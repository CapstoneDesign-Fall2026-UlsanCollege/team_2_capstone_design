"use client";

import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Copy,
  CreditCard,
  ExternalLink,
  Globe,
  LineChart,
  Package,
  Palette,
  Pencil,
  Plus,
  Repeat,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Target,
  Truck,
  Users,
  X,
} from "lucide-react";
import {
  AnalyticsRange,
  ApiError,
  fetchMerchantAnalytics,
  fetchMerchantProducts,
  fetchMerchantStoreOverview,
  formatNpr,
  MerchantStoreOverview,
  OverviewDailyPoint,
  ProductItem,
} from "@/lib/api";
import { SteepChart } from "@/components/merchant/SteepChart";
import { ProductSheet } from "@/components/merchant/ProductSheet";

interface PageProps {
  params: Promise<{ storeSlug: string }>;
}

function statusPillClasses(status: string): string {
  switch (status) {
    case "DELIVERED":
    case "PAID":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    case "SHIPPED":
    case "PROCESSING":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case "CONFIRMED":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    case "CANCELLED":
    case "PAYMENT_FAILED":
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20";
  }
}

function formatProductPrice(p: ProductItem): string {
  const variants = p.variants || [];
  if (variants.length === 0) return "No variants";
  const prices = variants.map((v) => v.price_minor);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatNpr(min) : `${formatNpr(min)} – ${formatNpr(max)}`;
}

