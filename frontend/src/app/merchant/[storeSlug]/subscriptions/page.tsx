"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Play,
  RefreshCw,
  Repeat,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  ApiError,
  fetchMerchantSubscriptions,
  formatNpr,
  MerchantSubscriptionsResponse,
  performMerchantSubscriptionAction,
  runMerchantSubscriptionCycles,
  SubscriptionItem,
} from "@/lib/api";
import { SubscriptionTable } from "@/components/merchant/SubscriptionTable";

type StatusTab = "ALL" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

export default function MerchantSubscriptionsPage() {
  const params = useParams();
  const storeSlug = String(params?.storeSlug || "");
  const router = useRouter();

  const [data, setData] = useState<MerchantSubscriptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [runningCycles, setRunningCycles] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const loadSubscriptions = async () => {
    if (!storeSlug) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchMerchantSubscriptions(storeSlug, {
        status: activeTab,
        q: searchQuery,
      });
      setData(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load subscriptions.";
      const isAuth =
        (err instanceof ApiError && (err.status === 401 || err.status === 403)) ||
        msg.includes("401") ||
        msg.includes("403") ||
        msg.toLowerCase().includes("unauthorized") ||
        msg.toLowerCase().includes("credentials");

      if (isAuth) {
        router.replace(`/login?next=/merchant/${encodeURIComponent(storeSlug)}/subscriptions`);
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [storeSlug, activeTab]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSubscriptions();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAction = async (
    sub: SubscriptionItem,
    action: "pause" | "resume" | "skip_cycle" | "cancel"
  ) => {
    try {
      setActionLoadingId(sub.id);
      await performMerchantSubscriptionAction(storeSlug, sub.id, action);
      setBannerMessage(
        action === "pause"
          ? `Subscription #${sub.id} paused.`
          : action === "resume"
          ? `Subscription #${sub.id} resumed.`
          : action === "skip_cycle"
          ? `Next delivery for subscription #${sub.id} skipped.`
          : `Subscription #${sub.id} cancelled.`
      );
      setTimeout(() => setBannerMessage(null), 4000);
      await loadSubscriptions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRunCyclesNow = async () => {
    try {
      setRunningCycles(true);
      const res = await runMerchantSubscriptionCycles(storeSlug);
      setBannerMessage(
        `Cycle execution complete! Generated ${res.orders_generated} fulfillment orders (${res.completed_subscriptions} completed).`
      );
      setTimeout(() => setBannerMessage(null), 5000);
      await loadSubscriptions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to run subscription cycles.");
    } finally {
      setRunningCycles(false);
    }
  };

  const metrics = data?.metrics || {
    active_count: 0,
    paused_count: 0,
    completed_count: 0,
    cancelled_count: 0,
    mrr_minor: 0,
  };

  const tabs: { key: StatusTab; label: string; count?: number }[] = [
    { key: "ALL", label: "All" },
    { key: "ACTIVE", label: "Active", count: metrics.active_count },
    { key: "PAUSED", label: "Paused", count: metrics.paused_count },
    { key: "COMPLETED", label: "Fulfilled", count: metrics.completed_count },
    { key: "CANCELLED", label: "Cancelled", count: metrics.cancelled_count },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            Subscription Engine
          </h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            Track recurring subscribers, execute fulfillment batches, and manage customer commitments.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunCyclesNow}
          disabled={runningCycles}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-mono text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${runningCycles ? "animate-spin" : ""}`} />
          <span>{runningCycles ? "Processing Cycles..." : "Run Cycle Now"}</span>
        </button>
      </div>

      {/* Floating Status / Feedback Banner */}
      {bannerMessage && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">{bannerMessage}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Subscribers */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span className="font-medium">Active Subscribers</span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-[var(--foreground)]">
            {metrics.active_count}
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)]">
            Recurring deliveries active
          </p>
        </div>

        {/* Estimated MRR */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span className="font-medium">Monthly Recurring Value</span>
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-[var(--foreground)]">
            {formatNpr(metrics.mrr_minor)}
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)]">
            Gross cycle commitment value
          </p>
        </div>

        {/* Paused / Retention */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span className="font-medium">Paused Subscriptions</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-[var(--foreground)]">
            {metrics.paused_count}
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)]">
            Awaiting shopper resume
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)] w-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs font-semibold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.key
                      ? "bg-[var(--muted)] text-[var(--foreground)] font-bold"
                      : "bg-[var(--card)] text-[var(--muted-foreground)]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subscriber or item..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Content Table */}
      {loading ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-12 text-center text-xs text-[var(--muted-foreground)] font-mono animate-pulse">
          Loading subscriptions...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-6 text-center text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <SubscriptionTable
          subscriptions={data?.subscriptions || []}
          onAction={handleAction}
          loadingId={actionLoadingId}
        />
      )}
    </div>
  );
}
