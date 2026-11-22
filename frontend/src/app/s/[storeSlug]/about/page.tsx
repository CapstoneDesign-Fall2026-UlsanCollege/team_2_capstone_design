import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Sparkles,
} from "lucide-react";
import { StoreImage } from "@/components/storefront/StoreImage";
import { StorePublicMetadata } from "@/lib/api";
import { fetchPublicStoreOutcome } from "@/lib/storefront-fetch";
import {
  buildWhatsAppUrl,
  sanitizeStorefrontImageUrl,
} from "@/lib/storefront-helpers";

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
      title: "About Store",
      alternates: { canonical: `/s/${slug}/about` },
    };
  }
  return {
    title: `About ${store.name}`,
    description:
      store.story_headline?.trim() ||
      `Learn more about ${store.name} on ShopCraft.`,
    alternates: { canonical: `/s/${slug}/about` },
  };
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

  const whatsappUrl = buildWhatsAppUrl(store.contact_phone, store.name);
  const displayPhone =
    store.contact_phone && store.contact_phone.trim() !== "9801234567"
      ? store.contact_phone.trim()
      : "";
  const bannerUrl = sanitizeStorefrontImageUrl(store.banner_url);
  const headline =
    store.story_headline ||
    store.tagline ||
    `About ${store.name}`;

  const aboutParagraphs = store.about_text?.trim()
    ? store.about_text.split(/\n\s*\n/).filter(Boolean)
    : [];

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

          <span className="font-serif text-sm sm:text-base font-bold text-[var(--ink)] truncate max-w-[200px] sm:max-w-none">
            About {store.name}
          </span>

          <div className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-2)]">
            <Heart className="w-3.5 h-3.5 text-[var(--primary)]" aria-hidden="true" />
            <span>Our Story</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 text-left">
        
        {/* Banner if available */}
        {bannerUrl && (
          <div className="relative w-full aspect-[21/9] max-h-72 rounded-xl overflow-hidden border border-[var(--border)]">
            <StoreImage
              src={bannerUrl}
              alt={`${store.name} storefront cover`}
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
          </div>
        )}

        {/* Dynamic Editorial Story Hero */}
        <section className="space-y-4 border-b border-[var(--border)] pb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--ink-2)] font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Independent Merchant · {store.name}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink)] leading-[1.12]">
            {headline}
          </h1>

          {store.tagline && (
            <p className="text-base sm:text-lg text-[var(--ink-2)] font-medium italic">
              &ldquo;{store.tagline}&rdquo;
            </p>
          )}

          {aboutParagraphs.length > 0 ? (
            <div className="space-y-4 pt-2 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed max-w-2xl">
              {aboutParagraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          ) : (
            <p className="pt-2 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed max-w-2xl">
              No store story has been added yet.
            </p>
          )}
        </section>

        {/* Store Verification & Contact Card */}
        <section className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-[var(--ink)]">
                Connect with {store.name}
              </h2>
              <p className="text-xs text-[var(--ink-2)] mt-0.5">
                Reach out for custom inquiries, bulk orders, or questions about our products.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Us</span>
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {store.address && (
              <div className="flex items-start gap-2 text-[var(--ink-2)]">
                <MapPin className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-[var(--ink)]">Location</span>
                  <span>{store.address}</span>
                </div>
              </div>
            )}

            {displayPhone && (
              <div className="flex items-start gap-2 text-[var(--ink-2)]">
                <Phone className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-[var(--ink)]">Direct Phone</span>
                  <a href={`tel:${displayPhone}`} className="hover:underline tabular-nums">
                    {displayPhone}
                  </a>
                </div>
              </div>
            )}

            {store.contact_email && (
              <div className="flex items-start gap-2 text-[var(--ink-2)]">
                <Mail className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-[var(--ink)]">Email Support</span>
                  <a href={`mailto:${store.contact_email}`} className="hover:underline">
                    {store.contact_email}
                  </a>
                </div>
              </div>
            )}
          </div>

          {(store.instagram_url || store.facebook_url) && (
            <div className="pt-2 flex items-center gap-3 text-xs text-[var(--ink-2)]">
              <span className="font-semibold text-[var(--ink)]">Follow Socials:</span>
              {store.instagram_url && (
                <a
                  href={store.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-[var(--ink)] hover:underline"
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
                  className="inline-flex items-center gap-1 hover:text-[var(--ink)] hover:underline"
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
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 rounded-lg font-serif text-sm font-bold bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>Explore {store.name} Catalog</span>
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-6 px-4 text-center text-xs text-[var(--ink-2)]">
        <p>© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
      </footer>
    </div>
  );
}