export default function MerchantOverviewPage({ params }: PageProps) {
  const { storeSlug } = use(params);
  const router = useRouter();
  const baseHref = `/merchant/${encodeURIComponent(storeSlug)}`;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<MerchantStoreOverview | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);

  // Steep Chart & Explorer Controls
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");
  const [extendedSeries, setExtendedSeries] = useState<OverviewDailyPoint[] | null>(null);
  const [chartMode, setChartMode] = useState<"line" | "bar">("line");
  const [showOrdersOverlay, setShowOrdersOverlay] = useState(true);
  const [showTargetLine, setShowTargetLine] = useState(true);

  // Workspace Tabs & Inspector Tabs
  const [activeSection, setActiveSection] = useState<"products" | "orders" | "settings">(
    "products"
  );
  const [railTab, setRailTab] = useState<"workspace" | "setup">("workspace");

  // Inline Product Add / Edit Drawer
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const refreshWorkspaceSilently = useCallback(() => {
    Promise.all([
      fetchMerchantStoreOverview(storeSlug),
      fetchMerchantProducts(storeSlug).catch(() => [] as ProductItem[]),
    ])
      .then(([ovData, prodData]) => {
        setOverview(ovData);
        setProducts(prodData);
      })
      .catch(() => {
        // Ignore background refresh errors
      });
  }, [storeSlug]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchMerchantStoreOverview(storeSlug),
      fetchMerchantProducts(storeSlug).catch(() => [] as ProductItem[]),
    ])
      .then(([ovData, prodData]) => {
        if (!active) return;
        setOverview(ovData);
        setProducts(prodData);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : "Failed to load store workspace";
        const isAuth =
          (err instanceof ApiError && (err.status === 401 || err.status === 403)) ||
          msg.includes("401") ||
          msg.includes("403") ||
          msg.toLowerCase().includes("unauthorized") ||
          msg.toLowerCase().includes("credentials");

        if (isAuth) {
          setTimeout(
            () => router.replace(`/login?next=/merchant/${encodeURIComponent(storeSlug)}`),
            0
          );
          return;
        }
        setError(msg);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [storeSlug, router]);

  // Listen to global `+ Add Product` saves from ConsoleShell or Sidebar
  useEffect(() => {
    const onExternalProductSaved = () => {
      refreshWorkspaceSilently();
    };
    window.addEventListener("merchant:product-saved", onExternalProductSaved);
    return () => {
      window.removeEventListener("merchant:product-saved", onExternalProductSaved);
    };
  }, [refreshWorkspaceSilently]);

  // Load 30d or 90d series when merchant switches window
  useEffect(() => {
    if (range === "7d") {
      return;
    }
    let active = true;
    fetchMerchantAnalytics(storeSlug, range as AnalyticsRange)
      .then((res) => {
        if (active) {
          setExtendedSeries(res.daily_series || []);
        }
      })
      .catch(() => {
        if (active) setExtendedSeries(null);
      });
    return () => {
      active = false;
    };
  }, [storeSlug, range]);

  const handleCopyStoreLink = () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/s/${encodeURIComponent(storeSlug)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setSheetOpen(true);
  };

  const openEditProduct = (prod: ProductItem) => {
    setEditingProduct(prod);
    setSheetOpen(true);
  };

  const handleLocalProductSaved = (saved: ProductItem) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
    });
    refreshWorkspaceSilently();
  };

  const setupSteps = useMemo(() => {
    if (!overview) return [];
    const checklist = overview.checklist;
    const hasProds = checklist.has_products || products.length > 0;
    return [
      {
        id: "store_url",
        title: "Store URL claimed",
        caption: `/s/${storeSlug} is live`,
        done: true,
        href: `/s/${encodeURIComponent(storeSlug)}`,
        external: true,
      },
      {
        id: "products",
        title: "Add catalog products",
        caption: "Create items, photos & NPR pricing",
        done: hasProds,
        onAction: openAddProduct,
      },
      {
        id: "shipping",
        title: "Set delivery rates",
        caption: "Kathmandu Valley & 7-province fees",
        done: checklist.has_shipping,
        href: `${baseHref}/settings?tab=shipping`,
      },
      {
        id: "payments",
        title: "Verify Khalti & COD",
        caption: "Enable wallet & cash settlement",
        done: checklist.has_khalti,
        href: `${baseHref}/settings?tab=payments`,
      },
      {
        id: "story",
        title: "Customize theme & story",
        caption: "Brand colors, fonts & founder note",
        done: Boolean(checklist.has_story),
        href: `${baseHref}/themes`,
      },
    ];
  }, [overview, products.length, storeSlug, baseHref]);

  if (loading) {
    return (
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_296px]">
        <div className="p-6 lg:p-8 space-y-6">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-[var(--secondary)] rounded animate-pulse" />
            <div className="h-4 w-64 bg-[var(--secondary)] rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2 border-l-2 border-[var(--border)] pl-3">
                <div className="h-3 w-20 bg-[var(--secondary)] rounded animate-pulse" />
                <div className="h-5 w-24 bg-[var(--secondary)] rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="h-64 rounded-xl bg-[var(--secondary)]/60 animate-pulse" />
        </div>
        <div className="hidden xl:block border-l border-[var(--border)] bg-[var(--background)]/50 p-5 space-y-4">
          <div className="h-5 w-32 bg-[var(--secondary)] rounded animate-pulse" />
          <div className="h-24 bg-[var(--secondary)] rounded-lg animate-pulse" />
          <div className="h-24 bg-[var(--secondary)] rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="p-8 max-w-lg mx-auto my-auto text-center space-y-3">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {error || "Store not found or access denied."}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Sign in with an owner or staff account for{" "}
          <span className="font-mono text-[var(--foreground)]">{storeSlug}</span>.
        </p>
        <div className="pt-2 flex justify-center gap-2">
          <Link
            href="/merchant/new"
            className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-[var(--primary)] text-[var(--primary-foreground)]"
          >
            Create New Store
          </Link>
          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-md text-xs font-medium border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]"
          >
            Switch Account
          </Link>
        </div>
      </div>
    );
  }

  const chartSeries =
    range === "7d" || !extendedSeries ? overview.daily_sales_7d || [] : extendedSeries;
  const windowRevenueMinor = chartSeries.reduce((acc, d) => acc + d.revenue_minor, 0);
  const recentOrders = overview.recent_orders || [];
  const completedCount = setupSteps.filter((s) => s.done).length;
  const catalogCount = products.length || overview.products_count || 0;

  const settingsCards = [
    {
      title: "Store & Brand Story",
      desc: "Store name, tagline, contact details & founder note",
      href: `${baseHref}/settings?tab=general`,
      icon: Store,
      tone: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    },
    {
      title: "Payments (Khalti & COD)",
      desc: "Instant digital wallet keys & Cash on Delivery rules",
      href: `${baseHref}/settings?tab=payments`,
      icon: CreditCard,
      tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    },
    {
      title: "Shipping & 7 Provinces",
      desc: "Kathmandu Valley fee, nationwide courier & free threshold",
      href: `${baseHref}/settings?tab=shipping`,
      icon: Truck,
      tone: "text-orange-600 dark:text-orange-400 bg-orange-500/10",
    },
    {
      title: "Themes & Storefront",
      desc: "Editorial presets, typography, colors & live preview",
      href: `${baseHref}/themes`,
      icon: Palette,
      tone: "text-violet-600 dark:text-violet-400 bg-violet-500/10",
    },
    {
      title: "Discounts & Promo Codes",
      desc: `${overview.active_discounts_count ?? 0} active checkout promo codes`,
      href: `${baseHref}/discounts`,
      icon: Tag,
      tone: "text-pink-600 dark:text-pink-400 bg-pink-500/10",
    },
    {
      title: "Repeat Subscriptions",
      desc: `${overview.active_subscriptions_count ?? 0} recurring subscriber deliveries`,
      href: `${baseHref}/subscriptions`,
      icon: Repeat,
      tone: "text-teal-600 dark:text-teal-400 bg-teal-500/10",
    },
    {
      title: "Customers Directory",
      desc: `${overview.customers_count ?? 0} shoppers & lifetime order history`,
      href: `${baseHref}/customers`,
      icon: Users,
      tone: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
    },
    {
      title: "Staff & Security Audit",
      desc: "Team role permissions & store activity log",
      href: `${baseHref}/settings?tab=staff`,
      icon: ShieldCheck,
      tone: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    },
  ];

  return (
    <div className="flex-1 flex flex-col xl:flex-row min-h-full">
      {/* =====================================================================
          LEFT / CENTER MAIN WORKSPACE CANVAS (Steep Minimalist White Canvas)
          ===================================================================== */}
      <div className="flex-1 min-w-0 px-5 py-6 sm:px-8 sm:py-7 space-y-8 bg-[var(--card)]">
        {/* 1. Calm Steep Header + Chart Mode Switcher */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-[22px] font-semibold tracking-tight text-[var(--foreground)]">
                {overview.store.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
              {overview.member_role && (
                <span className="text-[11px] text-[var(--muted-foreground)] font-mono uppercase">
                  {overview.member_role}
                </span>
              )}
            </div>

            {/* Steep Subtitle Date & Breakdown Row */}
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-[var(--muted-foreground)]">
              <div className="inline-flex items-center gap-1 rounded-md bg-[var(--background)] border border-[var(--border)] p-0.5 text-xs">
                {(
                  [
                    { id: "7d", label: "Last 7 days" },
                    { id: "30d", label: "30 days" },
                    { id: "90d", label: "90 days" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRange(opt.id)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                      range === opt.id
                        ? "bg-[var(--card)] text-[var(--foreground)] font-medium shadow-2xs"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <span className="hidden sm:inline text-[var(--border)]">·</span>
              <span className="text-xs truncate max-w-md">
                {overview.store.tagline || `Performance & catalog overview for /s/${storeSlug}`}
              </span>
            </div>
          </div>

          {/* Right Chart View Switcher (Steep Line / Bar Icons) */}
          <div className="flex items-center gap-2 self-start">
            <div
              className="inline-flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--background)]"
              role="group"
              aria-label="Chart display mode"
            >
              <button
                type="button"
                onClick={() => setChartMode("line")}
                title="Smooth curve view"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  chartMode === "line"
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-2xs"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartMode("bar")}
                title="Bar column view"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  chartMode === "bar"
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-2xs"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
            </div>

            <Link
              href={`${baseHref}/analytics`}
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <span>Full Report</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 2. Steep Vertical-Accent Inline Metrics Strip (Zero Box Clutter) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-7 pt-1">
          <div className="border-l-[2.5px] border-blue-500 pl-3.5 space-y-0.5">
            <p className="text-xs text-[var(--muted-foreground)]">Gross Revenue</p>
            <p className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--foreground)] tabular-nums">
              {formatNpr(overview.revenue_minor)}
            </p>
            <p className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
              {formatNpr(windowRevenueMinor)} in {range}
            </p>
          </div>

          <Link
            href={`${baseHref}/orders`}
            className="border-l-[2.5px] border-[#E89578] pl-3.5 space-y-0.5 group"
          >
            <p className="text-xs text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
              Total Orders
            </p>
            <p className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--foreground)] tabular-nums">
              {overview.orders_count}
            </p>
            <p className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
              {overview.pending_fulfillment_count ?? 0} awaiting dispatch
            </p>
          </Link>

          <button
            type="button"
            onClick={() => setActiveSection("products")}
            className="border-l-[2.5px] border-emerald-500 pl-3.5 space-y-0.5 text-left group cursor-pointer"
          >
            <p className="text-xs text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
              Catalog Products
            </p>
            <p className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--foreground)] tabular-nums">
              {catalogCount}
            </p>
            <p className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
              {overview.active_subscriptions_count ?? 0} active subscriptions
            </p>
          </button>

          <Link
            href={`${baseHref}/orders`}
            className="border-l-[2.5px] border-violet-500 pl-3.5 space-y-0.5 group"
          >
            <p className="text-xs text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
              COD to Collect
            </p>
            <p className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--foreground)] tabular-nums">
              {formatNpr(overview.cod_pending_minor ?? 0)}
            </p>
            <p className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
              {overview.today_orders_count ?? 0} orders today
            </p>
          </Link>
        </div>

        {/* 3. Steep Smooth Dual-Curve / Bar Chart */}
        <div className="pt-1 pb-2">
          <SteepChart
            series={chartSeries}
            mode={chartMode}
            showOrdersOverlay={showOrdersOverlay}
            showTargetLine={showTargetLine}
            height={252}
          />
        </div>

        {/* 4. Direct Store Workspace Tabs: Products, Orders & Settings */}
        <div className="space-y-4 pt-2 border-t border-[var(--border)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-5 -mb-px overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveSection("products")}
                className={`pb-2.5 text-[13px] border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeSection === "products"
                    ? "border-blue-500 text-[var(--foreground)] font-semibold"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                Catalog Products ({products.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("orders")}
                className={`pb-2.5 text-[13px] border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeSection === "orders"
                    ? "border-blue-500 text-[var(--foreground)] font-semibold"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                Recent Orders ({recentOrders.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("settings")}
                className={`pb-2.5 text-[13px] border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeSection === "settings"
                    ? "border-blue-500 text-[var(--foreground)] font-semibold"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                Settings &amp; Modules
              </button>
            </div>

            {activeSection === "products" && (
              <div className="flex items-center gap-2 pb-2 sm:pb-1.5">
                <button
                  type="button"
                  onClick={openAddProduct}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Product</span>
                </button>
                <Link
                  href={`${baseHref}/products`}
                  className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-2 py-1"
                >
                  <span>Manage All</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {activeSection === "orders" && (
              <div className="pb-2 sm:pb-1.5">
                <Link
                  href={`${baseHref}/orders`}
                  className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <span>All Orders</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {activeSection === "settings" && (
              <div className="pb-2 sm:pb-1.5">
                <Link
                  href={`${baseHref}/settings`}
                  className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <span>Open Full Settings</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* TAB 1: Inline Catalog Products Manager */}
          {activeSection === "products" && (
            <div>
              {products.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)]/60 p-8 text-center space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      Add your first product
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
                      Upload a photo, set your NPR price, and enable one-time or recurring
                      subscription checkout in seconds.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddProduct}
                    className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium hover:opacity-90 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Product</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] overflow-hidden">
                  {products.slice(0, 8).map((prod) => {
                    const variantCount = prod.variants?.length || 0;
                    return (
                      <div
                        key={prod.id}
                        className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--background)]/70 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg border border-[var(--border)] bg-[var(--background)] overflow-hidden shrink-0 flex items-center justify-center">
                            {prod.image_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={prod.image_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-[var(--muted-foreground)]" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`${baseHref}/products/${prod.id}`}
                                className="text-[13px] font-medium text-[var(--foreground)] hover:underline truncate"
                              >
                                {prod.name}
                              </Link>
                              {!prod.is_active && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--muted-foreground)]">
                                  Draft
                                </span>
                              )}
                              {prod.allow_subscription && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                                  Sub
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                              {variantCount} {variantCount === 1 ? "variant" : "variants"} · /
                              {prod.slug}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-mono font-semibold text-[var(--foreground)] tabular-nums">
                            {formatProductPrice(prod)}
                          </span>

                          <button
                            type="button"
                            onClick={() => openEditProduct(prod)}
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-xs text-[var(--foreground)] transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3 h-3 text-[var(--muted-foreground)]" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Recent Orders */}
          {activeSection === "orders" && (
            <div>
              {recentOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)]/60 p-8 text-center space-y-2.5">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    No orders placed yet
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
                    Share your <span className="font-mono">/s/{storeSlug}</span> link on Instagram,
                    TikTok, or WhatsApp to receive your first order.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyStoreLink}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-xs font-medium text-[var(--foreground)] cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Link Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Store Link</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] overflow-hidden">
                  {recentOrders.map((ord) => (
                    <Link
                      key={ord.id}
                      href={`${baseHref}/orders/${ord.id}`}
                      className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--background)]/70 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[var(--foreground)] tabular-nums">
                            {ord.order_number}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-medium ${statusPillClasses(
                              ord.status
                            )}`}
                          >
                            {ord.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--muted-foreground)] truncate mt-0.5">
                          {ord.customer_name} · {ord.payment_method}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-mono text-xs font-semibold text-[var(--foreground)] tabular-nums">
                          {formatNpr(ord.total_minor)}
                        </p>
                        <p className="text-[10px] font-mono text-[var(--muted-foreground)]">
                          {new Date(ord.created_at).toLocaleDateString("en-NP", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Store Settings & All ShopCraft Components */}
          {activeSection === "settings" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {settingsCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--background)]/80 hover:border-blue-500/40 flex items-start justify-between gap-3 transition-all"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${item.tone}`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[var(--foreground)]">
                          {item.title}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          RIGHT CONTEXTUAL INSPECTOR RAIL (Steep `Explore | Setup` Panel)
          ===================================================================== */}
      <aside className="w-full xl:w-[296px] shrink-0 border-t xl:border-t-0 xl:border-l border-[var(--border)] bg-[var(--background)]/55 flex flex-col justify-between">
        <div>
          {/* Rail Tabs: Workspace | Setup */}
          <div className="px-5 h-11 border-b border-[var(--border)] flex items-center gap-5 text-xs">
            <button
              type="button"
              onClick={() => setRailTab("workspace")}
              className={`h-full border-b-2 transition-colors cursor-pointer ${
                railTab === "workspace"
                  ? "border-[var(--foreground)] text-[var(--foreground)] font-semibold"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Explore &amp; Actions
            </button>
            <button
              type="button"
              onClick={() => setRailTab("setup")}
              className={`h-full border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                railTab === "setup"
                  ? "border-[var(--foreground)] text-[var(--foreground)] font-semibold"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <span>Setup</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)]">
                {completedCount}/5
              </span>
            </button>
          </div>

          {railTab === "workspace" ? (
            <div className="divide-y divide-[var(--border)] text-xs">
              {/* Quick Add Product Row */}
              <div className="px-5 py-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                    <Package className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span>Catalog</span>
                  </span>
                  <button
                    type="button"
                    onClick={openAddProduct}
                    title="Quick add product"
                    className="p-1 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={openAddProduct}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/12 text-blue-700 dark:text-blue-300 font-medium hover:bg-blue-500/20 transition-colors cursor-pointer"
                  >
                    <span>+ Add Product</span>
                  </button>
                  <Link
                    href={`${baseHref}/products`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <span>{catalogCount} items</span>
                  </Link>
                </div>
              </div>

              {/* Steep `Compare metrics` Interactive Control */}
              <div className="px-5 py-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                    <BarChart3 className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span>Compare metrics</span>
                  </span>
                  {!showOrdersOverlay && (
                    <button
                      type="button"
                      onClick={() => setShowOrdersOverlay(true)}
                      className="p-1 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                      title="Show orders curve"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {showOrdersOverlay && (
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/12 text-blue-700 dark:text-blue-300 font-medium">
                      <span>Orders volume</span>
                      <button
                        type="button"
                        onClick={() => setShowOrdersOverlay(false)}
                        aria-label="Hide orders overlay"
                        className="hover:opacity-75 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                )}

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showOrdersOverlay}
                    onChange={(e) => setShowOrdersOverlay(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="space-y-0.5">
                    <span className="block font-medium text-[var(--foreground)]">
                      Second y-axis
                    </span>
                    <span className="block text-[11px] text-[var(--muted-foreground)] leading-snug">
                      Use a separate axis for daily order volume alongside NPR revenue.
                    </span>
                  </span>
                </label>
              </div>

              {/* Steep `Target` Control */}
              <div className="px-5 py-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                    <Target className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span>Target</span>
                  </span>
                  {!showTargetLine && (
                    <button
                      type="button"
                      onClick={() => setShowTargetLine(true)}
                      className="p-1 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                      title="Show daily average target"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {showTargetLine ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/12 text-blue-700 dark:text-blue-300 font-medium">
                    <span>Daily average</span>
                    <button
                      type="button"
                      onClick={() => setShowTargetLine(false)}
                      aria-label="Hide target line"
                      className="hover:opacity-75 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : (
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    Click + to display the dashed daily average line.
                  </p>
                )}
              </div>

              {/* Steep `>` Navigation Rows for Settings & Store Modules */}
              <div className="divide-y divide-[var(--border)]">
                <Link
                  href={`${baseHref}/settings?tab=general`}
                  className="px-5 py-3 flex items-center justify-between hover:bg-[var(--secondary)]/60 transition-colors"
                >
                  <span className="flex items-center gap-2 text-[var(--foreground)] font-medium">
                    <Settings className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span>Store Settings</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                </Link>

                <Link
                  href={`${baseHref}/settings?tab=payments`}
                  className="px-5 py-3 flex items-center justify-between hover:bg-[var(--secondary)]/60 transition-colors"
                >
                  <span className="flex items-center gap-2 text-[var(--foreground)] font-medium">
                    <CreditCard className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span>Khalti &amp; COD</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                </Link>

                <Link
                  href={`${baseHref}/themes`}
                  className="px-5 py-3 flex items-center justify-between hover:bg-[var(--secondary)]/60 transition-colors"
                >
                  <span className="flex items-center gap-2 text-[var(--foreground)] font-medium">
                    <Palette className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span>Themes &amp; Design</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                </Link>

                <Link
                  href={`${baseHref}/discounts`}
                  className="px-5 py-3 flex items-center justify-between hover:bg-[var(--secondary)]/60 transition-colors"
                >
                  <span className="flex items-center gap-2 text-[var(--foreground)] font-medium">
                    <Tag className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span>Promo Codes</span>
                  </span>
                  <span className="flex items-center gap-1 text-[var(--muted-foreground)]">
                    <span className="font-mono text-[11px]">
                      {overview.active_discounts_count ?? 0}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </Link>

                <Link
                  href={`${baseHref}/subscriptions`}
                  className="px-5 py-3 flex items-center justify-between hover:bg-[var(--secondary)]/60 transition-colors"
                >
                  <span className="flex items-center gap-2 text-[var(--foreground)] font-medium">
                    <Repeat className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span>Subscriptions</span>
                  </span>
                  <span className="flex items-center gap-1 text-[var(--muted-foreground)]">
                    <span className="font-mono text-[11px]">
                      {overview.active_subscriptions_count ?? 0}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            </div>
          ) : (
            /* Setup Checklist Inspector Tab */
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[var(--foreground)]">Launch Progress</span>
                  <span className="font-mono text-[var(--muted-foreground)]">
                    {completedCount}/5
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((completedCount / 5) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                {setupSteps.map((st, idx) => (
                  <div
                    key={st.id}
                    className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5 ${
                          st.done
                            ? "bg-emerald-500 text-white"
                            : "border border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)]"
                        }`}
                      >
                        {st.done ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--foreground)]">{st.title}</p>
                        <p className="text-[11px] text-[var(--muted-foreground)]">{st.caption}</p>
                      </div>
                    </div>

                    {st.onAction ? (
                      <button
                        type="button"
                        onClick={st.onAction}
                        className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
                      >
                        Add
                      </button>
                    ) : st.href ? (
                      <Link
                        href={st.href}
                        target={st.external ? "_blank" : undefined}
                        className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                      >
                        Open
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Storefront Link Callout Card (Steep Floating Card Feel) */}
        <div className="p-4 m-4 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>Live Storefront</span>
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>

          <p className="text-[11px] font-mono text-[var(--muted-foreground)] truncate">
            /s/{storeSlug}
          </p>

          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={handleCopyStoreLink}
              className="flex-1 h-7 px-2.5 rounded-md border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--secondary)] text-[11px] font-medium text-[var(--foreground)] inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-[var(--muted-foreground)]" />
                  <span>Copy URL</span>
                </>
              )}
            </button>
            <Link
              href={`/s/${encodeURIComponent(storeSlug)}`}
              target="_blank"
              className="h-7 px-2.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-[11px] font-medium inline-flex items-center justify-center gap-1 hover:opacity-90 transition-opacity"
            >
              <span>Visit</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Inline Product Create / Edit Slide-Over Sheet */}
      <ProductSheet
        storeSlug={storeSlug}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        product={editingProduct}
        onSaved={handleLocalProductSaved}
      />
    </div>
  );
}
