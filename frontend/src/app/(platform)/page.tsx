"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Sparkles, Store } from "lucide-react";
import { DashboardMockupPreview } from "@/components/platform/DashboardMockupPreview";
import { WorkflowSection } from "@/components/platform/WorkflowSection";
import { CapabilityMatrix } from "@/components/platform/CapabilityMatrix";
import { ThemeTemplateStudio } from "@/components/platform/ThemeTemplateStudio";
import { PlatformFaq } from "@/components/platform/PlatformFaq";
import { PlatformFooter } from "@/components/platform/PlatformFooter";

export default function PlatformHomePage() {
  const [storeSlugInput, setStoreSlugInput] = useState("");

  const handleStartFree = (e: React.FormEvent) => {
    e.preventDefault();
    const target = storeSlugInput.trim() ? `/signup?name=${encodeURIComponent(storeSlugInput.trim())}` : "/signup";
    window.location.href = target;
  };

  return (
    <div className="relative w-full min-h-screen bg-[#FAF7F2] dark:bg-[#0d0d0e] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-900 dark:selection:bg-white selection:text-white dark:selection:text-zinc-950 overflow-x-hidden transition-colors duration-200">
      
      {/* ===================================================================== */}
      {/* BACKGROUND VISUALS (Diagonal Grid Lines + Glowing Accent Slashes)     */}
      {/* ===================================================================== */}
      
      {/* 1. Subtle Dotted / Angled Grid */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-60 dark:opacity-100"
        style={{
          backgroundImage: "radial-gradient(rgba(120, 119, 198, 0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(to bottom, black 40%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 95%)",
        }}
      />

      {/* 2. Diagonal Angled Lines Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-30 dark:opacity-40"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg, rgba(120, 119, 198, 0.04) 0, rgba(120, 119, 198, 0.04) 1px, transparent 0, transparent 40px)",
        }}
      />

      {/* 3. Glowing Diagonal Accent Slashes: Warm Amber & Subtle Green */}
      <div className="absolute top-16 left-1/2 -translate-x-3/4 w-[500px] h-[500px] bg-gradient-to-tr from-amber-500/15 via-amber-600/5 to-transparent rounded-full blur-3xl pointer-events-none transform -rotate-45" />
      <div className="absolute top-32 left-1/2 translate-x-1/4 w-[550px] h-[550px] bg-gradient-to-bl from-emerald-500/15 via-teal-600/5 to-transparent rounded-full blur-3xl pointer-events-none transform rotate-45" />

      {/* ===================================================================== */}
      {/* 1. HERO SECTION                                                       */}
      {/* ===================================================================== */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        
        {/* Subtle Announcement Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/40 mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Hosted Commerce Platform for Nepal</span>
          <span className="text-zinc-400 dark:text-zinc-600">·</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% NPR</span>
        </div>

        {/* Massive Bold Display Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-zinc-900 dark:text-white max-w-4xl mx-auto leading-[1.08]">
          Launch your online storefront with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-400">
            ShopCraft
          </span>
        </h1>

        {/* Subheading */}
        <p className="mt-6 text-base sm:text-xl text-zinc-600 dark:text-zinc-400 font-sans max-w-2xl mx-auto leading-relaxed">
          The mobile-first commerce and subscription engine for Nepal. Set up your catalog, manage grind and size variants, and publish a hosted storefront in minutes.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-sm transition-all active:scale-95 shadow-xl shadow-zinc-900/10 dark:shadow-white/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Start for Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 font-semibold text-sm transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          >
            <span>Login</span>
          </Link>
        </div>

        {/* Micro-trust cues */}
        <div className="mt-5 flex items-center justify-center gap-5 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          <span>✓ 14-Day Free Trial</span>
          <span>✓ No Credit Card Required</span>
          <span>✓ Khalti &amp; COD Ready</span>
        </div>

        {/* Framed Perspective Screenshot Mockup Preview */}
        <DashboardMockupPreview />

      </section>

      {/* ===================================================================== */}
      {/* 2. WORKFLOW / STEP PROGRESSION                                        */}
      {/* ===================================================================== */}
      <WorkflowSection />

      {/* ===================================================================== */}
      {/* 3. CAPABILITY MATRIX / 6 OPERATING AREAS                              */}
      {/* ===================================================================== */}
      <CapabilityMatrix />

      {/* ===================================================================== */}
      {/* 4. PURE STORE & MERCHANT CONSOLE TEMPLATE STUDIO                      */}
      {/* ===================================================================== */}
      <ThemeTemplateStudio />

      {/* ===================================================================== */}
      {/* 5. PRICING SECTION (Transparent NPR Tiers)                           */}
      {/* ===================================================================== */}
      <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-zinc-200 dark:border-white/5 scroll-mt-20">
        <div className="text-center mb-16 space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full inline-block">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
            Plans built for Nepal
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-sans">
            Start free. Upgrade as your order volume scales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Growth Plan */}
          <div className="p-8 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#141416] flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-zinc-500 dark:text-zinc-400">Growth Plan</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300">14-Day Trial</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black font-mono text-zinc-900 dark:text-white">Rs. 999</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">/ month</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                Everything you need to launch a hosted storefront and manage everyday products.
              </p>
              <ul className="space-y-2.5 pt-4 border-t border-zinc-200 dark:border-white/10 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>Up to 100 products &amp; variants</span></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>Hosted storefront subdomain</span></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>Khalti &amp; Cash on Delivery checkout</span></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>1-click Pathao courier waybills</span></li>
              </ul>
            </div>
            <Link
              href="/signup?plan=growth"
              className="mt-8 w-full py-3 rounded-full border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white hover:bg-zinc-950 dark:hover:bg-white hover:text-white dark:hover:text-zinc-950 font-bold text-xs text-center font-mono transition-all shadow-sm"
            >
              Start for Free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="p-8 rounded-3xl border-2 border-emerald-500 bg-emerald-500/5 dark:bg-[#161619] flex flex-col justify-between shadow-2xl relative">
            <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-mono font-bold uppercase tracking-wider">
              RECOMMENDED
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400">Pro Plan</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">High Volume</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black font-mono text-zinc-900 dark:text-white">Rs. 2,499</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">/ month</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                Full power for established roasteries, tea estates, and apparel brands.
              </p>
              <ul className="space-y-2.5 pt-4 border-t border-zinc-200 dark:border-white/10 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>Unlimited products &amp; orders</span></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>Custom .com.np / .com domain with SSL</span></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>Non-recurring repeat subscriptions</span></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>Staff accounts with role-based permissions</span></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>Automated SMS &amp; WhatsApp customer notices</span></li>
              </ul>
            </div>
            <Link
              href="/signup?plan=pro"
              className="mt-8 w-full py-3 rounded-full bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs text-center font-mono transition-all shadow-md active:scale-95"
            >
              Start 14-Day Free Trial →
            </Link>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. FAQ ACCORDION                                                      */}
      {/* ===================================================================== */}
      <PlatformFaq />

      {/* ===================================================================== */}
      {/* 7. FINAL READY CTA BANNER                                             */}
      {/* ===================================================================== */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center border-t border-zinc-200 dark:border-white/5">
        <div className="space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
            Ready to set up your storefront?
          </h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400 font-sans max-w-xl mx-auto">
            Join growing Nepali brands selling coffee, tea, apparel, and consumables online with ShopCraft.
          </p>

          <form
            onSubmit={handleStartFree}
            className="max-w-md mx-auto pt-2 flex flex-col sm:flex-row gap-2.5"
          >
            <input
              type="text"
              value={storeSlugInput}
              onChange={(e) => setStoreSlugInput(e.target.value)}
              placeholder="Your brand name (e.g. Himalayan Roasters)..."
              className="flex-1 px-4 py-3 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 shadow-xs"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs font-mono hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Start for Free →
            </button>
          </form>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 8. CLEAN SYMMETRICAL FOOTER                                           */}
      {/* ===================================================================== */}
      <PlatformFooter />

    </div>
  );
}
