"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon, LayoutDashboard } from "lucide-react";
import { usePlatformTheme } from "@/context/PlatformThemeContext";
import { ShopCraftLogo } from "@/components/platform/ShopCraftLogo";
import { fetchMyStores, fetchSession } from "@/lib/api";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Looks", href: "/#looks" },
  { label: "Made for Nepal", href: "/#made-for-nepal" },
  { label: "Orders", href: "/#orders" },
  { label: "Questions", href: "/#faq" },
];

export function PlatformNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasStores, setHasStores] = useState(false);
  const { theme, toggleTheme } = usePlatformTheme();

  useEffect(() => {
    let mounted = true;
    async function syncAuthNav() {
      try {
        const session = await fetchSession();
        if (!mounted) return;
        if (session.authenticated && session.user) {
          setIsAuthenticated(true);
          try {
            const myStores = await fetchMyStores();
            if (mounted) {
              setHasStores(Boolean(myStores.stores && myStores.stores.length > 0));
            }
          } catch {
            if (mounted) setHasStores(false);
          }
        } else {
          setIsAuthenticated(false);
          setHasStores(false);
        }
      } catch {
        if (mounted) {
          setIsAuthenticated(false);
          setHasStores(false);
        }
      }
    }
    syncAuthNav();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  const primaryHref = isAuthenticated ? "/merchant/new" : "/signup?next=/merchant/new";
  const primaryLabel = isAuthenticated
    ? hasStores
      ? "New store"
      : "Create my store"
    : "Create my store";

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-paper border-b border-line">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-7 h-16 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Left: Brand logo */}
        <Link
          href="/"
          className="justify-self-start inline-flex items-center min-h-[44px] py-1.5"
        >
          <ShopCraftLogo />
        </Link>

        {/* Center: Minimalist Navigation Links */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center gap-7 text-[13.5px] font-medium text-ink-2"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="inline-flex items-center min-h-[44px] px-1 hover:text-ink transition-colors whitespace-nowrap"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right: Desktop Action Buttons + Theme Toggle */}
        <div className="hidden md:flex items-center justify-self-end gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-ink-2 hover:text-ink hover:bg-paper-2 transition-colors cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-gold" />
            ) : (
              <Moon className="w-4 h-4 text-ink-2" />
            )}
          </button>

          {isAuthenticated && hasStores ? (
            <Link
              href="/merchant"
              className="inline-flex items-center gap-1.5 min-h-[44px] text-[13.5px] font-medium text-ink-2 hover:text-ink transition-colors px-2"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Console</span>
            </Link>
          ) : (
            <Link
              href="/login?next=/merchant"
              className="inline-flex items-center min-h-[44px] text-[13.5px] font-medium text-ink-2 hover:text-ink transition-colors px-2"
            >
              Log in
            </Link>
          )}

          <Link
            href={primaryHref}
            className="inline-flex items-center min-h-[44px] rounded-full bg-btn hover:bg-btn-hover text-btn-ink font-semibold text-[13.5px] px-[18px] transition-colors whitespace-nowrap"
          >
            {primaryLabel}
          </Link>
        </div>

        {/* Mobile: Theme Toggle + CTA + Hamburger */}
        <div className="flex md:hidden items-center justify-self-end gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full text-ink-2 hover:text-ink cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-gold" />
            ) : (
              <Moon className="w-4 h-4 text-ink-2" />
            )}
          </button>

          <Link
            href={primaryHref}
            className="inline-flex items-center min-h-[44px] rounded-full bg-btn hover:bg-btn-hover text-btn-ink font-semibold text-xs px-3.5 transition-colors whitespace-nowrap"
          >
            {primaryLabel}
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-ink-2 hover:text-ink hover:bg-paper-2 cursor-pointer"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-line bg-paper px-5 py-5 space-y-3 text-left">
          <div className="flex flex-col space-y-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center text-sm font-medium text-ink-2 hover:text-ink transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-line flex flex-col gap-2">
            {isAuthenticated && hasStores ? (
              <Link
                href="/merchant"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full min-h-[44px] flex items-center justify-center rounded-lg border border-line-strong text-ink text-xs font-semibold hover:bg-paper-2 transition-colors"
              >
                Merchant Console
              </Link>
            ) : (
              <Link
                href="/login?next=/merchant"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full min-h-[44px] flex items-center justify-center rounded-lg border border-line-strong text-ink text-xs font-semibold hover:bg-paper-2 transition-colors"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
