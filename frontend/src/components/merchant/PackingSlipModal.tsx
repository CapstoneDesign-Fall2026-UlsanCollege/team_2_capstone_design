"use client";

import React, { useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Printer, X, Check, AlertTriangle, Package, MapPin, Phone, User } from "lucide-react";
import { formatNpr, OrderDetail } from "@/lib/api";

export interface PackingSlipModalProps {
  storeName: string;
  storeSlug: string;
  order: OrderDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PackingSlipModal({
  storeName,
  storeSlug,
  order,
  open,
  onOpenChange,
}: PackingSlipModalProps) {
  const slipRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const isPaid = order.payment_status === "PAID";
  const isCOD = order.payment_method === "COD";
  const phone = order.customer_phone || order.shipping_address_snapshot?.phone || "N/A";
  const recipientName =
    order.shipping_address_snapshot?.recipient_name || order.customer_name || "Customer";

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity print:hidden" />
        <Dialog.Content className="fixed inset-x-4 top-[5%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 w-full max-w-xl max-h-[90vh] flex flex-col bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden print:static print:inset-auto print:translate-x-0 print:border-none print:shadow-none print:max-w-none print:w-full print:p-0">
          {/* Non-printed Modal Header */}
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--muted)]/40 print:hidden">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-[var(--foreground)]" />
              <Dialog.Title className="text-sm font-bold text-[var(--foreground)] font-mono">
                Courier Delivery Slip · #{order.order_number}
              </Dialog.Title>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-mono font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close slip"
                className="p-1.5 rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <Dialog.Description className="sr-only">
            Printable dispatch slip for order {order.order_number} formatted for Pathao and local delivery riders.
          </Dialog.Description>

          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: 80mm auto;
                margin: 4mm;
              }
              body * {
                visibility: hidden !important;
              }
              .packing-slip-printable, .packing-slip-printable * {
                visibility: visible !important;
              }
              .packing-slip-printable {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 72mm !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
                color: black !important;
              }
            }
          `}} />

          {/* Printable Packing Slip Body */}
          <div className="packing-slip-printable flex-1 overflow-y-auto p-6 space-y-5 text-zinc-900 bg-white font-sans text-xs print:p-0 print:overflow-visible">
            {/* Header / Brand */}
            <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-3">
              <div>
                <h1 className="text-base font-extrabold uppercase tracking-wider text-zinc-900">
                  {storeName}
                </h1>
                <p className="text-[11px] font-mono text-zinc-600">
                  shopcraft.com.np/s/{storeSlug}
                </p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  Fulfillment Slip · Powered by ShopCraft
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-mono font-bold text-zinc-900">
                  #{order.order_number}
                </p>
                <p className="text-[10px] font-mono text-zinc-500">{formattedDate}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border border-zinc-400 bg-zinc-100 rounded">
                  {order.status}
                </span>
              </div>
            </div>

            {/* Recipient & Shipping Information */}
            <div className="border border-zinc-300 rounded p-3 bg-zinc-50 space-y-1.5">
              <div className="flex items-center justify-between text-zinc-500 text-[10px] uppercase font-mono font-bold tracking-wider">
                <span>Deliver To (Customer)</span>
                <span>Contact Details</span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-zinc-900">{recipientName}</p>
                  <p className="font-mono text-zinc-700">
                    Ward {order.shipping_address_snapshot?.ward},{" "}
                    {order.shipping_address_snapshot?.municipality}
                  </p>
                  <p className="font-mono text-zinc-600">
                    {order.shipping_address_snapshot?.district},{" "}
                    {order.shipping_address_snapshot?.province}
                  </p>
                  {order.shipping_address_snapshot?.street_landmark && (
                    <p className="font-mono text-zinc-900 font-semibold pt-0.5">
                      📍 Landmark: {order.shipping_address_snapshot.street_landmark}
                    </p>
                  )}
                </div>

                <div className="text-right space-y-0.5 shrink-0">
                  <p className="text-sm font-mono font-extrabold text-zinc-900">
                    📞 {phone}
                  </p>
                  {order.customer_email && (
                    <p className="text-[11px] font-mono text-zinc-500">
                      {order.customer_email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* HIGH-VISIBILITY PAYMENT INSTRUCTION CALLOUT */}
            <div
              className={`p-3 rounded border-2 ${
                isPaid
                  ? "bg-emerald-50 border-emerald-600 text-emerald-950"
                  : "bg-amber-50 border-amber-600 text-amber-950"
              }`}
            >
              <div className="flex items-center gap-2">
                {isPaid ? (
                  <Check className="w-5 h-5 text-emerald-700 stroke-[3] shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-700 stroke-[3] shrink-0" />
                )}
                <div>
                  <p className="text-xs font-black uppercase tracking-wider font-mono">
                    {isPaid ? "ONLINE PAYMENT COMPLETED (KHALTI)" : "CASH ON DELIVERY (COD)"}
                  </p>
                  <p className="text-[11px] font-semibold mt-0.5">
                    {isPaid ? (
                      "DO NOT COLLECT ANY PAYMENT FROM CUSTOMER. ORDER IS FULLY PAID."
                    ) : (
                      <>
                        COLLECT EXACT CASH:{" "}
                        <span className="font-mono font-black text-sm underline">
                          {formatNpr(order.total_minor)}
                        </span>{" "}
                        FROM CUSTOMER UPON DELIVERY.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div>
              <table className="w-full text-left font-mono border-collapse">
                <thead>
                  <tr className="border-b border-zinc-300 text-[10px] text-zinc-500 uppercase">
                    <th className="py-1.5 font-bold">Item Description</th>
                    <th className="py-1.5 font-bold text-center">Qty</th>
                    <th className="py-1.5 font-bold text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {order.items.map((item) => (
                    <tr key={item.id} className="text-xs">
                      <td className="py-2 pr-2">
                        <p className="font-bold text-zinc-900">{item.product_name_snapshot}</p>
                        <p className="text-[11px] text-zinc-600">
                          {item.variant_label_snapshot}
                        </p>
                      </td>
                      <td className="py-2 text-center font-bold">{item.quantity}</td>
                      <td className="py-2 text-right font-bold tabular-nums">
                        {formatNpr(item.line_total_minor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="border-t border-zinc-300 pt-2 space-y-1 font-mono text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span>{formatNpr(order.subtotal_minor)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Delivery Charge</span>
                <span>{order.shipping_minor === 0 ? "FREE" : formatNpr(order.shipping_minor)}</span>
              </div>
              <div className="flex justify-between text-sm font-black border-t border-zinc-900 pt-1 text-zinc-900">
                <span>Total Due</span>
                <span>{formatNpr(order.total_minor)}</span>
              </div>
            </div>

            {/* Sign-off / Rider Section */}
            <div className="border-t border-dashed border-zinc-400 pt-4 grid grid-cols-3 gap-3 text-[10px] font-mono text-zinc-600">
              <div className="space-y-4">
                <p>Courier / Rider Name:</p>
                <div className="border-b border-zinc-400 w-full h-4" />
              </div>
              <div className="space-y-4">
                <p>Dispatch Time:</p>
                <div className="border-b border-zinc-400 w-full h-4" />
              </div>
              <div className="space-y-4">
                <p>Customer Signature:</p>
                <div className="border-b border-zinc-400 w-full h-4" />
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
