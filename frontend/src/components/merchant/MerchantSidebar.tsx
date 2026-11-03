"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Check,
  ChevronsUpDown,
  ExternalLink,
  Home,
  Moon,
  Package,
  Palette,
  Plus,
  Repeat,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Sun,
  Tag,
  Users,
} from "lucide-react";
import { usePlatformTheme } from "@/context/PlatformThemeContext";
import { fetchMyStores, MerchantStoreMembership } from "@/lib/api";

interface MerchantSidebarProps {
  storeSlug: string;
  onOpenCommandPalette: () => void;
}

export function MerchantSidebar({ storeSlug, onOpenCommandPalette }: MerchantSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = usePlatformTheme();

  const [stores, setStores] = React.useState<MerchantStoreMembership[]>([]);
  const [isSwitcherOpen, setIsSwitcherOpen] = React.useState(false);
  const switcherRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && storeSlug) {
      localStorage.setItem("shopcraft_active_store_slug", storeSlug);
    }
    fetchMyStores()
      .then((res) => {
        if (res.stores && res.stores.length > 0) {
          setStores(res.stores);
        } else {
          setStores([{
            id: 0,
            slug: storeSlug,
            name: storeSlug,
            category: "Specialty Goods",
            city: "Kathmandu",
            province: "Bagmati Province",
            theme_preset: "editorial-warm",
            logo_url: "",
            accent_color: "",
            role: "OWNER",
            created_at: new Date().toISOString(),
          }]);
        }
      })
      .catch(() => {
        setStores([{
          id: 0,
          slug: storeSlug,
          name: storeSlug,
          category: "Specialty Goods",
          city: "Kathmandu",
          province: "Bagmati Province",
          theme_preset: "editorial-warm",
          logo_url: "",
          accent_color: "",
          role: "OWNER",
          created_at: new Date().toISOString(),
        }]);
      });
  }, [storeSlug]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setIsSwitcherOpen(false);
      }
    }
    if (isSwitcherOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isSwitcherOpen]);

  const currentStore = stores.find((s) => s.slug === storeSlug);

  const navItems = [
    {
      label: "Overview",
      href: `/merchant/${encodeURIComponent(storeSlug)}`,
      exact: true,
      icon: Home,
    },
    {
      label: "Orders & Dispatch",
      href: `/merchant/${encodeURIComponent(storeSlug)}/orders`,
      exact: false,
      icon: ShoppingBag,
    },
    {
      label: "Products & Catalog",
      href: `/merchant/${encodeURIComponent(storeSlug)}/products`,
      exact: false,
      icon: Package,
    },
    {
      label: "Customers",
      href: `/merchant/${encodeURIComponent(storeSlug)}/customers`,
      exact: false,
      icon: Users,
    },
    {
      label: "Subscriptions",
      href: `/merchant/${encodeURIComponent(storeSlug)}/subscriptions`,
      exact: false,
      icon: Repeat,
    },
    {
      label: "Discounts",
      href: `/merchant/${encodeURIComponent(storeSlug)}/discounts`,
      exact: false,
      icon: Tag,
    },
    {
      label: "Analytics",
      href: `/merchant/${encodeURIComponent(storeSlug)}/analytics`,
      exact: false,
      icon: BarChart3,
    },
    {
      label: "Online Store",
      href: `/merchant/${encodeURIComponent(storeSlug)}/themes`,
      exact: false,
      icon: Palette,
    },
    {
      label: "Store Settings",
      href: `/merchant/${encodeURIComponent(storeSlug)}/settings`,
      exact: false,
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[240px] h-screen sticky top-0 shrink-0 border-r border-[var(--border)] bg-[var(--card)] select-none text-[var(--foreground)]">
      {/* 1. Store Header & Live View Pill */}
      <div className="p-4 border-b border-[var(--border)] bg-[var(--card)] space-y-2.5">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-extrabold text-sm tracking-tight text-[var(--foreground)] flex items-center gap-1.5">
            <Store className="w-4 h-4 text-emerald-500" />
            <span>ShopCraft</span>
          </Link>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
            Merchant
          </span>
        </div>

        {/* Store Switcher */}
        <div className="pt-1 relative" ref={switcherRef}>
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="w-full p-1.5 -mx-1.5 rounded-md hover:bg-[var(--secondary)] transition-colors flex items-center justify-between text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <div className="min-w-0">
                <span className="font-sans text-xs font-bold text-[var(--foreground)] truncate block">
                  {currentStore?.name || storeSlug}
                </span>
                <span className="text-[10px] font-mono text-[var(--muted-foreground)] truncate block">
                  /merchant/{storeSlug}
                </span>
              </div>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] shrink-0 ml-1 transition-colors" />
          </button>

          {isSwitcherOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1.5 shadow-xl text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1 text-[10px] font-mono font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Switch Store
              </div>

              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {stores.length > 0 ? (
                  stores.map((st) => {
                    const isCurrent = st.slug === storeSlug;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setIsSwitcherOpen(false);
                          if (!isCurrent) {
                            if (typeof window !== "undefined") {
                              localStorage.setItem("shopcraft_active_store_slug", st.slug);
                            }
                            router.push(`/merchant/${encodeURIComponent(st.slug)}`);
                          }
                        }}
                        className={`w-full px-2 py-1.5 rounded-md flex items-center justify-between text-left transition-colors cursor-pointer ${
                          isCurrent
                            ? "bg-[var(--secondary)] font-semibold text-[var(--foreground)]"
                            : "hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="truncate block font-medium">{st.name}</span>
                          <span className="text-[10px] font-mono text-[var(--muted-foreground)] truncate block">
                            /s/{st.slug}
                          </span>
                        </div>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-2" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-2 py-1 text-xs text-[var(--muted-foreground)]">
                    {storeSlug} (active)
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--border)] pt-1 mt-1">
                <Link
                  href="/merchant/new"
                  onClick={() => setIsSwitcherOpen(false)}
                  className="w-full px-2 py-1.5 rounded-md flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                >
                  <Plus className="w-3 h-3 text-emerald-500" />
                  <span>Create new store</span>
                </Link>
              </div>
            </div>
          )}

          <Link
            href={`/s/${encodeURIComponent(storeSlug)}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-[11px] font-sans font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] mt-2 px-2 py-0.5 rounded bg-[var(--secondary)] hover:bg-[var(--accent)] border border-[var(--border)] transition-colors"
          >
            <span>View Live Storefront</span>
            <ExternalLink className="w-3 h-3 text-[var(--muted-foreground)]" />
          </Link>
        </div>
      </div>

      {/* 2. ⌘K Search Command Trigger Button */}
      <div className="p-3">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full h-8 px-2.5 rounded-md border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--secondary)] flex items-center justify-between text-xs text-[var(--muted-foreground)] transition-colors cursor-pointer shadow-2xs"
        >
          <span className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
            <span className="text-xs">Search Console</span>
          </span>
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--secondary)] border border-[var(--border)] text-[var(--muted-foreground)]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* 3. Navigation Links */}
      <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors ${
                isActive
                  ? "bg-[var(--secondary)] text-[var(--foreground)] font-semibold border-l-2 border-emerald-500"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/50"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-emerald-500" : "text-[var(--muted-foreground)]"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 4. Footer with Theme Toggle */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-between">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-2 py-1.5 rounded-md hover:bg-[var(--secondary)] transition-colors cursor-pointer"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-zinc-600" />
          )}
          <span className="text-[11px] font-mono capitalize">{theme} mode</span>
        </button>

        <Link
          href="/"
          className="text-[11px] font-mono text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          Platform ↗
        </Link>
      </div>
    </aside>
  );
}
