"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  CreditCard,
  FastForward,
  Lock,
  Pause,
  Play,
  Repeat,
  ShoppingBag,
} from "lucide-react";
import {
  ApiError,
  fetchShopperSubscriptions,
  formatNpr,
  performShopperSubscriptionAction,
  SubscriptionItem,
} from "@/lib/api";

export interface StorefrontSubscriptionsClientProps {
  storeSlug: string;
  storeName: string;
}

export function StorefrontSubscriptionsClient({
  storeSlug,
  storeName,
}: StorefrontSubscriptionsClientProps) {
  const [subs, setSubs] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadSubs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchShopperSubscriptions(storeSlug);
      setSubs(data);
      setUnauthenticated(false);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to load subscriptions.";
      if (
        (err instanceof ApiError && (err.status === 401 || err.status === 403)) ||
        msg.includes("401") ||
        msg.includes("403") ||
        msg.toLowerCase().includes("credentials")
      ) {
        setUnauthenticated(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    loadSubs();
  }, [loadSubs]);

  const handleAction = async (
    sub: SubscriptionItem,
    action: "pause" | "resume" | "skip_cycle" | "cancel"
  ) => {
    try {
      setBusyId(sub.id);
      await performShopperSubscriptionAction(storeSlug, sub.id, action);
      setFeedback(
        action === "pause"
          ? "Subscription paused. Resume anytime when you need your next delivery."
          : action === "resume"
          ? "Subscription resumed."
          : action === "skip_cycle"
          ? "Skipped next delivery date by one interval."
          : "Subscription cancelled."
      );
      setTimeout(() => setFeedback(null), 4000);
      await loadSubs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update subscription.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 rounded-sf border border-sf-line bg-sf-surface animate-pulse" />
        <div className="h-28 rounded-sf border border-sf-line bg-sf-surface animate-pulse" />
      </div>
    );
  }

  if (unauthenticated) {
    return (
      <div className="p-8 rounded-sf border border-sf-line bg-sf-surface text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-sf-canvas border border-sf-line mx-auto flex items-center justify-center text-sf-accent">
          <Lock className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="font-sf-display text-lg font-bold text-sf-ink">
            Sign In to Manage Your Deliveries
          </h2>
          <p className="text-xs text-sf-muted font-sf-body max-w-md mx-auto leading-relaxed">
            Use your email OTP to view prepaid delivery balances, pay renewal links, or pause upcoming dispatches from {storeName}.
          </p>
        </div>
        <Link
          href={`/login?next=/s/${encodeURIComponent(storeSlug)}/subscriptions`}
          className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-sf bg-sf-cta text-sf-cta-ink font-sf-mono text-xs font-bold hover:opacity-90 transition-opacity"
        >
          Sign In with Email OTP
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 rounded-sf border border-sf-line bg-sf-surface flex items-center gap-2.5 text-xs font-sf-mono text-sf-ink">
        <AlertCircle className="w-4 h-4 text-sf-accent shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (subs.length === 0) {
    return (
      <div className="p-8 rounded-sf border border-sf-line bg-sf-surface text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-sf-canvas border border-sf-line mx-auto flex items-center justify-center text-sf-muted">
          <Repeat className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="font-sf-display text-lg font-bold text-sf-ink">
            No Active Subscriptions Yet
          </h2>
          <p className="text-xs text-sf-muted font-sf-body max-w-md mx-auto leading-relaxed">
            Choose a 3, 6, or 12-delivery prepaid bundle or pay-per-delivery plan on any eligible product to save on fresh dispatches.
          </p>
        </div>
        <Link
          href={`/s/${encodeURIComponent(storeSlug)}`}
          className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-5 py-2.5 rounded-sf bg-sf-cta text-sf-cta-ink font-sf-mono text-xs font-bold hover:opacity-90 transition-opacity"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Browse Products</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="p-3.5 rounded-sf border border-sf-line bg-sf-surface text-xs font-sf-mono text-sf-ink">
          {feedback}
        </div>
      )}

      {subs.map((sub) => {
        const isBusy = busyId === sub.id;
        const pendingOrder = sub.pending_renewal_order;
        const total = Math.max(1, sub.cycles_total ?? 1);
        const rem = Math.max(0, sub.cycles_remaining ?? 0);
        const pct = sub.is_prepaid
          ? Math.min(100, Math.round(((total - rem) / total) * 100))
          : 0;

        return (
          <div
            key={sub.id}
            className="p-5 rounded-sf border border-sf-line bg-sf-surface space-y-4 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <h3 className="font-sf-display text-base font-bold text-sf-ink">
                  {sub.product_name} · {sub.variant_label}
                </h3>
                <p className="text-xs font-sf-mono text-sf-muted tabular-nums mt-0.5">
                  {sub.plan_name} · {formatNpr(sub.unit_price_minor)} / delivery
                </p>
              </div>
              <span className="self-start px-2.5 py-0.5 rounded-sf border border-sf-line bg-sf-canvas text-[11px] font-sf-mono font-bold text-sf-ink uppercase">
                {sub.is_lapsed ? "PAYMENT DUE" : sub.status}
              </span>
            </div>

            {sub.is_prepaid ? (
              <div className="p-3 rounded-sf bg-sf-canvas border border-sf-line space-y-1.5">
                <div className="flex items-center justify-between text-xs font-sf-mono tabular-nums">
                  <span className="font-semibold text-sf-ink">
                    Prepaid Balance: {rem} of {total} deliveries remaining
                  </span>
                  <span className="text-sf-muted">Paid upfront</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-sf-surface overflow-hidden border border-sf-line">
                  <div
                    className="h-full bg-sf-cta transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ) : pendingOrder ? (
              <div className="p-3.5 rounded-sf border-2 border-sf-cta bg-sf-canvas flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-sf-mono font-bold text-sf-ink tabular-nums">
                    Renewal Order {pendingOrder.order_number} ·{" "}
                    {formatNpr(pendingOrder.total_minor)}
                  </p>
                  <p className="text-[11px] font-sf-body text-sf-muted">
                    Confirm via Khalti or Cash on Delivery to dispatch your parcel.
                  </p>
                </div>
                <Link
                  href={`/s/${encodeURIComponent(storeSlug)}/orders/${pendingOrder.id}?token=${encodeURIComponent(pendingOrder.token)}`}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-sf bg-sf-cta text-sf-cta-ink font-sf-mono text-xs font-bold hover:opacity-90 transition-opacity shrink-0"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Confirm Renewal</span>
                </Link>
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-sf-line">
              <div className="inline-flex items-center gap-1.5 text-xs font-sf-mono text-sf-muted tabular-nums">
                <Calendar className="w-3.5 h-3.5 text-sf-accent" />
                <span>Next scheduled dispatch: {sub.next_delivery_date}</span>
              </div>

              {sub.status !== "CANCELLED" && sub.status !== "COMPLETED" && (
                <div className="flex flex-wrap items-center gap-2">
                  {sub.status === "ACTIVE" && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAction(sub, "pause")}
                        className="min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-sf border border-sf-line bg-sf-canvas text-xs font-sf-mono font-semibold text-sf-ink hover:opacity-80 cursor-pointer inline-flex items-center gap-1"
                      >
                        <Pause className="w-3 h-3" />
                        <span>Pause</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAction(sub, "skip_cycle")}
                        className="min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-sf border border-sf-line bg-sf-canvas text-xs font-sf-mono font-semibold text-sf-ink hover:opacity-80 cursor-pointer inline-flex items-center gap-1"
                      >
                        <FastForward className="w-3 h-3" />
                        <span>Skip Next</span>
                      </button>
                    </>
                  )}
                  {sub.status === "PAUSED" && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleAction(sub, "resume")}
                      className="min-h-[44px] sm:min-h-[36px] px-3.5 py-1.5 rounded-sf bg-sf-cta text-sf-cta-ink text-xs font-sf-mono font-bold hover:opacity-90 cursor-pointer inline-flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      <span>Resume</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
