"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Home,
  ShoppingBag,
  Package,
  Repeat,
  Settings,
  Plus,
} from "lucide-react";

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
      icon: Home,
    },
    {
      label: "Orders",
      href: `/merchant/${encodeURIComponent(storeSlug)}/orders`,
      exact: false,
      icon: ShoppingBag,
    },
    {
      label: "Catalog",
      href: `/merchant/${encodeURIComponent(storeSlug)}/products`,
      exact: false,
      icon: Package,
    },
    {
      label: "Subs",
      href: `/merchant/${encodeURIComponent(storeSlug)}/subscriptions`,
      exact: false,
      icon: Repeat,
    },
    {
      label: "Analytics",
      href: `/merchant/${encodeURIComponent(storeSlug)}/analytics`,
      exact: false,
      icon: BarChart3,
    },
    {
      label: "Settings",
      href: `/merchant/${encodeURIComponent(storeSlug)}/settings`,
      exact: false,
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Floating Action Button (+) */}
      <div className="lg:hidden fixed bottom-18 right-4 z-40">
        <Link
          href={`/merchant/${encodeURIComponent(storeSlug)}/products?action=new`}
          className="w-12 h-12 rounded-full shadow-lg bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-bold active:scale-95 transition-transform"
          aria-label="Add new product"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </Link>
      </div>

      {/* Mobile Bottom Tabs */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--card)] border-t border-[var(--border)] pb-safe flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          const IconComponent = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center h-full text-center py-1 transition-colors ${
                isActive
                  ? "text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-normal"
              }`}
            >
              <IconComponent className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
