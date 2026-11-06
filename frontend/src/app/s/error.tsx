"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RotateCw } from "lucide-react";
import { Chip } from "@/components/ui/chip";

export default function StoreSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Store segment error boundary:", error);
  }, [error]);

  return (
    <div
      data-store-theme="editorial-warm"
      className="min-h-dvh bg-[var(--canvas)] text-[var(--ink)] flex flex-col items-center justify-center p-4 font-sans"
    >
      <div className="w-full max-w-md p-6 sm:p-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center space-y-6">
        <div className="inline-flex justify-center">
          <Chip tone="error">Connection Error</Chip>
        </div>

        <div className="w-14 h-14 rounded-full bg-[var(--error-bg)] border border-[var(--error-bd)] text-[var(--error-fg)] mx-auto flex items-center justify-center">
          <AlertCircle className="w-7 h-7" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-[var(--ink)]">
            Unable to Load Store
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-sm mx-auto leading-relaxed">
            We are having trouble connecting to this store right now. Please check your internet connection or try again shortly.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5 max-w-xs mx-auto">
          {/* Primary Action: Retry */}
          <button
            type="button"
            onClick={() => reset()}
            className="w-full min-h-[44px] h-12 rounded-lg bg-[var(--primary)] text-[var(--surface)] hover:bg-[var(--primary-hover)] text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          {/* Secondary Action: Platform Home */}
          <Link
            href="/"
            className="w-full min-h-[44px] h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--canvas)] text-xs font-medium text-[var(--ink)] transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--ink-2)]" />
            <span>Return to ShopCraft Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
