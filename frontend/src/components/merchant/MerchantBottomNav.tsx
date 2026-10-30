"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MerchantBottomNavProps {
  storeSlug: string;
}

export function MerchantBottomNav({ storeSlug }: MerchantBottomNavProps) {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Home",
      href: `/merchant/${encodeURIComponent(storeSlug)}`,
      exact: true,
      icon: "❖",
    },
    {
      label: "Products",
      href: `/merchant/${encodeURIComponent(storeSlug)}/products`,
      exact: false,
      icon: "▤",
    },
    {
      label: "Orders",
      href: `/merchant/${encodeURIComponent(storeSlug)}/orders`,
      exact: false,
      icon: "◎",
    },
    {
      label: "Settings",
      href: `/merchant/${encodeURIComponent(storeSlug)}/settings`,
      exact: false,
      icon: "⚙",
    },
  ];

  return (
    <>
      {/* Floating Action Button (+) */}
      <div className="lg:hidden fixed bottom-18 right-4 z-40">
        <Link
          href={`/merchant/${encodeURIComponent(storeSlug)}/products?action=new`}
          className="w-12 h-12 rounded-full shadow-lg bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xl font-bold active:scale-95 transition-transform"
          aria-label="Add new product"
        >
          +
        </Link>
      </div>

      {/* Mobile Bottom Tabs */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--card)] border-t border-[var(--border)] pb-safe flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center h-full text-center py-1 transition-colors ${
                isActive
                  ? "text-[var(--foreground)] font-semibold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-normal"
              }`}
            >
              <span className="text-sm font-mono leading-none mb-1">{tab.icon}</span>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
