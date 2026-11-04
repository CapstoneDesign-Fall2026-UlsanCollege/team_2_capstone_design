"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, ShoppingBag, Sun, Moon, LayoutDashboard } from "lucide-react";
import { usePlatformTheme } from "@/context/PlatformThemeContext";
import { fetchMyStores, fetchSession } from "@/lib/api";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Features", href: "/#features" },
  { label: "Workflow", href: "/#workflow" },
  { label: "Capabilities", href: "/#capabilities" },
  { label: "Templates", href: "/#templates" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

export function PlatformNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasStores, setHasStores] = useState(false);
  const { theme, toggleTheme } = usePlatformTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-[#0d0d0e]/90 backdrop-blur-md border-b border-zinc-200 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/40"
          : "bg-white/75 dark:bg-[#0d0d0e]/75 backdrop-blur-sm border-b border-zinc-100 dark:border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none"
          aria-label="ShopCraft Home"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold shadow-xs transition-transform group-hover:scale-105">
            <ShoppingBag className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-sans font-bold tracking-tight text-xl text-zinc-900 dark:text-white">
              ShopCraft
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </div>
        </Link>

        {/* Center: Minimalist Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium font-sans text-zinc-600 dark:text-zinc-400">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right: Desktop Action Buttons + Theme Toggle */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-white/10 cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>

          {isAuthenticated ? (
            <>
              {hasStores && (
                <Link
                  href="/merchant"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors px-3 py-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Merchant Console</span>
                </Link>
              )}
              <Link
                href="/merchant/new"
                className="inline-flex items-center gap-1.5 bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs rounded-full px-4 py-2 transition-all active:scale-95 shadow-sm"
              >
                <span>{hasStores ? "New Store" : "Create Your Store"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login?next=/merchant"
                className="text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors px-3 py-1.5"
              >
                Login
              </Link>

              <Link
                href="/signup?next=/merchant/new"
                className="inline-flex items-center gap-1.5 bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs rounded-full px-4 py-2 transition-all active:scale-95 shadow-sm"
              >
                <span>Start for Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile: Theme Toggle + Hamburger Menu Button */}
        <div className="flex md:hidden items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white focus:outline-none cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none cursor-pointer"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="md:hidden border-b border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#0d0d0e]/95 backdrop-blur-xl px-5 py-6 space-y-4 shadow-2xl text-left"
          >
            <div className="flex flex-col space-y-3.5">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex flex-col gap-2.5">
              {isAuthenticated ? (
                <>
                  {hasStores && (
                    <Link
                      href="/merchant"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-2.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                    >
                      Merchant Console
                    </Link>
                  )}
                  <Link
                    href="/merchant/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
                  >
                    {hasStores ? "Create Another Store →" : "Create Your Store →"}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login?next=/merchant"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup?next=/merchant/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
                  >
                    Start for Free →
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
