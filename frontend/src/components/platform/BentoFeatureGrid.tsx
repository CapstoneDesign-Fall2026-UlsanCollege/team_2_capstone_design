"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Truck,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  Printer,
  Palette,
} from "lucide-react";

export function BentoFeatureGrid() {
  const [activeTheme, setActiveTheme] = useState<"editorial" | "sage" | "ktm" | "obsidian">("editorial");
  const [simulatedStatus, setSimulatedStatus] = useState<"idle" | "verifying" | "paid">("idle");

  const handleSimulatePayment = () => {
    setSimulatedStatus("verifying");
    setTimeout(() => {
      setSimulatedStatus("paid");
      setTimeout(() => setSimulatedStatus("idle"), 3000);
    }, 1000);
  };

  const THEMES = {
    editorial: { name: "Editorial Warm", dot: "#A3432A", bg: "#F5F2EB", text: "#1A1512", font: "Serif" },
    sage: { name: "Pahadi Sage", dot: "#1F6F4A", bg: "#F3F7F4", text: "#0F241B", font: "Clean Sans" },
    ktm: { name: "KTM Bold", dot: "#2B3BFF", bg: "#F4F4F0", text: "#0B0B0B", font: "Grotesk" },
    obsidian: { name: "Midnight Obsidian", dot: "#F59E0B", bg: "#0B0D11", text: "#F9FAFB", font: "Mono Dark" },
  };

  return (
    <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header - Ultra Clean & Punchy */}
      <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>NEPAL-NATIVE INFRASTRUCTURE</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
          Built for how Nepal buys.
        </h2>
        <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 font-sans">
          Zero USD credit cards. Native Khalti. Cash on Delivery. Automated Pathao slips.
        </p>
      </div>

      {/* Asymmetric Bento Grid - Visual-First */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        
        {/* =================================================================== */}
        {/* CARD 1 (Span 2 cols): Native Khalti & COD                           */}
        {/* =================================================================== */}
        <div className="md:col-span-2 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              <CreditCard className="w-4 h-4" />
              <span>Payments</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Instant Khalti Web Wallet &amp; Verified COD
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Settles directly to Nabil, NIC Asia, or Global IME. 0% COD platform fees.
            </p>
          </div>

          {/* Interactive Mini-Widget */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Khalti Card */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  Khalti ePayment
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                  1-Tap PIN
                </span>
              </div>
              <button
                type="button"
                onClick={handleSimulatePayment}
                className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
              >
                {simulatedStatus === "idle" && (
                  <>
                    <span>Test Khalti Flow (Rs. 1,450)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
                {simulatedStatus === "verifying" && (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Verifying PIDX...</span>
                  </>
                )}
                {simulatedStatus === "paid" && (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Paid! Receipt Sent</span>
                  </>
                )}
              </button>
            </div>

            {/* COD Card */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Cash on Delivery
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  Verified Mobile
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-300 py-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>98XXXXXXXX phone confirmation</span>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* CARD 2: Direct WhatsApp Concierge                                   */}
        {/* =================================================================== */}
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <MessageCircle className="w-4 h-4" />
              <span>Communication</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Direct WhatsApp Concierge
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Instant 1-click customer chats and order status links right on WhatsApp.
            </p>
          </div>

          {/* Visual Chat Pills */}
          <div className="mt-6 space-y-2">
            <div className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-zinc-900 dark:text-white">Order Confirmed</span>
              <span className="text-emerald-600 font-bold">1-Click Chat</span>
            </div>
            <div className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-zinc-900 dark:text-white">Courier Out For Delivery</span>
              <span className="text-blue-600 font-bold">Live Tracking</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 text-center pt-1">
              99.2% on-time delivery communication
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* CARD 3: Pathao Courier Slips                                        */}
        {/* =================================================================== */}
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Truck className="w-4 h-4" />
              <span>Logistics</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              1-Click Courier Slips
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Instant 4x6&quot; thermal labels formatted for Pathao &amp; local riders.
            </p>
          </div>

          {/* Mini Visual Thermal Label */}
          <div className="mt-6 p-3 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 font-mono text-[11px] space-y-1">
            <div className="flex justify-between font-bold text-zinc-900 dark:text-white">
              <span>PATHAO WAYBILL</span>
              <span className="text-emerald-600">#PTH-8920</span>
            </div>
            <div className="text-zinc-500 dark:text-zinc-400 text-[10px]">
              Ward 03, Lazimpat · KTM
            </div>
            <div className="pt-1 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-bold text-zinc-900 dark:text-white">
              <span>COD AMOUNT:</span>
              <span>Rs. 1,650</span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* CARD 4 (Span 2 cols): Theme Engine with 4 Swatches                  */}
        {/* =================================================================== */}
        <div className="md:col-span-2 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Palette className="w-4 h-4" />
              <span>Theming</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              4 Distinct Brand Presets
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Zero coding. Switch fonts, colors, and radii instantly.
            </p>
          </div>

          {/* Micro Swatch Selector */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Object.entries(THEMES).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTheme(key as any)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  activeTheme === key
                    ? "border-zinc-900 dark:border-white ring-2 ring-zinc-900/10 dark:ring-white/20 shadow-xs"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
                style={{ backgroundColor: item.bg, color: item.text }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.dot }} />
                  <span className="text-xs font-bold truncate">{item.name}</span>
                </div>
                <div className="text-[10px] opacity-70 font-mono">{item.font}</div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
