"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Check,
  Layers,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  createMerchantSellingPlan,
  fetchMerchantSellingPlans,
  formatNpr,
  SellingPlanItem,
  updateMerchantSellingPlan,
} from "@/lib/api";

export interface SellingPlansManagerProps {
  storeSlug: string;
}

const NEPAL_STARTER_PRESETS: Array<Omit<SellingPlanItem, "id">> = [
  {
    code: "pay-per-delivery",
    name: "Pay-per-delivery Renewal",
    interval_unit: "MONTH",
    interval_count: 1,
    commitment_cycles: 1,
    discount_pct: 0,
    is_prepaid: false,
    is_active: true,
    sort_order: 0,
  },
  {
    code: "prepaid-3m",
    name: "3 Months Prepaid",
    interval_unit: "MONTH",
    interval_count: 1,
    commitment_cycles: 3,
    discount_pct: 5,
    is_prepaid: true,
    is_active: true,
    sort_order: 1,
  },
  {
    code: "prepaid-6m",
    name: "6 Months Prepaid",
    interval_unit: "MONTH",
    interval_count: 1,
    commitment_cycles: 6,
    discount_pct: 10,
    is_prepaid: true,
    is_active: true,
    sort_order: 2,
  },
  {
    code: "prepaid-12m",
    name: "12 Months Prepaid",
    interval_unit: "MONTH",
    interval_count: 1,
    commitment_cycles: 12,
    discount_pct: 15,
    is_prepaid: true,
    is_active: true,
    sort_order: 3,
  },
];

