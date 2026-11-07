import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Banknote, CreditCard, HelpCircle, MapPin, Phone, ShieldCheck, Truck } from "lucide-react";
import { formatNpr, StorePublicMetadata } from "@/lib/api";
import { getServerApiOrigin } from "@/lib/env";

async function fetchStore(storeSlug: string): Promise<StorePublicMetadata | null> {
  const origin = getServerApiOrigin();
  try {
    const res = await fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      return {
        slug: storeSlug,
        name: storeSlug,
        tagline: "Specialty goods delivered across Nepal.",
        currency: "NPR",
        theme_preset: "editorial-warm",
        logo_url: "",
        accent_color: "",
        contact_phone: "9801234567",
        inside_valley_shipping_minor: 10000,
        outside_valley_shipping_minor: 20000,
        free_shipping_threshold_minor: 150000,
      };
    }
    return await res.json();
  } catch {
    return {
      slug: storeSlug,
      name: storeSlug,
      tagline: "Specialty goods delivered across Nepal.",
      currency: "NPR",
      theme_preset: "editorial-warm",
      logo_url: "",
      accent_color: "",
      contact_phone: "9801234567",
      inside_valley_shipping_minor: 10000,
      outside_valley_shipping_minor: 20000,
      free_shipping_threshold_minor: 150000,
    };
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
            <span>7 Provinces</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 text-left">
        
        <div className="space-y-3 border-b border-sf-line pb-6">
          <h1 className="font-sf-display text-2xl sm:text-4xl font-bold tracking-tight text-sf-ink">
            Nepal Shipping &amp; Payment Policies
          </h1>
          <p className="text-xs sm:text-sm text-sf-muted font-sf-mono leading-relaxed">
            Transparent delivery rates, local payment methods, and door-to-door courier schedules for {store.name}.
          </p>
        </div>

        {/* 2 Delivery Zone Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Zone 1: Valley */}
          <div className="p-6 rounded-sf border border-sf-line bg-sf-surface space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-sf-mono font-bold text-sf-cta uppercase">
              <Truck className="w-4 h-4 text-sf-cta" />
              <span>Kathmandu Valley (24h Express)</span>
            </div>
            <h3 className="font-sf-display text-lg font-bold text-sf-ink">
              Kathmandu, Lalitpur &amp; Bhaktapur
            </h3>
            <p className="text-xs text-sf-muted leading-relaxed">
              Standard flat rate of <span className="font-bold text-sf-ink">{insideValleyRs}</span>. {hasFreeShipping ? (
                <>
                  Orders over{" "}
                  <span className="font-bold text-emerald-800">{freeThresholdRs}</span> qualify for completely{" "}
                  <span className="font-bold text-emerald-800">FREE delivery</span>.
                </>
              ) : (
                "Same-day or next-day direct doorstep courier dispatch."
              )}
            </p>
            <div className="text-[11px] font-sf-mono text-sf-muted pt-1 border-t border-sf-line">
              Dispatch: Dispatched within 24h via local bike courier.
            </div>
          </div>

          {/* Zone 2: Outside Valley */}
          <div className="p-6 rounded-sf border border-sf-line bg-sf-surface space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-sf-mono font-bold text-blue-800 uppercase">
              <MapPin className="w-4 h-4 text-blue-700" />
              <span>All 7 Provinces (Nationwide)</span>
            </div>
            <h3 className="font-sf-display text-lg font-bold text-sf-ink">
              74 Districts Across Nepal
            </h3>
            <p className="text-xs text-sf-muted leading-relaxed">
              Standard courier flat rate of <span className="font-bold text-sf-ink">{outsideValleyRs}</span>. Shipped in airtight heat-sealed packaging via Pathao Courier and domestic freight partners.
            </p>
            <div className="text-[11px] font-sf-mono text-sf-muted pt-1 border-t border-sf-line">
              Delivery Time: 2 to 4 business days depending on district.
            </div>
          </div>
        </section>

        {/* Payment Methods Breakdown */}
        <section className="p-6 rounded-sf border border-sf-line bg-sf-surface space-y-5">
          <h3 className="font-sf-display text-lg font-bold text-sf-ink">
            Payment &amp; Cash on Delivery Terms
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sf-mono">
            <div className="p-4 rounded-sf bg-sf-canvas border border-sf-line space-y-2">
              <div className="flex items-center gap-2 font-bold text-sf-ink">
                <CreditCard className="w-4 h-4 text-sf-accent" />
                <span>Khalti Web Wallet (Instant)</span>
              </div>
              <p className="text-sf-muted leading-relaxed text-[11px]">
                Pay directly from your Khalti balance, connected eBanking account, or SCT card. Instant verification with 0 payment processing surcharges.
              </p>
            </div>

            <div className="p-4 rounded-sf bg-sf-canvas border border-sf-line space-y-2">
              <div className="flex items-center gap-2 font-bold text-sf-ink">
                <Banknote className="w-4 h-4 text-sf-muted" />
                <span>Cash on Delivery (COD)</span>
              </div>
              <p className="text-sf-muted leading-relaxed text-[11px]">
                Available throughout Kathmandu Valley and major provincial hubs. Our dispatch team will call you before sending the courier to confirm your address.
              </p>
            </div>
          </div>
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
