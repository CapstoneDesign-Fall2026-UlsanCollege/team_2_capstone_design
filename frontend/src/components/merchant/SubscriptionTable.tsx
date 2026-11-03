"use client";

import React from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FastForward,
  Link2,
  PackageCheck,
  Pause,
  Play,
  Repeat,
  XCircle,
} from "lucide-react";
import { formatNpr, SubscriptionItem } from "@/lib/api";

export interface SubscriptionTableProps {
  subscriptions: SubscriptionItem[];
  onRequestAction: (
    sub: SubscriptionItem,
    action: "pause" | "resume" | "skip_cycle" | "cancel"
  ) => void;
  onGenerateRenewal: (sub: SubscriptionItem) => void;
  loadingId?: number | null;
}

function StatusBadge({ sub }: { sub: SubscriptionItem }) {
  if (sub.is_lapsed && sub.status !== "CANCELLED" && sub.status !== "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[10px] font-mono font-semibold">
        <AlertCircle className="w-2.5 h-2.5" />
        <span>Payment Due</span>
      </span>
    );
  }
  if (sub.status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
        <span>Active</span>
      </span>
    );
  }
  if (sub.status === "PAUSED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-mono font-medium">
        <Clock className="w-2.5 h-2.5" />
        <span>Paused</span>
      </span>
    );
  }
  if (sub.status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] font-mono font-medium">
        <CheckCircle2 className="w-2.5 h-2.5" />
        <span>Fulfilled</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono font-medium">
      <XCircle className="w-2.5 h-2.5" />
      <span>Cancelled</span>
    </span>
  );
}

