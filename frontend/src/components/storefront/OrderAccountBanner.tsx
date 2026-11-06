"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, User } from "lucide-react";
import { useStorefrontAuth } from "@/lib/auth";
import { useAccount } from "./AccountContext";

export interface OrderAccountBannerProps {
  storeSlug: string;
  customerEmail?: string;
}

export function OrderAccountBanner({ storeSlug, customerEmail }: OrderAccountBannerProps) {
  const { isAuthenticated, loading } = useStorefrontAuth(storeSlug);
  const { openAccount } = useAccount();

  if (loading || isAuthenticated) {
    return null;
  }

  const cleanEmail = customerEmail?.trim().toLowerCase();

  return (
    <div className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3.5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[var(--canvas)] border border-[var(--border)] flex items-center justify-center shrink-0 text-[var(--ink)]">
          <User className="w-4 h-4" />
        </div>
        <div className="space-y-1 min-w-0">
          <h3 className="font-serif text-sm sm:text-base font-semibold text-[var(--ink)]">
            Save your details for faster checkout next time
          </h3>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            Create an optional customer account{cleanEmail ? ` using ${cleanEmail}` : ""} to track your package, view order history, and save delivery addresses.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => openAccount(cleanEmail || undefined)}
          className="min-h-[44px] px-4 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <span>Create customer account</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1.5 text-[11px] text-[var(--ink-2)]">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--status-success-fg)] shrink-0" />
          <span>Passwordless · 6-digit email code</span>
        </div>
      </div>
    </div>
  );
}

export function OrderHeaderNav({
  storeSlug,
  orderNumber,
}: {
  storeSlug: string;
  orderNumber: string;
}) {
  const { isAuthenticated, loading } = useStorefrontAuth(storeSlug);
  const { openAccount } = useAccount();

  if (loading) {
    return <span className="text-xs text-[var(--ink-2)] tabular-nums">{orderNumber}</span>;
  }

  if (isAuthenticated) {
    return (
      <Link
        href={`/s/${encodeURIComponent(storeSlug)}/account`}
        className="text-xs font-medium text-[var(--ink)] hover:text-[var(--ink-2)] underline min-h-[44px] inline-flex items-center"
      >
        Order history
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden sm:inline text-xs text-[var(--ink-2)] tabular-nums">{orderNumber}</span>
      <button
        type="button"
        onClick={() => openAccount()}
        className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)] underline min-h-[44px] inline-flex items-center cursor-pointer"
      >
        Sign in
      </button>
    </div>
  );
}
