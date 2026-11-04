"use client";

import React, { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Check,
  Copy,
  Pause,
  Percent,
  Play,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  ApiError,
  createMerchantDiscount,
  deleteMerchantDiscount,
  DiscountItem,
  fetchMerchantDiscounts,
  formatNpr,
  MerchantDiscountsResponse,
  updateMerchantDiscount,
} from "@/lib/api";

interface PageProps {
  params: Promise<{ storeSlug: string }>;
}

const NEPAL_PROMO_PRESETS = [
  {
    code: "DASHAIN15",
    description: "Dashain festive campaign — 15% off orders over Rs. 1,500",
    discount_type: "PERCENTAGE" as const,
    valueRsOrPct: "15",
    minSubtotalRs: "1500",
    maxUses: "200",
  },
  {
    code: "TIHAR10",
    description: "Tihar gift box special — 10% off storewide",
    discount_type: "PERCENTAGE" as const,
    valueRsOrPct: "10",
    minSubtotalRs: "0",
    maxUses: "",
  },
  {
    code: "WELCOME100",
    description: "First Instagram order — Rs. 100 off carts over Rs. 1,000",
    discount_type: "FIXED_AMOUNT" as const,
    valueRsOrPct: "100",
    minSubtotalRs: "1000",
    maxUses: "500",
  },
];

