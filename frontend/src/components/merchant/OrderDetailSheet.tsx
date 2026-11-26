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
  Printer,
  Truck,
  User,
  X,
  XCircle,
} from "lucide-react";
import { PackingSlipModal } from "./PackingSlipModal";
import { formatNpr, OrderDetail } from "@/lib/api";
import { orderTerminalActionView, paymentView } from "@/lib/merchant-status";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

export interface OrderDetailSheetProps {
  order: OrderDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdvanceStatus: (order: OrderDetail, toStatus: string, note?: string) => void;
  storeSlug?: string;
  storeName?: string;
}

export function OrderDetailSheet({
  order,
  open,
  onOpenChange,
  onAdvanceStatus,
  storeSlug,
  storeName,
}: OrderDetailSheetProps) {
  const [slipOpen, setSlipOpen] = useState<boolean>(false);
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);
  const [trackingNote, setTrackingNote] = useState<string>("");

  const currentOrderId = order?.id ?? null;
  const [prevOrderId, setPrevOrderId] = useState<number | null>(currentOrderId);
  if (currentOrderId !== prevOrderId) {
    setPrevOrderId(currentOrderId);
    setTrackingNote("");
  }

  if (!order) return null;

  const statusUpper = order.status.toUpperCase();
  const isCOD = order.payment_method === "COD";
  const payBadge = paymentView(order);
  const terminalAction = orderTerminalActionView(order);

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
    setTrackingNote("");
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-200" />
        <Dialog.Content className="console fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto z-50 w-full sm:max-w-lg border-t sm:border-t-0 sm:border-l border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] flex flex-col justify-between max-h-[90dvh] sm:max-h-dvh overflow-hidden outline-none rounded-t-xl sm:rounded-none animate-in slide-in-from-bottom sm:slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Dialog.Title className="text-base font-semibold text-[var(--ink)] tabular-nums">
                {order.order_number}
              </Dialog.Title>
              <span className="px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--canvas)] text-xs font-medium text-[var(--ink-2)] uppercase">
                {order.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSlipOpen(true)}
                title="Print Courier Packing Slip"
              >
                <Printer className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Print Slip</span>
              </Button>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close details"
                className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors cursor-pointer"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <Dialog.Description className="sr-only">
            Fulfillment details and lifecycle actions for order {order.order_number}.
          </Dialog.Description>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Customer Contact & Quick Actions */}
            <section className="space-y-3">
              <h4 className="font-semibold text-xs text-[var(--ink-2)] uppercase tracking-wider flex items-center gap-1.5">
                <User className="size-3.5" aria-hidden="true" />
                <span>Customer Contact</span>
              </h4>

              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--canvas)] space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm text-[var(--ink)]">
                      {order.shipping_address_snapshot?.recipient_name ||
                        order.customer_name ||
                        "Customer"}
                    </p>
                    <p className="text-xs text-[var(--ink-2)] tabular-nums">
                      {customerPhone}
                    </p>
                    {order.customer_email && (
                      <p className="text-xs text-[var(--ink-2)]">
                        {order.customer_email}
                      </p>
                    )}
                  </div>

                  <Chip tone={payBadge.tone}>{payBadge.label}</Chip>
                </div>

                {/* Direct Action Links */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border)]">
                  {customerPhone && (
                    <a
                      href={`tel:${customerPhone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--nav-active)] transition-colors"
                    >
                      <Phone className="size-3.5 text-[var(--ink-2)]" aria-hidden="true" />
                      <span>Call</span>
                    </a>
                  )}

                  {customerPhone && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--nav-active)] transition-colors"
                    >
                      <MessageCircle className="size-3.5 text-[var(--status-success-fg)]" aria-hidden="true" />
                      <span>WhatsApp</span>
                      <ExternalLink className="size-3 text-[var(--ink-2)]" aria-hidden="true" />
                    </a>
                  )}

                  {customerPhone && (
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--nav-active)] transition-colors cursor-pointer"
                    >
                      {copiedPhone ? (
                        <>
                          <Check className="size-3.5 text-[var(--status-success-fg)]" aria-hidden="true" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5 text-[var(--ink-2)]" aria-hidden="true" />
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
              <h4 className="font-semibold text-xs text-[var(--ink-2)] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden="true" />
                <span>Shipping Address</span>
              </h4>

              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs space-y-1 text-[var(--ink)]">
                <p className="font-semibold">
                  Ward {order.shipping_address_snapshot?.ward},{" "}
                  {order.shipping_address_snapshot?.municipality}
                </p>
                <p className="text-[var(--ink-2)]">
                  {order.shipping_address_snapshot?.district},{" "}
                  {order.shipping_address_snapshot?.province}
                </p>
                {order.shipping_address_snapshot?.street_landmark && (
                  <p className="text-xs text-[var(--ink-2)] pt-0.5">
                    Landmark:{" "}
                    <span className="text-[var(--ink)] font-medium">
                      {order.shipping_address_snapshot.street_landmark}
                    </span>
                  </p>
                )}
              </div>
            </section>

            {/* Line Items Breakdown */}
            <section className="space-y-3">
              <h4 className="font-semibold text-xs text-[var(--ink-2)] uppercase tracking-wider flex items-center gap-1.5">
                <Package className="size-3.5" aria-hidden="true" />
                <span>Items ({order.items.length})</span>
              </h4>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden">
                {order.items.map((it) => (
                  <div
                    key={it.id}
                    className="p-3 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <p className="font-semibold text-[var(--ink)] truncate">
                        {it.product_name_snapshot}
                      </p>
                      <p className="text-xs text-[var(--ink-2)] tabular-nums">
                        {it.variant_label_snapshot} × {it.quantity}
                      </p>
                    </div>

                    <span className="font-semibold text-[var(--ink)] tabular-nums whitespace-nowrap">
                      {formatNpr(it.line_total_minor)}
                    </span>
                  </div>
                ))}

                {/* Subtotal & Delivery Totals */}
                <div className="p-3 bg-[var(--canvas)] text-xs space-y-1.5 text-[var(--ink-2)]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-[var(--ink)] tabular-nums">
                      {formatNpr(order.subtotal_minor)}
                    </span>
                  </div>
                  {order.discount_minor > 0 && (
                    <div className="flex justify-between text-[var(--status-success-fg)] font-medium">
                      <span>Discount</span>
                      <span className="tabular-nums">-{formatNpr(order.discount_minor)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="text-[var(--ink)] tabular-nums">
                      {order.shipping_minor === 0 ? "Free" : formatNpr(order.shipping_minor)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-[var(--border)] font-semibold text-sm text-[var(--ink)]">
                    <span>Total Amount</span>
                    <span className="tabular-nums">{formatNpr(order.total_minor)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Courier Tracking Note Input */}
            {(statusUpper === "PROCESSING" || statusUpper === "PACKED") && (
              <section className="space-y-2">
                <label
                  htmlFor="courier-note"
                  className="text-xs font-medium text-[var(--ink)] flex items-center gap-1.5"
                >
                  <Truck className="size-3.5 text-[var(--ink-2)]" aria-hidden="true" />
                  <span>Courier / Tracking Reference (Optional)</span>
                </label>
                <input
                  id="courier-note"
                  type="text"
                  placeholder="e.g. Pathao Rider 9801999888 / Tracking #PTH-402"
                  value={trackingNote}
                  onChange={(e) => setTrackingNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--ink)] placeholder:text-[var(--ink-2)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                />
              </section>
            )}

            {/* Event Timeline History */}
            {order.events && order.events.length > 0 && (
              <section className="space-y-3">
                <h4 className="font-semibold text-xs text-[var(--ink-2)] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="size-3.5" aria-hidden="true" />
                  <span>Lifecycle Timeline</span>
                </h4>

                <div className="space-y-2">
                  {order.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-xs flex items-start gap-2.5"
                    >
                      <div className="size-2 rounded-full bg-[var(--ink)] mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[var(--ink)] uppercase text-xs">
                            {ev.to_status}
                          </span>
                          <span className="text-xs text-[var(--ink-2)] tabular-nums">
                            {new Date(ev.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {ev.note && (
                          <p className="text-xs text-[var(--ink-2)] mt-0.5">
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
          <div className="p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--surface)]">
            {nextStatus ? (
              <Button
                type="button"
                variant="primary"
                className="w-full h-11 text-xs sm:text-sm"
                onClick={handleExecuteNextAction}
              >
                <span>{actionLabel}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : terminalAction.kind === "delivered" ? (
              <div className="w-full py-2.5 px-3 rounded-lg border border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-fg)] text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                <span>{terminalAction.sheetLabel}</span>
              </div>
            ) : terminalAction.kind === "cancelled" || terminalAction.kind === "failed" ? (
              <div className="w-full py-2.5 px-3 rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-[var(--status-error-fg)] text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                <XCircle className="size-4 shrink-0" aria-hidden="true" />
                <span>{terminalAction.sheetLabel}</span>
              </div>
            ) : (
              <div className="w-full py-2.5 px-3 rounded-lg border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)] text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                <Clock className="size-4 shrink-0" aria-hidden="true" />
                <span>{terminalAction.sheetLabel}</span>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      <PackingSlipModal
        storeName={storeName || "ShopCraft Store"}
        storeSlug={storeSlug || "store"}
        order={order}
        open={slipOpen}
        onOpenChange={setSlipOpen}
      />
    </Dialog.Root>
  );
}
