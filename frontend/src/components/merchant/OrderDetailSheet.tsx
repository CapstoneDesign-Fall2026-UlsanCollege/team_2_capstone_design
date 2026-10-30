"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Truck,
  User,
  X,
} from "lucide-react";
import { formatNpr, OrderDetail } from "@/lib/api";

export interface OrderDetailSheetProps {
  order: OrderDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdvanceStatus: (order: OrderDetail, toStatus: string, note?: string) => void;
}

export function OrderDetailSheet({
  order,
  open,
  onOpenChange,
  onAdvanceStatus,
}: OrderDetailSheetProps) {
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);
  const [trackingNote, setTrackingNote] = useState<string>("");

  if (!order) return null;

  const statusUpper = order.status.toUpperCase();
  const isPaid = order.payment_status === "PAID";
  const isCOD = order.payment_method === "COD";

  const customerPhone =
    order.customer_phone || order.shipping_address_snapshot?.phone || "";
  const cleanPhone = customerPhone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/977${cleanPhone}?text=${encodeURIComponent(
    `Namaste ${order.shipping_address_snapshot?.recipient_name || ""}, this is regarding your order ${order.order_number} on ShopCraft.`
  )}`;

  const handleCopyPhone = () => {
    if (!customerPhone) return;
    navigator.clipboard.writeText(customerPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 1500);
  };

  // Determine next action
  let nextStatus: string | null = null;
  let actionLabel = "";

  if (statusUpper === "CONFIRMED" || statusUpper === "PAID") {
    nextStatus = "PROCESSING";
    actionLabel = "Mark as Packed";
  } else if (statusUpper === "PROCESSING" || statusUpper === "PACKED") {
    nextStatus = "SHIPPED";
    actionLabel = "Mark as Shipped";
  } else if (statusUpper === "SHIPPED") {
    nextStatus = "DELIVERED";
    actionLabel = isCOD
      ? `Mark Delivered · Confirm ${formatNpr(order.total_minor)} Cash`
      : "Mark Delivered";
  }

  const handleExecuteNextAction = () => {
    if (!nextStatus) return;
    onAdvanceStatus(order, nextStatus, trackingNote.trim() || undefined);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-200" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto z-50 w-full sm:max-w-lg border-t sm:border-t-0 sm:border-l border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] flex flex-col justify-between max-h-[90dvh] sm:max-h-dvh overflow-hidden outline-none rounded-t-xl sm:rounded-none animate-in slide-in-from-bottom sm:slide-in-from-right duration-200 shadow-2xl">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Dialog.Title className="font-mono text-base font-bold text-[var(--foreground)] tabular-nums">
                {order.order_number}
              </Dialog.Title>
              <span className="px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--muted)] text-[11px] font-mono font-semibold uppercase">
                {order.status}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close details"
              className="p-1.5 rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <Dialog.Description className="sr-only">
            Fulfillment details and lifecycle actions for order {order.order_number}.
          </Dialog.Description>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Customer Contact & Quick Actions */}
            <section className="space-y-3">
              <h4 className="font-semibold text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Customer Contact</span>
              </h4>

              <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm text-[var(--foreground)]">
                      {order.shipping_address_snapshot?.recipient_name ||
                        order.customer_name ||
                        "Customer"}
                    </p>
                    <p className="text-xs font-mono text-[var(--muted-foreground)]">
                      {customerPhone}
                    </p>
                    {order.customer_email && (
                      <p className="text-[11px] font-mono text-[var(--muted-foreground)]">
                        {order.customer_email}
                      </p>
                    )}
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                      isPaid
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                    }`}
                  >
                    {isPaid ? "Paid" : "COD Due"}
                  </span>
                </div>

                {/* Direct Action Chips: Call, WhatsApp, Copy */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border)]/60">
                  {customerPhone && (
                    <a
                      href={`tel:${customerPhone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] text-xs font-mono font-medium hover:bg-[var(--muted)] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Call</span>
                    </a>
                  )}

                  {customerPhone && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] text-xs font-mono font-medium text-emerald-600 hover:bg-[var(--muted)] transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}

                  {customerPhone && (
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] text-xs font-mono font-medium hover:bg-[var(--muted)] transition-colors cursor-pointer"
                    >
                      {copiedPhone ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Delivery Address Details */}
            <section className="space-y-3">
              <h4 className="font-semibold text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Shipping Address</span>
              </h4>

              <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs font-mono space-y-1 text-[var(--foreground)]">
                <p className="font-semibold">
                  Ward {order.shipping_address_snapshot?.ward},{" "}
                  {order.shipping_address_snapshot?.municipality}
                </p>
                <p className="text-[var(--muted-foreground)]">
                  {order.shipping_address_snapshot?.district},{" "}
                  {order.shipping_address_snapshot?.province}
                </p>
                {order.shipping_address_snapshot?.street_landmark && (
                  <p className="text-[11px] text-[var(--muted-foreground)] pt-0.5">
                    Landmark:{" "}
                    <span className="text-[var(--foreground)] font-medium">
                      {order.shipping_address_snapshot.street_landmark}
                    </span>
                  </p>
                )}
              </div>
            </section>

            {/* Line Items Breakdown */}
            <section className="space-y-3">
              <h4 className="font-semibold text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                <span>Items ({order.items.length})</span>
              </h4>

              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] divide-y divide-[var(--border)] overflow-hidden">
                {order.items.map((it) => (
                  <div
                    key={it.id}
                    className="p-3 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <p className="font-bold text-[var(--foreground)] truncate">
                        {it.product_name_snapshot}
                      </p>
                      <p className="text-[11px] text-[var(--muted-foreground)]">
                        {it.variant_label_snapshot} × {it.quantity}
                      </p>
                    </div>

                    <span className="font-bold text-[var(--foreground)] tabular-nums whitespace-nowrap">
                      {formatNpr(it.line_total_minor)}
                    </span>
                  </div>
                ))}

                {/* Subtotal & Delivery Totals */}
                <div className="p-3 bg-[var(--muted)]/40 text-xs font-mono space-y-1.5 text-[var(--muted-foreground)]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-[var(--foreground)] tabular-nums">
                      {formatNpr(order.subtotal_minor)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="text-[var(--foreground)] tabular-nums">
                      {order.shipping_minor === 0 ? "FREE" : formatNpr(order.shipping_minor)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[var(--border)] font-bold text-sm text-[var(--foreground)]">
                    <span>Total Amount</span>
                    <span className="tabular-nums">{formatNpr(order.total_minor)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Courier Tracking Note Input (When Packing or Shipping) */}
            {(statusUpper === "PROCESSING" || statusUpper === "PACKED") && (
              <section className="space-y-2">
                <label
                  htmlFor="courier-note"
                  className="font-mono text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Courier / Tracking Reference (Optional)</span>
                </label>
                <input
                  id="courier-note"
                  type="text"
                  placeholder="e.g. Pathao Rider 9801999888 / Tracking #PTH-402"
                  value={trackingNote}
                  onChange={(e) => setTrackingNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--card)] text-xs font-mono text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </section>
            )}

            {/* Event Timeline History */}
            {order.events && order.events.length > 0 && (
              <section className="space-y-3">
                <h4 className="font-semibold text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Lifecycle Timeline</span>
                </h4>

                <div className="space-y-2">
                  {order.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-md border border-[var(--border)] bg-[var(--muted)]/20 text-xs font-mono flex items-start gap-2.5"
                    >
                      <div className="w-2 h-2 rounded-full bg-[var(--primary)] mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[var(--foreground)] uppercase text-[11px]">
                            {ev.to_status}
                          </span>
                          <span className="text-[10px] text-[var(--muted-foreground)] tabular-nums">
                            {new Date(ev.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {ev.note && (
                          <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                            {ev.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sticky Next Action Footer */}
          <div className="p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--card)]">
            {nextStatus ? (
              <button
                type="button"
                onClick={handleExecuteNextAction}
                className="w-full h-11 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] font-mono text-xs sm:text-sm font-semibold tracking-wide hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>{actionLabel}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <div className="w-full py-2.5 rounded-md border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Order Completed &amp; Delivered</span>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