export default function MerchantDiscountsPage({ params }: PageProps) {
  const { storeSlug } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MerchantDiscountsResponse | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [valueInput, setValueInput] = useState("10");
  const [minSubtotalRs, setMinSubtotalRs] = useState("0");
  const [maxUsesInput, setMaxUsesInput] = useState("");
  const [expiresAtInput, setExpiresAtInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchMerchantDiscounts(storeSlug);
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load promo codes";
      const isAuth =
        (err instanceof ApiError && (err.status === 401 || err.status === 403)) ||
        msg.includes("401") ||
        msg.includes("403");
      if (isAuth) {
        router.replace(`/login?next=/merchant/${encodeURIComponent(storeSlug)}/discounts`);
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [storeSlug, router]);

  useEffect(() => {
    let mounted = true;
    async function initDiscounts() {
      try {
        const res = await fetchMerchantDiscounts(storeSlug);
        if (!mounted) return;
        setData(res);
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : "Failed to load promo codes";
        const isAuth =
          (err instanceof ApiError && (err.status === 401 || err.status === 403)) ||
          msg.includes("401") ||
          msg.includes("403");
        if (isAuth) {
          router.replace(`/login?next=/merchant/${encodeURIComponent(storeSlug)}/discounts`);
          return;
        }
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    initDiscounts();
    return () => {
      mounted = false;
    };
  }, [storeSlug, router]);

  const openPresetModal = (preset?: (typeof NEPAL_PROMO_PRESETS)[number]) => {
    setFormError(null);
    if (preset) {
      setCode(preset.code);
      setDescription(preset.description);
      setDiscountType(preset.discount_type);
      setValueInput(preset.valueRsOrPct);
      setMinSubtotalRs(preset.minSubtotalRs);
      setMaxUsesInput(preset.maxUses);
      setExpiresAtInput("");
    } else {
      setCode("");
      setDescription("");
      setDiscountType("PERCENTAGE");
      setValueInput("10");
      setMinSubtotalRs("0");
      setMaxUsesInput("");
      setExpiresAtInput("");
    }
    setModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length < 3) {
      setFormError("Promo code must be at least 3 characters (e.g. DASHAIN15).");
      return;
    }

    const rawVal = parseInt(valueInput, 10);
    if (!Number.isFinite(rawVal) || rawVal <= 0) {
      setFormError("Enter a valid positive discount amount.");
      return;
    }
    if (discountType === "PERCENTAGE" && rawVal > 90) {
      setFormError("Percentage discount must be between 1% and 90%.");
      return;
    }

    const valuePayload = discountType === "PERCENTAGE" ? rawVal : rawVal * 100;
    const minSubMinor = Math.max(0, (parseInt(minSubtotalRs, 10) || 0) * 100);
    const maxUsesVal = maxUsesInput.trim() ? parseInt(maxUsesInput.trim(), 10) : null;
    const expiresIso = expiresAtInput.trim()
      ? new Date(`${expiresAtInput.trim()}T23:59:59`).toISOString()
      : null;

    try {
      setSubmitting(true);
      await createMerchantDiscount(storeSlug, {
        code: cleanCode,
        description: description.trim(),
        discount_type: discountType,
        value: valuePayload,
        min_subtotal_minor: minSubMinor,
        max_uses: maxUsesVal,
        expires_at: expiresIso,
        is_active: true,
      });
      setModalOpen(false);
      await loadDiscounts();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Unable to create promo code.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (disc: DiscountItem) => {
    try {
      setBusyId(disc.id);
      await updateMerchantDiscount(storeSlug, disc.id, {
        is_active: !disc.is_active,
      });
      await loadDiscounts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update promo status.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (disc: DiscountItem) => {
    try {
      setBusyId(disc.id);
      await deleteMerchantDiscount(storeSlug, disc.id);
      await loadDiscounts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove promo code.");
    } finally {
      setBusyId(null);
    }
  };

  const handleCopyCode = (disc: DiscountItem) => {
    navigator.clipboard.writeText(disc.code);
    setCopiedId(disc.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="space-y-6">
      {/* 1. Polaris Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
            Discounts &amp; Promo Codes
          </h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Store-scoped percentage and integer Rs. promo codes validated live at checkout
          </p>
        </div>

        <button
          type="button"
          onClick={() => openPresetModal()}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Promo Code</span>
        </button>
      </div>

      {/* 2. KPI Summary Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
          <p className="text-[11px] font-medium text-[var(--muted-foreground)]">Active Codes</p>
          <p className="text-xl font-bold font-mono tabular-nums text-[var(--foreground)]">
            {data?.metrics.active_count ?? 0}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)]">Redeemable now</p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
          <p className="text-[11px] font-medium text-[var(--muted-foreground)]">Redemptions</p>
          <p className="text-xl font-bold font-mono tabular-nums text-[var(--foreground)]">
            {data?.metrics.total_redemptions ?? 0}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)]">Orders discounted</p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
          <p className="text-[11px] font-medium text-[var(--muted-foreground)]">Expired</p>
          <p className="text-xl font-bold font-mono tabular-nums text-[var(--foreground)]">
            {data?.metrics.expired_count ?? 0}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)]">Past campaign window</p>
        </div>
      </div>

      {/* 3. Nepal Campaign Templates Strip */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[var(--foreground)]">
              Quick Nepal Campaign Presets
            </p>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Launch a seasonal festival or Instagram welcome code in one click
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {NEPAL_PROMO_PRESETS.map((preset) => (
            <button
              key={preset.code}
              type="button"
              onClick={() => openPresetModal(preset)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--secondary)] hover:bg-[var(--muted)] text-xs font-mono font-semibold text-[var(--foreground)] transition-colors cursor-pointer"
            >
              <Tag className="w-3 h-3 text-emerald-500" />
              <span>{preset.code}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* 4. Discounts Table / Empty State */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse"
            />
          ))}
        </div>
      ) : !data || data.discounts.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[var(--secondary)] border border-[var(--border)] mx-auto flex items-center justify-center text-[var(--muted-foreground)]">
            <Percent className="w-4 h-4" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-sm font-bold text-[var(--foreground)]">
              No promo codes created yet
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Reward Instagram followers or launch Dashain &amp; Tihar offers. Codes are strictly
              isolated to <span className="font-mono text-[var(--foreground)]">{storeSlug}</span>{" "}
              and verified server-side at checkout.
            </p>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => openPresetModal(NEPAL_PROMO_PRESETS[0])}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Promo Code</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          {/* Mobile 375px Card List */}
          <div className="sm:hidden divide-y divide-[var(--border)]">
            {data.discounts.map((disc) => {
              const isMaxed = disc.max_uses !== null && disc.used_count >= disc.max_uses;
              const statusLabel = !disc.is_active
                ? "Paused"
                : disc.is_expired
                ? "Expired"
                : isMaxed
                ? "Maxed Out"
                : "Active";

              return (
                <div key={disc.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]">
                        {disc.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(disc)}
                        aria-label="Copy promo code"
                        className="p-1.5 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] cursor-pointer"
                      >
                        {copiedId === disc.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] font-mono uppercase font-semibold ${
                        statusLabel === "Active"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          : statusLabel === "Paused"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {disc.description && (
                    <p className="text-[11px] text-[var(--muted-foreground)]">{disc.description}</p>
                  )}

                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="font-bold text-[var(--foreground)]">
                      {disc.discount_type === "PERCENTAGE"
                        ? `${disc.value}% OFF`
                        : `${formatNpr(disc.value)} OFF`}
                    </span>
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                      {disc.min_subtotal_minor > 0
                        ? `Min ${formatNpr(disc.min_subtotal_minor)}`
                        : "No min"}{" "}
                      ·{" "}
                      {disc.max_uses !== null
                        ? `${disc.used_count}/${disc.max_uses}`
                        : `${disc.used_count} used`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={busyId === disc.id}
                      onClick={() => handleToggleActive(disc)}
                      className="flex-1 h-9 rounded-md border border-[var(--border)] bg-[var(--secondary)] text-xs font-medium text-[var(--foreground)] inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {disc.is_active ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause Code</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Enable Code</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === disc.id}
                      onClick={() => handleDelete(disc)}
                      aria-label="Delete promo code"
                      className="h-9 w-9 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-red-600 inline-flex items-center justify-center cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-[11px] font-mono uppercase text-[var(--muted-foreground)]">
                  <th className="py-2.5 px-4 font-semibold">Promo Code</th>
                  <th className="py-2.5 px-4 font-semibold">Discount</th>
                  <th className="py-2.5 px-4 font-semibold">Minimum Cart</th>
                  <th className="py-2.5 px-4 font-semibold">Usage</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {data.discounts.map((disc) => {
                  const isMaxed =
                    disc.max_uses !== null && disc.used_count >= disc.max_uses;
                  const statusLabel = !disc.is_active
                    ? "Paused"
                    : disc.is_expired
                    ? "Expired"
                    : isMaxed
                    ? "Maxed Out"
                    : "Active";

                  return (
                    <tr
                      key={disc.id}
                      className="hover:bg-[var(--secondary)]/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]">
                            {disc.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(disc)}
                            title="Copy code"
                            className="p-1 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                          >
                            {copiedId === disc.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {disc.description && (
                          <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5 max-w-xs truncate">
                            {disc.description}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold tabular-nums text-[var(--foreground)] whitespace-nowrap">
                        {disc.discount_type === "PERCENTAGE"
                          ? `${disc.value}% OFF`
                          : `${formatNpr(disc.value)} OFF`}
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums text-[var(--muted-foreground)] whitespace-nowrap">
                        {disc.min_subtotal_minor > 0
                          ? formatNpr(disc.min_subtotal_minor)
                          : "No minimum"}
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums text-[var(--foreground)] whitespace-nowrap">
                        {disc.max_uses !== null
                          ? `${disc.used_count} / ${disc.max_uses}`
                          : `${disc.used_count} used`}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-mono uppercase font-semibold ${
                            statusLabel === "Active"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : statusLabel === "Paused"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                              : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={busyId === disc.id}
                            onClick={() => handleToggleActive(disc)}
                            title={disc.is_active ? "Pause code" : "Activate code"}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--secondary)] hover:bg-[var(--muted)] text-[11px] font-medium text-[var(--foreground)] cursor-pointer disabled:opacity-50"
                          >
                            {disc.is_active ? (
                              <>
                                <Pause className="w-3 h-3" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 text-emerald-500" />
                                <span>Enable</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={busyId === disc.id}
                            onClick={() => handleDelete(disc)}
                            title="Delete or archive promo code"
                            className="p-1.5 rounded border border-[var(--border)] bg-[var(--background)] hover:bg-red-500/10 hover:text-red-600 text-[var(--muted-foreground)] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Create Promo Code Modal (Solid Zinc Surface — Portaled Safely) */}
      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl p-5 space-y-4 outline-none">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <Dialog.Title className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Create Promo Code
                </Dialog.Title>
                <Dialog.Description className="text-xs text-zinc-500 dark:text-zinc-400">
                  Shoppers enter this code at checkout on /s/{storeSlug}
                </Dialog.Description>
              </div>
              <Dialog.Close className="p-1 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>

            {formError && (
              <div className="p-2.5 rounded-md border border-red-500/30 bg-red-500/10 text-xs text-red-700 dark:text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  Promo Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={40}
                  placeholder="e.g. DASHAIN15"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full h-9 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  Internal Note / Campaign Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Instagram story 15% promo"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(e.target.value as "PERCENTAGE" | "FIXED_AMOUNT")
                    }
                    className="w-full h-9 px-2.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (Rs.)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    {discountType === "PERCENTAGE" ? "Discount %" : "Amount (Rs.)"}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={discountType === "PERCENTAGE" ? 90 : 100000}
                    value={valueInput}
                    onChange={(e) => setValueInput(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    Minimum Cart (Rs.)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={minSubtotalRs}
                    onChange={(e) => setMinSubtotalRs(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    Max Redemptions (Optional)
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Unlimited"
                    value={maxUsesInput}
                    onChange={(e) => setMaxUsesInput(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiresAtInput}
                  onChange={(e) => setExpiresAtInput(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="h-9 px-3.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-4 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Creating..." : "Save Promo Code"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
