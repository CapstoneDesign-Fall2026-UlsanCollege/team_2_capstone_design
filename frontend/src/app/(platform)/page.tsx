"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const THEME_PRESETS = [
  {
    id: "editorial-warm",
    name: "Editorial Warm",
    category: "Coffee, Bakeries, Books",
    bg: "#F5F2EB",
    accent: "#A3432A",
    tagline: "Artisanal roasts & slow goods",
    sampleItem: "Himalayan Arabica (250g)",
    samplePrice: "Rs. 765",
  },
  {
    id: "pahadi-sage",
    name: "Pahadi Sage",
    category: "Herbal, Skincare, Honey",
    bg: "#F3F7F4",
    accent: "#1F6F4A",
    tagline: "Wild mountain harvest",
    sampleItem: "Mustang Raw White Honey",
    samplePrice: "Rs. 1,150",
  },
  {
    id: "ktm-bold",
    name: "KTM Bold",
    category: "Streetwear, Tech, Studio",
    bg: "#F4F4F0",
    accent: "#2B3BFF",
    tagline: "Limited urban releases",
    sampleItem: "Patan Block-Print Hoodie",
    samplePrice: "Rs. 2,850",
  },
];

export default function PlatformHomePage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("Pahadi Goods");
  const [activePresetIndex, setActivePresetIndex] = useState(1); // default pahadi-sage
  const [hasInteracted, setHasInteracted] = useState(false);

  const slug = slugify(storeName) || "your-shop";
  const activePreset = THEME_PRESETS[activePresetIndex];

  // Auto-cycle presets every 4s until user touches/clicks
  useEffect(() => {
    if (hasInteracted) return;
    const interval = setInterval(() => {
      setActivePresetIndex((prev) => (prev + 1) % THEME_PRESETS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [hasInteracted]);

  const handlePresetSelect = (index: number) => {
    setHasInteracted(true);
    setActivePresetIndex(index);
  };

  const handleStartFree = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/merchant/new?name=${encodeURIComponent(storeName.trim() || "My Store")}`);
  };

  return (
    <div className="w-full bg-[var(--sc-paper,#FAFAF7)] text-[var(--sc-ink,#111318)] min-h-dvh">
      {/* --------------------------------------------------------------------- */}
      {/* 1. HERO SECTION: Left-Aligned + Real Storefront Phone Preview         */}
      {/* --------------------------------------------------------------------- */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column (Hero Copy & Interactive Name Claim) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-xs text-[var(--sc-ink-2,#4B5060)]">
              <span
                className="w-2 h-2 rounded-full bg-[var(--sc-marigold,#F2A900)] inline-block"
                aria-hidden="true"
              />
              <span>Multi-Tenant Commerce &amp; Subscriptions for Nepal</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.12] text-[var(--sc-ink,#111318)]">
                Your shop, online, before your chiya cools.
              </h1>
              <p className="text-base sm:text-lg text-[var(--sc-ink-2,#4B5060)] max-w-xl leading-relaxed">
                Khalti and Cash on Delivery, both working on day one. Built specifically for mobile shoppers arriving from Instagram and TikTok in-app browsers across Nepal.
              </p>
            </div>

            {/* Interactive Hero Input: Claim Your Store Name */}
            <form onSubmit={handleStartFree} className="space-y-4 max-w-lg">
              <div className="space-y-1.5">
                <label
                  htmlFor="hero-store-name"
                  className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)]"
                >
                  Enter your store name
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="hero-store-name"
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => {
                      setStoreName(e.target.value);
                      setHasInteracted(true);
                    }}
                    placeholder="e.g. Pahadi Honey, KTM Threads..."
                    className="flex-1 h-12 px-4 rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-sm font-medium text-[var(--sc-ink,#111318)] focus:outline-none focus:border-[var(--sc-marigold,#F2A900)] focus:ring-1 focus:ring-[var(--sc-marigold,#F2A900)] transition-colors"
                  />
                  <button
                    type="submit"
                    className="h-12 px-6 rounded-lg bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] font-medium text-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap shadow-xs"
                  >
                    Start free →
                  </button>
                </div>
              </div>

              {/* Live URL Ghost with Hand-Drawn Marigold Underline Motif */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--sc-ink-2,#4B5060)] font-mono pt-1">
                <span className="text-[var(--sc-ink-3,#8B90A0)]">Live URL:</span>
                <span className="text-[var(--sc-ink,#111318)] font-semibold relative">
                  shopcraft.com.np/s/{slug}
                  <svg
                    className="absolute -bottom-1 left-0 w-full h-[3px] text-[var(--sc-marigold,#F2A900)]"
                    viewBox="0 0 100 6"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M 0,4 Q 25,1 50,4 T 100,3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="text-[var(--sc-success,#15803D)] text-[11px] font-sans font-medium ml-2">
                  ✓ available
                </span>
              </div>
            </form>

            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-[var(--sc-ink-2,#4B5060)]">
              <span className="flex items-center gap-1.5">
                <span className="text-[var(--sc-success,#15803D)]">✓</span> Zero monthly hosting fees
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[var(--sc-success,#15803D)]">✓</span> Instant Khalti test sandbox
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[var(--sc-success,#15803D)]">✓</span> Launch in 2 minutes
              </span>
            </div>
          </div>

          {/* Right Column: Real Phone-Sized Live Storefront Preview */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* Theme Preset Swatches */}
            <div className="flex items-center gap-2 mb-3 bg-[var(--sc-surface,#FFFFFF)] border border-[var(--sc-line,#E8E8E1)] px-3 py-1.5 rounded-full shadow-xs">
              <span className="text-[11px] font-mono text-[var(--sc-ink-3,#8B90A0)] mr-1">Preset:</span>
              {THEME_PRESETS.map((preset, idx) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(idx)}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                    activePresetIndex === idx
                      ? "bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] font-medium"
                      : "text-[var(--sc-ink-2,#4B5060)] hover:text-[var(--sc-ink,#111318)]"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Phone Shell */}
            <div className="w-[310px] sm:w-[330px] rounded-[32px] border-[6px] border-[var(--sc-ink,#111318)] bg-[var(--sc-ink,#111318)] shadow-xl overflow-hidden">
              {/* Phone Speaker Notch */}
              <div className="h-4 bg-[var(--sc-ink,#111318)] flex justify-center items-center">
                <div className="w-16 h-1 bg-[var(--sc-ink-3,#8B90A0)]/40 rounded-full" />
              </div>

              {/* Scoped Storefront Screen */}
              <div
                data-store-theme={activePreset.id}
                className="bg-sf-canvas text-sf-ink font-sf-body p-4 min-h-[460px] flex flex-col justify-between transition-colors duration-300"
              >
                {/* Storefront Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-sf-line pb-3">
                    <span className="font-sf-display text-base font-bold tracking-tight text-sf-ink truncate max-w-[200px]">
                      {storeName.trim() || "Your Store"}
                    </span>
                    <span className="text-[10px] font-sf-mono px-2 py-0.5 rounded-sf border border-sf-line bg-sf-surface text-sf-ink">
                      Bag (0)
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sf bg-sf-surface border border-sf-line text-[10px] font-sf-mono text-sf-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-sf-accent" />
                      <span>In Stock · Dispatch in 24h</span>
                    </div>
                    <p className="text-xs text-sf-muted font-normal pt-1">
                      {activePreset.tagline}
                    </p>
                  </div>

                  {/* Sample Product Card inside Scoped Theme */}
                  <div className="p-3 rounded-sf bg-sf-surface border border-sf-line space-y-2 shadow-xs">
                    <div className="h-24 w-full rounded-sf bg-sf-canvas border border-sf-line flex items-center justify-center text-xs font-sf-mono text-sf-muted">
                      [Product Photo]
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <p className="font-sf-display text-xs font-bold text-sf-ink truncate">
                        {activePreset.sampleItem}
                      </p>
                      <p className="font-sf-mono text-xs font-semibold text-sf-ink tabular-nums">
                        {activePreset.samplePrice}
                      </p>
                    </div>
                    <p className="text-[10px] text-sf-muted">
                      Pay-per-delivery or prepaid 3-month cycle
                    </p>
                    <button
                      type="button"
                      className="w-full h-8 mt-1 rounded-sf bg-sf-cta text-sf-cta-ink font-sf-mono text-[11px] font-medium flex items-center justify-center"
                    >
                      Add to bag
                    </button>
                  </div>
                </div>

                {/* Footer preview */}
                <div className="pt-4 border-t border-sf-line text-center text-[10px] font-sf-mono text-sf-muted">
                  <span>Powered by ShopCraft · Kathmandu, Nepal</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] font-mono text-[var(--sc-ink-3,#8B90A0)] mt-2">
              Live preview rendered under <code className="font-semibold text-[var(--sc-ink-2,#4B5060)]">data-store-theme=&quot;{activePreset.id}&quot;</code>
            </p>
          </div>

        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 2. LOCAL DHAKA-WEAVE MOTIF DIVIDER                                    */}
      {/* --------------------------------------------------------------------- */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
        <div className="h-[2px] w-full bg-[var(--sc-line,#E8E8E1)] flex items-center justify-center">
          <span className="bg-[var(--sc-paper,#FAFAF7)] px-4 font-mono text-xs text-[var(--sc-ink-3,#8B90A0)]">
            ❖ ❖ ❖
          </span>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. FOUR CONCRETE PILLARS FOR NEPAL (ANTI-"AI LOOK" REALITY)          */}
      {/* --------------------------------------------------------------------- */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-2xl mb-12 space-y-2">
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--sc-marigold,#F2A900)] font-semibold">
            Built for Local Reality
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--sc-ink,#111318)]">
            Why ShopCraft fits Nepal better than Shopify.
          </h2>
          <p className="text-sm text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
            Global platforms assume US credit cards, monthly recurring Stripe charges, and zip codes. Here is how ShopCraft was designed from the ground up for Kathmandu and the 7 provinces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          
          {/* Pillar 1 */}
          <div className="p-6 sm:p-7 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] space-y-3">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--sc-paper,#FAFAF7)] border border-[var(--sc-line,#E8E8E1)] text-[var(--sc-ink-2,#4B5060)]">
              01 / MOBILE-FIRST
            </span>
            <h3 className="text-lg font-bold text-[var(--sc-ink,#111318)]">
              Instagram &amp; TikTok in-app browser speed.
            </h3>
            <p className="text-xs sm:text-sm text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
              Over 90% of online shoppers in Nepal tap a link in an Instagram bio or TikTok video. ShopCraft storefronts load in under 1 second on cellular 4G (Ncell and NTC), without heavy app bundles or desktop-first bloat.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 sm:p-7 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] space-y-3">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--sc-paper,#FAFAF7)] border border-[var(--sc-line,#E8E8E1)] text-[var(--sc-ink-2,#4B5060)]">
              02 / ZERO AUTO-DEBITS
            </span>
            <h3 className="text-lg font-bold text-[var(--sc-ink,#111318)]">
              Khalti wallet &amp; Cash on Delivery on day one.
            </h3>
            <p className="text-xs sm:text-sm text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
              Nepali banks do not support automated recurring card charges. ShopCraft supports verified Khalti web-wallet return redirects and Cash on Delivery with ward-level dispatch receipts. Zero friction.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 sm:p-7 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] space-y-3">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--sc-paper,#FAFAF7)] border border-[var(--sc-line,#E8E8E1)] text-[var(--sc-ink-2,#4B5060)]">
              03 / SUBSCRIPTIONS
            </span>
            <h3 className="text-lg font-bold text-[var(--sc-ink,#111318)]">
              Prepaid cycles &amp; pay-per-delivery renewal links.
            </h3>
            <p className="text-xs sm:text-sm text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
              Sell coffee, honey, herbal teas, or skincare on recurring cadences. Shoppers choose Prepaid 3, 6, or 12 deliveries upfront, or receive a 1-tap WhatsApp/SMS renewal link when their next box roasts.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 sm:p-7 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] space-y-3">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--sc-paper,#FAFAF7)] border border-[var(--sc-line,#E8E8E1)] text-[var(--sc-ink-2,#4B5060)]">
              04 / GEOGRAPHY
            </span>
            <h3 className="text-lg font-bold text-[var(--sc-ink,#111318)]">
              Native Province, District, Municipality &amp; Ward data.
            </h3>
            <p className="text-xs sm:text-sm text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
              No generic &quot;Zip Code&quot; errors. Our cascading address selector includes all 7 Provinces, 77 Districts, Municipalities, and Ward 1 to 35. Couriers and riders in Kathmandu Valley get precise chowk and tole landmarks.
            </p>
          </div>

        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 4. GROUNDED CTA BAND                                                  */}
      {/* --------------------------------------------------------------------- */}
      <section className="border-t border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--sc-ink,#111318)]">
              Ready to launch your shop?
            </h2>
            <p className="text-xs sm:text-sm text-[var(--sc-ink-2,#4B5060)]">
              Done. Your store is live. Share it on Instagram before your chiya cools.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/merchant/new"
              className="h-12 px-6 rounded-lg bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] font-medium text-xs font-mono uppercase tracking-wider flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              Launch Store Now →
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 5. FOOTER                                                             */}
      {/* --------------------------------------------------------------------- */}
      <footer className="border-t border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-paper,#FAFAF7)] py-8 px-4 sm:px-6 text-xs text-[var(--sc-ink-2,#4B5060)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[var(--sc-ink,#111318)] tracking-tight">ShopCraft</span>
            <span>· Multi-Tenant SaaS for Nepal</span>
          </div>

          <nav className="flex items-center gap-4 text-xs font-mono">
            <Link href="/login" className="hover:text-[var(--sc-ink,#111318)] transition-colors">
              Sign In
            </Link>
            <Link href="/account/addresses" className="hover:text-[var(--sc-ink,#111318)] transition-colors">
              Addresses
            </Link>
            <Link href="/s/brewmellow" target="_blank" className="hover:text-[var(--sc-ink,#111318)] transition-colors">
              Example Store ↗
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
