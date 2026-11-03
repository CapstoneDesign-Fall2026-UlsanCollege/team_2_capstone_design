"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Banknote, CreditCard, RefreshCw, ShieldCheck } from "lucide-react";
import { formatNpr, payPublicOrder } from "@/lib/api";

export interface OrderRenewalPaymentBoxProps {
  storeSlug: string;
  orderId: number;
  token: string;
  totalMinor: number;
  isSubscriptionCycle: boolean;
  allowCod: boolean;
  isFailed: boolean;
}

export function OrderRenewalPaymentBox({
  storeSlug,
  orderId,
  token,
  totalMinor,
  isSubscriptionCycle,
  allowCod,
  isFailed,
}: OrderRenewalPaymentBoxProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<"KHALTI" | "COD">("KHALTI");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!token) {
      setError("Secure order access token is missing from this payment link.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const returnUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/s/${encodeURIComponent(storeSlug)}/checkout/khalti-return/`
          : undefined;

      const res = await payPublicOrder(storeSlug, orderId, {
        token,
        payment_method: selectedMethod,
        return_url: returnUrl,
      });

      if (selectedMethod === "KHALTI" && res.payment_url) {
        window.location.href = res.payment_url;
        return;
      }

      // COD confirmed — refresh server page to show confirmed timeline
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process payment confirmation. Please try again."
      );
      setSubmitting(false);
    }
  };

  return (
    <section className="p-5 rounded-sf border-2 border-sf-cta bg-sf-surface space-y-4 shadow-xs">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-sf-display text-base font-bold text-sf-ink">
            {isSubscriptionCycle
              ? "Confirm Your Delivery Renewal"
              : isFailed
              ? "Retry Order Payment"
              : "Complete Order Payment"}
          </h2>
          <span className="font-sf-mono text-sm font-bold text-sf-ink tabular-nums whitespace-nowrap shrink-0">
            {formatNpr(totalMinor)}
          </span>
        </div>
        <p className="text-xs text-sf-muted font-sf-body leading-relaxed">
          {isSubscriptionCycle
            ? "No automatic wallet charges — choose Khalti instant payment or Cash on Delivery to dispatch your scheduled cycle."
            : "Your order is reserved. Select your preferred Nepal payment method below to confirm dispatch."}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-sf border border-sf-line bg-sf-canvas flex items-start gap-2 text-xs text-sf-ink font-sf-mono">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-sf-accent" />
          <span>{error}</span>
        </div>
      )}

      {/* Payment Rail Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setSelectedMethod("KHALTI")}
          className={`min-h-[52px] p-3 rounded-sf border text-left transition-all cursor-pointer flex items-center gap-3 ${
            selectedMethod === "KHALTI"
              ? "border-2 border-sf-cta bg-sf-canvas text-sf-ink"
              : "border-sf-line bg-sf-surface text-sf-muted hover:text-sf-ink"
          }`}
        >
          <CreditCard className="w-4 h-4 text-sf-accent shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold font-sf-mono text-sf-ink">
              Khalti ePayment
            </p>
            <p className="text-[11px] text-sf-muted font-sf-mono truncate">
              Instant wallet &amp; mobile banking
            </p>
          </div>
        </button>

        {allowCod && (
          <button
            type="button"
            onClick={() => setSelectedMethod("COD")}
            className={`min-h-[52px] p-3 rounded-sf border text-left transition-all cursor-pointer flex items-center gap-3 ${
              selectedMethod === "COD"
                ? "border-2 border-sf-cta bg-sf-canvas text-sf-ink"
                : "border-sf-line bg-sf-surface text-sf-muted hover:text-sf-ink"
            }`}
          >
            <Banknote className="w-4 h-4 text-sf-accent shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold font-sf-mono text-sf-ink">
                Cash on Delivery
              </p>
              <p className="text-[11px] text-sf-muted font-sf-mono truncate">
                Pay {formatNpr(totalMinor)} at doorstep
              </p>
            </div>
          </button>
        )}
      </div>

      <button
        type="button"
        disabled={submitting}
        onClick={handlePay}
        className="w-full min-h-[48px] px-5 py-3 rounded-sf bg-sf-cta text-sf-cta-ink font-sf-mono text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : selectedMethod === "KHALTI" ? (
          <span>Pay {formatNpr(totalMinor)} via Khalti</span>
        ) : (
          <span>Confirm Cash on Delivery ({formatNpr(totalMinor)})</span>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] font-sf-mono text-sf-muted">
        <ShieldCheck className="w-3.5 h-3.5 text-sf-accent" />
        <span>Verified one-time payment · Never auto-debited</span>
      </div>
    </section>
  );
}
