"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Banknote,
  CreditCard,
  LineChart,
  MapPin,
  Package,
  RefreshCw,
  Repeat,
} from "lucide-react";
import {
  AnalyticsRange,
  ApiError,
  fetchMerchantAnalytics,
  formatNpr,
  MerchantAnalyticsResponse,
} from "@/lib/api";
import { SteepChart } from "@/components/merchant/SteepChart";

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
  const [chartMode, setChartMode] = useState<"line" | "bar">("line");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MerchantAnalyticsResponse | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

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
  }, [storeSlug, range, router, reloadCount]);

  return (
    <div className="space-y-8">
      {/* 1. Steep Minimal Page Header + Range & Chart Mode Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Analytics &amp; Nepal Reports
          </h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Gross sales, Khalti vs. COD rail mix, and 7-province revenue distribution for{" "}
            <span className="font-mono text-[var(--foreground)]">{storeSlug}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--background)]">
            {RANGE_OPTIONS.map((opt) => {
              const active = range === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRange(opt.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-[var(--card)] text-[var(--foreground)] shadow-2xs"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="inline-flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--background)]">
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
              title="Column bar view"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                chartMode === "bar"
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-2xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="space-y-2 border-l-2 border-[var(--border)] pl-3 animate-pulse"
              >
                <div className="h-3 w-20 bg-[var(--secondary)] rounded" />
                <div className="h-5 w-24 bg-[var(--secondary)] rounded" />
              </div>
            ))}
          </div>
          <div className="h-60 rounded-xl bg-[var(--background)] animate-pulse" />
        </div>
      )}

      {/* Error State */}
      {!loading && (error || !data) && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {error || "Unable to load analytics report."}
          </p>
          <button
            type="button"
            onClick={() => setReloadCount((c) => c + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {!loading && data && (
        <>
          {/* 2. Steep Vertical-Accent Inline Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="border-l-[2.5px] border-blue-500 pl-3.5 space-y-0.5">
              <p className="text-xs text-[var(--muted-foreground)]">Gross Sales</p>
              <p className="text-xl font-semibold tracking-tight text-[var(--foreground)] tabular-nums">
                {formatNpr(data.kpis.gross_sales_minor)}
              </p>
              <p className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
                {formatNpr(data.kpis.paid_sales_minor)} paid ·{" "}
                {formatNpr(data.kpis.cod_pending_minor)} COD
              </p>
            </div>

            <div className="border-l-[2.5px] border-[#E89578] pl-3.5 space-y-0.5">
              <p className="text-xs text-[var(--muted-foreground)]">Avg. Order Value</p>
              <p className="text-xl font-semibold tracking-tight text-[var(--foreground)] tabular-nums">
                {formatNpr(data.kpis.aov_minor)}
              </p>
              <p className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
                {data.kpis.orders_count} orders · {formatNpr(data.kpis.discounts_given_minor)}{" "}
                promos
              </p>
            </div>

            <div className="border-l-[2.5px] border-emerald-500 pl-3.5 space-y-0.5">
              <p className="text-xs text-[var(--muted-foreground)]">Repeat Customer Rate</p>
              <p className="text-xl font-semibold tracking-tight text-[var(--foreground)] tabular-nums">
                {data.kpis.repeat_customer_rate_pct}%
              </p>
              <p className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
                {data.kpis.repeat_customers} of {data.kpis.total_customers} shoppers re-ordered
              </p>
            </div>
          </div>

          {/* 3. Steep Smooth Trajectory Chart */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                  Daily Sales Trajectory (
                  {data.daily_series.length > 7 ? "Last 14 days" : "Last 7 days"})
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Confirmed storefront orders over time (integer Rs.)
                </p>
              </div>
              <span className="text-xs font-mono text-[var(--muted-foreground)] tabular-nums">
                {data.kpis.orders_count} orders in window
              </span>
            </div>

            <SteepChart
              series={data.daily_series}
              mode={chartMode}
              showOrdersOverlay={true}
              showTargetLine={true}
              height={256}
            />
          </div>

          {/* 4. Nepal 7-Province Breakdown + Payment Rail Mix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>Sales by Nepal Province</span>
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Normalized across all 7 provinces from ward &amp; district delivery addresses
                </p>
              </div>

              <div className="space-y-3">
                {data.sales_by_province.map((prov) => (
                  <div key={prov.province} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--foreground)]">
                          {prov.province} Province
                        </span>
                        <span className="text-[11px] font-mono text-[var(--muted-foreground)] tabular-nums">
                          {prov.orders_count} {prov.orders_count === 1 ? "order" : "orders"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono tabular-nums">
                        <span className="font-semibold text-[var(--foreground)]">
                          {formatNpr(prov.revenue_minor)}
                        </span>
                        <span className="text-[11px] text-[var(--muted-foreground)] w-11 text-right">
                          {prov.share_pct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-300"
                        style={{
                          width: `${prov.revenue_minor > 0 ? Math.max(4, prov.share_pct) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--foreground)]">
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
                            <span className="text-xs font-medium text-[var(--foreground)] truncate">
                              {rail.label}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-semibold text-[var(--foreground)] tabular-nums shrink-0">
                            {formatNpr(rail.revenue_minor)}
                          </span>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              rail.method === "KHALTI"
                                ? "bg-blue-500"
                                : rail.method === "COD"
                                ? "bg-[#E89578]"
                                : "bg-emerald-500"
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
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Configure →
                </Link>
              </div>
            </div>
          </div>

          {/* 5. Top Selling Products Table */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[var(--muted-foreground)]" />
                  <span>Top Products by Revenue</span>
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Best-performing SKUs and units sold in selected period
                </p>
              </div>
              <Link
                href={`/merchant/${encodeURIComponent(storeSlug)}/products`}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
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
                    <tr className="border-b border-[var(--border)] bg-[var(--background)] text-[11px] font-medium text-[var(--muted-foreground)]">
                      <th className="py-2.5 px-4">Product</th>
                      <th className="py-2.5 px-4 text-right">Units Sold</th>
                      <th className="py-2.5 px-4 text-right">Gross Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] text-xs">
                    {data.top_products.map((prod, idx) => (
                      <tr
                        key={prod.product_name}
                        className="hover:bg-[var(--background)]/70 transition-colors"
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
                        <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-[var(--foreground)]">
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
