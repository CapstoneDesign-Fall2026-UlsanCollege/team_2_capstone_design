"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  Repeat,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";

interface TenantPreviewData {
  slug: string;
  name: string;
  tagline: string;
  themePreset: string;
  accentColor: string;
  canvasColor: string;
  surfaceColor: string;
  inkColor: string;
  badgeText: string;
  sampleProduct: string;
  sampleVariant: string;
  priceFormatted: string;
  subscriptionText: string;
  sampleNotes: string[];
}

const PREVIEW_TENANTS: TenantPreviewData[] = [
  {
    slug: "brewmellow",
    name: "BrewMellow",
    tagline: "Specialty Himalayan Coffee",
    themePreset: "editorial-warm",
    accentColor: "#A3432A",
    canvasColor: "#F5F2EB",
    surfaceColor: "#FFFFFF",
    inkColor: "#2C221E",
    badgeText: "Single-Origin Micro-Lot",
    sampleProduct: "Gulmi Reserve",
    sampleVariant: "250g Whole Bean",
    priceFormatted: "Rs. 685",
    subscriptionText: "↻ Subscribe & Save 10%",
    sampleNotes: ["Dark Chocolate", "Himalayan Citrus", "Brown Sugar"],
  },
  {
    slug: "himalayan-artisans",
    name: "Himalayan Artisans",
    tagline: "Organic Tea & Wild Herbs",
    themePreset: "pahadi-sage",
    accentColor: "#2D5A43",
    canvasColor: "#F3F7F4",
    surfaceColor: "#FFFFFF",
    inkColor: "#1B3026",
    badgeText: "Organic Ilam First-Flush",
    sampleProduct: "Ilam Single-Estate Black Tea",
    sampleVariant: "250g Artisanal Tin",
    priceFormatted: "Rs. 855",
    subscriptionText: "↻ 3M Prepaid Season (10% off)",
    sampleNotes: ["Muscatel", "Wild Honey", "Roasted Malt"],
  },
];

