"use client";

import React from "react";
import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import { formatNpr } from "@/lib/api";

export interface StorefrontHeaderProps {
  storeSlug: string;
  storeName: string;
  tagline?: string;
  logoUrl?: string | null;
  contactPhone?: string | null;
  announcementMessage?: string | null;
  freeShippingThresholdMinor?: number | null;
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenSearch?: () => void;
  onCatalogClick?: () => void;
  onSelectCategory?: (category: string) => void;
  activeCategory?: string;
  categories?: string[];
}

function isPlaceholderText(text?: string | null): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();
  return (
    lower === "general" ||
    lower === "aaa" ||
    lower === "placeholder" ||
    lower === "online storefront · nepal" ||
    lower === "online storefront" ||
    lower === "official online store"
  );
}

export function StorefrontHeader({
  storeSlug,
  storeName,
  tagline,
  logoUrl,
  announcementMessage,
  freeShippingThresholdMinor,
  cartCount = 0,
  onOpenCart,
  onOpenSearch,
  onCatalogClick,
}: StorefrontHeaderProps) {
  // Determine announcement message. Hidden if empty.
  const announcementText = React.useMemo(() => {
    if (announcementMessage && !isPlaceholderText(announcementMessage)) {
      return announcementMessage.trim();
    }
    if (
      typeof freeShippingThresholdMinor === "number" &&
      freeShippingThresholdMinor > 0
    ) {
      return `Free Kathmandu Valley delivery on orders over ${formatNpr(
        freeShippingThresholdMinor
      )}`;
    }
    return null;
  }, [announcementMessage, freeShippingThresholdMinor]);

  const cleanTagline = React.useMemo(() => {
    if (!tagline || isPlaceholderText(tagline)) return null;
    return tagline.trim();
  }, [tagline]);

  return (
    <div className="w-full">
      {/* 1. Announcement Bar: 36px, charcoal (#171716), single static merchant message. Hidden if empty. */}
      {announcementText && (
        <aside
          aria-label="Store announcement"
          className="w-full h-9 bg-[var(--ink)] text-[var(--surface)] text-xs font-medium px-4 flex items-center justify-center border-b border-[var(--border)] overflow-hidden"
        >
          <p className="truncate text-center max-w-4xl tracking-normal">
            {announcementText}
          </p>
        </aside>
      )}

      {/* 2. Header Bar: Logo/Name, Clean Navigation, Search, Bag. No glass/blur, 1px border. */}
      <header className="sticky top-0 z-30 w-full border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Brand Identity */}
          <Link
            href={`/s/${encodeURIComponent(storeSlug)}`}
            className="flex items-center gap-3 min-w-0 group shrink-0"
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={storeName}
                className="h-8 sm:h-9 max-w-[150px] object-contain rounded"
              />
            ) : (
              <div className="flex flex-col text-left">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[var(--ink)] leading-tight group-hover:opacity-85 transition-opacity">
                  {storeName}
                </span>
                {cleanTagline && (
                  <span className="hidden lg:block text-xs text-[var(--ink-2)] max-w-sm truncate font-normal">
                    {cleanTagline}
                  </span>
                )}
              </div>
            )}
          </Link>

          {/* Center: Desktop Navigation (Catalog, Our story, Delivery & COD, Contact) */}
          <nav
            aria-label="Main storefront navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--ink-2)]"
          >
            <button
              type="button"
              onClick={onCatalogClick}
              className="hover:text-[var(--ink)] cursor-pointer transition-colors"
            >
              Catalog
            </button>
            <Link
              href={`/s/${encodeURIComponent(storeSlug)}/about`}
              className="hover:text-[var(--ink)] cursor-pointer transition-colors"
            >
              Our story
            </Link>
            <Link
              href={`/s/${encodeURIComponent(storeSlug)}/shipping`}
              className="hover:text-[var(--ink)] cursor-pointer transition-colors"
            >
              Delivery &amp; COD
            </Link>
            <Link
              href={`/s/${encodeURIComponent(storeSlug)}/contact`}
              className="hover:text-[var(--ink)] cursor-pointer transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Right: Actions (Search, Bag) with min 44px tap targets */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-11 h-11 flex items-center justify-center rounded-lg text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors cursor-pointer"
              aria-label="Search catalog"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Bag Button: Bag (count) */}
            <button
              type="button"
              onClick={onOpenCart}
              className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] transition-colors cursor-pointer flex items-center gap-2 text-xs sm:text-sm font-medium"
              aria-label={`Open shopping bag with ${cartCount} items`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Bag</span>
              {cartCount > 0 && (
                <span className="tabular-nums font-semibold">
                  ({cartCount})
                </span>
              )}
            </button>
          </div>

        </div>
      </header>
    </div>
  );
}
