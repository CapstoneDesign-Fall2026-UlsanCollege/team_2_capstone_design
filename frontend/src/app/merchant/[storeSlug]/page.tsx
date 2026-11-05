"use client";

import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import {
  AnalyticsRange,
  ApiError,
  fetchMerchantAnalytics,
  fetchMerchantProducts,
  fetchMerchantStoreOverview,
  formatNpr,
  MerchantAnalyticsResponse,
  MerchantStoreOverview,
  OverviewDailyPoint,
  ProductItem,
} from "@/lib/api";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { SetupGuideCard } from "@/components/merchant/SetupGuideCard";
import { NeedsAttentionCards } from "@/components/merchant/NeedsAttentionCards";
import { HomeKpiStrip, HomeKpiData } from "@/components/merchant/HomeKpiStrip";
import { ProductSheet } from "@/components/merchant/ProductSheet";
import { SalesBarChart } from "@/components/merchant/SalesBarChart";
import { RecentOrdersSection } from "@/components/merchant/RecentOrdersSection";
import {
  countsAsSales,
  fulfillmentView,
  isKhaltiProblem,
  paymentView,
} from "@/lib/merchant-status";

interface PageProps {
  params: Promise<{ storeSlug: string }>;
}

export default function MerchantOverviewPage({ params }: PageProps) {
  const { storeSlug } = use(params);
  const router = useRouter();
  const baseHref = `/merchant/${encodeURIComponent(storeSlug)}`;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<MerchantStoreOverview | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [analytics, setAnalytics] = useState<MerchantAnalyticsResponse | null>(null);

  // Date range segmented control: 7d, 30d, 90d
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");

  // Chart configuration controls (lives on the chart)
  const [chartMode, setChartMode] = useState<"bar" | "line">("bar");
  const [showCompare, setShowCompare] = useState(false);

  // Inline Product Add / Edit Drawer
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  const refreshSilently = useCallback(() => {
    Promise.all([
      fetchMerchantStoreOverview(storeSlug),
      fetchMerchantProducts(storeSlug).catch(() => [] as ProductItem[]),
      fetchMerchantAnalytics(storeSlug, range as AnalyticsRange).catch(() => null),
    ])
      .then(([ovData, prodData, anaData]) => {
        setOverview(ovData);
        setProducts(prodData);
        if (anaData) setAnalytics(anaData);
      })
      .catch(() => {});
  }, [storeSlug, range]);

  // Initial load
  useEffect(() => {
    let active = true;
    Promise.all([
      fetchMerchantStoreOverview(storeSlug),
      fetchMerchantProducts(storeSlug).catch(() => [] as ProductItem[]),
      fetchMerchantAnalytics(storeSlug, range as AnalyticsRange).catch(() => null),
    ])
      .then(([ovData, prodData, anaData]) => {
        if (!active) return;
        setOverview(ovData);
        setProducts(prodData);
        if (anaData) setAnalytics(anaData);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : "Failed to load store overview";
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
  }, [storeSlug, router, range]);

  // External product saved listener (from top bar or global shortcut)
  useEffect(() => {
    const onSaved = () => refreshSilently();
    window.addEventListener("merchant:product-saved", onSaved);
    return () => window.removeEventListener("merchant:product-saved", onSaved);
  }, [refreshSilently]);

  const openAddProduct = () => {
    setEditingProduct(null);
    setSheetOpen(true);
  };

  const handleProductSaved = (saved: ProductItem) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
    });
    refreshSilently();
  };

  // KPI Calculations strictly scoped to the range
  const kpiData: HomeKpiData = useMemo(() => {
    if (analytics?.kpis) {
      return {
        salesPaidMinor: analytics.kpis.paid_sales_minor ?? 0,
        ordersCount: analytics.kpis.orders_count ?? 0,
        aovMinor: analytics.kpis.aov_minor ?? 0,
        codPendingMinor: analytics.kpis.cod_pending_minor ?? overview?.cod_pending_minor ?? 0,
        salesDeltaPct: null,
        ordersDeltaPct: null,
        aovDeltaPct: null,
      };
    }
    // Fallback to overview data if analytics fetch is in-flight
    const salesPaid = overview?.revenue_minor ?? 0;
    const ordersCount = overview?.orders_count ?? 0;
    const aov = ordersCount > 0 ? Math.round(salesPaid / ordersCount) : 0;
    return {
      salesPaidMinor: salesPaid,
      ordersCount,
      aovMinor: aov,
      codPendingMinor: overview?.cod_pending_minor ?? 0,
      salesDeltaPct: null,
      ordersDeltaPct: null,
      aovDeltaPct: null,
    };
  }, [analytics, overview]);

  // Khalti problem orders
  const khaltiProblemsCount = overview?.recent_orders
    ? overview.recent_orders.filter(isKhaltiProblem).length
    : 0;

  // Chart data
  const chartSeries: OverviewDailyPoint[] = useMemo(() => {
    if (analytics?.daily_series && analytics.daily_series.length > 0) {
      return analytics.daily_series;
    }
    return overview?.daily_sales_7d || [];
  }, [analytics, overview]);

  const rangeLabel = range === "7d" ? "7 days" : range === "30d" ? "30 days" : "90 days";

  // Loading state (skeletons, zero layout shift)
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="h-7 w-24 bg-[var(--surface)] border border-[var(--border)] rounded-lg animate-pulse" />
          <div className="h-9 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-lg animate-pulse" />
        </div>
        <div className="h-28 rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-pulse" />
      </div>
    );
  }

  // Error state
  if (error || !overview) {
    return (
      <div className="mx-auto max-w-md p-8 my-auto text-center space-y-4">
        <div className="size-10 rounded-full border border-[var(--error-bd)] bg-[var(--error-bg)] text-[var(--error-fg)] flex items-center justify-center mx-auto">
          <AlertTriangle className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--ink)]">
            {error || "Unable to load store workspace"}
          </p>
          <p className="text-xs text-[var(--ink-2)]">
            Please verify your network connection or account permissions.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-2">
          <Button onClick={() => window.location.reload()} variant="primary" size="sm">
            <RefreshCw className="size-3.5 mr-1.5" />
            Retry
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/login">Switch account</Link>
          </Button>
        </div>
      </div>
    );
  }

  const recentOrders = overview.recent_orders || [];

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8 space-y-6 text-[13px]">
      {/* 1. Header: Page Title "Home" + Date Range Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-[22px] font-semibold tracking-tight text-[var(--ink)]">
            Home
          </h1>
        </div>

        <Tabs
          aria-label="Date range"
          variant="segmented"
          value={range}
          onValueChange={(val) => setRange(val as "7d" | "30d" | "90d")}
          options={[
            { value: "7d", label: "Last 7 days" },
            { value: "30d", label: "30 days" },
            { value: "90d", label: "90 days" },
          ]}
        />
      </div>

      {/* 2. Setup Guide Card (dismissible, hidden at 5/5) */}
      <SetupGuideCard
        storeSlug={storeSlug}
        checklist={overview.checklist}
        onQuickAddProduct={openAddProduct}
      />

      {/* 3. Needs Attention Cards */}
      <NeedsAttentionCards
        storeSlug={storeSlug}
        ordersToDispatchCount={overview.pending_fulfillment_count ?? 0}
        codPendingMinor={overview.cod_pending_minor ?? 0}
        khaltiProblemsCount={khaltiProblemsCount}
      />

      {/* 4. KPI Strip */}
      <HomeKpiStrip data={kpiData} rangeLabel={rangeLabel} />

      {/* 5. Sales Chart Section (BAR chart, near-black bars, today highlighted, 240px tall, compact summary if < 5 orders) */}
      <SalesBarChart
        series={chartSeries}
        storeSlug={storeSlug}
        totalOrdersInRange={kpiData.ordersCount}
        totalSalesMinor={kpiData.salesPaidMinor}
        rangeLabel={rangeLabel}
      />

      {/* 6. Recent Orders Section (Responsive table on desktop/tablet, card list on mobile) */}
      <RecentOrdersSection
        orders={recentOrders}
        storeSlug={storeSlug}
      />

      {/* Inline Product Create / Edit Slide-Over Sheet */}
      <ProductSheet
        storeSlug={storeSlug}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        product={editingProduct}
        onSaved={handleProductSaved}
      />
    </div>
  );
}
