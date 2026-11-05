"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Check,
  ExternalLink,
  Menu,
  Plus,
  Search,
  Settings,
  Share2,
} from "lucide-react";
import { MerchantSidebar } from "@/components/merchant/MerchantSidebar";
import { MerchantBottomNav } from "@/components/merchant/MerchantBottomNav";
import { CommandPalette } from "@/components/merchant/CommandPalette";
import { ProductSheet } from "@/components/merchant/ProductSheet";
import { ProductItem } from "@/lib/api";

interface ConsoleShellProps {
  storeSlug: string;
  children: React.ReactNode;
}

function resolveSectionLabel(pathname: string, baseHref: string): string {
  if (pathname === baseHref) return "Overview";
  const rest = pathname.slice(baseHref.length).replace(/^\//, "");
  const head = rest.split("/")[0];
  switch (head) {
    case "orders":
      return "Orders";
    case "products":
      return "Products";
    case "subscriptions":
      return "Subscriptions";
    case "discounts":
      return "Discounts";
    case "customers":
      return "Customers";
    case "analytics":
      return "Analytics";
    case "themes":
      return "Themes & Storefront";
    case "settings":
      return "Settings";
    default:
      return "Workspace";
  }
}

export function ConsoleShell({ storeSlug, children }: ConsoleShellProps) {
  const pathname = usePathname();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [quickProductOpen, setQuickProductOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const baseHref = `/merchant/${encodeURIComponent(storeSlug)}`;
  const isOverviewRoute = pathname === baseHref;
  const sectionLabel = resolveSectionLabel(pathname, baseHref);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCopyShareUrl = () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/s/${encodeURIComponent(storeSlug)}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleGlobalProductSaved = (saved: ProductItem) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("merchant:product-saved", { detail: saved })
      );
    }
  };

  return (
    <div className="flex min-h-dvh bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
      {/* Steep-style Off-White / Dark-Slate Sidebar + Mobile Drawer */}
      <MerchantSidebar
        storeSlug={storeSlug}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onQuickAddProduct={() => setQuickProductOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Crisp White / Surface Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--card)]">
        {/* Slim 48px Steep Workspace Top Bar */}
        <header className="h-12 border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-xs px-4 lg:px-6 flex items-center justify-between gap-3 sticky top-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-1.5 -ml-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs min-w-0">
              <Link
                href={baseHref}
                className="font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors truncate max-w-[120px] sm:max-w-[180px]"
              >
                {storeSlug}
              </Link>
              <span className="text-[var(--muted-foreground)]/50">/</span>
              <span className="font-semibold text-[var(--foreground)] truncate">
                {sectionLabel}
              </span>
            </div>
          </div>

          {/* Right Global Actions: Search, Quick Add Product, Settings, Share, Live Shop */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              title="Jump to any page (⌘K)"
              className="hidden sm:inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--secondary)] text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Search</span>
              <kbd className="font-mono text-[10px] opacity-75">⌘K</kbd>
            </button>

            <button
              type="button"
              onClick={() => setQuickProductOpen(true)}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.25]" />
              <span>Add Product</span>
            </button>

            <Link
              href={`${baseHref}/settings`}
              title="Store settings"
              aria-label="Store settings"
              className="hidden sm:inline-flex items-center justify-center h-7 w-7 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={handleCopyShareUrl}
              title="Copy storefront link"
              aria-label="Copy storefront link"
              className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            >
              {copiedUrl ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>

            <Link
              href={`/s/${encodeURIComponent(storeSlug)}`}
              target="_blank"
              title="Open live storefront"
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-xs font-medium text-[var(--foreground)] transition-colors"
            >
              <span className="hidden sm:inline">Live Shop</span>
              <ExternalLink className="w-3 h-3 text-[var(--muted-foreground)]" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        {isOverviewRoute ? (
          <main className="flex-1 w-full pb-24 lg:pb-0 flex flex-col">
            {children}
          </main>
        ) : (
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto pb-24 lg:pb-10">
            {children}
          </main>
        )}

        {/* Mobile Bottom Navigation */}
        <MerchantBottomNav storeSlug={storeSlug} />

        {/* ⌘K Command Palette Dialog */}
        <CommandPalette
          storeSlug={storeSlug}
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
        />

        {/* Global 1-Click Quick Add Product Drawer */}
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
