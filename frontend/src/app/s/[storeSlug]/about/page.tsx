import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { StoreImage } from "@/components/storefront/StoreImage";
import { StorePublicMetadata } from "@/lib/api";
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
        tagline: "Quality goods delivered across Nepal.",
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
      tagline: "Quality goods delivered across Nepal.",
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

export default async function StorefrontAboutPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const store = await fetchStore(storeSlug);

  if (!store) {
    notFound();
  }

  const cleanPhone = (store.contact_phone || "").replace(/\D/g, "");
  const headline =
    store.story_headline ||
    store.tagline ||
    `Crafting authentic products with pride and care.`;

  const aboutParagraphs = store.about_text
    ? store.about_text.split(/\n\s*\n/).filter(Boolean)
    : [
        `${store.name} was established in ${store.city || "Nepal"} to bring authentic, high-quality ${store.category ? store.category.toLowerCase() : "specialty goods"} directly to patrons across Nepal without middlemen.`,
        `Every item in our collection is curated with personal attention to quality, reliable sourcing, and customer satisfaction. We take pride in transparent pricing, prompt door-to-door courier delivery to all 7 provinces, and responsive local support for all our patrons.`,
      ];

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

          <span className="font-sf-display text-sm sm:text-base font-bold text-sf-ink truncate max-w-[200px] sm:max-w-none">
            About {store.name}
          </span>

          <div className="inline-flex items-center gap-1 text-[11px] font-sf-mono text-sf-muted">
            <Heart className="w-3.5 h-3.5 text-sf-cta" aria-hidden="true" />
            <span>Our Story</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 text-left">
        
        {/* Banner if available */}
        {store.banner_url && (
          <div className="relative w-full aspect-[21/9] max-h-72 rounded-sf overflow-hidden border border-sf-line shadow-2xs">
            <StoreImage
              src={store.banner_url}
              alt={`${store.name} storefront cover`}
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
          </div>
        )}

        {/* Dynamic Editorial Story Hero */}
        <section className="space-y-4 border-b border-sf-line pb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-sf-surface border border-sf-line text-[11px] font-sf-mono text-sf-muted font-medium">
            <Sparkles className="w-3.5 h-3.5 text-sf-accent" />
            <span>Independent Merchant · {store.name}</span>
          </div>

          <h1 className="font-sf-display text-3xl sm:text-5xl font-bold tracking-tight text-sf-ink leading-[1.12]">
            {headline}
          </h1>

          {store.tagline && (
            <p className="text-base sm:text-lg text-sf-muted font-medium italic">
              &ldquo;{store.tagline}&rdquo;
            </p>
          )}

          <div className="space-y-4 pt-2 text-sm sm:text-base text-sf-muted leading-relaxed max-w-2xl font-sf-body">
            {aboutParagraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        </section>

        {/* 3 Core Commitments */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-sf border border-sf-line bg-sf-surface space-y-2.5 shadow-2xs">
            <Sparkles className="w-5 h-5 text-sf-cta" />
            <h3 className="font-sf-display text-base font-bold text-sf-ink">
              Quality &amp; Authenticity
            </h3>
            <p className="text-xs text-sf-muted leading-relaxed">
              Every item dispatched is checked thoroughly for material purity, craftsmanship, and freshness before packaging.
            </p>
          </div>

          <div className="p-5 rounded-sf border border-sf-line bg-sf-surface space-y-2.5 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h3 className="font-sf-display text-base font-bold text-sf-ink">
              Direct Independent Maker
            </h3>
            <p className="text-xs text-sf-muted leading-relaxed">
              You are supporting an independent business directly. No intermediaries, no inflated markups.
            </p>
          </div>

          <div className="p-5 rounded-sf border border-sf-line bg-sf-surface space-y-2.5 shadow-2xs">
            <Truck className="w-5 h-5 text-sf-ink" />
            <h3 className="font-sf-display text-base font-bold text-sf-ink">
              Reliable Nepal Courier
            </h3>
            <p className="text-xs text-sf-muted leading-relaxed">
              Prompt door-to-door dispatch across Kathmandu Valley and verified regional logistics to all 7 provinces.
            </p>
          </div>
        </section>

        {/* Store Verification & Contact Card */}
        <section className="p-6 rounded-sf border border-sf-line bg-sf-surface space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sf-line pb-4">
            <div>
              <h2 className="font-sf-display text-lg font-bold text-sf-ink">
                Connect with {store.name}
              </h2>
              <p className="text-xs text-sf-muted mt-0.5">
                Reach out for custom inquiries, bulk orders, or questions about our products.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {cleanPhone && (
                <a
                  href={`https://wa.me/977${cleanPhone}?text=Hi%20${encodeURIComponent(store.name)}%2C%20I%20have%20a%20question%20about%20your%20store.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sf text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-800 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Us</span>
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sf-mono">
            {store.address && (
              <div className="flex items-start gap-2 text-sf-muted">
                <MapPin className="w-4 h-4 text-sf-cta shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-sf-ink">Location</span>
                  <span>{store.address}</span>
                </div>
              </div>
            )}

            {store.contact_phone && (
              <div className="flex items-start gap-2 text-sf-muted">
                <Phone className="w-4 h-4 text-sf-cta shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-sf-ink">Direct Phone</span>
                  <a href={`tel:${store.contact_phone}`} className="hover:underline">
                    {store.contact_phone}
                  </a>
                </div>
              </div>
            )}

            {store.contact_email && (
              <div className="flex items-start gap-2 text-sf-muted">
                <Mail className="w-4 h-4 text-sf-cta shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-sf-ink">Email Support</span>
                  <a href={`mailto:${store.contact_email}`} className="hover:underline">
                    {store.contact_email}
                  </a>
                </div>
              </div>
            )}
          </div>

          {(store.instagram_url || store.facebook_url) && (
            <div className="pt-2 flex items-center gap-3 text-xs text-sf-muted font-sf-mono">
              <span className="font-semibold text-sf-ink">Follow Socials:</span>
              {store.instagram_url && (
                <a
                  href={store.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-sf-ink hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Instagram</span>
                </a>
              )}
              {store.facebook_url && (
                <a
                  href={store.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-sf-ink hover:underline"
                >
                  <span>Facebook</span>
                </a>
              )}
            </div>
          )}
        </section>

        {/* Direct Link back to Catalog */}
        <div className="text-center pt-4">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-sf font-sf-display text-sm font-bold bg-sf-ink text-white hover:opacity-90 transition-opacity"
          >
            <Package className="w-4 h-4" />
            <span>Explore {store.name} Catalog</span>
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-sf-line bg-sf-surface py-6 px-4 text-center text-xs font-sf-mono text-sf-muted">
        <p>© {new Date().getFullYear()} {store.name}. Powered by ShopCraft Nepal.</p>
      </footer>
    </div>
  );
}
