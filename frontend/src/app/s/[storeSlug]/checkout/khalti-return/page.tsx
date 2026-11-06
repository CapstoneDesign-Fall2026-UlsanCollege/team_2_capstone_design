"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, RotateCw } from "lucide-react";
import { verifyKhaltiPayment } from "@/lib/api";
import { Chip } from "@/components/ui/chip";

export default function KhaltiReturnPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const storeSlug = typeof params.storeSlug === "string" ? params.storeSlug : "";
  const pidx = searchParams.get("pidx") || "";
  const orderId =
    searchParams.get("order_id") ||
    searchParams.get("purchase_order_id") ||
    "";

  const [state, setState] = useState<"VERIFYING" | "SUCCESS" | "FAILED">("VERIFYING");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!storeSlug || !pidx || !orderId) {
      Promise.resolve().then(() => {
        setState("FAILED");
        setErrorMessage("Missing payment parameters in return URL.");
      });
      return;
    }

    verifyKhaltiPayment(storeSlug, pidx, orderId)
      .then((res) => {
        if (res.success) {
          setState("SUCCESS");
          setTimeout(() => {
            const dest = res.token
              ? `/s/${encodeURIComponent(storeSlug)}/orders/${encodeURIComponent(orderId)}?token=${encodeURIComponent(res.token)}`
              : `/s/${encodeURIComponent(storeSlug)}/orders/${encodeURIComponent(orderId)}`;
            router.push(dest);
          }, 800);
        } else {
          setState("FAILED");
          setErrorMessage("Payment verification was not completed by Khalti.");
        }
      })
      .catch((err: unknown) => {
        setState("FAILED");
        const msg =
          err instanceof Error ? err.message : "Payment verification failed or timed out.";
        setErrorMessage(msg);
      });
  }, [storeSlug, pidx, orderId, router]);

  const handleRetryPayment = () => {
    router.push(`/s/${encodeURIComponent(storeSlug)}/checkout`);
  };

  return (
    <div className="min-h-dvh bg-[var(--canvas)] text-[var(--ink)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center space-y-6">
        {/* STATE 1: VERIFYING / PENDING */}
        {state === "VERIFYING" && (
          <div className="space-y-4 py-4">
            <div className="inline-flex justify-center">
              <Chip tone="warning">Verifying Payment</Chip>
            </div>

            <Loader2 className="w-8 h-8 text-[var(--warning-fg)] animate-spin mx-auto" aria-hidden="true" />

            <div className="space-y-1.5">
              <h1 className="font-serif text-xl sm:text-2xl font-semibold text-[var(--ink)]">
                Verifying with Khalti
              </h1>
              <p className="text-xs text-[var(--ink-2)] max-w-xs mx-auto leading-relaxed">
                Confirming transaction status with the payment gateway. Please keep this window open.
              </p>
            </div>
          </div>
        )}

        {/* STATE 2: SUCCESS */}
        {state === "SUCCESS" && (
          <div className="space-y-4 py-4">
            <div className="inline-flex justify-center">
              <Chip tone="success">Payment Verified</Chip>
            </div>

            <div className="w-12 h-12 rounded-full bg-[var(--success-bg)] border border-[var(--success-bd)] text-[var(--success-fg)] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            </div>

            <div className="space-y-1.5">
              <h1 className="font-serif text-xl sm:text-2xl font-semibold text-[var(--ink)]">
                Payment Confirmed
              </h1>
              <p className="text-xs text-[var(--ink-2)]">
                Your order is confirmed. Redirecting to order receipt...
              </p>
            </div>
          </div>
        )}

        {/* STATE 3: FAILED / CANCELLED WITH ONE-TAP RETRY */}
        {state === "FAILED" && (
          <div className="space-y-5 py-2">
            <div className="inline-flex justify-center">
              <Chip tone="error">Payment Failed</Chip>
            </div>

            <div className="w-12 h-12 rounded-full bg-[var(--error-bg)] border border-[var(--error-bd)] text-[var(--error-fg)] mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" aria-hidden="true" />
            </div>

            <div className="space-y-1.5">
              <h1 className="font-serif text-xl sm:text-2xl font-semibold text-[var(--ink)]">
                Payment Not Completed
              </h1>
              <p className="text-xs text-[var(--ink-2)] max-w-xs mx-auto leading-relaxed">
                {errorMessage || "The transaction could not be verified by Khalti. Your card or wallet was not charged."}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              {/* One-tap retry button */}
              <button
                type="button"
                onClick={handleRetryPayment}
                className="w-full min-h-[44px] h-12 rounded-lg bg-[var(--primary)] text-[var(--surface)] hover:bg-[var(--primary-hover)] text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>Retry Payment</span>
              </button>

              <Link
                href={`/s/${encodeURIComponent(storeSlug)}`}
                className="w-full min-h-[44px] h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--canvas)] text-xs font-medium text-[var(--ink)] transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Store</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
