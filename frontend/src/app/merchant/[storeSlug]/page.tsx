"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fetchMerchantStoreOverview,
  formatNpr,
  MerchantStoreOverview,
} from "@/lib/api";

interface PageProps {
  params: Promise<{ storeSlug: string }>;
}

export default function MerchantOverviewPage({ params }: PageProps) {
  const { storeSlug } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<MerchantStoreOverview | null>(null);

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
        // If unauthorized, redirect to login
        if (msg.includes("401") || msg.includes("403") || msg.includes("Unauthorized")) {
          router.replace(`/login?next=/merchant/${encodeURIComponent(storeSlug)}`);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="space-y-1">
            <div className="h-5 w-48 bg-[var(--secondary)] rounded animate-pulse" />
            <div className="h-3 w-32 bg-[var(--secondary)] rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 animate-pulse"
            />
          ))}
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

  const completedSteps = [
    overview.checklist.has_products,
    overview.checklist.has_shipping,
    overview.checklist.has_khalti,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
              {overview.store.name}
            </h1>
            <span className="text-xs font-mono text-[var(--muted-foreground)]">
              /s/{overview.store.slug}
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {overview.store.tagline || "Your independent store on ShopCraft."}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-[var(--border)] bg-[var(--secondary)]">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--st-delivered)" }}
              aria-hidden="true"
            />
            <span className="font-medium text-[var(--foreground)]">Live</span>
          </div>

          <Link
            href={`/s/${encodeURIComponent(storeSlug)}`}
            target="_blank"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded font-medium border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] transition-colors"
          >
            <span>Visit Store</span>
            <span className="text-[10px]">↗</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
          <p className="text-[11px] font-medium text-[var(--muted-foreground)]">Orders Placed</p>
          <p className="text-xl font-bold font-mono tabular-nums text-[var(--foreground)]">
            {overview.orders_count}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)]">Lifetime store orders</p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
          <p className="text-[11px] font-medium text-[var(--muted-foreground)]">Confirmed Revenue</p>
          <p className="text-xl font-bold font-mono tabular-nums text-[var(--foreground)]">
            {formatNpr(overview.revenue_minor)}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)]">Paid &amp; verified orders</p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
          <p className="text-[11px] font-medium text-[var(--muted-foreground)]">Active Products</p>
          <p className="text-xl font-bold font-mono tabular-nums text-[var(--foreground)]">
            {overview.products_count}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)]">Visible on storefront</p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
          <p className="text-[11px] font-medium text-[var(--muted-foreground)]">Direct Customers</p>
          <p className="text-xl font-bold font-mono tabular-nums text-[var(--foreground)]">
            {overview.customers_count}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)]">Registered shoppers</p>
        </div>
      </div>

      {/* Launch Checklist Card */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--card-foreground)]">
              Store Launch Checklist
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Complete these steps to start taking orders from Instagram, TikTok, and web.
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]">
            {completedSteps} of 3 completed
          </span>
        </div>

        <div className="space-y-2.5 divide-y divide-[var(--border)]">
          {/* Step 1: Products */}
          <div className="pt-2.5 first:pt-0 flex items-center justify-between">
            <div className="flex items-start gap-2.5">
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5"
                style={{
                  backgroundColor: overview.checklist.has_products
                    ? "var(--st-delivered)"
                    : "var(--muted)",
                  color: overview.checklist.has_products ? "#FFFFFF" : "var(--muted-foreground)",
                }}
              >
                {overview.checklist.has_products ? "✓" : "1"}
              </span>
              <div>
                <p className="text-xs font-medium text-[var(--foreground)]">Add catalog products</p>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Add photos, packaging sizes (250g, 500g, 1kg), and optional subscription discounts.
                </p>
              </div>
            </div>
            <Link
              href={`/merchant/${encodeURIComponent(storeSlug)}/products`}
              className="text-xs font-medium text-[var(--foreground)] hover:underline shrink-0 ml-4"
            >
              {overview.checklist.has_products ? "Manage" : "Add product"} →
            </Link>
          </div>

          {/* Step 2: Shipping */}
          <div className="pt-2.5 flex items-center justify-between">
            <div className="flex items-start gap-2.5">
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5"
                style={{
                  backgroundColor: overview.checklist.has_shipping
                    ? "var(--st-delivered)"
                    : "var(--muted)",
                  color: overview.checklist.has_shipping ? "#FFFFFF" : "var(--muted-foreground)",
                }}
              >
                {overview.checklist.has_shipping ? "✓" : "2"}
              </span>
              <div>
                <p className="text-xs font-medium text-[var(--foreground)]">
                  Set delivery fees &amp; thresholds
                </p>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Set Kathmandu Valley and outstation delivery rates, plus free delivery threshold.
                </p>
              </div>
            </div>
            <Link
              href={`/merchant/${encodeURIComponent(storeSlug)}/settings`}
              className="text-xs font-medium text-[var(--foreground)] hover:underline shrink-0 ml-4"
            >
              {overview.checklist.has_shipping ? "Manage" : "Set rates"} →
            </Link>
          </div>

          {/* Step 3: Khalti */}
          <div className="pt-2.5 flex items-center justify-between">
            <div className="flex items-start gap-2.5">
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5"
                style={{
                  backgroundColor: overview.checklist.has_khalti
                    ? "var(--st-delivered)"
                    : "var(--muted)",
                  color: overview.checklist.has_khalti ? "#FFFFFF" : "var(--muted-foreground)",
                }}
              >
                {overview.checklist.has_khalti ? "✓" : "3"}
              </span>
              <div>
                <p className="text-xs font-medium text-[var(--foreground)]">
                  Connect Khalti payment gateway
                </p>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Accept instant digital payments. Cash on Delivery is already enabled by default.
                </p>
              </div>
            </div>
            <Link
              href={`/merchant/${encodeURIComponent(storeSlug)}/settings`}
              className="text-xs font-medium text-[var(--foreground)] hover:underline shrink-0 ml-4"
            >
              {overview.checklist.has_khalti ? "Connected" : "Connect"} →
            </Link>
          </div>
        </div>
      </div>

      {/* Empty Orders Callout / Quick Hint */}
      {overview.orders_count === 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-[var(--foreground)]">
              No orders placed yet.
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Share your store link on Instagram or WhatsApp before your chiya cools.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/s/${encodeURIComponent(storeSlug)}`;
              navigator.clipboard.writeText(url);
              alert("Store link copied to clipboard!");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] cursor-pointer shrink-0 transition-colors"
          >
            <span>Copy Store Link</span>
            <span className="font-mono text-[10px]">📋</span>
          </button>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href={`/merchant/${encodeURIComponent(storeSlug)}/products`}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--ring)] transition-colors group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-xs text-[var(--foreground)]">Catalog &amp; Variants</span>
            <span className="text-xs text-[var(--muted-foreground)] group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </div>
          <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
            Manage product images, variant weights, stock levels, and prepaid subscription options.
          </p>
        </Link>

        <Link
          href={`/merchant/${encodeURIComponent(storeSlug)}/orders`}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--ring)] transition-colors group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-xs text-[var(--foreground)]">Orders &amp; Queue</span>
            <span className="text-xs text-[var(--muted-foreground)] group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </div>
          <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
            Fulfill incoming orders: New → Packed → Shipped → Delivered. Collect Cash on Delivery.
          </p>
        </Link>

        <Link
          href={`/merchant/${encodeURIComponent(storeSlug)}/settings`}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--ring)] transition-colors group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-xs text-[var(--foreground)]">Store &amp; Payments</span>
            <span className="text-xs text-[var(--muted-foreground)] group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </div>
          <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
            Configure theme presets (Editorial Warm, Pahadi Sage, KTM Bold), delivery fees, and Khalti keys.
          </p>
        </Link>
      </div>
    </div>
  );
}
