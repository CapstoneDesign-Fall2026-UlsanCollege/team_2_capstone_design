"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Layers,
  PackageCheck,
  Play,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  ApiError,
  fetchMerchantSubscriptions,
  formatNpr,
  generateMerchantSubscriptionRenewal,
  MerchantSubscriptionsResponse,
  performMerchantSubscriptionAction,
  RenewalGenerationResponse,
  runMerchantSubscriptionCycles,
  SubscriptionItem,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SubscriptionTable } from "@/components/merchant/SubscriptionTable";
import { RenewalLinkDialog } from "@/components/merchant/RenewalLinkDialog";
import { SellingPlansManager } from "@/components/merchant/SellingPlansManager";

type StatusTab = "ALL" | "ACTIVE" | "LAPSED" | "PAUSED" | "COMPLETED" | "CANCELLED";
type ViewSection = "SUBSCRIBERS" | "PLANS";

interface PendingConfirmAction {
  sub: SubscriptionItem;
  action: "pause" | "resume" | "skip_cycle" | "cancel";
}

export default function MerchantSubscriptionsPage() {
  const params = useParams();
  const storeSlug = String(params?.storeSlug || "");
  const router = useRouter();

  const [section, setSection] = useState<ViewSection>("SUBSCRIBERS");
  const [data, setData] = useState<MerchantSubscriptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [runningCycles, setRunningCycles] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [bannerTone, setBannerTone] = useState<"success" | "error">("success");

  const [confirmState, setConfirmState] = useState<PendingConfirmAction | null>(null);
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [renewalData, setRenewalData] = useState<RenewalGenerationResponse | null>(null);

  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const showToast = (msg: string, tone: "success" | "error" = "success") => {
    setBannerTone(tone);
    setBannerMessage(msg);
    setTimeout(() => setBannerMessage(null), 4500);
  };

  const loadSubscriptions = useCallback(async () => {
    if (!storeSlug) return;
    try {
      const res = await fetchMerchantSubscriptions(storeSlug, {
        status: activeTab,
        q: debouncedQuery,
      });
      setData(res);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load subscriptions.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [storeSlug, activeTab, debouncedQuery]);

  useEffect(() => {
    let ignore = false;
    if (!storeSlug) return;

    fetchMerchantSubscriptions(storeSlug, {
      status: activeTab,
      q: debouncedQuery,
    })
      .then((res) => {
        if (!ignore) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (ignore) return;
        const msg = err instanceof Error ? err.message : "Failed to load subscriptions.";
        const isAuth =
          (err instanceof ApiError && (err.status === 401 || err.status === 403)) ||
          msg.includes("401") ||
          msg.includes("403") ||
          msg.toLowerCase().includes("unauthorized") ||
          msg.toLowerCase().includes("credentials");

        if (isAuth) {
          setTimeout(
            () =>
              router.replace(
                `/login?next=/merchant/${encodeURIComponent(storeSlug)}/subscriptions`
              ),
            0
          );
          return;
        }
        setError(msg);
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [storeSlug, activeTab, debouncedQuery, router]);

  const executeConfirmedAction = async () => {
    if (!confirmState) return;
    const { sub, action } = confirmState;
    setConfirmState(null);
    try {
      setActionLoadingId(sub.id);
      await performMerchantSubscriptionAction(storeSlug, sub.id, action);
      showToast(
        action === "pause"
          ? `Subscription #${sub.id} paused. Deliveries are on hold until resumed.`
          : action === "resume"
          ? `Subscription #${sub.id} resumed.`
          : action === "skip_cycle"
          ? `Next delivery date for subscription #${sub.id} moved forward by one cycle.`
          : `Subscription #${sub.id} cancelled.`
      );
      await loadSubscriptions();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Subscription action failed.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRequestAction = (
    sub: SubscriptionItem,
    action: "pause" | "resume" | "skip_cycle" | "cancel"
  ) => {
    if (action === "resume") {
      // Resuming is non-destructive; execute immediately
      setActionLoadingId(sub.id);
      performMerchantSubscriptionAction(storeSlug, sub.id, "resume")
        .then(async () => {
          showToast(`Subscription #${sub.id} resumed.`);
          await loadSubscriptions();
        })
        .catch((err) => {
          showToast(err instanceof Error ? err.message : "Failed to resume.", "error");
        })
        .finally(() => setActionLoadingId(null));
      return;
    }
    setConfirmState({ sub, action });
  };

  const handleGenerateRenewal = async (sub: SubscriptionItem) => {
    try {
      setActionLoadingId(sub.id);
      const res = await generateMerchantSubscriptionRenewal(storeSlug, sub.id);
      setRenewalData(res);
      setRenewalModalOpen(true);
      await loadSubscriptions();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to generate renewal link.",
        "error"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRunCyclesNow = async () => {
    try {
      setRunningCycles(true);
      const res = await runMerchantSubscriptionCycles(storeSlug);
      showToast(
        res.orders_generated > 0
          ? `Processed due dispatches: ${res.orders_generated} cycle order(s) generated (${res.completed_subscriptions} commitment(s) completed).`
          : "All due subscription dispatches for today are already up to date."
      );
      await loadSubscriptions();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to run subscription cycles.",
        "error"
      );
    } finally {
      setRunningCycles(false);
    }
  };

  const metrics = data?.metrics || {
    active_count: 0,
    paused_count: 0,
    completed_count: 0,
    cancelled_count: 0,
    lapsed_count: 0,
    prepaid_cycles_remaining: 0,
    upcoming_7d_count: 0,
    mrr_minor: 0,
  };

  const tabs: { key: StatusTab; label: string; count?: number }[] = [
    { key: "ALL", label: "All" },
    { key: "ACTIVE", label: "Active", count: metrics.active_count },
    { key: "LAPSED", label: "Payment Due", count: metrics.lapsed_count ?? 0 },
    { key: "PAUSED", label: "Paused", count: metrics.paused_count },
    { key: "COMPLETED", label: "Fulfilled", count: metrics.completed_count },
    { key: "CANCELLED", label: "Cancelled", count: metrics.cancelled_count },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            Subscriptions
          </h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            Non-recurring Nepal subscriptions: prepaid 3/6/12-delivery commitments and WhatsApp renewal links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Section Switcher */}
          <div className="inline-flex items-center p-1 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50">
            <button
              type="button"
              onClick={() => setSection("SUBSCRIBERS")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                section === "SUBSCRIBERS"
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs font-semibold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Subscribers
            </button>
            <button
              type="button"
              onClick={() => setSection("PLANS")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                section === "PLANS"
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs font-semibold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Plans (3/6/12)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleRunCyclesNow}
            disabled={runningCycles}
            className="inline-flex items-center gap-2 min-h-[38px] px-3.5 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-mono text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${runningCycles ? "animate-spin" : ""}`} />
            <span>{runningCycles ? "Running..." : "Run Due Cycles"}</span>
          </button>
        </div>
      </div>

      {/* Status Toast Banner */}
      {bannerMessage && (
        <div
          className={`rounded-lg border p-3 flex items-center gap-2.5 text-xs shadow-xs animate-in fade-in duration-200 ${
            bannerTone === "error"
              ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
              : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
          }`}
        >
          {bannerTone === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          <span className="font-medium">{bannerMessage}</span>
        </div>
      )}

      {/* 4-Card Nepal KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Subscribers */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span className="font-medium">Active Subscribers</span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums tracking-tight text-[var(--foreground)]">
            {metrics.active_count}
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
            {metrics.upcoming_7d_count ?? 0} dispatching in next 7d
          </p>
        </div>

        {/* Monthly Recurring Value */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span className="font-medium">Monthly Cycle Value</span>
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums tracking-tight text-[var(--foreground)]">
            {formatNpr(metrics.mrr_minor)}
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)]">
            Normalized 30-day run rate
          </p>
        </div>

        {/* Prepaid Cycles Owed */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span className="font-medium">Prepaid Cycles Owed</span>
            <PackageCheck className="w-4 h-4 text-[var(--foreground)]" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums tracking-tight text-[var(--foreground)]">
            {metrics.prepaid_cycles_remaining ?? 0}
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)]">
            Paid upfront · Rs. 0 dispatches
          </p>
        </div>

        {/* Lapsed / Payment Due */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span className="font-medium">Payment Due / Lapsed</span>
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums tracking-tight text-[var(--foreground)]">
            {metrics.lapsed_count ?? 0}
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)]">
            Awaiting renewal link payment
          </p>
        </div>
      </div>

      {section === "PLANS" ? (
        <SellingPlansManager storeSlug={storeSlug} />
      ) : (
        <>
          {/* Filter Tabs & Search Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)] w-full lg:w-fit overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    setLoading(true);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === tab.key
                      ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs font-semibold"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === "number" && (
                    <span
                      className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-full ${
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
            <div className="relative w-full lg:w-72">
              <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subscriber, phone, or item..."
                className="w-full h-9 pl-8 pr-3 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)]"
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
              onRequestAction={handleRequestAction}
              onGenerateRenewal={handleGenerateRenewal}
              loadingId={actionLoadingId}
            />
          )}
        </>
      )}

      {/* Confirmation Dialog for Pause / Skip Cycle / Cancel */}
      <Dialog
        open={Boolean(confirmState)}
        onOpenChange={(open) => {
          if (!open) setConfirmState(null);
        }}
      >
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-5 sm:p-6">
          {confirmState && (
            <>
              <DialogHeader className="text-left space-y-1.5">
                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {confirmState.action === "pause"
                    ? "Pause Subscription?"
                    : confirmState.action === "skip_cycle"
                    ? "Skip Next Scheduled Delivery?"
                    : "Cancel Subscription?"}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {confirmState.action === "pause" && (
                    <>
                      Scheduled deliveries for{" "}
                      <strong>
                        {confirmState.sub.customer_name || confirmState.sub.customer_email}
                      </strong>{" "}
                      will be placed on hold.{" "}
                      {confirmState.sub.is_prepaid &&
                        `Their ${confirmState.sub.cycles_remaining ?? 0} remaining prepaid cycle(s) are preserved until resumed.`}
                    </>
                  )}
                  {confirmState.action === "skip_cycle" && (
                    <>
                      The next dispatch date ({confirmState.sub.next_delivery_date}) for{" "}
                      <strong>{confirmState.sub.product_name}</strong> will advance by one billing interval without deducting any prepaid balance.
                    </>
                  )}
                  {confirmState.action === "cancel" && (
                    <>
                      This permanently stops future cycle orders for{" "}
                      <strong>
                        {confirmState.sub.customer_name || confirmState.sub.customer_email}
                      </strong>
                      .{" "}
                      {confirmState.sub.is_prepaid &&
                      (confirmState.sub.cycles_remaining ?? 0) > 0
                        ? `Warning: this subscriber still has ${confirmState.sub.cycles_remaining} prepaid delivery cycle(s) remaining.`
                        : "No further renewal links will be sent."}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setConfirmState(null)}
                  className="min-h-[40px] px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer"
                >
                  Keep Unchanged
                </button>
                <button
                  type="button"
                  onClick={executeConfirmedAction}
                  className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-opacity hover:opacity-90 ${
                    confirmState.action === "cancel"
                      ? "bg-red-600 text-white"
                      : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  }`}
                >
                  {confirmState.action === "pause"
                    ? "Confirm Pause"
                    : confirmState.action === "skip_cycle"
                    ? "Skip Next Cycle"
                    : "Cancel Subscription"}
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Renewal Link & WhatsApp Notification Modal */}
      <RenewalLinkDialog
        open={renewalModalOpen}
        onOpenChange={setRenewalModalOpen}
        renewalData={renewalData}
      />
    </div>
  );
}