function CycleProgressDisplay({ sub }: { sub: SubscriptionItem }) {
  if (!sub.is_prepaid) {
    return (
      <div className="space-y-0.5">
        <span className="text-[11px] font-mono text-[var(--foreground)] font-medium block">
          Pay-per-delivery
        </span>
        {sub.pending_renewal_order ? (
          <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-semibold block tabular-nums">
            Unpaid {sub.pending_renewal_order.order_number}
          </span>
        ) : (
          <span className="text-[10px] font-mono text-[var(--muted-foreground)] block">
             WhatsApp renewal link
          </span>
        )}
      </div>
    );
  }

  const total = Math.max(1, sub.cycles_total ?? 1);
  const rem = Math.max(0, sub.cycles_remaining ?? 0);
  const delivered = Math.max(0, total - rem);
  const pct = Math.min(100, Math.round((delivered / total) * 100));

  return (
    <div className="space-y-1 min-w-[118px]">
      <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
        <span className="font-semibold text-[var(--foreground)]">
          {rem} of {total} left
        </span>
        <span className="text-[10px] text-[var(--muted-foreground)]">
          Rs. 0 due
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
        <div
          className="h-full bg-[var(--primary)] rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SubscriptionTable({
  subscriptions,
  onRequestAction,
  onGenerateRenewal,
  loadingId,
}: SubscriptionTableProps) {
  if (subscriptions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-[var(--muted)] border border-[var(--border)] mx-auto flex items-center justify-center text-[var(--muted-foreground)]">
          <Repeat className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base">
            No Subscriptions Match This View
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto leading-relaxed">
            Prepaid 3, 6, and 12-delivery commitments and pay-per-delivery subscribers appear here once placed on your storefront.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card List (<768px) — zero horizontal overflow, 44px thumb targets */}
      <div className="space-y-3 md:hidden">
        {subscriptions.map((sub) => {
          const isLoading = loadingId === sub.id;
          const displayName =
            sub.customer_name ||
            sub.shipping_address_snapshot?.recipient_name ||
            sub.customer_email ||
            "Subscriber";
          const contactLine =
            sub.customer_phone ||
            sub.shipping_address_snapshot?.phone ||
            sub.customer_email;
          const canDispatchOrRenew =
            sub.status !== "CANCELLED" &&
            sub.status !== "COMPLETED" &&
            (!sub.is_prepaid || (sub.cycles_remaining ?? 0) > 0);

          return (
            <div
              key={sub.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[var(--foreground)] truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] font-mono text-[var(--muted-foreground)] truncate tabular-nums">
                    {contactLine}
                  </p>
                </div>
                <StatusBadge sub={sub} />
              </div>

              <div className="rounded-md bg-[var(--secondary)]/40 border border-[var(--border)] p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[var(--foreground)] truncate">
                    {sub.product_name} ({sub.variant_label})
                  </span>
                  <span className="font-mono font-bold text-[var(--foreground)] tabular-nums shrink-0">
                    {formatNpr(sub.unit_price_minor)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[var(--muted-foreground)]">
                  <span>{sub.plan_name || (sub.is_prepaid ? "Prepaid" : "Pay-per-delivery")}</span>
                  <span className="inline-flex items-center gap-1 text-[var(--foreground)] tabular-nums">
                    <Calendar className="w-3 h-3 text-[var(--muted-foreground)]" />
                    {sub.next_delivery_date}
                  </span>
                </div>

                <CycleProgressDisplay sub={sub} />
              </div>

              {isLoading ? (
                <div className="h-10 flex items-center justify-center text-xs font-mono text-[var(--muted-foreground)] animate-pulse">
                  Updating subscription...
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {canDispatchOrRenew && (
                    <button
                      type="button"
                      onClick={() => onGenerateRenewal(sub)}
                      className="flex-1 min-h-[40px] px-3 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-mono text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {sub.is_prepaid ? (
                        <>
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Dispatch Next</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="w-3.5 h-3.5" />
                          <span>Renewal Link</span>
                        </>
                      )}
                    </button>
                  )}

                  {sub.status === "ACTIVE" && (
                    <>
                      <button
                        type="button"
                        onClick={() => onRequestAction(sub, "pause")}
                        className="min-h-[40px] px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-xs font-mono font-medium text-[var(--foreground)] cursor-pointer"
                      >
                        Pause
                      </button>
                      <button
                        type="button"
                        onClick={() => onRequestAction(sub, "skip_cycle")}
                        className="min-h-[40px] px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-xs font-mono font-medium text-[var(--foreground)] cursor-pointer"
                      >
                        Skip
                      </button>
                    </>
                  )}

                  {sub.status === "PAUSED" && (
                    <button
                      type="button"
                      onClick={() => onRequestAction(sub, "resume")}
                      className="min-h-[40px] px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-mono font-semibold cursor-pointer"
                    >
                      Resume
                    </button>
                  )}

                  {sub.status !== "CANCELLED" && sub.status !== "COMPLETED" && (
                    <button
                      type="button"
                      onClick={() => onRequestAction(sub, "cancel")}
                      className="min-h-[40px] px-3 py-2 rounded-lg text-xs font-mono font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Polaris Resource Table (>=768px) */}
      <div className="hidden md:block rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)] font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3 font-medium">Subscriber</th>
                <th className="py-3 px-3 font-medium">Plan &amp; Item</th>
                <th className="py-3 px-3 font-medium">Cycle Rate</th>
                <th className="py-3 px-3 font-medium">Next Dispatch</th>
                <th className="py-3 px-3 font-medium">Commitment</th>
                <th className="py-3 px-3 font-medium">Status</th>
                <th className="py-3 px-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {subscriptions.map((sub) => {
                const isLoading = loadingId === sub.id;
                const displayName =
                  sub.customer_name ||
                  sub.shipping_address_snapshot?.recipient_name ||
                  sub.customer_email ||
                  "Subscriber";
                const canDispatchOrRenew =
                  sub.status !== "CANCELLED" &&
                  sub.status !== "COMPLETED" &&
                  (!sub.is_prepaid || (sub.cycles_remaining ?? 0) > 0);

                return (
                  <tr
                    key={sub.id}
                    className="hover:bg-[var(--muted)]/40 transition-colors group"
                  >
                    {/* Subscriber Contact */}
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-[var(--foreground)]">
                          {displayName}
                        </p>
                        <p className="text-[11px] font-mono text-[var(--muted-foreground)] tabular-nums">
                          {sub.customer_phone ||
                            sub.shipping_address_snapshot?.phone ||
                            sub.customer_email}
                        </p>
                      </div>
                    </td>

                    {/* Plan & Offering */}
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-[var(--foreground)]">
                            {sub.product_name}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                            ({sub.variant_label})
                          </span>
                        </div>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]">
                          {sub.plan_name ||
                            (sub.is_prepaid ? "Prepaid Plan" : "Pay-per-delivery")}
                        </span>
                      </div>
                    </td>

                    {/* Unit Rate */}
                    <td className="py-3 px-3 font-mono font-bold text-[var(--foreground)] tabular-nums whitespace-nowrap">
                      {formatNpr(sub.unit_price_minor)}
                    </td>

                    {/* Next Delivery Date */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] tabular-nums">
                      <div className="flex items-center gap-1.5 text-[var(--foreground)]">
                        <Calendar className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                        <span>{sub.next_delivery_date}</span>
                      </div>
                    </td>

                    {/* Commitment / Cycles Remaining */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <CycleProgressDisplay sub={sub} />
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge sub={sub} />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {isLoading ? (
                        <span className="font-mono text-[11px] text-[var(--muted-foreground)] animate-pulse">
                          Updating...
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          {canDispatchOrRenew && (
                            <button
                              type="button"
                              onClick={() => onGenerateRenewal(sub)}
                              title={
                                sub.is_prepaid
                                  ? "Generate next prepaid Rs. 0 dispatch order"
                                  : "Generate 1-click WhatsApp renewal payment link"
                              }
                              className="px-2.5 py-1 rounded bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity font-mono text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                            >
                              {sub.is_prepaid ? (
                                <>
                                  <PackageCheck className="w-3 h-3" />
                                  <span>Dispatch</span>
                                </>
                              ) : (
                                <>
                                  <Link2 className="w-3 h-3" />
                                  <span>Renewal Link</span>
                                </>
                              )}
                            </button>
                          )}

                          {sub.status === "ACTIVE" && (
                            <>
                              <button
                                type="button"
                                onClick={() => onRequestAction(sub, "pause")}
                                title="Pause subscription"
                                className="px-2 py-1 rounded bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors font-mono text-[11px] font-medium cursor-pointer"
                              >
                                <Pause className="w-3 h-3 inline mr-1" />
                                Pause
                              </button>
                              <button
                                type="button"
                                onClick={() => onRequestAction(sub, "skip_cycle")}
                                title="Skip next cycle"
                                className="px-2 py-1 rounded bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors font-mono text-[11px] font-medium cursor-pointer"
                              >
                                <FastForward className="w-3 h-3 inline mr-1" />
                                Skip
                              </button>
                            </>
                          )}

                          {sub.status === "PAUSED" && (
                            <button
                              type="button"
                              onClick={() => onRequestAction(sub, "resume")}
                              title="Resume subscription"
                              className="px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-mono text-[11px] font-medium cursor-pointer shadow-xs"
                            >
                              <Play className="w-3 h-3 inline mr-1" />
                              Resume
                            </button>
                          )}

                          {sub.status !== "CANCELLED" &&
                            sub.status !== "COMPLETED" && (
                              <button
                                type="button"
                                onClick={() => onRequestAction(sub, "cancel")}
                                title="Cancel subscription"
                                className="px-2 py-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-mono text-[11px] font-medium cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
