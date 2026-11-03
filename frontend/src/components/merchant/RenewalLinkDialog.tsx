"use client";

import React, { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  MessageSquare,
  PackageCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatNpr, RenewalGenerationResponse } from "@/lib/api";

export interface RenewalLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renewalData: RenewalGenerationResponse | null;
}

function normalizeNepalPhoneForWhatsApp(rawPhone: string): string {
  const digits = (rawPhone || "").replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  if (digits.startsWith("977") && digits.length >= 13) return digits;
  if (digits.length === 10 && digits.startsWith("9")) return `977${digits}`;
  return digits;
}

export function RenewalLinkDialog({
  open,
  onOpenChange,
  renewalData,
}: RenewalLinkDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!renewalData) return null;

  const { subscription, renewal_order, newly_created } = renewalData;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const fullRenewalUrl = `${origin}${renewal_order.renewal_path}`;
  const fullWhatsAppText = `${renewal_order.whatsapp_message}${fullRenewalUrl}`;

  const rawPhone =
    subscription.customer_phone ||
    subscription.shipping_address_snapshot?.phone ||
    "";
  const waDigits = normalizeNepalPhoneForWhatsApp(rawPhone);
  const whatsappHref = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(fullWhatsAppText)}`
    : `https://wa.me/?text=${encodeURIComponent(fullWhatsAppText)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullRenewalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback ignored
    }
  };

  const isPrepaidDispatch = renewal_order.is_prepaid_dispatch;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-5 sm:p-6">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
              {isPrepaidDispatch ? (
                <PackageCheck className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
              ) : (
                <Link2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {isPrepaidDispatch
                  ? "Prepaid Cycle Dispatched"
                  : newly_created
                  ? "Pay-Per-Delivery Renewal Link Ready"
                  : "Active Renewal Payment Link"}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                {isPrepaidDispatch
                  ? "Zero-rupee fulfillment order generated against upfront prepaid balance."
                  : "No auto-debit in Nepal — share this tokenized link so your subscriber can pay via Khalti or confirm COD."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Order & Subscriber Summary */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3.5 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block">
                Cycle Order
              </span>
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {renewal_order.order_number}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block">
                Amount Due
              </span>
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {isPrepaidDispatch
                  ? "Rs. 0 (Prepaid)"
                  : formatNpr(renewal_order.total_minor)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block">
                Subscriber
              </span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate block">
                {subscription.customer_name || subscription.customer_email}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block">
                Mobile (Nepal)
              </span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                {rawPhone || "Not on file"}
              </span>
            </div>
          </div>

          {/* Copyable Tokenized Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
              {isPrepaidDispatch ? "Order Tracking Link" : "One-Click Renewal Payment URL"}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={fullRenewalUrl}
                className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono text-[11px] text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-900 dark:text-zinc-100 transition-colors cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* WhatsApp Notification Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                WhatsApp Dispatch Message Preview
              </span>
              <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                {waDigits ? `+${waDigits}` : "Select contact in WhatsApp"}
              </span>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 p-3 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans break-words">
              {fullWhatsAppText}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <a
            href={renewal_order.renewal_path}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-900 dark:text-zinc-100 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Preview Shopper Link</span>
          </a>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Send via WhatsApp</span>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
