"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { usePlatformTheme } from "@/context/PlatformThemeContext";
import { fetchMyStores, fetchSession } from "@/lib/api";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Looks", href: "/#looks" },
  { label: "Orders", href: "/#orders" },
  { label: "FAQ", href: "/#faq" },
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

  const themeLabel = theme === "dark" ? "Light" : "Dark";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#F9F9F7] dark:bg-[#0E0F12] border-b border-[#E2E2DC] dark:border-white/10">
      <div className="max-w-[1040px] mx-auto px-5 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0 focus:outline-none"
          aria-label="ShopCraft Home"
        >
          <span
            className="w-7 h-7 rounded-[7px] bg-[#161614] dark:bg-[#ECECE9] text-[#F9F9F7] dark:text-[#0E0F12] flex items-center justify-center font-bold text-[15px]"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          >
            S
          </span>
          <span className="font-bold tracking-tight text-[17px] text-[#161614] dark:text-[#ECECE9]">
            ShopCraft
          </span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-[#4A4A45] dark:text-[#B4B6BD]">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="hover:text-[#161614] dark:hover:text-[#ECECE9] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions (rounded-lg controls, no pills in nav) */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="min-h-[38px] px-3.5 rounded-lg border border-[#E2E2DC] dark:border-white/15 bg-white dark:bg-[#15171B] text-[#161614] dark:text-[#ECECE9] text-[13px] font-semibold whitespace-nowrap cursor-pointer hover:border-[#C6C6BE] dark:hover:border-white/30 transition-colors"
          >
            {themeLabel}
          </button>

          {isAuthenticated ? (
            <>
              {hasStores && (
                <Link
                  href="/merchant"
                  className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-lg border border-[#E2E2DC] dark:border-white/15 bg-white dark:bg-[#15171B] text-[#161614] dark:text-[#ECECE9] text-[13px] font-semibold whitespace-nowrap hover:border-[#C6C6BE] dark:hover:border-white/30 transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Console</span>
                </Link>
              )}
              <Link
                href="/merchant/new"
                className="inline-flex items-center min-h-[38px] px-3.5 rounded-lg bg-[#161614] dark:bg-[#ECECE9] text-[#F9F9F7] dark:text-[#0E0F12] text-[13px] font-semibold whitespace-nowrap hover:opacity-90 transition-opacity"
              >
                {hasStores ? "New store" : "Create my store"}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login?next=/merchant"
                className="inline-flex items-center min-h-[38px] px-3.5 rounded-lg border border-[#E2E2DC] dark:border-white/15 bg-white dark:bg-[#15171B] text-[#161614] dark:text-[#ECECE9] text-[13px] font-semibold whitespace-nowrap hover:border-[#C6C6BE] dark:hover:border-white/30 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup?next=/merchant/new"
                className="inline-flex items-center min-h-[38px] px-3.5 rounded-lg bg-[#161614] dark:bg-[#ECECE9] text-[#F9F9F7] dark:text-[#0E0F12] text-[13px] font-semibold whitespace-nowrap hover:opacity-90 transition-opacity"
              >
                Create my store
              </Link>
            </>
          )}
        </div>

        {/* Mobile Actions (single crisp row, >=40px tap targets) */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="min-h-[40px] px-3 rounded-lg border border-[#E2E2DC] dark:border-white/15 bg-white dark:bg-[#15171B] text-[#161614] dark:text-[#ECECE9] text-xs font-semibold whitespace-nowrap cursor-pointer"
          >
            {themeLabel}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="min-h-[40px] min-w-[40px] rounded-lg border border-[#E2E2DC] dark:border-white/15 bg-white dark:bg-[#15171B] text-[#161614] dark:text-[#ECECE9] inline-flex items-center justify-center cursor-pointer"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Flat Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E2E2DC] dark:border-white/10 bg-[#F9F9F7] dark:bg-[#0E0F12] px-5 py-5 space-y-4">
          <nav className="flex flex-col gap-3 text-sm font-medium text-[#4A4A45] dark:text-[#B4B6BD]">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#161614] dark:hover:text-[#ECECE9]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="pt-3 border-t border-[#E2E2DC] dark:border-white/10 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <>
                {hasStores && (
                  <Link
                    href="/merchant"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[44px] w-full rounded-lg border border-[#E2E2DC] dark:border-white/15 bg-white dark:bg-[#15171B] text-[#161614] dark:text-[#ECECE9] text-sm font-semibold inline-flex items-center justify-center"
                  >
                    Merchant Console
                  </Link>
                )}
                <Link
                  href="/merchant/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] w-full rounded-lg bg-[#161614] dark:bg-[#ECECE9] text-[#F9F9F7] dark:text-[#0E0F12] text-sm font-semibold inline-flex items-center justify-center"
                >
                  {hasStores ? "New store" : "Create my store"}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login?next=/merchant"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] w-full rounded-lg border border-[#E2E2DC] dark:border-white/15 bg-white dark:bg-[#15171B] text-[#161614] dark:text-[#ECECE9] text-sm font-semibold inline-flex items-center justify-center"
                >
                  Login
                </Link>
                <Link
                  href="/signup?next=/merchant/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] w-full rounded-lg bg-[#161614] dark:bg-[#ECECE9] text-[#F9F9F7] dark:text-[#0E0F12] text-sm font-semibold inline-flex items-center justify-center"
                >
                  Create my store
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
