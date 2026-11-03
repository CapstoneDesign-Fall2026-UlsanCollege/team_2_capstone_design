"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Banknote,
  Check,
  Copy,
  ExternalLink,
  Package,
  Palette,
  Plus,
  Repeat,
  ShoppingBag,
  Tag,
  TrendingUp,
} from "lucide-react";
import {
  ApiError,
  fetchMerchantStoreOverview,
  formatNpr,
  MerchantStoreOverview,
} from "@/lib/api";
import { SetupGuideCard } from "@/components/merchant/SetupGuideCard";

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

export default function MerchantOverviewPage({ params }: PageProps) {
  const { storeSlug } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<MerchantStoreOverview | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMerchantStoreOverview(storeSlug);
        if (!mounted) return;
        setOverview(data);
      } catch (err: unknown) {
        if (!mounted) return;
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
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [storeSlug, router]);

  const handleCopyStoreLink = () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/s/${encodeURIComponent(storeSlug)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="space-y-1.5">
            <div className="h-5 w-48 bg-[var(--secondary)] rounded animate-pulse" />
            <div className="h-3.5 w-64 bg-[var(--secondary)] rounded animate-pulse" />
          </div>
          <div className="h-8 w-28 bg-[var(--secondary)] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-56 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
          <div className="h-56 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center space-y-3">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {error || "Store not found or access denied."}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          You must be an owner or staff member of{" "}
          <span className="font-mono text-[var(--foreground)]">{storeSlug}</span> to view this
          console.
        </p>
        <div className="pt-2 flex justify-center gap-2">
          <Link
            href="/merchant/new"
            className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--primary)] text-[var(--primary-foreground)]"
          >
            Create New Store
          </Link>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]"
          >
            Switch Account
          </Link>
        </div>
      </div>
    );
  }

  const dailySeries = overview.daily_sales_7d || [];
  const maxDailyRev = Math.max(
    100,
    ...dailySeries.map((d) => d.revenue_minor)
  );
  const recentOrders = overview.recent_orders || [];

  return (
    <div className="space-y-6">
      {/* 1. Polaris Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
              {overview.store.name}
            </h1>
            <span className="text-xs font-mono text-[var(--muted-foreground)]">
              /s/{overview.store.slug}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--secondary)] text-[10px] font-mono font-semibold text-[var(--foreground)]">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "var(--st-delivered)" }}
                aria-hidden="true"
              />
              <span>LIVE</span>
            </span>
            {overview.member_role && (
              <span className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--card)] text-[10px] font-mono uppercase text-[var(--muted-foreground)]">
                {overview.member_role}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {overview.store.tagline || "Independent Nepal storefront powered by ShopCraft."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleCopyStoreLink}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md font-medium border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] transition-colors cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <Link
            href={`/s/${encodeURIComponent(storeSlug)}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md font-medium border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] transition-colors"
          >
            <span>Storefront</span>
            <ExternalLink className="w-3 h-3 text-[var(--muted-foreground)]" />
          </Link>

          <Link
            href={`/merchant/${encodeURIComponent(storeSlug)}/products?action=new`}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* 2. Operational KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted-foreground)]">
            <span>Today&apos;s Sales</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-xl font-bold font-mono tabular-nums text-[var(--foreground)]">
            {formatNpr(overview.today_sales_minor ?? 0)}
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
            {overview.today_orders_count ?? 0} today · {formatNpr(overview.revenue_minor)} lifetime
          </p>
        </div>

        <Link
          href={`/merchant/${encodeURIComponent(storeSlug)}/orders`}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1 hover:border-[var(--ring)] transition-colors"
        >
          <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted-foreground)]">
            <span>Orders to Fulfill</span>
            <ShoppingBag className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          </div>
          <p className="text-xl font-bold font-mono tabular-nums text-[var(--foreground)]">
            {overview.pending_fulfillment_count ?? 0}
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
            {overview.orders_count} total orders · {overview.customers_count} shoppers
          </p>
        </Link>

        <Link
          href={`/merchant/${encodeURIComponent(storeSlug)}/orders`}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1 hover:border-[var(--ring)] transition-colors"
        >
          <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted-foreground)]">
            <span>COD Cash to Collect</span>
            <Banknote className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-xl font-bold font-mono tabular-nums text-[var(--foreground)]">
            {formatNpr(overview.cod_pending_minor ?? 0)}
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)]">
            Awaiting rider settlement
          </p>
        </Link>

        <Link
          href={`/merchant/${encodeURIComponent(storeSlug)}/subscriptions`}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1 hover:border-[var(--ring)] transition-colors"
        >
          <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted-foreground)]">
            <span>Active Subscriptions</span>
            <Repeat className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          </div>
          <p className="text-xl font-bold font-mono tabular-nums text-[var(--foreground)]">
            {overview.active_subscriptions_count ?? 0}
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
            {overview.products_count} active products · {overview.active_discounts_count ?? 0} promos
          </p>
        </Link>
      </div>

      {/* 3. Quick Actions Bar (Polaris Merchant Shortcuts) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Link
          href={`/merchant/${encodeURIComponent(storeSlug)}/orders`}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-xs font-medium text-[var(--foreground)] whitespace-nowrap transition-colors"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          <span>Dispatch Queue</span>
        </Link>
        <Link
          href={`/merchant/${encodeURIComponent(storeSlug)}/discounts`}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-xs font-medium text-[var(--foreground)] whitespace-nowrap transition-colors"
        >
          <Tag className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          <span>Create Promo Code</span>
        </Link>
        <Link
          href={`/merchant/${encodeURIComponent(storeSlug)}/themes`}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-xs font-medium text-[var(--foreground)] whitespace-nowrap transition-colors"
        >
          <Palette className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          <span>Customize Theme</span>
        </Link>
        <Link
          href={`/merchant/${encodeURIComponent(storeSlug)}/analytics`}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-xs font-medium text-[var(--foreground)] whitespace-nowrap transition-colors"
        >
          <BarChart3 className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          <span>Province Analytics</span>
        </Link>
        <Link
          href={`/merchant/${encodeURIComponent(storeSlug)}/products`}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-xs font-medium text-[var(--foreground)] whitespace-nowrap transition-colors"
        >
          <Package className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          <span>Manage Inventory</span>
        </Link>
      </div>

      {/* 4. 7-Day Pulse Chart + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 7-Day Sales Pulse */}
        <div className="lg:col-span-5 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] font-mono">
                Last 7 Days Pulse
              </h2>
              <p className="text-sm font-bold text-[var(--foreground)] font-mono tabular-nums mt-0.5">
                {formatNpr(dailySeries.reduce((acc, d) => acc + d.revenue_minor, 0))}
              </p>
            </div>
            <Link
              href={`/merchant/${encodeURIComponent(storeSlug)}/analytics`}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <span>Full Report</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="h-36 flex items-end gap-2 pt-4 border-b border-[var(--border)] pb-2">
            {dailySeries.map((pt) => {
              const heightPct =
                pt.revenue_minor > 0
                  ? Math.max(10, Math.round((pt.revenue_minor / maxDailyRev) * 100))
                  : 4;
              return (
                <div
                  key={pt.date}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                  title={`${pt.label}: ${formatNpr(pt.revenue_minor)} (${pt.orders_count} orders)`}
                >
                  <div className="w-full flex items-end justify-center h-24">
                    <div
                      className={`w-full max-w-[28px] rounded-t transition-all ${
                        pt.revenue_minor > 0
                          ? "bg-zinc-900 dark:bg-zinc-100 group-hover:bg-emerald-600"
                          : "bg-[var(--secondary)]"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[var(--muted-foreground)] tabular-nums">
                    {pt.label.split(" ")[1]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)] font-mono">
            <span>
              {dailySeries.reduce((acc, d) => acc + d.orders_count, 0)} orders in 7 days
            </span>
            <span>NPR (Rs.)</span>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="lg:col-span-7 rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--foreground)]">Recent Orders</h2>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Latest storefront checkouts and subscription renewals
              </p>
            </div>
            <Link
              href={`/merchant/${encodeURIComponent(storeSlug)}/orders`}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-6 text-center space-y-2.5 my-auto">
              <p className="text-xs font-semibold text-[var(--foreground)]">
                No orders placed yet
              </p>
              <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
                Share your `/s/{storeSlug}` link on Instagram bio, TikTok, or WhatsApp to receive your first order.
              </p>
              <button
                type="button"
                onClick={handleCopyStoreLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--border)] bg-[var(--secondary)] hover:bg-[var(--muted)] text-[var(--foreground)] cursor-pointer transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Store Link Copied</span>
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
            <div className="divide-y divide-[var(--border)]">
              {recentOrders.map((ord) => (
                <Link
                  key={ord.id}
                  href={`/merchant/${encodeURIComponent(storeSlug)}/orders/${ord.id}`}
                  className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-[var(--secondary)]/50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--foreground)] tabular-nums">
                        {ord.order_number}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-semibold ${statusPillClasses(
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
                    <p className="font-mono text-xs font-bold text-[var(--foreground)] tabular-nums">
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
      </div>

      {/* 5. Polaris Setup Guide Checklist */}
      <SetupGuideCard
        storeSlug={storeSlug}
        storeName={overview.store.name}
        checklist={overview.checklist}
      />
    </div>
  );
}
