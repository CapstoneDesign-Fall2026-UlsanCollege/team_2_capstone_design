"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import {
  fetchMerchantSellingPlans,
  formatNpr,
  SellingPlanItem,
  updateMerchantProduct,
  updateMerchantSellingPlan,
} from "@/lib/api";

interface SellingPlanConfigProps {
  storeSlug: string;
  productId: number;
  initialAllowSubscription: boolean;
  samplePriceMinor: number;
  onMasterToggle: (enabled: boolean) => void;
}

export function SellingPlanConfig({
  storeSlug,
  productId,
  initialAllowSubscription,
  samplePriceMinor,
  onMasterToggle,
}: SellingPlanConfigProps) {
  const [enabled, setEnabled] = useState(initialAllowSubscription);
  const [plans, setPlans] = useState<SellingPlanItem[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    let active = true;
    fetchMerchantSellingPlans(storeSlug)
      .then((res) => {
        if (active) setPlans(res);
      })
      .catch(() => {
        // Ignore silent fetch error in embedded card
      })
      .finally(() => {
        if (active) setLoadingPlans(false);
      });
    return () => {
      active = false;
    };
  }, [storeSlug]);

  const handleMasterToggle = async (newVal: boolean) => {
    setEnabled(newVal);
    onMasterToggle(newVal);
    setSaving(true);
    try {
      await updateMerchantProduct(storeSlug, productId, {
        allow_subscription: newVal,
      });
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2500);
    } catch (err) {
      console.error("Failed to update subscription master flag:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePlanActive = async (plan: SellingPlanItem) => {
    try {
      setSaving(true);
      const updated = await updateMerchantSellingPlan(storeSlug, plan.id, {
        is_active: !plan.is_active,
      });
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? updated : p)));
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    } catch (err) {
      console.error("Failed to toggle selling plan:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
      {/* Master Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Subscription &amp; Recurring Deliveries
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Allow shoppers to order prepaid 3/6/12-delivery bundles or pay-per-delivery renewal links.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {savedFeedback && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-mono text-emerald-600 font-medium">
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              disabled={saving}
              checked={enabled}
              onChange={(e) => handleMasterToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-[var(--secondary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)] border border-[var(--border)]" />
          </label>
        </div>
      </div>

      {/* Store Selling Plans Preview (persisted to database) */}
      {enabled && (
        <div className="pt-3 border-t border-[var(--border)] space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[var(--foreground)]">
              Active Store Selling Plans
            </span>
            <Link
              href={`/merchant/${encodeURIComponent(storeSlug)}/subscriptions`}
              className="inline-flex items-center gap-1 text-xs font-mono text-[var(--foreground)] hover:underline"
            >
              <span>Manage Discounts &amp; Plans</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {loadingPlans ? (
            <p className="text-xs font-mono text-[var(--muted-foreground)]">
              Loading selling plans...
            </p>
          ) : plans.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              No selling plans created yet. Configure 3/6/12 prepaid and renewal plans in Subscriptions.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {plans.map((plan) => {
                const discountedMinor = Math.round(
                  samplePriceMinor * (1 - plan.discount_pct / 100)
                );
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => handleTogglePlanActive(plan)}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                      plan.is_active
                        ? "bg-[var(--secondary)]/60 border-[var(--primary)]/40 text-[var(--foreground)]"
                        : "bg-[var(--background)] border-[var(--border)] text-[var(--muted-foreground)] opacity-70"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{plan.name}</p>
                      <p className="text-[11px] font-mono tabular-nums">
                        {formatNpr(discountedMinor)}/delivery
                        {plan.discount_pct > 0 ? ` (${plan.discount_pct}% off)` : ""}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--card)] shrink-0">
                      {plan.is_active ? "Active" : "Off"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <p className="text-[10px] text-[var(--muted-foreground)]">
            Non-recurring Nepal model: prepaid 3/6/12-cycle bundles (Khalti upfront) or pay-per-delivery renewal links.
          </p>
        </div>
      )}
    </section>
  );
}
