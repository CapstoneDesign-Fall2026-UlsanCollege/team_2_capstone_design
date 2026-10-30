"use client";

import React, { useState } from "react";
import { formatNpr, updateMerchantProduct } from "@/lib/api";

const PRESET_PLANS = [
  { code: "PREPAID-3", label: "Prepaid 3 Deliveries", cycles: 3, isPrepaid: true },
  { code: "PREPAID-6", label: "Prepaid 6 Deliveries", cycles: 6, isPrepaid: true },
  { code: "PREPAID-12", label: "Prepaid 12 Deliveries", cycles: 12, isPrepaid: true },
  { code: "PAY-PER-DELIVERY", label: "Pay-Per-Delivery Renewal", cycles: 1, isPrepaid: false },
];

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
  const [discountPct, setDiscountPct] = useState(10);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([
    "PREPAID-3",
    "PREPAID-6",
    "PAY-PER-DELIVERY",
  ]);
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const discountedMinor = Math.round(samplePriceMinor * (1 - discountPct / 100));

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

  const togglePlan = (code: string) => {
    setSelectedPlans((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
      {/* Master Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Subscription &amp; Recurring Deliveries
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Allow shoppers to order prepaid delivery bundles or pay-per-delivery renewal links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedFeedback && (
            <span className="text-[11px] font-mono text-[var(--st-delivered)] font-medium">
              ✓ Saved
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

      {/* Subscription Config Area (visible when enabled) */}
      {enabled && (
        <div className="pt-3 border-t border-[var(--border)] space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Discount Percentage */}
            <div className="space-y-1">
              <label htmlFor="sub-discount" className="text-xs font-medium text-[var(--foreground)]">
                Subscriber Incentive Discount
              </label>
              <div className="relative">
                <input
                  id="sub-discount"
                  type="number"
                  min="0"
                  max="50"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(Math.min(50, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  className="w-full h-8 px-3 pr-8 rounded border border-[var(--border)] bg-[var(--background)] text-xs font-mono tabular-nums text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
                <span className="absolute right-3 top-2 text-xs font-mono text-[var(--muted-foreground)]">
                  %
                </span>
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                Standard Nepal D2C recommendation: 10%–15% discount for repeat deliveries.
              </p>
            </div>

            {/* Computed Price Preview Badge */}
            <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 flex flex-col justify-center">
              <span className="text-[10px] font-mono uppercase text-[var(--muted-foreground)]">
                Live Pricing Preview
              </span>
              <p className="text-xs font-semibold text-[var(--foreground)] mt-0.5">
                {formatNpr(discountedMinor)} per delivery
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                Subscribers save {discountPct}% off the base {formatNpr(samplePriceMinor)} price.
              </p>
            </div>
          </div>

          {/* Plan Commitment Options */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--foreground)]">
              Offered Commitment Plans
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_PLANS.map((plan) => {
                const isSelected = selectedPlans.includes(plan.code);
                return (
                  <button
                    key={plan.code}
                    type="button"
                    onClick={() => togglePlan(plan.code)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                        : "bg-[var(--secondary)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <span>{plan.label}</span>
                    <span className="text-[10px] font-mono opacity-80">
                      {plan.isPrepaid ? `(${plan.cycles}x)` : "(Renew link)"}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              Non-recurring subscriptions: prepaid batches or pay-per-delivery links (no auto-debit).
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
