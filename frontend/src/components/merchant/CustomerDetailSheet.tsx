"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Calendar,
  ExternalLink,
  CreditCard,
  Banknote,
  CheckCircle2,
  Clock,
  Package,
} from "lucide-react";
import {
  formatNpr,
  fetchMerchantCustomerDetail,
  MerchantCustomerItem,
  MerchantCustomerDetail,
} from "@/lib/api";

interface CustomerDetailSheetProps {
  storeSlug: string;
  customer: MerchantCustomerItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOrder?: (orderId: number) => void;
}

export function CustomerDetailSheet({
  storeSlug,
  customer,
  open,
  onOpenChange,
  onSelectOrder,
}: CustomerDetailSheetProps) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<MerchantCustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !customer) {
      setDetail(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    fetchMerchantCustomerDetail(storeSlug, customer.id)
      .then((data) => {
        setDetail(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load customer details");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, customer, storeSlug]);

  if (!customer) return null;

  const initials = (customer.full_name || customer.email || "C")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity" />
        <Dialog.Content className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg border-l border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-2xl flex flex-col justify-between overflow-hidden outline-none animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-[var(--border)] flex items-start justify-between bg-[var(--muted)]/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-base flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <Dialog.Title className="text-base font-bold text-[var(--foreground)] truncate">
                  {customer.full_name || "Unnamed Customer"}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-[var(--muted-foreground)] font-mono">
                  Customer ID #{customer.id} · Member since{" "}
                  {new Date(customer.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </Dialog.Description>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close sheet"
              className="p-1.5 rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] block">
                  Total Spent
                </span>
                <span className="text-sm sm:text-base font-mono font-extrabold text-[var(--foreground)] tabular-nums block">
                  {formatNpr(customer.total_spent_minor)}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] block">
                  Total Orders
                </span>
                <span className="text-sm sm:text-base font-mono font-bold text-[var(--foreground)] block">
                  {customer.orders_count}{" "}
                  <span className="text-xs font-normal text-[var(--muted-foreground)]">
                    {customer.orders_count === 1 ? "order" : "orders"}
                  </span>
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] block">
                  Location
                </span>
                <span className="text-sm font-semibold text-[var(--foreground)] truncate block">
                  {customer.city || "Nepal"}
                </span>
              </div>
            </div>

            {/* Contact Channels */}
            <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--muted-foreground)]">
                Contact Information
              </h3>
              <div className="space-y-2 text-xs">
                {customer.phone && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[var(--muted-foreground)]">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Phone (Nepal):</span>
                    </span>
                    <a
                      href={`tel:${customer.phone}`}
                      className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      +977 {customer.phone}
                    </a>
                  </div>
                )}

                {customer.email && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[var(--muted-foreground)]">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email:</span>
                    </span>
                    <a
                      href={`mailto:${customer.email}`}
                      className="font-mono text-[var(--foreground)] hover:underline truncate max-w-[200px]"
                    >
                      {customer.email}
                    </a>
                  </div>
                )}

                {customer.phone && (
                  <div className="pt-2 flex items-center gap-2 border-t border-[var(--border)]">
                    <a
                      href={`https://wa.me/${(() => {
                        const d = customer.phone.replace(/\D/g, "").replace(/^0+/, "");
                        return d.startsWith("977") ? d : `977${d}`;
                      })()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold font-mono transition-colors"
                    >
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={`tel:${customer.phone}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--secondary)]/80 text-xs font-semibold font-mono transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call +977</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-4 w-24 bg-[var(--muted)] animate-pulse rounded" />
                <div className="h-20 bg-[var(--muted)] animate-pulse rounded-lg" />
                <div className="h-20 bg-[var(--muted)] animate-pulse rounded-lg" />
              </div>
            ) : error ? (
              <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
                {error}
              </div>
            ) : detail ? (
              <>
                {/* Recent Orders Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--muted-foreground)] flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Order History ({detail.orders.length})</span>
                    </h3>
                  </div>

                  {detail.orders.length === 0 ? (
                    <p className="text-xs text-[var(--muted-foreground)] italic p-3 border border-dashed border-[var(--border)] rounded-lg text-center">
                      No orders placed yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {detail.orders.map((ord) => {
                        const isPaid = ord.payment_status === "PAID";
                        const isDelivered = ord.status === "DELIVERED";

                        return (
                          <div
                            key={ord.id}
                            className="p-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/20 hover:bg-[var(--secondary)]/40 transition-colors space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-xs text-[var(--foreground)]">
                                #{ord.order_number}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                                    isDelivered
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                  }`}
                                >
                                  {ord.status}
                                </span>
                                <span
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                                    isPaid
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  }`}
                                >
                                  {ord.payment_method === "KHALTI" ? "Khalti" : "COD"} ·{" "}
                                  {ord.payment_status}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] font-mono">
                              <span>
                                {new Date(ord.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                              <span className="font-extrabold text-[var(--foreground)] tabular-nums">
                                {formatNpr(ord.total_minor)}
                              </span>
                            </div>

                            {/* Line items summary */}
                            <div className="pt-1 border-t border-[var(--border)]/60 text-[11px] text-[var(--muted-foreground)]">
                              {ord.items.map((it) => (
                                <div key={it.id} className="flex justify-between">
                                  <span>
                                    {it.quantity}x {it.product_name_snapshot}{" "}
                                    {it.variant_label_snapshot ? `(${it.variant_label_snapshot})` : ""}
                                  </span>
                                  <span className="font-mono">{formatNpr(it.line_total_minor)}</span>
                                </div>
                              ))}
                            </div>

                            {/* View Order in Queue */}
                            <div className="flex items-center justify-end pt-1">
                              <Link
                                href={`/merchant/${encodeURIComponent(storeSlug)}/orders`}
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                <span>View in Orders Queue</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--secondary)] text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--secondary)]/80 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
