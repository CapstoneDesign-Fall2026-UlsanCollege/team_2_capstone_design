"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  ExternalLink,
  Home,
  Moon,
  Palette,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Sun,
  X,
} from "lucide-react";
import { usePlatformTheme } from "@/context/PlatformThemeContext";
import { fetchMyStores, MerchantStoreMembership } from "@/lib/api";

interface MerchantSidebarProps {
  storeSlug: string;
  onOpenCommandPalette: () => void;
  onQuickAddProduct?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const SETTINGS_SUBITEMS = [
  { label: "Store & Story", tab: "general" },
  { label: "Payments & COD", tab: "payments" },
  { label: "Shipping & Domains", tab: "shipping" },
  { label: "Staff & Roles", tab: "staff" },
  { label: "Security Audit", tab: "audit" },
];

export function MerchantSidebar({
  storeSlug,
  onOpenCommandPalette,
  onQuickAddProduct,
  mobileOpen = false,
  onCloseMobile,
}: MerchantSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = usePlatformTheme();

  const [stores, setStores] = React.useState<MerchantStoreMembership[]>([]);
  const [isSwitcherOpen, setIsSwitcherOpen] = React.useState(false);
  const isOnSettingsRoute = pathname.startsWith(
    `/merchant/${encodeURIComponent(storeSlug)}/settings`
  );
  const [manualSettingsOpen, setManualSettingsOpen] = React.useState<boolean | null>(null);
  const settingsExpanded = manualSettingsOpen ?? isOnSettingsRoute;
  const switcherRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && storeSlug) {
      localStorage.setItem("shopcraft_active_store_slug", storeSlug);
    }
    fetchMyStores()
      .then((res) => {
        if (res.stores && res.stores.length > 0) {
          setStores(res.stores);
        } else {
          setStores([
            {
              id: 0,
              slug: storeSlug,
              name: storeSlug,
              category: "Specialty Goods",
              city: "Kathmandu",
              province: "Bagmati Province",
              theme_preset: "editorial-warm",
              logo_url: "",
              accent_color: "",
              role: "OWNER",
              created_at: new Date().toISOString(),
            },
          ]);
        }
      })
      .catch(() => {
        setStores([
          {
            id: 0,
            slug: storeSlug,
            name: storeSlug,
            category: "Specialty Goods",
            city: "Kathmandu",
            province: "Bagmati Province",
            theme_preset: "editorial-warm",
            logo_url: "",
            accent_color: "",
            role: "OWNER",
            created_at: new Date().toISOString(),
          },
        ]);
      });
  }, [storeSlug]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setIsSwitcherOpen(false);
      }
    }
    if (isSwitcherOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isSwitcherOpen]);

  const currentStore = stores.find((s) => s.slug === storeSlug);
  const baseHref = `/merchant/${encodeURIComponent(storeSlug)}`;

  const primaryItems = [
    {
      label: "Home",
      href: baseHref,
      exact: true,
      icon: Home,
    },
    {
      label: "Orders",
      href: `${baseHref}/orders`,
      exact: false,
      icon: ShoppingBag,
    },
  ];

  const catalogModules = [
    {
      badge: "P",
      badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      label: "Products",
      href: `${baseHref}/products`,
      hasQuickAdd: true,
    },
    {
      badge: "S",
      badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      label: "Subscriptions",
      href: `${baseHref}/subscriptions`,
      hasQuickAdd: false,
    },
    {
      badge: "D",
      badgeClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
      label: "Discounts",
      href: `${baseHref}/discounts`,
      hasQuickAdd: false,
    },
    {
      badge: "C",
      badgeClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
      label: "Customers",
      href: `${baseHref}/customers`,
      hasQuickAdd: false,
    },
  ];

  const reportItems = [
    {
      label: "Analytics",
      href: `${baseHref}/analytics`,
      icon: BarChart3,
    },
    {
      label: "Themes & Storefront",
      href: `${baseHref}/themes`,
      icon: Palette,
    },
  ];

  const sidebarBody = (
    <div className="flex flex-col h-full w-[236px] bg-[var(--background)] text-[var(--foreground)] select-none border-r border-[var(--border)]">
      {/* 1. Calm Workspace Switcher (Steep style) */}
      <div className="px-3.5 pt-4 pb-2 relative" ref={switcherRef}>
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => setIsSwitcherOpen((prev) => !prev)}
            className="flex-1 flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--secondary)] transition-colors text-left cursor-pointer min-w-0 group"
          >
            {/* Steep-inspired dual-accent workspace mark */}
            <span className="w-6 h-6 rounded-md bg-[var(--card)] border border-[var(--border)] shadow-2xs flex items-center justify-center shrink-0">
              <span className="flex items-center -space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500/90" />
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500/90" />
              </span>
            </span>

            <span className="text-[13px] font-semibold tracking-tight text-[var(--foreground)] truncate">
              {currentStore?.name || storeSlug}
            </span>

            <ChevronsUpDown className="w-3.5 h-3.5 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] shrink-0 ml-auto transition-colors" />
          </button>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation"
              className="lg:hidden p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Store Switcher Popover */}
        {isSwitcherOpen && (
          <div className="absolute top-full left-3 right-3 mt-1 z-50 rounded-xl border border-[var(--border)] bg-[var(--popover)] p-1.5 shadow-lg text-xs space-y-1">
            <div className="px-2 py-1 text-[11px] font-medium text-[var(--muted-foreground)]">
              Workspaces
            </div>

            <div className="max-h-52 overflow-y-auto space-y-0.5">
              {stores.map((st) => {
                const isCurrent = st.slug === storeSlug;
                return (
                  <button
                    key={`${st.id}-${st.slug}`}
                    type="button"
                    onClick={() => {
                      setIsSwitcherOpen(false);
                      onCloseMobile?.();
                      if (!isCurrent) {
                        if (typeof window !== "undefined") {
                          localStorage.setItem("shopcraft_active_store_slug", st.slug);
                        }
                        router.push(`/merchant/${encodeURIComponent(st.slug)}`);
                      }
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isCurrent
                        ? "bg-[var(--secondary)] font-semibold text-[var(--foreground)]"
                        : "hover:bg-[var(--secondary)]/60 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="truncate block text-xs">{st.name}</span>
                      <span className="text-[10px] font-mono text-[var(--muted-foreground)] truncate block">
                        /s/{st.slug}
                      </span>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-[var(--border)] pt-1 mt-1 space-y-0.5">
              <Link
                href="/merchant/new"
                onClick={() => {
                  setIsSwitcherOpen(false);
                  onCloseMobile?.();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-blue-500" />
                <span>Create new store</span>
              </Link>
              <Link
                href="/"
                onClick={() => {
                  setIsSwitcherOpen(false);
                  onCloseMobile?.();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
              >
                <span>ShopCraft Home</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Navigation Sections */}
      <nav className="flex-1 px-3 py-2 space-y-5 overflow-y-auto">
        {/* Primary Links: Home, Orders, Settings > */}
        <div className="space-y-0.5">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
                  isActive
                    ? "bg-[var(--secondary)] text-[var(--foreground)] font-medium"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/60"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 stroke-[1.75] ${
                    isActive ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Expandable Settings Row (Steep `Settings >` pattern) */}
          <div>
            <div
              className={`flex items-center justify-between rounded-lg transition-colors ${
                isOnSettingsRoute
                  ? "bg-[var(--secondary)] text-[var(--foreground)] font-medium"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/60"
              }`}
            >
              <Link
                href={`${baseHref}/settings`}
                onClick={onCloseMobile}
                className="flex-1 flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] min-w-0"
              >
                <Settings
                  className={`w-4 h-4 shrink-0 stroke-[1.75] ${
                    isOnSettingsRoute ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
                  }`}
                />
                <span>Settings</span>
              </Link>
              <button
                type="button"
                onClick={() => setManualSettingsOpen(!settingsExpanded)}
                aria-label="Toggle settings sections"
                className="p-1.5 mr-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
              >
                {settingsExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {settingsExpanded && (
              <div className="mt-0.5 ml-4 pl-2.5 border-l border-[var(--border)] space-y-0.5">
                {SETTINGS_SUBITEMS.map((sub) => (
                  <Link
                    key={sub.tab}
                    href={`${baseHref}/settings?tab=${sub.tab}`}
                    onClick={onCloseMobile}
                    className="flex items-center gap-2 px-2 py-1 rounded-md text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/50 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rotate-45 bg-[var(--muted-foreground)]/60 shrink-0" />
                    <span className="truncate">{sub.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Group 2: Store & Catalog (Steep Pastel Squircle Badges + Quick Add) */}
        <div className="space-y-1">
          <div className="px-2.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
              Catalog &amp; Sales
            </span>
          </div>

          <div className="space-y-0.5">
            {catalogModules.map((mod) => {
              const isActive = pathname.startsWith(mod.href);
              return (
                <div
                  key={mod.href}
                  className={`group flex items-center justify-between rounded-lg transition-colors ${
                    isActive
                      ? "bg-[var(--secondary)] text-[var(--foreground)] font-medium"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/60"
                  }`}
                >
                  <Link
                    href={mod.href}
                    onClick={onCloseMobile}
                    className="flex-1 flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] min-w-0"
                  >
                    <span
                      className={`w-[18px] h-[18px] rounded-[5px] text-[10px] font-bold flex items-center justify-center shrink-0 ${mod.badgeClass}`}
                    >
                      {mod.badge}
                    </span>
                    <span className="truncate">{mod.label}</span>
                  </Link>

                  {mod.hasQuickAdd && onQuickAddProduct && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseMobile?.();
                        onQuickAddProduct();
                      }}
                      title="Quick add new product"
                      aria-label="Quick add new product"
                      className="mr-1.5 p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)] opacity-80 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Group 3: Insights & Storefront */}
        <div className="space-y-1">
          <div className="px-2.5">
            <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
              Reports &amp; Storefront
            </span>
          </div>

          <div className="space-y-0.5">
            {reportItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
                    isActive
                      ? "bg-[var(--secondary)] text-[var(--foreground)] font-medium"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/60"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 stroke-[1.75] ${
                      isActive ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}

            <Link
              href={`/s/${encodeURIComponent(storeSlug)}`}
              target="_blank"
              onClick={onCloseMobile}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/60 transition-colors"
            >
              <span>View Live Shop</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
            </Link>
          </div>
        </div>
      </nav>

      {/* 4. Minimal Bottom Bar: Search ⌘K + Theme Toggle */}
      <div className="p-3 border-t border-[var(--border)] flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            onCloseMobile?.();
            onOpenCommandPalette();
          }}
          className="flex-1 h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] flex items-center justify-between text-xs text-[var(--muted-foreground)] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            <span>Jump to...</span>
          </span>
          <kbd className="font-mono text-[10px] text-[var(--muted-foreground)]">⌘K</kbd>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="h-8 w-8 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer shrink-0"
        >
          {theme === "dark" ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block h-screen sticky top-0 shrink-0">
        {sidebarBody}
      </aside>

      {/* Mobile Slide-Over Sidebar Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-2xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full shadow-2xl">{sidebarBody}</div>
        </div>
      )}
    </>
  );
}
