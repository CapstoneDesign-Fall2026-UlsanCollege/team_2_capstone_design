"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Check,
  CreditCard,
  ExternalLink,
  MapPin,
  Package,
  Phone,
  Repeat,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { HeroStorePreview } from "@/components/platform/HeroStorePreview";
import { DemoTenantShowcase } from "@/components/platform/DemoTenantShowcase";
import { ShopifyComparisonTable } from "@/components/platform/ShopifyComparisonTable";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PlatformHomePage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("Pahadi Goods");
  const [slugStatus, setSlugStatus] = useState<"checking" | "available" | "unavailable">("available");

  const slug = slugify(storeName) || "your-shop";

  React.useEffect(() => {
    if (!slug || slug === "your-shop") {
      setSlugStatus("available");
      return;
    }
    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stores/check-slug/?slug=${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          setSlugStatus(data.available ? "available" : "unavailable");
        } else {
          setSlugStatus("available");
        }
      } catch {
        setSlugStatus("available");
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [slug]);

  const handleStartFree = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/merchant/new?name=${encodeURIComponent(storeName.trim() || "My Store")}`);
  };

  return (
    <div className="w-full bg-[var(--sc-paper,#FAFAF7)] text-[var(--sc-ink,#111318)] min-h-dvh">
      {/* --------------------------------------------------------------------- */}
      {/* 1. HERO SECTION: Grounded, Comparison-Driven Headline                 */}
      {/* --------------------------------------------------------------------- */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column (Hero Copy & Interactive Name Claim) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div
              suppressHydrationWarning
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-xs text-[var(--sc-ink-2,#4B5060)] shadow-2xs"
            >
              <span
                className="w-2 h-2 rounded-full bg-[var(--sc-marigold,#F2A900)] inline-block animate-pulse"
                aria-hidden="true"
              />
              <span suppressHydrationWarning className="font-medium">
                NEPAL-FIRST COMMERCE OS · ZERO USD DOLLAR CARD REQUIRED
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-[50px] font-extrabold tracking-tight leading-[1.12] text-[var(--sc-ink,#111318)]">
                Why pay $39/mo for Shopify when it doesn&apos;t even know what a Ward is?
              </h1>
              <p className="text-base sm:text-lg text-[var(--sc-ink-2,#4B5060)] max-w-xl leading-relaxed">
                Launch your independent online store in 2 minutes. Native Khalti sandbox payments, Cash on Delivery with collection guards, Province-to-Ward cascading checkout, and recurring subscriptions built for Nepal&apos;s zero auto-debit banking.
              </p>
            </div>

            {/* Interactive Hero Input: Claim Your Store Name */}
            <form onSubmit={handleStartFree} className="space-y-4 max-w-lg">
              <div className="space-y-1.5">
                <label
                  htmlFor="hero-store-name"
                  className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] font-medium"
                >
                  Enter your store name
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="hero-store-name"
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Pahadi Honey, Pokhara Crafts..."
                    className="flex-1 h-12 px-4 rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-sm font-medium text-[var(--sc-ink,#111318)] focus:outline-hidden focus:border-[var(--sc-marigold,#F2A900)] focus:ring-1 focus:ring-[var(--sc-marigold,#F2A900)] transition-colors"
                  />
                  <button
                    type="submit"
                    className="h-12 px-6 rounded-lg bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] font-semibold text-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Launch Free Store</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Live URL Ghost */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--sc-ink-2,#4B5060)] font-mono pt-1">
                <span className="text-[var(--sc-ink-3,#8B90A0)]">Live Storefront:</span>
                <span className="text-[var(--sc-ink,#111318)] font-semibold relative">
                  shopcraft.com.np/s/{slug}
                </span>
                {slugStatus === "checking" ? (
                  <span className="text-zinc-500 text-[11px] font-sans font-medium ml-2 animate-pulse">
                    checking...
                  </span>
                ) : slugStatus === "available" ? (
                  <span className="text-[var(--sc-success,#15803D)] text-[11px] font-sans font-medium ml-2">
                    ✓ available
                  </span>
                ) : (
                  <span className="text-red-600 text-[11px] font-sans font-medium ml-2">
                    ✕ taken
                  </span>
                )}
              </div>
            </form>

            {/* Quick Proof Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[var(--sc-ink-2,#4B5060)]">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="text-red-500 font-bold">✕</span> No $39/mo USD card fees
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4 text-[var(--sc-success,#15803D)] stroke-[3]" /> Day-one Khalti &amp; COD
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4 text-[var(--sc-success,#15803D)] stroke-[3]" /> 7 Provinces &amp; Ward checkout
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4 text-[var(--sc-success,#15803D)] stroke-[3]" /> 0.8s mobile speed on 4G
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Phone Simulator */}
          <div className="lg:col-span-5 flex justify-center">
            <HeroStorePreview />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 2. THE DIRECT SHOPIFY & INSTAGRAM COMPARISON MATRIX                   */}
      {/* --------------------------------------------------------------------- */}
      <section className="border-t border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--sc-marigold,#F2A900)]">
              THE HONEST BREAKDOWN
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--sc-ink,#111318)]">
              How ShopCraft Compares to Shopify &amp; Instagram
            </h2>
            <p className="text-sm sm:text-base text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
              Global platforms fail in Nepal because they assume US credit cards, automated auto-debits, and 5-digit Zip Codes. Here is why Nepali merchants lose customers on foreign platforms.
            </p>
          </div>

          <ShopifyComparisonTable />
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 3. THE TWO CHECKOUTS: VISUAL WALKTHROUGH                              */}
      {/* --------------------------------------------------------------------- */}
      <section className="border-t border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-paper,#FAFAF7)] py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-600">
              WHERE SALES ARE LOST
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--sc-ink,#111318)]">
              The Two Checkouts: Why 50%+ of Nepali Shoppers Drop Off
            </h2>
            <p className="text-sm text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
              Compare the customer checkout experience when someone taps your link from an Instagram ad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: The Shopify Checkout in Nepal (Broken Experience) */}
            <div className="rounded-2xl border-2 border-red-200 bg-red-50/30 p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-red-200">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-red-100 text-red-700">
                    <ShieldAlert className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-base text-zinc-900">Shopify in Nepal</h3>
                    <p className="text-xs text-red-700 font-mono">High abandonment rate (~55%)</p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-200 text-red-800 font-bold">
                  BROKEN UX
                </span>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-zinc-700">
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 p-0.5 rounded-full bg-red-200 text-red-800 shrink-0">
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <div>
                    <strong className="text-zinc-900 block">Forces 5-digit &quot;Postal / Zip Code&quot;</strong>
                    Nepali shoppers don&apos;t have zip codes. They enter &quot;00977&quot; or fake numbers. Couriers and riders have zero idea where to deliver.
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 p-0.5 rounded-full bg-red-200 text-red-800 shrink-0">
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <div>
                    <strong className="text-zinc-900 block">No Native Khalti or eSewa</strong>
                    Shoppers see a US Stripe credit card form. Domestic debit cards fail. Shoppers leave the site without paying.
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 p-0.5 rounded-full bg-red-200 text-red-800 shrink-0">
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <div>
                    <strong className="text-zinc-900 block">Recurring Subscriptions Blocked</strong>
                    Nepal Rastra Bank blocks recurring auto-debit on debit cards. Subscription apps fail completely.
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 p-0.5 rounded-full bg-red-200 text-red-800 shrink-0">
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <div>
                    <strong className="text-zinc-900 block">$39/mo in USD from Your Bank Card</strong>
                    Depletes your $500 annual Dollar Card limit just to keep your store online.
                  </div>
                </li>
              </ul>
            </div>

            {/* Right: The ShopCraft Checkout in Nepal (Tailored Experience) */}
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/30 p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-base text-zinc-900">ShopCraft in Nepal</h3>
                    <p className="text-xs text-emerald-800 font-mono">High conversion rate (&gt;88%)</p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold">
                  NATIVE FLOW
                </span>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-zinc-700">
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 p-0.5 rounded-full bg-emerald-200 text-emerald-800 shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <div>
                    <strong className="text-zinc-900 block">Province (1–7) → District → Municipality → Ward (1–35)</strong>
                    Shoppers pick their exact local chowk, tole, and landmark in 3 taps. Courier riders get clear dispatch receipts.
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 p-0.5 rounded-full bg-emerald-200 text-emerald-800 shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <div>
                    <strong className="text-zinc-900 block">Instant Khalti Sandbox &amp; Verified COD</strong>
                    Direct web-wallet return redirects and Cash on Delivery with exact collection guards.
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 p-0.5 rounded-full bg-emerald-200 text-emerald-800 shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <div>
                    <strong className="text-zinc-900 block">Prepaid Cycles &amp; 1-Tap WhatsApp Renewals</strong>
                    Prepaid 3, 6, or 12 deliveries upfront, or automated fulfillment links without illegal recurring bank debits.
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 p-0.5 rounded-full bg-emerald-200 text-emerald-800 shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <div>
                    <strong className="text-zinc-900 block">Rs. 0 Monthly Platform Fee</strong>
                    No USD card needed. Zero monthly hosting bills. You keep 100% of your product margins.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 4. CORE ARCHITECTURAL PILLARS                                         */}
      {/* --------------------------------------------------------------------- */}
      <section className="border-t border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--sc-ink,#111318)]">
              Engineered for how Nepal shops and ships.
            </h2>
            <p className="text-sm text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
              Every detail is calibrated for local courier riders, mobile networks, and domestic banking realities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1: Nepali Addresses */}
            <div className="rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-paper,#FAFAF7)] p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <MapPin className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-bold text-sm text-[var(--sc-ink,#111318)]">
                Nepali Address Engine
              </h3>
              <p className="text-xs text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
                Cascading Province, District, Municipality, and Ward selectors. Validates 10-digit 98/97 mobile numbers so riders never get lost.
              </p>
            </div>

            {/* Pillar 2: Dual Payments */}
            <div className="rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-paper,#FAFAF7)] p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <CreditCard className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-bold text-sm text-[var(--sc-ink,#111318)]">
                Khalti &amp; COD Built-In
              </h3>
              <p className="text-xs text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
                Accept digital payments via Khalti Sandbox or tactile Cash on Delivery. Server verifies payments with instant pidx idempotency.
              </p>
            </div>

            {/* Pillar 3: Subscriptions */}
            <div className="rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-paper,#FAFAF7)] p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Repeat className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-bold text-sm text-[var(--sc-ink,#111318)]">
                Himalayan Subscriptions
              </h3>
              <p className="text-xs text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
                Prepaid 3, 6, and 12-month commitments paid upfront. Automated engine generates $0 fulfillment orders on delivery cycles with zero re-charge friction.
              </p>
            </div>

            {/* Pillar 4: Merchant Tower */}
            <div className="rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-paper,#FAFAF7)] p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Package className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-bold text-sm text-[var(--sc-ink,#111318)]">
                Fulfillment Queue &amp; Undo
              </h3>
              <p className="text-xs text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
                Pack, ship, and deliver orders with a 5-second non-blocking undo. One-tap WhatsApp chat and phone dialing for direct customer contact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 5. MULTI-TENANT DEMO SHOWCASE                                        */}
      {/* --------------------------------------------------------------------- */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--sc-marigold,#F2A900)]">
              Multi-Tenant Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--sc-ink,#111318)] mt-1">
              Explore Live Demo Tenants
            </h2>
            <p className="text-xs text-[var(--sc-ink-2,#4B5060)] mt-1">
              Two distinct businesses running completely isolated on the same ShopCraft cloud core.
            </p>
          </div>

          <Link
            href="/merchant/new"
            className="text-xs font-mono font-semibold text-[var(--sc-ink,#111318)] hover:underline flex items-center gap-1"
          >
            <span>Launch your store →</span>
          </Link>
        </div>

        <DemoTenantShowcase />
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 6. GROUNDED CALL TO ACTION BAND                                      */}
      {/* --------------------------------------------------------------------- */}
      <section className="border-t border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--sc-ink,#111318)]">
              Ready to launch your shop in Nepal?
            </h2>
            <p className="text-xs sm:text-sm text-[var(--sc-ink-2,#4B5060)]">
              No dollar card, no technical setup. Your store is live before your chiya cools.
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
      {/* 7. FOOTER & ATTRIBUTION                                              */}
      {/* --------------------------------------------------------------------- */}
      <footer className="border-t border-[var(--sc-line,#E8E8E1)] py-12 bg-[var(--sc-paper,#FAFAF7)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[var(--sc-ink-2,#4B5060)]">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-extrabold text-sm tracking-tight text-[var(--sc-ink,#111318)]">
              ShopCraft
            </p>
            <p className="text-[11px] font-mono text-[var(--sc-ink-3,#8B90A0)]">
              Multi-Tenant E-Commerce &amp; Subscription Operating System for Nepal.
            </p>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <Link href="/s/brewmellow" className="hover:text-[var(--sc-ink,#111318)] transition-colors">
              BrewMellow Demo
            </Link>
            <Link href="/s/himalayan-artisans" className="hover:text-[var(--sc-ink,#111318)] transition-colors">
              Himalayan Artisans Demo
            </Link>
            <Link href="/merchant/new" className="hover:text-[var(--sc-ink,#111318)] transition-colors font-semibold">
              Create Store
            </Link>
          </div>

          <div className="text-center sm:text-right text-[11px] font-mono text-[var(--sc-ink-3,#8B90A0)]">
            <p>Capstone Design Fall 2026</p>
            <p>Ulsan College · Team 2</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
