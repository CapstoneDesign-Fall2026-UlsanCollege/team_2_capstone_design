"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronsUpDown, ExternalLink, PanelLeftOpen, Plus, X } from "lucide-react";
import { MerchantStoreMembership } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { buildMerchantNav, isNavActive, type NavItem } from "./merchant-nav";

interface MerchantSidebarProps {
  storeSlug: string;
  stores: MerchantStoreMembership[];
  /** Orders waiting to be dispatched; shown as a count badge on Orders. */
  ordersCount: number;
  drawerOpen: boolean;
  onDrawerOpenChange: (open: boolean) => void;
}

const formatCount = (n: number) => (n > 99 ? "99+" : String(n));

function NavLink({
  item,
  active,
  count,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  count?: number;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={`relative flex min-h-11 md:min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-[var(--nav-active)] font-medium text-[var(--ink)]"
          : "text-[var(--ink-2)] hover:bg-[var(--nav-active)] hover:text-[var(--ink)]"
      }`}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {collapsed ? (
        <span className="sr-only">{item.label}</span>
      ) : (
        <span className="truncate">{item.label}</span>
      )}
      {count ? (
        collapsed ? (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 size-2 rounded-full bg-[var(--ink)]"
          />
        ) : null
      ) : null}
      {count ? (
        <>
          {!collapsed && <Badge className="ml-auto">{formatCount(count)}</Badge>}
          <span className="sr-only">, {count} to dispatch</span>
        </>
      ) : null}
    </Link>
  );
}

