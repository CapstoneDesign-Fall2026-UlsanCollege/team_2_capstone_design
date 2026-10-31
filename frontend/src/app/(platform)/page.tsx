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
  HelpCircle,
  MapPin,
  Package,
  Phone,
  Repeat,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
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
      {/* 1. HERO SECTION: Bold, Warm, High-Converting Hero (Pasalify + ShopCraft) */}
      {/* --------------------------------------------------------------------- */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column (Hero Copy & Interactive Store Claim Form) */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-7">
            {/* National Badge */}
            <div
              suppressHydrationWarning
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-900/10 bg-[#0F2D1F] text-xs text-white shadow-2xs"
            >
              <span className="text-sm">🇳🇵</span>
              <span suppressHydrationWarning className="font-semibold tracking-wide text-[11px] uppercase">
                Built for Nepal&apos;s Merchants &amp; Creators
              </span>
            </div>

            {/* Clean Bold Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold tracking-tight leading-[1.12] text-[var(--sc-ink,#111318)]">
                Launch your online store in Nepal. <span className="text-[#C2410C]">For Free.</span>
              </h1>
              <p className="text-base sm:text-lg text-[var(--sc-ink-2,#4B5060)] max-w-xl leading-relaxed">
                The easiest multi-tenant e-commerce &amp; subscription platform. Pre-integrated with Khalti Sandbox, Cash on Delivery, and native Ward 1–35 delivery routing. No coding or USD Dollar Card required.
              </p>
            </div>

            {/* Interactive Hero Input: Claim Your Store Name */}
            <form onSubmit={handleStartFree} className="space-y-3.5 max-w-lg">
              <div className="space-y-1.5">
                <label
                  htmlFor="hero-store-name"
                  className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] font-semibold"
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
                    placeholder="e.g. Pahadi Goods, Mustang Honey..."
                    className="flex-1 h-12 px-4 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-white text-sm font-medium text-[var(--sc-ink,#111318)] focus:outline-hidden focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] transition-colors shadow-2xs"
                  />
                  <button
                    type="submit"
                    className="h-12 px-6 rounded-xl bg-[#C2410C] hover:bg-[#EA580C] text-white font-semibold text-sm active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Start Free Store →</span>
                  </button>
                </div>
              </div>

              {/* Live URL Ghost Indicator */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--sc-ink-2,#4B5060)] font-mono pt-0.5">
                <span className="text-zinc-500">Live URL:</span>
                <span className="text-zinc-900 font-semibold relative">
                  shopcraft.com.np/s/{slug}
                </span>
                {slugStatus === "checking" ? (
                  <span className="text-zinc-500 text-[11px] font-sans font-medium ml-2 animate-pulse">
                    checking...
                  </span>
                ) : slugStatus === "available" ? (
                  <span className="text-emerald-700 text-[11px] font-sans font-bold ml-2">
                    ✓ available
                  </span>
                ) : (
                  <span className="text-red-600 text-[11px] font-sans font-bold ml-2">
                    ✕ taken
                  </span>
                )}
              </div>
            </form>

            {/* Trust Subtext */}
            <p className="text-xs text-[var(--sc-ink-2,#4B5060)] pt-1">
              No credit card required. Free .com.np setup. 2-minute instant launch.
            </p>
          </div>

          {/* Right Column: Dual Device Mockup (Desktop Dashboard + Mobile Storefront) */}
          <div className="lg:col-span-6 flex justify-center">
            <HeroStorePreview />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 2. LOCAL PAYMENTS & LOGISTICS TRUST BANNER (Pasalify-Style)          */}
      {/* --------------------------------------------------------------------- */}
      <section className="border-y border-[var(--sc-line,#E8E8E1)] bg-white py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <p className="text-xs sm:text-sm font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] font-medium">
            Supported by Nepal&apos;s most popular local payments and delivery options:
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            {/* Khalti Badge */}
            <div className="px-5 py-2.5 rounded-xl border border-purple-200 bg-purple-50/60 flex items-center gap-2.5 shadow-2xs">
              <span className="w-6 h-6 rounded-md bg-[#5C2D91] text-white font-extrabold text-xs flex items-center justify-center">
                K
              </span>
              <span className="font-extrabold text-sm text-[#5C2D91]">khalti</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-200/60 text-purple-900 font-bold">
                SANDBOX
              </span>
            </div>

            {/* Cash on Delivery Badge */}
            <div className="px-5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center gap-2.5 shadow-2xs">
              <span className="w-6 h-6 rounded-md bg-emerald-700 text-white font-extrabold text-[11px] flex items-center justify-center">
                COD
              </span>
              <span className="font-extrabold text-sm text-emerald-800">Cash on Delivery</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-200/60 text-emerald-900 font-bold">
                VERIFIED
              </span>
            </div>

            {/* Nepali Geography Badge */}
            <div className="px-5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center gap-2 shadow-2xs">
              <span className="text-base">🛵</span>
              <span className="font-bold text-xs text-zinc-800">Valley &amp; Nationwide Riders</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/merchant/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C2410C] hover:bg-[#EA580C] text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <span>Create Your Store — Free Forever during Beta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 3. THREE CORE PILLARS (Clean, Grounded)                               */}
      {/* --------------------------------------------------------------------- */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1: Payments */}
          <div className="p-6 rounded-2xl border border-[var(--sc-line,#E8E8E1)] bg-white space-y-3 shadow-2xs hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-[var(--sc-ink,#111318)]">
              Integrated Local Payments
            </h3>
            <p className="text-xs sm:text-sm text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
              Instantly accept Khalti web wallet returns with verified pidx callbacks and tactile Cash on Delivery with ward-level dispatch receipts. Zero USD cards required.
            </p>
          </div>

          {/* Pillar 2: Delivery & Wards */}
          <div className="p-6 rounded-2xl border border-[var(--sc-line,#E8E8E1)] bg-white space-y-3 shadow-2xs hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-[var(--sc-ink,#111318)]">
              Local Delivery Routing
            </h3>
            <p className="text-xs sm:text-sm text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
              Native cascading Province (1–7), 77 Districts, Municipalities, and Wards 1–35. Automated Kathmandu Valley vs Outside Valley rates without generic zip code errors.
            </p>
          </div>

          {/* Pillar 3: Subscriptions */}
          <div className="p-6 rounded-2xl border border-[var(--sc-line,#E8E8E1)] bg-white space-y-3 shadow-2xs hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Repeat className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-[var(--sc-ink,#111318)]">
              Himalayan Recurring Subscriptions
            </h3>
            <p className="text-xs sm:text-sm text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
              Sell coffee, tea, honey, and skincare on prepaid 3, 6, or 12 delivery commitments. Automated engine generates $0 fulfillment orders with 1-tap WhatsApp renewal links.
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 4. THE DIRECT SHOPIFY & INSTAGRAM COMPARISON MATRIX                   */}
      {/* --------------------------------------------------------------------- */}
      <section id="comparison" className="border-t border-[var(--sc-line,#E8E8E1)] bg-white py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C2410C]">
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
      {/* 5. THE TWO CHECKOUTS: VISUAL SIDE-BY-SIDE WALKTHROUGH                 */}
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
              Compare what happens when a customer taps your link from Instagram or TikTok.
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
      {/* 6. MULTI-TENANT DEMO SHOWCASE                                        */}
      {/* --------------------------------------------------------------------- */}
      <section id="demos" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#C2410C]">
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
      {/* 7. TRANSPARENT PRICING PLANS (Pasalify-Inspired)                     */}
      {/* --------------------------------------------------------------------- */}
      <section id="pricing" className="border-t border-[var(--sc-line,#E8E8E1)] bg-white py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C2410C]">
              SIMPLE, HONEST PRICING
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--sc-ink,#111318)]">
              Start Free. Pay Nothing Until You Scale.
            </h2>
            <p className="text-sm text-[var(--sc-ink-2,#4B5060)]">
              No hidden currency conversion fees. No mandatory foreign credit cards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Beta / Starter Plan */}
            <div className="rounded-2xl border-2 border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-paper,#FAFAF7)] p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-200 text-zinc-800">
                    Starter / Beta
                  </span>
                  <span className="text-xs font-mono text-emerald-700 font-bold">100% Free</span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono text-zinc-950">Rs. 0</span>
                    <span className="text-xs text-zinc-500 font-mono">/ forever</span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">
                    Everything you need to launch and start selling across Nepal.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-zinc-700 pt-2 border-t border-zinc-200">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited products &amp; variants</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Native Khalti Sandbox + Cash on Delivery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Cascading 7 Provinces &amp; Ward checkout</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Prepaid subscriptions &amp; 1-tap WhatsApp renewal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Fulfillment queue with 5-second undo</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/merchant/new"
                className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs text-center block shadow-xs transition-colors"
              >
                Launch Free Store
              </Link>
            </div>

            {/* Growth Plan */}
            <div className="rounded-2xl border-2 border-[#C2410C] bg-white p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-md relative">
              <span className="absolute -top-3 right-6 text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#C2410C] text-white shadow-xs">
                POPULAR FOR SCALING BRANDS
              </span>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-100 text-[#C2410C]">
                    Growth
                  </span>
                  <span className="text-xs font-mono text-zinc-500">Billed Annually</span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono text-zinc-950">Rs. 999</span>
                    <span className="text-xs text-zinc-500 font-mono">/ month</span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">
                    For serious brands requiring automated SMS alerts &amp; custom domains.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-zinc-700 pt-2 border-t border-zinc-200">
                  <li className="flex items-center gap-2 font-medium text-zinc-950">
                    <Check className="w-4 h-4 text-[#C2410C] shrink-0" />
                    <span>Everything in Starter, plus:</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Custom domain (yourbrand.com.np)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Automated customer WhatsApp dispatch notifications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Multi-staff permissions &amp; role management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Live Khalti merchant keys &amp; settlement reporting</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/merchant/new"
                className="w-full py-3 rounded-xl bg-[#C2410C] hover:bg-[#EA580C] text-white font-semibold text-xs text-center block shadow-xs transition-colors"
              >
                Start 14-Day Pro Trial →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 8. GROUNDED CALL TO ACTION BAND                                      */}
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
              className="h-12 px-6 rounded-xl bg-[#C2410C] hover:bg-[#EA580C] text-white font-medium text-xs font-mono uppercase tracking-wider flex items-center justify-center transition-colors shadow-xs"
            >
              Launch Store Now →
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 9. FOOTER & ATTRIBUTION                                              */}
      {/* --------------------------------------------------------------------- */}
      <footer className="border-t border-[var(--sc-line,#E8E8E1)] py-12 bg-[var(--sc-paper,#FAFAF7)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[var(--sc-ink-2,#4B5060)]">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="w-5 h-5 rounded bg-[#0F2D1F] text-white text-[10px] flex items-center justify-center font-bold">
                ⛰️
              </span>
              <p className="font-extrabold text-sm tracking-tight text-[var(--sc-ink,#111318)]">
                ShopCraft
              </p>
            </div>
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
