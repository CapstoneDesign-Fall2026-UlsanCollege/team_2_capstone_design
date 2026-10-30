"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  Check,
  CreditCard,
  MapPin,
  Package,
  Phone,
  Repeat,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { HeroStorePreview } from "@/components/platform/HeroStorePreview";
import { DemoTenantShowcase } from "@/components/platform/DemoTenantShowcase";

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

  const slug = slugify(storeName) || "your-shop";

  const handleStartFree = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/merchant/new?name=${encodeURIComponent(storeName.trim() || "My Store")}`);
  };

  return (
    <div className="w-full bg-[var(--sc-paper,#FAFAF7)] text-[var(--sc-ink,#111318)] min-h-dvh">
      {/* --------------------------------------------------------------------- */}
      {/* 1. HERO SECTION                                                       */}
      {/* --------------------------------------------------------------------- */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column (Hero Copy & Interactive Name Claim) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-xs text-[var(--sc-ink-2,#4B5060)] shadow-2xs">
              <span
                className="w-2 h-2 rounded-full bg-[var(--sc-marigold,#F2A900)] inline-block animate-pulse"
                aria-hidden="true"
              />
              <span className="font-medium">Nepal&apos;s Multi-Tenant E-Commerce &amp; Subscription OS</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.12] text-[var(--sc-ink,#111318)]">
                The Shopify for Nepal.
              </h1>
              <p className="text-base sm:text-lg text-[var(--sc-ink-2,#4B5060)] max-w-xl leading-relaxed">
                Launch your branded online store in 2 minutes with recurring subscriptions, Khalti sandbox payments, Cash on Delivery, and native Nepali address checkout.
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
                    <span>Launch Store</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Live URL Ghost */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--sc-ink-2,#4B5060)] font-mono pt-1">
                <span className="text-[var(--sc-ink-3,#8B90A0)]">Store URL:</span>
                <span className="text-[var(--sc-ink,#111318)] font-semibold relative">
                  shopcraft.com.np/s/{slug}
                </span>
                <span className="text-[var(--sc-success,#15803D)] text-[11px] font-sans font-medium ml-2">
                  ✓ available
                </span>
              </div>
            </form>

            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-[var(--sc-ink-2,#4B5060)]">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[var(--sc-success,#15803D)]" /> Zero monthly platform fees
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[var(--sc-success,#15803D)]" /> Khalti Sandbox ready
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[var(--sc-success,#15803D)]" /> Cash on Delivery guard
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
      {/* 2. CORE PILLARS FOR NEPAL COMMERCE                                   */}
      {/* --------------------------------------------------------------------- */}
      <section className="border-y border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--sc-ink,#111318)]">
              Engineered for how Nepal shops and ships.
            </h2>
            <p className="text-sm text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
              Global platforms break on Nepali addresses and wallets. ShopCraft is custom-built for local reality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1: Nepali Addresses */}
            <div className="rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-paper,#FAFAF7)] p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
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
              <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center justify-center">
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
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center">
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
              <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
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
      {/* 3. MULTI-TENANT DEMO SHOWCASE                                        */}
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
      {/* 4. PLATFORM COMPARISON                                               */}
      {/* --------------------------------------------------------------------- */}
      <section className="border-t border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--sc-ink,#111318)]">
              Why Nepali brands choose ShopCraft
            </h2>
            <p className="text-xs text-[var(--sc-ink-2,#4B5060)]">
              Designed from first principles for Nepal&apos;s domestic e-commerce environment.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-paper,#FAFAF7)] overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--sc-line,#E8E8E1)] bg-zinc-100/60 font-mono text-[11px] uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)]">
                  <th className="p-3.5 font-medium">Feature</th>
                  <th className="p-3.5 font-bold text-[var(--sc-ink,#111318)]">ShopCraft</th>
                  <th className="p-3.5 font-medium text-zinc-600">Shopify / WooCommerce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sc-line,#E8E8E1)]">
                <tr>
                  <td className="p-3.5 font-medium text-[var(--sc-ink,#111318)]">Local Nepali Payments</td>
                  <td className="p-3.5 font-mono text-emerald-700 font-semibold">✓ Khalti Sandbox &amp; COD</td>
                  <td className="p-3.5 text-zinc-600">Requires expensive plugins or US Stripe</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-[var(--sc-ink,#111318)]">Nepali Address Picker</td>
                  <td className="p-3.5 font-mono text-emerald-700 font-semibold">✓ 7 Provinces, Wards, Landmarks</td>
                  <td className="p-3.5 text-zinc-600">US ZIP-code assumption breaks checkout</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-[var(--sc-ink,#111318)]">Recurring Subscriptions</td>
                  <td className="p-3.5 font-mono text-emerald-700 font-semibold">✓ Prepaid 3/6/12M &amp; Pay-per-delivery</td>
                  <td className="p-3.5 text-zinc-600">Requires NRB bank acquiring contracts</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-[var(--sc-ink,#111318)]">Monthly Platform Fees</td>
                  <td className="p-3.5 font-mono text-emerald-700 font-semibold">✓ Free during beta</td>
                  <td className="p-3.5 text-zinc-600">$39/mo + payment transaction fees</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 5. FOOTER & ATTRIBUTION                                              */}
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