function StoreSwitcher({
  storeSlug,
  stores,
  onNavigate,
}: {
  storeSlug: string;
  stores: MerchantStoreMembership[];
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const current = (stores || []).find((s) => s.slug === storeSlug);
  const name = current?.name || storeSlug;

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative px-3 pt-4 pb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Store: ${name}. Switch store`}
        className="flex min-h-11 md:min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 text-left transition-colors hover:bg-[var(--nav-active)]"
      >
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--ink)]"
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="truncate text-[13px] font-semibold text-[var(--ink)]">{name}</span>
        <ChevronsUpDown className="ml-auto size-4 shrink-0 text-[var(--ink-2)]" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Your stores"
          className="absolute left-3 right-3 top-full z-50 mt-1 space-y-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 text-[13px]"
        >
          <div className="max-h-52 space-y-0.5 overflow-y-auto">
            {((stores || []).length ? stores : current ? [current] : []).map((st) => {
              const isCurrent = st.slug === storeSlug;
              return (
                <button
                  key={`${st.id}-${st.slug}`}
                  type="button"
                  role="option"
                  aria-selected={isCurrent}
                  onClick={() => {
                    setOpen(false);
                    if (!isCurrent) {
                      onNavigate?.();
                      router.push(`/merchant/${encodeURIComponent(st.slug)}`);
                    }
                  }}
                  className={`flex min-h-11 md:min-h-9 w-full cursor-pointer items-center justify-between rounded-lg px-2.5 text-left transition-colors hover:bg-[var(--nav-active)] ${
                    isCurrent ? "bg-[var(--nav-active)] font-medium text-[var(--ink)]" : "text-[var(--ink-2)]"
                  }`}
                >
                  <span className="truncate">{st.name}</span>
                  {isCurrent && <Check className="ml-2 size-4 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div className="border-t border-[var(--border)] pt-1">
            <Link
              href="/merchant/new"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="flex min-h-11 md:min-h-9 items-center gap-2 rounded-lg px-2.5 text-[var(--ink-2)] transition-colors hover:bg-[var(--nav-active)] hover:text-[var(--ink)]"
            >
              <Plus className="size-4" aria-hidden="true" />
              Create new store
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarBody({
  storeSlug,
  stores,
  ordersCount,
  onNavigate,
  onClose,
  showViewStore,
}: {
  storeSlug: string;
  stores: MerchantStoreMembership[];
  ordersCount: number;
  onNavigate?: () => void;
  onClose?: () => void;
  /** Only in the mobile drawer; on larger screens "View store" lives in the top bar. */
  showViewStore?: boolean;
}) {
  const pathname = usePathname();
  const { main, settings } = buildMerchantNav(`/merchant/${encodeURIComponent(storeSlug)}`);

  return (
    <div className="flex h-full w-60 flex-col border-r border-[var(--border)] bg-[var(--canvas)] text-[var(--ink)]">
      <div className="flex items-start">
        <div className="min-w-0 flex-1">
          <StoreSwitcher storeSlug={storeSlug} stores={stores} onNavigate={onNavigate} />
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="mr-2 mt-4 flex size-11 cursor-pointer items-center justify-center rounded-lg text-[var(--ink-2)] hover:bg-[var(--nav-active)]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="Main" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {main.map((item) => (
          <NavLink
            key={item.key}
            item={item}
            active={isNavActive(pathname, item)}
            count={item.key === "orders" ? ordersCount : undefined}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-[var(--border)] px-3 py-3">
        {showViewStore && (
          <a
            href={`/s/${encodeURIComponent(storeSlug)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onNavigate}
            className="flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-[var(--ink-2)] transition-colors hover:bg-[var(--nav-active)] hover:text-[var(--ink)]"
          >
            <ExternalLink className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            View store
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
        <NavLink
          item={settings}
          active={isNavActive(pathname, settings)}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}

function Rail({
  storeSlug,
  ordersCount,
  onExpand,
}: {
  storeSlug: string;
  ordersCount: number;
  onExpand: () => void;
}) {
  const pathname = usePathname();
  const { main, settings } = buildMerchantNav(`/merchant/${encodeURIComponent(storeSlug)}`);
  return (
    <div className="flex h-full w-16 flex-col items-center border-r border-[var(--border)] bg-[var(--canvas)]">
      <button
        type="button"
        onClick={onExpand}
        aria-label="Expand navigation"
        className="mt-4 mb-2 flex size-10 cursor-pointer items-center justify-center rounded-lg text-[var(--ink-2)] hover:bg-[var(--nav-active)] hover:text-[var(--ink)]"
      >
        <PanelLeftOpen className="size-4" aria-hidden="true" />
      </button>
      <nav aria-label="Main" className="w-full flex-1 space-y-0.5 px-2 py-2">
        {main.map((item) => (
          <NavLink
            key={item.key}
            item={item}
            collapsed
            active={isNavActive(pathname, item)}
            count={item.key === "orders" ? ordersCount : undefined}
          />
        ))}
      </nav>
      <div className="w-full border-t border-[var(--border)] px-2 py-3">
        <NavLink item={settings} collapsed active={isNavActive(pathname, settings)} />
      </div>
    </div>
  );
}

export function MerchantSidebar({
  storeSlug,
  stores,
  ordersCount,
  drawerOpen,
  onDrawerOpenChange,
}: MerchantSidebarProps) {
  const close = () => onDrawerOpenChange(false);
  return (
    <>
      {/* Desktop (>=1024px): full 240px sidebar */}
      <aside className="sticky top-0 hidden h-dvh shrink-0 lg:block">
        <SidebarBody storeSlug={storeSlug} stores={stores} ordersCount={ordersCount} />
      </aside>

      {/* Tablet (768-1023px): collapsed icon rail, expands into the drawer */}
      <aside className="sticky top-0 hidden h-dvh shrink-0 md:block lg:hidden">
        <Rail storeSlug={storeSlug} ordersCount={ordersCount} onExpand={() => onDrawerOpenChange(true)} />
      </aside>

      {/* Tablet expand + mobile "More": same navigation in an accessible drawer */}
      <Dialog.Root open={drawerOpen} onOpenChange={onDrawerOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 lg:hidden" />
          <Dialog.Content
            aria-describedby={undefined}
            className="console fixed inset-y-0 left-0 z-50 outline-none lg:hidden"
          >
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <SidebarBody
              storeSlug={storeSlug}
              stores={stores}
              ordersCount={ordersCount}
              onNavigate={close}
              onClose={close}
              showViewStore
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
