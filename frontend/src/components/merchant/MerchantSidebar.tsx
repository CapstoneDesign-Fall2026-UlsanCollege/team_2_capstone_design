"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MerchantSidebarProps {
  storeSlug: string;
  onOpenCommandPalette: () => void;
}

export function MerchantSidebar({ storeSlug, onOpenCommandPalette }: MerchantSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Overview",
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
    <aside className="hidden lg:flex flex-col w-[232px] h-screen sticky top-0 shrink-0 border-r border-[var(--border)] bg-[var(--background)] select-none">
      {/* Store Header */}
      <div className="p-4 border-b border-[var(--border)] space-y-2">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-extrabold text-xs tracking-tight text-[var(--foreground)]">
            ShopCraft
          </Link>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)]">
            Console
          </span>
        </div>

        <div className="pt-1">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: "var(--st-new)" }}
              aria-hidden="true"
            />
            <span className="font-mono text-xs font-semibold text-[var(--foreground)] truncate">
              {storeSlug}
            </span>
          </div>

          <Link
            href={`/s/${encodeURIComponent(storeSlug)}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--muted-foreground)] hover:text-[var(--foreground)] mt-1 transition-colors"
          >
            <span>Live Store</span>
            <span className="text-[10px]">↗</span>
          </Link>
        </div>
      </div>

      {/* ⌘K Trigger Button */}
      <div className="p-3">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full h-8 px-2.5 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] flex items-center justify-between text-xs text-[var(--muted-foreground)] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <span className="text-[11px]">🔍</span>
            <span className="text-[11px]">Command Palette</span>
          </span>
          <kbd className="text-[10px] font-mono px-1 py-0.2 rounded bg-[var(--secondary)] border border-[var(--border)]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 text-xs">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md font-medium transition-colors ${
                isActive
                  ? "bg-[var(--secondary)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/60"
              }`}
            >
              <span className="text-xs font-mono">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Account */}
      <div className="p-3 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)] space-y-1">
        <Link
          href="/account/addresses"
          className="flex items-center justify-between px-2 py-1.5 rounded hover:text-[var(--foreground)] transition-colors"
        >
          <span>Account Settings</span>
          <span className="text-[10px] font-mono">→</span>
        </Link>
        <Link
          href="/login"
          className="flex items-center justify-between px-2 py-1.5 rounded hover:text-[var(--foreground)] transition-colors text-[11px]"
        >
          <span>Switch Account</span>
        </Link>
      </div>
    </aside>
  );
}