export function HeroStorePreview() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tenant = PREVIEW_TENANTS[selectedIndex];
  const [purchaseType, setPurchaseType] = useState<"one_time" | "subscription">("subscription");

  return (
    <div className="relative w-full max-w-xl mx-auto flex items-center justify-center pt-2 sm:pt-4">
      {/* ------------------------------------------------------------------ */}
      {/* 1. DESKTOP MERCHANT DASHBOARD MOCKUP (Background Frame)            */}
      {/* ------------------------------------------------------------------ */}
      <div className="hidden sm:block absolute left-0 top-6 w-[430px] lg:w-[460px] rounded-2xl border border-[var(--sc-line,#E8E8E1)] bg-white shadow-xl overflow-hidden pointer-events-none select-none opacity-95 transition-all duration-300">
        {/* Mac OS Browser Chrome Top Bar */}
        <div className="h-8 bg-zinc-100 border-b border-zinc-200 px-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="text-[10px] font-mono text-zinc-500 bg-white px-3 py-0.5 rounded border border-zinc-200">
            shopcraft.com.np/merchant/{tenant.slug}
          </div>
          <div className="w-10" />
        </div>

        {/* Dashboard Shell Grid: Dark Green Sidebar + Workspace */}
        <div className="grid grid-cols-12 min-h-[360px] bg-zinc-50">
          {/* Mini Sidebar */}
          <div className="col-span-3 bg-[#0F2D1F] text-zinc-300 p-3 space-y-3 flex flex-col justify-between text-[10px] font-mono">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-white font-bold pb-2 border-b border-white/10">
                <span className="text-xs">⛰️</span>
                <span className="tracking-tight text-[11px]">ShopCraft</span>
              </div>
              <div className="space-y-1">
                <div className="px-2 py-1 rounded bg-white/15 text-white font-semibold flex items-center justify-between">
                  <span>Overview</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="px-2 py-1 rounded text-zinc-400 hover:text-white flex items-center justify-between">
                  <span>Orders</span>
                  <span className="text-[9px] bg-white/10 px-1 rounded">18</span>
                </div>
                <div className="px-2 py-1 rounded text-zinc-400 hover:text-white">Products</div>
                <div className="px-2 py-1 rounded text-zinc-400 hover:text-white flex items-center justify-between">
                  <span>Subscribers</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded">24</span>
                </div>
                <div className="px-2 py-1 rounded text-zinc-400 hover:text-white">Settings</div>
              </div>
            </div>
            <div className="text-[9px] text-zinc-400 pt-2 border-t border-white/10">
              🇳🇵 Kathmandu, NP
            </div>
          </div>

          {/* Mini Dashboard Workspace */}
          <div className="col-span-9 p-4 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-200">
              <div>
                <p className="font-extrabold text-xs text-zinc-900 tracking-tight">Merchant Workspace</p>
                <p className="text-[9px] font-mono text-zinc-500">{tenant.name} · Live Store</p>
              </div>
              <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                ● Live 99.9%
              </span>
            </div>

            {/* Metric Tiles Row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2.5 rounded-xl border border-zinc-200 shadow-2xs space-y-0.5">
                <span className="text-[9px] font-mono text-zinc-500 block">Today&apos;s Sales</span>
                <span className="text-sm font-extrabold font-mono text-zinc-900">Rs. 42,500</span>
                <span className="text-[8px] font-mono text-emerald-600 block flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> +18.4% today
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-zinc-200 shadow-2xs space-y-0.5">
                <span className="text-[9px] font-mono text-zinc-500 block">Orders Today</span>
                <span className="text-sm font-extrabold font-mono text-zinc-900">18 Orders</span>
                <span className="text-[8px] font-mono text-purple-600 block">12 Khalti · 6 COD</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-zinc-200 shadow-2xs space-y-0.5">
                <span className="text-[9px] font-mono text-zinc-500 block">Monthly MRR</span>
                <span className="text-sm font-extrabold font-mono text-zinc-900">Rs. 38,400</span>
                <span className="text-[8px] font-mono text-blue-600 block">24 Active Clubs</span>
              </div>
            </div>

            {/* Orders Queue Peek */}
            <div className="bg-white rounded-xl border border-zinc-200 p-2.5 space-y-1.5 shadow-2xs">
              <span className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-wider block">
                Recent Orders Queue (5s Undo)
              </span>
              <div className="space-y-1 text-[9px] font-mono">
                <div className="flex items-center justify-between p-1 rounded bg-zinc-50 border border-zinc-100">
                  <span className="font-semibold text-zinc-900">#BM-1042 · Gulmi Reserve</span>
                  <span className="text-zinc-600">Patan Ward 4</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">PAID (Khalti)</span>
                </div>
                <div className="flex items-center justify-between p-1 rounded bg-zinc-50 border border-zinc-100">
                  <span className="font-semibold text-zinc-900">#HA-2089 · Ilam Orthodox</span>
                  <span className="text-zinc-600">Baluwatar Ward 3</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">COD PENDING</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. OVERLAID SMARTPHONE STOREFRONT SIMULATOR (Foreground)           */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative z-10 sm:ml-auto flex flex-col items-center">
        {/* Store Switcher Pill */}
        <div className="flex items-center gap-1.5 p-1 mb-3 rounded-full bg-white/95 backdrop-blur-sm border border-[var(--sc-line,#E8E8E1)] shadow-md">
          {PREVIEW_TENANTS.map((t, idx) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedIndex === idx
                  ? "bg-[#C2410C] text-white font-semibold shadow-xs"
                  : "text-[var(--sc-ink-2,#4B5060)] hover:text-[var(--sc-ink,#111318)]"
              }`}
            >
              <span>{idx === 0 ? "☕" : "🍃"}</span>
              <span>{t.name}</span>
            </button>
          ))}
        </div>

        {/* Smartphone Hardware Frame */}
        <div className="w-[290px] sm:w-[310px] rounded-[36px] border-[6px] border-zinc-950 bg-zinc-950 shadow-2xl overflow-hidden transition-all duration-300">
          {/* Dynamic Island / Top Notch */}
          <div className="h-5 bg-zinc-950 flex justify-center items-center">
            <div className="w-16 h-1 bg-zinc-700/60 rounded-full" />
          </div>

          {/* Live Themed Storefront Screen */}
          <div
            style={{ backgroundColor: tenant.canvasColor, color: tenant.inkColor }}
            className="p-3.5 space-y-3 min-h-[440px] flex flex-col justify-between font-sans transition-colors duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-black/10">
              <div>
                <p className="font-extrabold text-sm tracking-tight">{tenant.name}</p>
                <p className="text-[10px] opacity-75 font-mono">{tenant.tagline}</p>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/80 border border-black/10 flex items-center justify-center text-xs shadow-xs">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Featured Product Card */}
            <div className="rounded-xl bg-white p-3 shadow-xs border border-black/5 space-y-2">
              <div className="flex items-center justify-between">
                <span
                  style={{ backgroundColor: `${tenant.accentColor}18`, color: tenant.accentColor }}
                  className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                >
                  {tenant.badgeText}
                </span>
                <span className="text-[9px] text-zinc-600 font-mono flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  In Stock · 24h
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm leading-tight text-zinc-900">{tenant.sampleProduct}</h4>
                <p className="text-[11px] text-zinc-600 font-mono pt-0.5">{tenant.sampleVariant}</p>
              </div>

              {/* Flavor Profile Badges */}
              <div className="flex flex-wrap gap-1">
                {tenant.sampleNotes.map((note) => (
                  <span
                    key={note}
                    className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200"
                  >
                    {note}
                  </span>
                ))}
              </div>

              {/* One-Time vs Subscribe Switcher */}
              <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-zinc-100 text-[9px] font-mono">
                <button
                  type="button"
                  onClick={() => setPurchaseType("one_time")}
                  className={`py-1 rounded text-center transition-all cursor-pointer ${
                    purchaseType === "one_time"
                      ? "bg-white font-bold text-zinc-900 shadow-xs"
                      : "text-zinc-600"
                  }`}
                >
                  One-time
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseType("subscription")}
                  className={`py-1 rounded text-center transition-all cursor-pointer ${
                    purchaseType === "subscription"
                      ? "bg-white font-bold text-zinc-900 shadow-xs"
                      : "text-zinc-600"
                  }`}
                >
                  Subscribe
                </button>
              </div>

              {/* Price Preview */}
              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-sm font-extrabold font-mono text-zinc-900">
                  {tenant.priceFormatted}
                </span>
                <span className="text-[9px] font-mono font-semibold text-emerald-600">
                  {purchaseType === "subscription" ? tenant.subscriptionText : "Standard order"}
                </span>
              </div>
            </div>

            {/* Add to Bag CTA */}
            <div className="space-y-1.5 pt-0.5">
              <button
                type="button"
                style={{ backgroundColor: tenant.accentColor }}
                className="w-full py-2.5 rounded-xl text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99] transition-transform cursor-pointer"
              >
                <span>Add to Cart · {tenant.priceFormatted}</span>
              </button>

              <Link
                href={`/s/${tenant.slug}`}
                target="_blank"
                className="block text-center text-[10px] font-mono text-zinc-600 hover:text-zinc-900 transition-colors underline decoration-dotted"
              >
                Open live storefront in new tab →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
