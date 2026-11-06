import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { CheckoutForm, CheckoutSkeleton } from "@/components/storefront/CheckoutForm";
import { StorePublicMetadata } from "@/lib/api";

async function fetchStore(storeSlug: string): Promise<StorePublicMetadata | null> {
  const origin = process.env.DJANGO_API_ORIGIN || "http://127.0.0.1:8000";
  try {
    const res = await fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/`, {
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      return {
        slug: storeSlug,
        name: storeSlug,
        tagline: "",
        currency: "NPR",
        theme_preset: "editorial-warm",
        logo_url: "",
        accent_color: "",
        contact_phone: "9801234567",
        inside_valley_shipping_minor: 10000,
        outside_valley_shipping_minor: 20000,
        free_shipping_threshold_minor: null,
      };
    }
    return await res.json();
  } catch {
    return {
      slug: storeSlug,
      name: storeSlug,
      tagline: "",
      currency: "NPR",
      theme_preset: "editorial-warm",
      logo_url: "",
      accent_color: "",
      contact_phone: "9801234567",
      inside_valley_shipping_minor: 10000,
      outside_valley_shipping_minor: 20000,
      free_shipping_threshold_minor: null,
    };
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
            Direct purchase from {store.name} · Khalti or Cash on Delivery
          </p>
        </div>

        <Suspense fallback={<CheckoutSkeleton />}>
          <CheckoutForm store={store} />
        </Suspense>
      </main>
    </div>
  );
}
