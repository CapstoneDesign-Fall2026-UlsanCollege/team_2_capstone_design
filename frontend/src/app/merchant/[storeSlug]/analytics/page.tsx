"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Banknote,
  CreditCard,
  MapPin,
  Package,
  RefreshCw,
  Repeat,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  AnalyticsRange,
  ApiError,
  fetchMerchantAnalytics,
  formatNpr,
  MerchantAnalyticsResponse,
} from "@/lib/api";

interface PageProps {
  params: Promise<{ storeSlug: string }>;
}

const RANGE_OPTIONS: { id: AnalyticsRange; label: string }[] = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "all", label: "All time" },
];

export default function MerchantAnalyticsPage({ params }: PageProps) {
  const { storeSlug } = use(params);
  const router = useRouter();

  const [range, setRange] = useState<AnalyticsRange>("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MerchantAnalyticsResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchMerchantAnalytics(storeSlug, range);
        if (!mounted) return;
        setData(res);
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : "Failed to load store analytics";
        const isAuth =
          (err instanceof ApiError && (err.status === 401 || err.status === 403)) ||
          msg.includes("401") ||
          msg.includes("403");
        if (isAuth) {
          setTimeout(
            () =>
              router.replace(
                `/login?next=/merchant/${encodeURIComponent(storeSlug)}/analytics`
              ),
            0
          );
          return;
        }
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, [storeSlug, range, router]);

  return (
    <div className="space-y-6">
      {/* 1. Polaris Page Header + Range Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
            Analytics &amp; Nepal Reports
          </h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Gross sales, Khalti vs. COD rail mix, and 7-province revenue distribution for{" "}
            <span className="font-mono text-[var(--foreground)]">{storeSlug}</span>
          </p>
        </div>

        <div className="inline-flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--secondary)] self-start sm:self-auto">
          {RANGE_OPTIONS.map((opt) => {
            const active = range === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRange(opt.id)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-2xs font-semibold"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse"
              />
            ))}
          </div>
          <div className="h-56 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-64 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
            <div className="h-64 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && (error || !data) && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {error || "Unable to load analytics report."}
          </p>
          <button
            type="button"
            onClick={() => setRange(range)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {!loading && data && (
        <>
          {/* 2. KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted-foreground)]">
                <span>Gross Sales</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-xl font-bold font-mono tabular-nums text-[var(--foreground)]">
                {formatNpr(data.kpis.gross_sales_minor)}
              </p>
              <p className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
                {formatNpr(data.kpis.paid_sales_minor)} paid ·{" "}
                {formatNpr(data.kpis.cod_pending_minor)} COD pending
              </p>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted-foreground)]">
                <span>Avg. Order Value</span>
                <BarChart3 className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              </div>
              <p className="text-xl font-bold font-mono tabular-nums text-[var(--foreground)]">
                {formatNpr(data.kpis.aov_minor)}
              </p>
              <p className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
                {data.kpis.orders_count} orders · {formatNpr(data.kpis.discounts_given_minor)} promos
              </p>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted-foreground)]">
                <span>Repeat Customer Rate</span>
                <Users className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              </div>
              <p className="text-xl font-bold font-mono tabular-nums text-[var(--foreground)]">
                {data.kpis.repeat_customer_rate_pct}%
              </p>
              <p className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
                {data.kpis.repeat_customers} of {data.kpis.total_customers} shoppers re-ordered
              </p>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted-foreground)]">
                <span>Subscription MRR</span>
                <Repeat className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              </div>
              <p className="text-xl font-bold font-mono tabular-nums text-[var(--foreground)]">
                {formatNpr(data.kpis.active_mrr_minor)}
              </p>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Normalized 30-day cycle run-rate
              </p>
            </div>
          </div>

          {/* 3. Daily Revenue & Order Volume Chart */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-[var(--foreground)]">
                  Daily Sales Trajectory
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Confirmed storefront and subscription orders over time (integer Rs.)
                </p>
              </div>
              <span className="text-xs font-mono text-[var(--muted-foreground)] tabular-nums">
                {data.kpis.orders_count} orders in window
              </span>
            </div>

            {data.daily_series.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-[var(--muted-foreground)]">
                No time-series points in selected range.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="h-44 flex items-end gap-1 sm:gap-1.5 pt-4 border-b border-[var(--border)] pb-2 overflow-x-auto">
                  {(() => {
                    const maxVal = Math.max(
                      100,
                      ...data.daily_series.map((d) => d.revenue_minor)
                    );
                    return data.daily_series.map((pt) => {
                      const pct =
                        pt.revenue_minor > 0
                          ? Math.max(8, Math.round((pt.revenue_minor / maxVal) * 100))
                          : 3;
                      return (
                        <div
                          key={pt.date}
                          className="flex-1 min-w-[10px] flex flex-col items-center justify-end h-full group"
                          title={`${pt.label}: ${formatNpr(pt.revenue_minor)} (${pt.orders_count} orders)`}
                        >
                          <div className="w-full h-36 flex items-end justify-center">
                            <div
                              className={`w-full max-w-[24px] rounded-t transition-all ${
                                pt.revenue_minor > 0
                                  ? "bg-zinc-900 dark:bg-zinc-100 group-hover:bg-emerald-600"
                                  : "bg-[var(--secondary)]"
                              }`}
                              style={{ height: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--muted-foreground)] tabular-nums">
                  <span>{data.daily_series[0]?.label}</span>
                  <span>
                    {data.daily_series[Math.floor(data.daily_series.length / 2)]?.label}
                  </span>
                  <span>{data.daily_series[data.daily_series.length - 1]?.label}</span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Nepal 7-Province Breakdown + Payment Rail Mix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Nepal 7 Provinces */}
            <div className="lg:col-span-7 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>Sales by Nepal Province</span>
                  </h2>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Normalized across all 7 provinces from ward &amp; district delivery addresses
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {data.sales_by_province.map((prov) => (
                  <div key={prov.province} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--foreground)]">
                          {prov.province} Province
                        </span>
                        <span className="text-[11px] font-mono text-[var(--muted-foreground)] tabular-nums">
                          {prov.orders_count} {prov.orders_count === 1 ? "order" : "orders"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono tabular-nums">
                        <span className="font-bold text-[var(--foreground)]">
                          {formatNpr(prov.revenue_minor)}
                        </span>
                        <span className="text-[11px] text-[var(--muted-foreground)] w-11 text-right">
                          {prov.share_pct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--secondary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
                        style={{
                          width: `${prov.revenue_minor > 0 ? Math.max(4, prov.share_pct) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Rail Mix */}
            <div className="lg:col-span-5 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-[var(--foreground)]">
                    Payment Rail Mix
                  </h2>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Khalti instant wallet vs. Cash on Delivery vs. Prepaid dispatches
                  </p>
                </div>

                <div className="space-y-3">
                  {data.payment_mix.map((rail) => {
                    const RailIcon =
                      rail.method === "KHALTI"
                        ? CreditCard
                        : rail.method === "COD"
                        ? Banknote
                        : Repeat;
                    return (
                      <div
                        key={rail.method}
                        className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <RailIcon className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                            <span className="text-xs font-semibold text-[var(--foreground)] truncate">
                              {rail.label}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-[var(--foreground)] tabular-nums shrink-0">
                            {formatNpr(rail.revenue_minor)}
                          </span>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              rail.method === "KHALTI"
                                ? "bg-emerald-600"
                                : rail.method === "COD"
                                ? "bg-amber-500"
                                : "bg-zinc-600 dark:bg-zinc-300"
                            }`}
                            style={{
                              width: `${rail.orders_count > 0 ? Math.max(6, rail.share_pct) : 0}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--muted-foreground)] tabular-nums">
                          <span>
                            {rail.orders_count} {rail.orders_count === 1 ? "order" : "orders"}
                          </span>
                          <span>{rail.share_pct}% of revenue</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">Payment rails &amp; COD rules</span>
                <Link
                  href={`/merchant/${encodeURIComponent(storeSlug)}/settings?tab=payments`}
                  className="font-mono font-medium text-[var(--foreground)] hover:underline"
                >
                  Configure →
                </Link>
              </div>
            </div>
          </div>

          {/* 5. Top Selling Products Table */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[var(--muted-foreground)]" />
                  <span>Top Products by Revenue</span>
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Best-performing SKUs and bags sold in selected period
                </p>
              </div>
              <Link
                href={`/merchant/${encodeURIComponent(storeSlug)}/products`}
                className="text-xs font-mono font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Catalog →
              </Link>
            </div>

            {data.top_products.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
                No product line-items sold in this period yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-[11px] font-mono uppercase text-[var(--muted-foreground)]">
                      <th className="py-2.5 px-4 font-semibold">Product</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Units Sold</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Gross Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] text-xs">
                    {data.top_products.map((prod, idx) => (
                      <tr
                        key={prod.product_name}
                        className="hover:bg-[var(--secondary)]/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-[var(--foreground)]">
                          <span className="font-mono text-[11px] text-[var(--muted-foreground)] mr-2 tabular-nums">
                            #{idx + 1}
                          </span>
                          {prod.product_name}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-[var(--foreground)]">
                          {prod.units_sold}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-[var(--foreground)]">
                          {formatNpr(prod.revenue_minor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