export function SellingPlansManager({ storeSlug }: SellingPlansManagerProps) {
  const [plans, setPlans] = useState<SellingPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [seeding, setSeeding] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newIsPrepaid, setNewIsPrepaid] = useState(true);
  const [newCycles, setNewCycles] = useState(3);
  const [newDiscount, setNewDiscount] = useState(10);
  const [newIntervalUnit, setNewIntervalUnit] = useState<"WEEK" | "MONTH">("MONTH");
  const [newIntervalCount, setNewIntervalCount] = useState(1);
  const [creating, setCreating] = useState(false);

  const loadPlans = useCallback(async () => {
    if (!storeSlug) return;
    try {
      setLoading(true);
      const res = await fetchMerchantSellingPlans(storeSlug);
      setPlans(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load selling plans.");
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handlePatchPlan = async (
    plan: SellingPlanItem,
    patch: Partial<SellingPlanItem>
  ) => {
    try {
      setSavingId(plan.id);
      const updated = await updateMerchantSellingPlan(storeSlug, plan.id, patch);
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? updated : p)));
      setSavedId(plan.id);
      setTimeout(() => setSavedId((curr) => (curr === plan.id ? null : curr)), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update selling plan.");
    } finally {
      setSavingId(null);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      setSeeding(true);
      setError(null);
      for (const preset of NEPAL_STARTER_PRESETS) {
        await createMerchantSellingPlan(storeSlug, preset);
      }
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create starter plans.");
    } finally {
      setSeeding(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newName.trim();
    const cleanCode = (newCode.trim() || cleanName)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30);

    if (!cleanName || !cleanCode) {
      setError("Plan name and code are required.");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const created = await createMerchantSellingPlan(storeSlug, {
        name: cleanName,
        code: cleanCode,
        is_prepaid: newIsPrepaid,
        commitment_cycles: newIsPrepaid ? newCycles : 1,
        discount_pct: Math.min(50, Math.max(0, newDiscount)),
        interval_unit: newIntervalUnit,
        interval_count: Math.max(1, newIntervalCount),
        is_active: true,
        sort_order: plans.length,
      });
      setPlans((prev) => [...prev, created]);
      setNewName("");
      setNewCode("");
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create selling plan.");
    } finally {
      setCreating(false);
    }
  };

  const sampleBagMinor = 100000; // Rs. 1,000 example unit price

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-[var(--foreground)]">
            Store Selling Plans (Non-Recurring Nepal Rails)
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] max-w-2xl">
            Configure upfront <strong>Prepaid 3 / 6 / 12-delivery bundles</strong> (paid via Khalti, fulfilled as Rs. 0 cycle orders) and <strong>Pay-per-delivery plans</strong> (fulfilled via WhatsApp payment links).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] hover:bg-[var(--accent)] text-xs font-semibold text-[var(--foreground)] transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showCreateForm ? "Cancel" : "Add Plan"}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Create Plan Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreatePlan}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 space-y-4"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--muted-foreground)]">
            New Selling Plan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--foreground)] block">
                Plan Display Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Bi-Weekly Fresh Roast"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!newCode) {
                    setNewCode(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]+/g, "-")
                        .replace(/^-+|-+$/g, "")
                        .slice(0, 24)
                    );
                  }
                }}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--foreground)] block">
                Billing Model
              </label>
              <select
                value={newIsPrepaid ? "prepaid" : "payg"}
                onChange={(e) => {
                  const prepaid = e.target.value === "prepaid";
                  setNewIsPrepaid(prepaid);
                  if (!prepaid) setNewCycles(1);
                  else if (newCycles === 1) setNewCycles(3);
                }}
                className="w-full h-9 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)]"
              >
                <option value="prepaid">Prepaid Upfront Bundle (Khalti)</option>
                <option value="payg">Pay-Per-Delivery Renewal Link</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--foreground)] block">
                {newIsPrepaid ? "Prepaid Cycles" : "Delivery Cadence"}
              </label>
              {newIsPrepaid ? (
                <select
                  value={newCycles}
                  onChange={(e) => setNewCycles(Number(e.target.value))}
                  className="w-full h-9 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs font-mono text-[var(--foreground)]"
                >
                  <option value={3}>3 Deliveries Prepaid</option>
                  <option value={6}>6 Deliveries Prepaid</option>
                  <option value={12}>12 Deliveries Prepaid</option>
                </select>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={newIntervalCount}
                    onChange={(e) => setNewIntervalCount(Math.max(1, Number(e.target.value) || 1))}
                    className="w-16 h-9 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs font-mono text-[var(--foreground)]"
                  />
                  <select
                    value={newIntervalUnit}
                    onChange={(e) => setNewIntervalUnit(e.target.value as "WEEK" | "MONTH")}
                    className="flex-1 h-9 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)]"
                  >
                    <option value="WEEK">Week(s)</option>
                    <option value="MONTH">Month(s)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--foreground)] block">
                Subscriber Discount (%)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={newDiscount}
                onChange={(e) => setNewDiscount(Math.min(50, Math.max(0, Number(e.target.value) || 0)))}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs font-mono tabular-nums text-[var(--foreground)]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              <span>{creating ? "Saving..." : "Create Selling Plan"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Plans List */}
      {loading ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-10 text-center text-xs font-mono text-[var(--muted-foreground)] animate-pulse">
          Loading selling plans...
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[var(--secondary)] border border-[var(--border)] mx-auto flex items-center justify-center text-[var(--muted-foreground)]">
            <Layers className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              No Selling Plans Configured Yet
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto">
              Add standard Nepal commitment plans (Pay-per-delivery + 3, 6, and 12 Months Prepaid) in one click.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{seeding ? "Creating Plans..." : "Create Standard 3 / 6 / 12 & Renewal Plans"}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {plans.map((plan) => {
            const perBagMinor = Math.round(sampleBagMinor * (1 - plan.discount_pct / 100));
            const upfrontMinor = plan.is_prepaid
              ? perBagMinor * plan.commitment_cycles
              : perBagMinor;
            const isSaving = savingId === plan.id;
            const isSaved = savedId === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-lg border p-4 space-y-3 transition-colors ${
                  plan.is_active
                    ? "border-[var(--border)] bg-[var(--card)]"
                    : "border-[var(--border)] bg-[var(--muted)]/30 opacity-75"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[var(--foreground)]">
                        {plan.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]">
                        {plan.is_prepaid
                          ? `${plan.commitment_cycles}x Prepaid`
                          : "Pay-Per-Delivery"}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-[var(--muted-foreground)] mt-0.5">
                      Code: {plan.code} · Every {plan.interval_count}{" "}
                      {plan.interval_unit.toLowerCase()}
                      {plan.interval_count > 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Active Switch */}
                  <div className="flex items-center gap-2">
                    {isSaving && (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--muted-foreground)]" />
                    )}
                    {isSaved && !isSaving && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-mono text-emerald-600 font-semibold">
                        <Check className="w-3 h-3" />
                        Saved
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        handlePatchPlan(plan, { is_active: !plan.is_active })
                      }
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border cursor-pointer transition-colors ${
                        plan.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                          : "bg-[var(--secondary)] text-[var(--muted-foreground)] border-[var(--border)]"
                      }`}
                    >
                      {plan.is_active ? "Active" : "Paused"}
                    </button>
                  </div>
                </div>

                {/* Discount Editor + Sample Math */}
                <div className="pt-2 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`plan-disc-${plan.id}`}
                      className="text-xs text-[var(--muted-foreground)]"
                    >
                      Discount:
                    </label>
                    <div className="relative w-20">
                      <input
                        id={`plan-disc-${plan.id}`}
                        type="number"
                        min={0}
                        max={50}
                        defaultValue={plan.discount_pct}
                        onBlur={(e) => {
                          const next = Math.min(
                            50,
                            Math.max(0, parseInt(e.target.value, 10) || 0)
                          );
                          if (next !== plan.discount_pct) {
                            handlePatchPlan(plan, { discount_pct: next });
                          }
                        }}
                        className="w-full h-8 px-2.5 pr-6 rounded border border-[var(--border)] bg-[var(--background)] font-mono text-xs tabular-nums text-[var(--foreground)]"
                      />
                      <span className="absolute right-2 top-1.5 text-xs font-mono text-[var(--muted-foreground)]">
                        %
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right font-mono text-[11px] tabular-nums">
                    <span className="text-[var(--muted-foreground)]">
                      On Rs. 1,000 item:{" "}
                    </span>
                    <span className="font-bold text-[var(--foreground)]">
                      {formatNpr(perBagMinor)}/cycle
                    </span>
                    {plan.is_prepaid && (
                      <span className="block text-[10px] text-[var(--muted-foreground)]">
                        Upfront Khalti checkout: {formatNpr(upfrontMinor)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
