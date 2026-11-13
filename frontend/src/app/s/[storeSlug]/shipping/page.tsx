import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Banknote, CreditCard, MapPin, Truck } from "lucide-react";
import { formatNpr, StorePublicMetadata } from "@/lib/api";
import { getServerApiOrigin } from "@/lib/env";
import { getStorefrontPaymentAndDeliveryClaims } from "@/lib/storefront-helpers";

async function fetchStore(storeSlug: string): Promise<StorePublicMetadata | null> {
  const origin = getServerApiOrigin();
  try {
    const res = await fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404 || !res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
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
    <div className="min-h-dvh bg-sf-canvas text-sf-ink flex flex-col font-sf-body">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-sf-line bg-sf-surface/90 backdrop-blur-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center gap-1.5 text-xs font-sf-mono text-sf-muted hover:text-sf-ink transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Store</span>
          </Link>

          <span className="font-sf-display text-sm sm:text-base font-bold text-sf-ink">
            Delivery &amp; Logistics
          </span>

          <div className="inline-flex items-center gap-1 text-[11px] font-sf-mono text-sf-muted">
            <Truck className="w-3.5 h-3.5 text-sf-accent" aria-hidden="true" />
            <span>{claims.shippingConfigured ? "7 Provinces" : "NPR"}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 text-left">
        
        <div className="space-y-3 border-b border-sf-line pb-6">
          <h1 className="font-sf-display text-2xl sm:text-4xl font-bold tracking-tight text-sf-ink">
            Shipping &amp; Payment Policies
          </h1>
          <p className="text-xs sm:text-sm text-sf-muted font-sf-mono leading-relaxed">
            Shipping fees and payment options configured by {store.name}.
          </p>
        </div>

        {/* Delivery Zone Cards */}
        {claims.shippingConfigured ? (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Zone 1: Valley */}
            <div className="p-6 rounded-sf border border-sf-line bg-sf-surface space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-sf-mono font-bold text-sf-cta uppercase">
                <Truck className="w-4 h-4 text-sf-cta" />
                <span>Kathmandu Valley (1–2 days)</span>
              </div>
              <h3 className="font-sf-display text-lg font-bold text-sf-ink">
                Kathmandu, Lalitpur &amp; Bhaktapur
              </h3>
              <p className="text-xs text-sf-muted leading-relaxed">
                Standard flat rate of <span className="font-bold text-sf-ink">{insideValleyRs}</span>. {hasFreeShipping ? (
                  <>
                    Orders over{" "}
                    <span className="font-bold text-emerald-800">{freeThresholdRs}</span> qualify for{" "}
                    <span className="font-bold text-emerald-800">FREE delivery</span>.
                  </>
                ) : (
                  "Direct doorstep courier dispatch."
                )}
              </p>
            </div>

            {/* Zone 2: Outside Valley */}
            <div className="p-6 rounded-sf border border-sf-line bg-sf-surface space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-sf-mono font-bold text-blue-800 uppercase">
                <MapPin className="w-4 h-4 text-blue-700" />
                <span>Outside Valley (Nationwide courier)</span>
              </div>
              <h3 className="font-sf-display text-lg font-bold text-sf-ink">
                Nationwide Delivery Across Nepal
              </h3>
              <p className="text-xs text-sf-muted leading-relaxed">
                Standard courier flat rate of <span className="font-bold text-sf-ink">{outsideValleyRs}</span>.
              </p>
            </div>
          </section>
        ) : (
          <section className="p-6 rounded-sf border border-sf-line bg-sf-surface text-xs text-sf-muted leading-relaxed">
            {store.name} has not published custom delivery zones yet. Any applicable shipping fee is shown clearly at checkout before you confirm your order.
          </section>
        )}

        {/* Payment Methods Breakdown */}
        <section className="p-6 rounded-sf border border-sf-line bg-sf-surface space-y-5">
          <h3 className="font-sf-display text-lg font-bold text-sf-ink">
            Payment Terms
          </h3>

          {claims.hasKhalti || claims.codEnabled ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sf-mono">
              {claims.hasKhalti && (
                <div className="p-4 rounded-sf bg-sf-canvas border border-sf-line space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sf-ink">
                    <CreditCard className="w-4 h-4 text-sf-accent" />
                    <span>Khalti Web Wallet (Instant)</span>
                  </div>
                  <p className="text-sf-muted leading-relaxed text-[11px]">
                    Pay directly from your Khalti balance, connected eBanking account, or SCT card with instant verification.
                  </p>
                </div>
              )}

              {claims.codEnabled && (
                <div className="p-4 rounded-sf bg-sf-canvas border border-sf-line space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sf-ink">
                    <Banknote className="w-4 h-4 text-sf-muted" />
                    <span>Cash on Delivery (COD)</span>
                  </div>
                  <p className="text-sf-muted leading-relaxed text-[11px]">
                    Pay in cash when your order arrives.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-sf-muted leading-relaxed">
              No online or Cash on Delivery payment options are currently enabled for this store.
            </p>
          )}
        </section>

        {/* Back Action */}
        <div className="text-center pt-2">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-sf bg-sf-cta text-sf-cta-ink text-xs font-sf-mono font-bold hover:opacity-90 transition-opacity"
          >
            <span>Return to Catalog</span>
          </Link>
        </div>

      </main>
    </div>
  );
}
