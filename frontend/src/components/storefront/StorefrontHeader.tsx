"use client";

import React from "react";
import Link from "next/link";
import { Phone, ShoppingBag } from "lucide-react";

export interface StorefrontHeaderProps {
  storeSlug: string;
  storeName: string;
  logoUrl?: string | null;
  contactPhone?: string | null;
  cartCount?: number;
  onOpenCart?: () => void;
}

export function StorefrontHeader({
  storeSlug,
  storeName,
  logoUrl,
  contactPhone,
  cartCount = 0,
  onOpenCart,
}: StorefrontHeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-sf-line bg-sf-surface/90 backdrop-blur-xs">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand Logo / Name */}
        <Link
          href={`/s/${encodeURIComponent(storeSlug)}`}
          className="flex items-center gap-2.5 min-w-0 group"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={storeName}
              className="h-8 max-w-[120px] object-contain rounded-sf"
            />
          ) : (
            <span className="font-sf-display text-base sm:text-lg font-bold tracking-tight text-sf-ink truncate group-hover:opacity-85 transition-opacity">
              {storeName}
            </span>
          )}
        </Link>

        {/* Actions: Support Phone & Cart Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {contactPhone && (
            <a
              href={`tel:${contactPhone.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sf border border-sf-line bg-sf-canvas text-xs font-sf-mono text-sf-muted hover:text-sf-ink transition-colors"
              title={`Call support: ${contactPhone}`}
            >
              <Phone className="w-3.5 h-3.5 text-sf-muted" aria-hidden="true" />
              <span className="hidden sm:inline tabular-nums">{contactPhone}</span>
              <span className="sm:hidden">Call</span>
            </a>
          )}

          <button
            type="button"
            onClick={onOpenCart}
            aria-label="Shopping Cart"
            className="relative inline-flex items-center justify-center w-9 h-9 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink hover:bg-sf-surface active:scale-95 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-sf-ink" aria-hidden="true" />
            {cartCount > 0 && (
              <span
                aria-label={`${cartCount} items in cart`}
                className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-sf-cta px-1 text-[10px] font-sf-mono font-bold text-sf-cta-ink tabular-nums animate-in zoom-in-50 duration-150"
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
