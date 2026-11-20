import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Banknote, CreditCard, MapPin, Truck } from "lucide-react";
import { formatNpr, StorePublicMetadata } from "@/lib/api";
import { fetchPublicStoreOutcome } from "@/lib/storefront-fetch";
import { getStorefrontPaymentAndDeliveryClaims } from "@/lib/storefront-helpers";

async function fetchStore(storeSlug: string): Promise<StorePublicMetadata | null> {
  const res = await fetchPublicStoreOutcome(storeSlug);
  return res.status === "ok" ? res.store : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}): Promise<Metadata> {
  const { storeSlug } = await params;
  const store = await fetchStore(storeSlug);
  const slug = encodeURIComponent(store?.slug || storeSlug);
  if (!store) {
    return {
      title: "Shipping & Delivery",
      alternates: { canonical: `/s/${slug}/shipping` },
    };
  }
  return {
    title: `Shipping & Delivery — ${store.name}`,
    description: `Kathmandu Valley and nationwide delivery rates and payment options for ${store.name}.`,
    alternates: { canonical: `/s/${slug}/shipping` },
  };
}

export default async function StorefrontShippingPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const store = await fetchStore(storeSlug);

  if (!store) {
    notFound();
  }

  const claims = getStorefrontPaymentAndDeliveryClaims(store);
  const insideValleyRs = formatNpr(store.inside_valley_shipping_minor || 10000);
  const outsideValleyRs = formatNpr(store.outside_valley_shipping_minor || 20000);
  const hasFreeShipping = Boolean(store.free_shipping_threshold_minor && store.free_shipping_threshold_minor > 0);
  const freeThresholdRs = hasFreeShipping ? formatNpr(store.free_shipping_threshold_minor!) : "";

  return (
    <div className="min-h-dvh bg-[var(--canvas)] text-[var(--ink)] flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Store</span>
          </Link>

          <span className="font-serif text-sm sm:text-base font-bold text-[var(--ink)]">
            Delivery &amp; Logistics
          </span>

          <div className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-2)]">
            <Truck className="w-3.5 h-3.5 text-[var(--primary)]" aria-hidden="true" />
            <span>{claims.shippingConfigured ? "7 Provinces" : "NPR"}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 text-left">
        
        <div className="space-y-3 border-b border-[var(--border)] pb-6">
          <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
            Shipping &amp; Payment Policies
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed">
            Shipping fees and payment options configured by {store.name}.
          </p>
        </div>

        {/* Delivery Zone Cards */}
        {claims.shippingConfigured ? (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Zone 1: Valley */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] uppercase">
                <Truck className="w-4 h-4 text-[var(--primary)]" />
                <span>Kathmandu Valley (1–2 days)</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-[var(--ink)]">
                Kathmandu, Lalitpur &amp; Bhaktapur
              </h3>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                Standard flat rate of <span className="font-bold text-[var(--ink)] tabular-nums">{insideValleyRs}</span>. {hasFreeShipping ? (
                  <>
                    Orders over{" "}
                    <span className="font-bold text-[var(--status-success-fg)] tabular-nums">{freeThresholdRs}</span> qualify for{" "}
                    <span className="font-bold text-[var(--status-success-fg)]">FREE delivery</span>.
                  </>
                ) : (
                  "Direct doorstep courier dispatch."
                )}
              </p>
            </div>

            {/* Zone 2: Outside Valley */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--ink)] uppercase">
                <MapPin className="w-4 h-4 text-[var(--ink-2)]" />
                <span>Outside Valley (Nationwide courier)</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-[var(--ink)]">
                Nationwide Delivery Across Nepal
              </h3>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                Standard courier flat rate of <span className="font-bold text-[var(--ink)] tabular-nums">{outsideValleyRs}</span>.
              </p>
            </div>
          </section>
        ) : (
          <section className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--ink-2)] leading-relaxed">
            {store.name} has not published custom delivery zones yet. Any applicable shipping fee is shown clearly at checkout before you confirm your order.
          </section>
        )}

        {/* Payment Methods Breakdown */}
        <section className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-5">
          <h3 className="font-serif text-lg font-bold text-[var(--ink)]">
            Payment Terms
          </h3>

          {claims.hasKhalti || claims.codEnabled ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {claims.hasKhalti && (
                <div className="p-4 rounded-lg bg-[var(--canvas)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
                    <CreditCard className="w-4 h-4 text-[var(--primary)]" />
                    <span>Khalti Web Wallet (Instant)</span>
                  </div>
                  <p className="text-[var(--ink-2)] leading-relaxed text-[11px]">
                    Pay directly from your Khalti balance, connected eBanking account, or SCT card with instant verification.
                  </p>
                </div>
              )}

              {claims.codEnabled && (
                <div className="p-4 rounded-lg bg-[var(--canvas)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
                    <Banknote className="w-4 h-4 text-[var(--ink-2)]" />
                    <span>Cash on Delivery (COD)</span>
                  </div>
                  <p className="text-[var(--ink-2)] leading-relaxed text-[11px]">
                    Pay in cash when your order arrives.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              No online or Cash on Delivery payment options are currently enabled for this store.
            </p>
          )}
        </section>

        {/* Back Action */}
        <div className="text-center pt-2">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] text-xs font-bold transition-colors"
          >
            <span>Return to Catalog</span>
          </Link>
        </div>

      </main>
    </div>
  );
}
