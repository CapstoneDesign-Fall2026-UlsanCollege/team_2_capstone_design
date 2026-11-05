"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { buildMerchantNav, isNavActive } from "./merchant-nav";

interface MerchantBottomNavProps {
  storeSlug: string;
  ordersCount: number;
  onOpenMore: () => void;
}

/**
 * Mobile tab bar: Home, Orders, Products, More. No floating action button:
 * "Add product" lives only in the top bar. 44px+ tap targets.
 */
export function MerchantBottomNav({ storeSlug, ordersCount, onOpenMore }: MerchantBottomNavProps) {
  const pathname = usePathname();
  const { main } = buildMerchantNav(`/merchant/${encodeURIComponent(storeSlug)}`);
  const tabs = main.filter((i) => ["home", "orders", "products"].includes(i.key));

  const base =
    "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors";

  return (
    <nav
      aria-label="Primary"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 flex h-14 items-stretch border-t border-[var(--border)] bg-[var(--surface)] md:hidden"
    >
      {tabs.map((tab) => {
        const active = isNavActive(pathname, tab);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`${base} ${active ? "font-semibold text-[var(--ink)]" : "text-[var(--ink-2)]"}`}
          >
            <span className="relative">
              <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
              {tab.key === "orders" && ordersCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-[var(--ink)] px-1 text-center text-xs leading-4 text-[var(--primary-foreground)]"
                >
                  {ordersCount > 99 ? "99+" : ordersCount}
                </span>
              )}
            </span>
            <span>{tab.label}</span>
            {tab.key === "orders" && ordersCount > 0 && (
              <span className="sr-only">, {ordersCount} to dispatch</span>
            )}
            {active && (
              <span aria-hidden="true" className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-[var(--ink)]" />
            )}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onOpenMore}
        aria-haspopup="dialog"
        className={`${base} cursor-pointer text-[var(--ink-2)]`}
      >
        <Menu className="size-5" strokeWidth={1.75} aria-hidden="true" />
        <span>More</span>
      </button>
    </nav>
  );
}
