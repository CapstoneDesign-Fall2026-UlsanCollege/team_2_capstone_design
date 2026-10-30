"use client";

import React from "react";
import {
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { formatNpr, OrderDetail } from "@/lib/api";

export interface OrderQueueTableProps {
  orders: OrderDetail[];
  onSelectOrder: (order: OrderDetail) => void;
  onQuickAdvance: (order: OrderDetail) => void;
}

function getRelativeTime(isoDate: string): string {
  try {
    const now = new Date().getTime();
    const then = new Date(isoDate).getTime();
    const diffSec = Math.floor((now - then) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return "Recent";
  }
}

export function OrderQueueTable({
  orders,
  onSelectOrder,
  onQuickAdvance,
}: OrderQueueTableProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-[var(--muted)] border border-[var(--border)] mx-auto flex items-center justify-center text-[var(--muted-foreground)]">
          <ShoppingBag className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base">
            No Orders Found
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto leading-relaxed">
            No orders match this status tab yet. Share your store link on Instagram, TikTok, or
            WhatsApp to get your first customer.
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
              <th className="py-3 px-4 font-medium">Order</th>
              <th className="py-3 px-4 font-medium">Customer</th>
              <th className="py-3 px-4 font-medium hidden sm:table-cell">Items</th>
              <th className="py-3 px-4 font-medium">Total</th>
              <th className="py-3 px-4 font-medium">Payment</th>
              <th className="py-3 px-4 font-medium hidden md:table-cell">Age</th>
              <th className="py-3 px-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {orders.map((order) => {
              const statusUpper = order.status.toUpperCase();
              const isPaid = order.payment_status === "PAID";
              const isCOD = order.payment_method === "COD";

              const recipientName =
                order.customer_name ||
                order.shipping_address_snapshot?.recipient_name ||
                order.customer_email ||
                "Customer";

              const totalItemsCount = order.items.reduce(
                (sum, it) => sum + (it.quantity || 1),
                0
              );

              return (
                <tr
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="hover:bg-[var(--muted)]/40 transition-colors cursor-pointer group"
                >
                  {/* Order Number */}
                  <td className="py-3.5 px-4 font-mono font-bold text-[var(--foreground)] tabular-nums whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{order.order_number}</span>
                      {order.order_type === "SUBSCRIPTION_CYCLE" && (
                        <span
                          title="Recurring Delivery Order"
                          className="text-[10px] text-blue-600 font-bold"
                        >
                          ↻
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-[var(--foreground)] truncate max-w-[130px] sm:max-w-none">
                        {recipientName}
                      </p>
                      <p className="text-[11px] font-mono text-[var(--muted-foreground)] truncate max-w-[130px] sm:max-w-none">
                        {order.shipping_address_snapshot?.phone || order.customer_phone || ""}
                      </p>
                    </div>
                  </td>

                  {/* Items */}
                  <td className="py-3.5 px-4 hidden sm:table-cell">
                    <div className="space-y-0.5">
                      <p className="font-medium text-[var(--foreground)] truncate max-w-[180px]">
                        {order.items[0]?.product_name_snapshot || "Items"}
                      </p>
                      <p className="text-[11px] font-mono text-[var(--muted-foreground)]">
                        {totalItemsCount} {totalItemsCount === 1 ? "unit" : "units"}
                        {order.items.length > 1 && ` (+${order.items.length - 1} more)`}
                      </p>
                    </div>
                  </td>

                  {/* Total Amount */}
                  <td className="py-3.5 px-4 font-mono font-bold text-[var(--foreground)] tabular-nums whitespace-nowrap">
                    {formatNpr(order.total_minor)}
                  </td>

                  {/* Payment Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-medium">
                        <CreditCard className="w-2.5 h-2.5" />
                        <span>Paid</span>
                      </span>
                    ) : isCOD ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-mono font-medium">
                        <Banknote className="w-2.5 h-2.5" />
                        <span>COD Due</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono font-medium">
                        <span>Unpaid</span>
                      </span>
                    )}
                  </td>

                  {/* Order Age */}
                  <td className="py-3.5 px-4 hidden md:table-cell font-mono text-[11px] text-[var(--muted-foreground)] whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[var(--muted-foreground)]" />
                      {getRelativeTime(order.created_at)}
                    </span>
                  </td>

                  {/* Next Action Button */}
                  <td
                    className="py-3.5 px-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {statusUpper === "CONFIRMED" || statusUpper === "PAID" ? (
                      <button
                        type="button"
                        onClick={() => onQuickAdvance(order)}
                        className="px-2.5 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] font-mono text-[11px] font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                      >
                        Pack
                      </button>
                    ) : statusUpper === "PROCESSING" || statusUpper === "PACKED" ? (
                      <button
                        type="button"
                        onClick={() => onQuickAdvance(order)}
                        className="px-2.5 py-1.5 rounded-md bg-blue-600 text-white font-mono text-[11px] font-semibold hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
                      >
                        Ship
                      </button>
                    ) : statusUpper === "SHIPPED" ? (
                      <button
                        type="button"
                        onClick={() => onQuickAdvance(order)}
                        className="px-2.5 py-1.5 rounded-md bg-emerald-600 text-white font-mono text-[11px] font-semibold hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
                      >
                        Deliver
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Done</span>
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
