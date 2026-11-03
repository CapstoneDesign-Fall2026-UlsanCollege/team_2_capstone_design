"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, PackageCheck, Phone } from "lucide-react";
import { useCart } from "./CartContext";

export interface StorefrontBottomNavProps {
  storeSlug: string;
  contactPhone?: string | null;
  onOpenSearch?: () => void;
}

export function StorefrontBottomNav({
  storeSlug,
  contactPhone,
  onOpenSearch,
}: StorefrontBottomNavProps) {
  const pathname = usePathname();
  const { itemCount, openCart } = useCart();

  const isHome = pathname === `/s/${storeSlug}` || pathname === `/s/${storeSlug}/`;
  const isOrders = pathname.includes(`/s/${storeSlug}/orders`);

  return (
    <nav
      aria-label="Storefront mobile navigation"
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-sf-surface/95 backdrop-blur-md border-t border-sf-line pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
    >
      <div className="grid grid-cols-4 h-14 items-center">
        {/* Tab 1: Home / Store */}
        <Link
          href={`/s/${encodeURIComponent(storeSlug)}`}
          className={`flex flex-col items-center justify-center gap-1 h-full transition-colors cursor-pointer ${
            isHome
              ? "text-sf-cta font-bold"
              : "text-sf-muted hover:text-sf-ink font-medium"
          }`}
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          <span className="text-[10px] font-sf-mono tracking-tight">Store</span>
        </Link>

        {/* Tab 2: Search / Catalog */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex flex-col items-center justify-center gap-1 h-full text-sf-muted hover:text-sf-ink font-medium transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" aria-hidden="true" />
          <span className="text-[10px] font-sf-mono tracking-tight">Search</span>
        </button>

        {/* Tab 3: Cart / Bag */}
        <button
          type="button"
          onClick={openCart}
          className="relative flex flex-col items-center justify-center gap-1 h-full text-sf-muted hover:text-sf-ink font-medium transition-colors cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-sf-cta px-1 text-[9px] font-sf-mono font-bold text-sf-cta-ink tabular-nums animate-in zoom-in-50 duration-150">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-sf-mono tracking-tight">Bag</span>
        </button>

        {/* Tab 4: Track Orders or Call WhatsApp */}
        {contactPhone ? (
          <a
            href={`https://wa.me/977${contactPhone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1 h-full text-sf-muted hover:text-sf-ink font-medium transition-colors cursor-pointer"
          >
            <Phone className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span className="text-[10px] font-sf-mono tracking-tight text-emerald-700">Chat</span>
          </a>
        ) : (
          <Link
            href={`/s/${encodeURIComponent(storeSlug)}/orders`}
            className={`flex flex-col items-center justify-center gap-1 h-full transition-colors cursor-pointer ${
              isOrders
                ? "text-sf-cta font-bold"
                : "text-sf-muted hover:text-sf-ink font-medium"
            }`}
          >
            <PackageCheck className="w-4 h-4" aria-hidden="true" />
            <span className="text-[10px] font-sf-mono tracking-tight">Orders</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
