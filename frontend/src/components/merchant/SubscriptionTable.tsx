"use client";

import React from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FastForward,
  MoreVertical,
  Pause,
  Play,
  Repeat,
  XCircle,
} from "lucide-react";
import { formatNpr, SubscriptionItem } from "@/lib/api";

export interface SubscriptionTableProps {
  subscriptions: SubscriptionItem[];
  onAction: (
    sub: SubscriptionItem,
    action: "pause" | "resume" | "skip_cycle" | "cancel"
  ) => void;
  loadingId?: number | null;
}

export function SubscriptionTable({
  subscriptions,
  onAction,
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
            No Subscriptions Found
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto leading-relaxed">
            No active subscriptions match this filter. Enable selling plans on your products to start earning recurring revenue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)] font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4 font-medium">Subscriber</th>
              <th className="py-3 px-4 font-medium">Plan & Item</th>
              <th className="py-3 px-4 font-medium">Rate</th>
              <th className="py-3 px-4 font-medium">Next Cycle</th>
              <th className="py-3 px-4 font-medium hidden sm:table-cell">Cycles Left</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
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

              return (
                <tr
                  key={sub.id}
                  className="hover:bg-[var(--muted)]/40 transition-colors group"
                >
                  {/* Subscriber Contact */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-[var(--foreground)] truncate max-w-[140px] sm:max-w-none">
                        {displayName}
                      </p>
                      <p className="text-[11px] font-mono text-[var(--muted-foreground)] truncate max-w-[140px] sm:max-w-none">
                        {sub.customer_phone || sub.shipping_address_snapshot?.phone || sub.customer_email}
                      </p>
                    </div>
                  </td>

                  {/* Plan & Offering */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-[var(--foreground)] truncate max-w-[160px]">
                          {sub.product_name}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                          ({sub.variant_label})
                        </span>
                      </div>
                      <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]">
                        {sub.plan_name || (sub.is_prepaid ? "Prepaid Plan" : "Pay-per-delivery")}
                      </span>
                    </div>
                  </td>

                  {/* Unit Rate */}
                  <td className="py-3.5 px-4 font-mono font-bold text-[var(--foreground)] tabular-nums whitespace-nowrap">
                    {formatNpr(sub.unit_price_minor)}
                  </td>

                  {/* Next Delivery Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                    <div className="flex items-center gap-1.5 text-[var(--foreground)]">
                      <Calendar className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                      <span>{sub.next_delivery_date}</span>
                    </div>
                  </td>

                  {/* Cycles Remaining */}
                  <td className="py-3.5 px-4 hidden sm:table-cell whitespace-nowrap font-mono text-[11px]">
                    {sub.is_prepaid ? (
                      <span className="font-medium text-[var(--foreground)]">
                        {sub.cycles_remaining ?? 0} of {sub.cycles_total ?? 0} left
                      </span>
                    ) : (
                      <span className="text-[var(--muted-foreground)]">Ongoing</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {sub.status === "ACTIVE" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                        <span>Active</span>
                      </span>
                    )}
                    {sub.status === "PAUSED" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-mono font-medium">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Paused</span>
                      </span>
                    )}
                    {sub.status === "COMPLETED" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] font-mono font-medium">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Fulfilled</span>
                      </span>
                    )}
                    {sub.status === "CANCELLED" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono font-medium">
                        <XCircle className="w-2.5 h-2.5" />
                        <span>Cancelled</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {isLoading ? (
                      <span className="font-mono text-[11px] text-[var(--muted-foreground)] animate-pulse">
                        Updating...
                      </span>
                    ) : sub.status === "ACTIVE" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAction(sub, "pause")}
                          title="Pause subscription"
                          className="px-2 py-1 rounded bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors font-mono text-[11px] font-medium cursor-pointer"
                        >
                          <Pause className="w-3 h-3 inline mr-1" />
                          Pause
                        </button>
                        <button
                          type="button"
                          onClick={() => onAction(sub, "skip_cycle")}
                          title="Skip next cycle"
                          className="px-2 py-1 rounded bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors font-mono text-[11px] font-medium cursor-pointer"
                        >
                          <FastForward className="w-3 h-3 inline mr-1" />
                          Skip
                        </button>
                        <button
                          type="button"
                          onClick={() => onAction(sub, "cancel")}
                          title="Cancel subscription"
                          className="px-2 py-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-mono text-[11px] font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : sub.status === "PAUSED" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAction(sub, "resume")}
                          title="Resume subscription"
                          className="px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-mono text-[11px] font-medium cursor-pointer shadow-xs"
                        >
                          <Play className="w-3 h-3 inline mr-1" />
                          Resume
                        </button>
                        <button
                          type="button"
                          onClick={() => onAction(sub, "cancel")}
                          title="Cancel subscription"
                          className="px-2 py-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-mono text-[11px] font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
