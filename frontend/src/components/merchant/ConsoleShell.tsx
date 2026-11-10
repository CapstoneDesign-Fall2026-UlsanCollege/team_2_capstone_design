"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ExternalLink, Plus, Search, X } from "lucide-react";
import { MerchantSidebar } from "@/components/merchant/MerchantSidebar";
import { MerchantBottomNav } from "@/components/merchant/MerchantBottomNav";
import { CommandPalette } from "@/components/merchant/CommandPalette";
import { ProductSheet } from "@/components/merchant/ProductSheet";
import { useMyStores, useOrdersToDispatch } from "@/components/merchant/useConsoleData";
import { Button } from "@/components/ui/button";
import { ProductItem, MerchantStoreMembership } from "@/lib/api";

interface ConsoleShellProps {
  storeSlug: string;
  currentStore?: MerchantStoreMembership | null;
  stores?: MerchantStoreMembership[];
  children: React.ReactNode;
}

function resolveSectionLabel(pathname: string, baseHref: string): string {
  if (pathname === baseHref) return "Home";
  const head = pathname.slice(baseHref.length).replace(/^\//, "").split("/")[0];
  switch (head) {
    case "orders":
      return "Orders";
    case "products":
      return "Products";
    case "discounts":
      return "Discounts";
    case "customers":
      return "Customers";
    case "analytics":
      return "Analytics";
    case "themes":
      return "Online Store";
    case "settings":
      return "Settings";
    default:
      return "Workspace";
  }
}

export function ConsoleShell({
  storeSlug,
  currentStore: initialCurrentStore,
  stores: initialStores,
  children,
}: ConsoleShellProps) {
  const pathname = usePathname();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickProductOpen, setQuickProductOpen] = useState(false);
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl K");
  const [notice, setNotice] = useState<string | null>(null);

  const fallbackStores = useMyStores(storeSlug);
  const stores = initialStores ?? (fallbackStores.length > 0 ? fallbackStores : []);
  const currentStore = initialCurrentStore ?? stores.find((s) => s.slug === storeSlug) ?? null;
  const ordersCount = useOrdersToDispatch(storeSlug, pathname);

  const baseHref = `/merchant/${encodeURIComponent(storeSlug)}`;
  const isOverviewRoute = pathname === baseHref;
  const sectionLabel = resolveSectionLabel(pathname, baseHref);
  const storeName = currentStore?.name || "";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("shopcraft_merchant_notice");
      if (stored) {
        setNotice(stored);
        sessionStorage.removeItem("shopcraft_merchant_notice");
      }
    }
  }, []);

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setShortcutLabel("⌘K");
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleGlobalProductSaved = (saved: ProductItem) => {
    window.dispatchEvent(new CustomEvent("merchant:product-saved", { detail: saved }));
  };

  return (
    <div className="flex min-h-dvh bg-[var(--canvas)] text-[var(--ink)]">
      <MerchantSidebar
        storeSlug={storeSlug}
        stores={stores}
        currentStore={currentStore}
        ordersCount={ordersCount}
        drawerOpen={drawerOpen}
        onDrawerOpenChange={setDrawerOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col bg-[var(--canvas)]">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--canvas)] px-4 lg:px-6">
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
              <li className="hidden min-w-0 sm:block">
                <Link
                  href={baseHref}
                  className="block max-w-[180px] truncate text-[var(--ink-2)] hover:text-[var(--ink)]"
                >
                  {storeName || "Store"}
                </Link>
              </li>
              <li aria-hidden="true" className="hidden text-[var(--ink-2)] sm:block">
                /
              </li>
              <li className="min-w-0 truncate font-semibold text-[var(--ink)]" aria-current="page">
                {sectionLabel}
              </li>
            </ol>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {/* Search: field on tablet+, icon on mobile. Cmd/Ctrl+K opens the palette. */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Search"
              aria-keyshortcuts="Control+K Meta+K"
              className="hidden h-9 w-64 cursor-pointer items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] text-[var(--ink-2)] transition-colors hover:bg-[var(--nav-active)] lg:flex"
            >
              <span className="flex items-center gap-2">
                <Search className="size-4" aria-hidden="true" />
                Search
              </span>
              <span aria-hidden="true" className="text-xs">
                {shortcutLabel}
              </span>
            </button>
            <Button
              variant="tertiary"
              size="icon"
              className="lg:hidden"
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Search"
            >
              <Search />
            </Button>

            <Button variant="secondary" asChild className="hidden md:inline-flex">
              <a href={`/s/${encodeURIComponent(storeSlug)}`} target="_blank" rel="noopener noreferrer">
                View store
                <ExternalLink aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>

            {/* The ONE primary action. Icon-only below sm, with an accessible name. */}
            <Button onClick={() => setQuickProductOpen(true)} className="hidden sm:inline-flex">
              <Plus aria-hidden="true" />
              Add product
            </Button>
            <Button
              size="icon"
              className="sm:hidden"
              onClick={() => setQuickProductOpen(true)}
              aria-label="Add product"
            >
              <Plus />
            </Button>
          </div>
        </header>

        {notice && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-xs text-[var(--ink)]"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
              <span>{notice}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss notice"
              className="rounded p-1 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {isOverviewRoute ? (
          <main className="flex flex-1 flex-col pb-24 md:pb-0">{children}</main>
        ) : (
          <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-24 sm:p-6 md:pb-10 lg:p-8">
            {children}
          </main>
        )}

        <MerchantBottomNav
          storeSlug={storeSlug}
          ordersCount={ordersCount}
          onOpenMore={() => setDrawerOpen(true)}
        />

        <CommandPalette
          storeSlug={storeSlug}
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
        />

        <ProductSheet
          storeSlug={storeSlug}
          open={quickProductOpen}
          onOpenChange={setQuickProductOpen}
          product={null}
          onSaved={handleGlobalProductSaved}
        />
      </div>
    </div>
  );
}
