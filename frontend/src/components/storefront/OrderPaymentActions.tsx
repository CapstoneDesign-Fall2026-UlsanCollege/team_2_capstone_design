"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCw } from "lucide-react";
import { payPublicOrder, verifyKhaltiPayment } from "@/lib/api";
import { useCart } from "@/components/storefront/CartContext";
import {
  clearKhaltiOrderToken,
  interpretVerifyAttempt,
  saveKhaltiOrderToken,
} from "@/lib/khalti-return";

interface OrderPaymentActionsProps {
  storeSlug: string;
  orderId: number;
  orderToken: string;
  paymentRef?: string;
  mode: "failed" | "pending";
}

export function OrderPaymentActions({
  storeSlug,
  orderId,
  orderToken,
  paymentRef = "",
  mode,
}: OrderPaymentActionsProps) {
  const router = useRouter();
  const { clear } = useCart();

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleRetryPayment = async () => {
    if (busy) return;
    if (!orderToken) {
      setFeedback("Missing order token. Open your order receipt link from checkout to retry.");
      return;
    }

    setBusy(true);
    setFeedback("");
    try {
      const returnUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/s/${encodeURIComponent(storeSlug)}/checkout/khalti-return/`
          : undefined;
      const res = await payPublicOrder(storeSlug, orderId, {
        token: orderToken,
        payment_method: "KHALTI",
        return_url: returnUrl,
      });
      if (res.token) {
        saveKhaltiOrderToken(storeSlug, orderId, res.token);
      }
      if (res.payment_url) {
        if (res.is_mock || res.payment_url.startsWith("/")) {
          router.push(res.payment_url);
        } else {
          window.location.href = res.payment_url;
        }
        return;
      }
      setBusy(false);
      setFeedback("Payment retry URL could not be generated. Please try again.");
    } catch (err: unknown) {
      setBusy(false);
      setFeedback(
        err instanceof Error ? err.message : "Failed to initiate Khalti payment retry."
      );
    }
  };

  const handleCheckAgain = async () => {
    if (busy) return;
    if (!paymentRef) {
      await handleRetryPayment();
      return;
    }

    setBusy(true);
    setFeedback("");
    const outcome = await interpretVerifyAttempt(
      () => verifyKhaltiPayment(storeSlug, paymentRef, orderId),
      orderToken
    );

    if (outcome.kind === "success") {
      clear();
      clearKhaltiOrderToken(storeSlug, orderId);
      router.refresh();
      setBusy(false);
      return;
    }

    if (outcome.kind === "failed") {
      clearKhaltiOrderToken(storeSlug, orderId);
      router.refresh();
      setBusy(false);
      setFeedback(outcome.message);
      return;
    }

    setBusy(false);
    if (outcome.kind === "pending") {
      setFeedback("Payment is still pending on Khalti. Please wait a moment and check again.");
    } else {
      setFeedback("Could not reach Khalti, try again.");
    }
  };

  const isFailedMode = mode === "failed";

  return (
    <div className="pt-2 max-w-xs mx-auto space-y-2.5">
      <button
        type="button"
        onClick={isFailedMode ? handleRetryPayment : handleCheckAgain}
        disabled={busy}
        className="w-full min-h-[44px] h-12 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] disabled:opacity-60 text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RotateCw className="w-4 h-4" />
        )}
        <span>
          {busy
            ? isFailedMode
              ? "Opening Khalti..."
              : "Checking Khalti..."
            : isFailedMode
            ? "Retry Payment"
            : "Check again"}
        </span>
      </button>

      {feedback && (
        <p className="text-xs text-[var(--ink-2)] leading-relaxed">{feedback}</p>
      )}
    </div>
  );
}
