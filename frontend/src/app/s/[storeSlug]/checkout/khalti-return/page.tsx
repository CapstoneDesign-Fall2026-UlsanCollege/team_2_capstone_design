"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { verifyKhaltiPayment } from "@/lib/api";

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
            router.push(`/s/${encodeURIComponent(storeSlug)}/orders/${orderId}`);
          }, 800);
        } else {
          setState("FAILED");
          setErrorMessage("Payment verification was not completed.");
        }
      })
      .catch((err: unknown) => {
        setState("FAILED");
        const msg =
          err instanceof Error ? err.message : "Payment verification failed or timed out.";
        setErrorMessage(msg);
      });
  }, [storeSlug, pidx, orderId, router]);

  return (
    <div className="min-h-dvh bg-sf-canvas text-sf-ink flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-sf border border-sf-line bg-sf-surface text-center space-y-5 shadow-lg">
        {state === "VERIFYING" && (
          <div className="space-y-4 py-6">
            <Loader2 className="w-10 h-10 text-sf-accent animate-spin mx-auto" aria-hidden="true" />
            <div className="space-y-1.5">
              <h2 className="font-sf-display text-lg font-bold text-sf-ink">
                Verifying Payment with Khalti
              </h2>
              <p className="text-xs text-sf-muted font-sf-mono">
                Connecting to Khalti Sandbox server... Please do not close this window.
              </p>
            </div>
          </div>
        )}

        {state === "SUCCESS" && (
          <div className="space-y-4 py-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-sf-canvas border border-sf-line text-sf-accent mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-sf-display text-lg font-bold text-sf-ink">
                Payment Verified ✓
              </h2>
              <p className="text-xs text-sf-muted font-sf-mono">
                Redirecting to your order confirmation screen...
              </p>
            </div>
          </div>
        )}

        {state === "FAILED" && (
          <div className="space-y-4 py-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-sf-canvas border border-sf-line text-sf-cta mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-sf-display text-lg font-bold text-sf-ink">
                Payment Verification Failed
              </h2>
              <p className="text-xs text-sf-muted font-sf-mono">
                {errorMessage || "The transaction could not be verified by Khalti."}
              </p>
            </div>

            <div className="pt-3 flex flex-col gap-2">
              <Link
                href={`/s/${encodeURIComponent(storeSlug)}/checkout`}
                className="w-full py-2.5 rounded-sf bg-sf-cta text-sf-cta-ink font-sf-mono text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Return to Checkout
              </Link>
              <Link
                href={`/s/${encodeURIComponent(storeSlug)}`}
                className="w-full py-2.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-mono text-xs font-medium hover:bg-sf-surface transition-colors"
              >
                Back to Storefront
              </Link>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-sf-line flex items-center justify-center gap-1.5 text-[11px] font-sf-mono text-sf-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-sf-accent" aria-hidden="true" />
          <span>ShopCraft Verified Khalti Sandbox</span>
        </div>
      </div>
    </div>
  );
}
