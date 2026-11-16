"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, RotateCw, WifiOff } from "lucide-react";
import { useCart } from "@/components/storefront/CartContext";
import { Chip } from "@/components/ui/chip";
import {
  clearKhaltiOrderToken,
  createKhaltiReturnController,
  KhaltiReturnSnapshot,
  readKhaltiOrderToken,
} from "@/lib/khalti-return";

export default function KhaltiReturnPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { clear } = useCart();

  const storeSlug = typeof params.storeSlug === "string" ? params.storeSlug : "";
  const pidx = searchParams.get("pidx") || "";
  const orderId =
    searchParams.get("order_id") ||
    searchParams.get("purchase_order_id") ||
    "";
  const queryToken = searchParams.get("token") || "";

  const clearRef = useRef(clear);
  useEffect(() => {
    clearRef.current = clear;
  }, [clear]);

  const controllerRef = useRef<ReturnType<typeof createKhaltiReturnController> | null>(null);

  const [snapshot, setSnapshot] = useState<KhaltiReturnSnapshot>(() => ({
    status: "verifying",
    pollExhausted: false,
    errorMessage: "",
    orderToken: "",
    isTest: false,
    isRetrying: false,
  }));

  useEffect(() => {
    const initialToken = queryToken || (storeSlug && orderId ? readKhaltiOrderToken(storeSlug, orderId) : "");
    const returnUrl =
      typeof window !== "undefined" && storeSlug
        ? `${window.location.origin}/s/${encodeURIComponent(storeSlug)}/checkout/khalti-return/`
        : undefined;

    const controller = createKhaltiReturnController({
      storeSlug,
      pidx,
      orderId,
      initialToken,
      returnUrl,
      clearCart: () => {
        clearRef.current();
        if (storeSlug && orderId) {
          clearKhaltiOrderToken(storeSlug, orderId);
        }
      },
      navigateOrder: (dest) => {
        router.push(dest);
      },
      navigatePayment: (paymentUrl, isMock) => {
        if (isMock || paymentUrl.startsWith("/")) {
          router.push(paymentUrl);
        } else {
          window.location.href = paymentUrl;
        }
      },
      onUpdate: (next) => {
        setSnapshot(next);
      },
    });

    controllerRef.current = controller;
    void controller.start();

    return () => {
      controller.destroy();
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    };
  }, [storeSlug, pidx, orderId, queryToken, router]);

  const handleRetryPayment = () => {
    void controllerRef.current?.retryPayment();
  };

  const handleCheckAgain = () => {
    void controllerRef.current?.checkAgain();
  };

  return (
    <div className="min-h-dvh bg-[var(--canvas)] text-[var(--ink)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center space-y-6">
        {snapshot.status === "verifying" && (
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

        {snapshot.status === "pending" && (
          <div className="space-y-5 py-2">
            <div className="inline-flex justify-center">
              <Chip tone="warning">Verifying Payment</Chip>
            </div>

            {!snapshot.pollExhausted ? (
              <Loader2 className="w-8 h-8 text-[var(--warning-fg)] animate-spin mx-auto" aria-hidden="true" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[var(--warning-bg)] border border-[var(--warning-bd)] text-[var(--warning-fg)] mx-auto flex items-center justify-center">
                <RotateCw className="w-5 h-5" aria-hidden="true" />
              </div>
            )}

            <div className="space-y-1.5">
              <h1 className="font-serif text-xl sm:text-2xl font-semibold text-[var(--ink)]">
                Still verifying
              </h1>
              <p className="text-xs text-[var(--ink-2)] max-w-xs mx-auto leading-relaxed">
                {snapshot.pollExhausted
                  ? "Khalti has not confirmed the payment yet. Tap Check again to refresh status."
                  : "Khalti is finalizing your payment. Checking status automatically..."}
              </p>
            </div>

            {snapshot.pollExhausted && (
              <div className="pt-1 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleCheckAgain}
                  className="w-full min-h-[44px] h-12 rounded-lg bg-[var(--primary)] text-[var(--surface)] hover:bg-[var(--primary-hover)] text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Check again</span>
                </button>

                <Link
                  href={`/s/${encodeURIComponent(storeSlug)}`}
                  className="w-full min-h-[44px] h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--canvas)] text-xs font-medium text-[var(--ink)] transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Store</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {snapshot.status === "success" && (
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

        {snapshot.status === "failed" && (
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
                {snapshot.errorMessage || "The transaction could not be verified by Khalti. No money was captured."}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              {snapshot.orderToken && orderId && (
                <button
                  type="button"
                  onClick={handleRetryPayment}
                  disabled={snapshot.isRetrying}
                  className="w-full min-h-[44px] h-12 rounded-lg bg-[var(--primary)] text-[var(--surface)] hover:bg-[var(--primary-hover)] disabled:opacity-60 text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {snapshot.isRetrying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCw className="w-4 h-4" />
                  )}
                  <span>{snapshot.isRetrying ? "Opening Khalti..." : "Retry Payment"}</span>
                </button>
              )}

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

        {snapshot.status === "error" && (
          <div className="space-y-5 py-2">
            <div className="inline-flex justify-center">
              <Chip tone="warning">Verification Unavailable</Chip>
            </div>

            <div className="w-12 h-12 rounded-full bg-[var(--warning-bg)] border border-[var(--warning-bd)] text-[var(--warning-fg)] mx-auto flex items-center justify-center">
              <WifiOff className="w-6 h-6" aria-hidden="true" />
            </div>

            <div className="space-y-1.5">
              <h1 className="font-serif text-xl sm:text-2xl font-semibold text-[var(--ink)]">
                Could not reach Khalti, try again
              </h1>
              <p className="text-xs text-[var(--ink-2)] max-w-xs mx-auto leading-relaxed">
                We had trouble reaching Khalti to verify your transaction. Tap below to check status again.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleCheckAgain}
                className="w-full min-h-[44px] h-12 rounded-lg bg-[var(--primary)] text-[var(--surface)] hover:bg-[var(--primary-hover)] text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>Check again</span>
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

        {snapshot.isTest && (
          <p className="text-[11px] text-[var(--ink-2)] border border-[var(--border)] bg-[var(--canvas)] rounded-md px-3 py-1.5 inline-block">
            Test mode: no real money is charged
          </p>
        )}
      </div>
    </div>
  );
}
