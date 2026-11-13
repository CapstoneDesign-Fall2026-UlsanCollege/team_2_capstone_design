import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { CheckoutForm, CheckoutSkeleton } from "@/components/storefront/CheckoutForm";
import { StorePublicMetadata } from "@/lib/api";
import { getServerApiOrigin } from "@/lib/env";
import { getStorefrontPaymentAndDeliveryClaims } from "@/lib/storefront-helpers";

async function fetchStore(storeSlug: string): Promise<StorePublicMetadata | null> {
  const origin = getServerApiOrigin();
  try {
    const res = await fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/`, {
      cache: "no-store",
    });
    if (res.status === 404 || !res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function StorefrontCheckoutPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const store = await fetchStore(storeSlug);

  if (!store) {
    notFound();
  }

  return (
    <div className="min-h-dvh bg-[var(--canvas)] text-[var(--ink)] flex flex-col font-sans">
      {/* Distraction-Free Header */}
      <header className="sticky top-0 z-30 w-full border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Store</span>
          </Link>

          <span className="font-serif text-base font-semibold text-[var(--ink)]">
            {store.name}
          </span>

          <div className="inline-flex items-center gap-1 text-xs text-[var(--ink-2)]">
            <ShieldCheck className="w-4 h-4 text-[var(--ink-2)]" aria-hidden="true" />
            <span className="hidden sm:inline">Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Main Checkout Container */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 space-y-1 text-left">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ink)]">
            Checkout
          </h1>
          <p className="text-xs text-[var(--ink-2)]">
            {getStorefrontPaymentAndDeliveryClaims(store).heroPromiseLine ||
              `Direct purchase from ${store.name}`}
          </p>
        </div>

        <Suspense fallback={<CheckoutSkeleton />}>
          <CheckoutForm store={store} />
        </Suspense>
      </main>
    </div>
  );
}
