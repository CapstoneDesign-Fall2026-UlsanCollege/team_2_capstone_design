"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  Repeat,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
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
  priceNumber: number;
  discountPriceFormatted: string;
  subscriptionText: string;
  origin: string;
  altitude: string;
  tastingNotes: string[];
}

const PREVIEW_TENANTS: TenantPreviewData[] = [
  {
    slug: "brewmellow",
    name: "BrewMellow",
    tagline: "Specialty Himalayan Micro-Lots",
    themePreset: "editorial-warm",
    accentColor: "#A3432A",
    canvasColor: "#F5F2EB",
    surfaceColor: "#FFFFFF",
    inkColor: "#2C221E",
    badgeText: "Single-Origin Micro-Lot",
    sampleProduct: "Gulmi Reserve Specialty Coffee",
    sampleVariant: "250g Whole Bean · Medium-Light Roast",
    priceFormatted: "Rs. 685",
    priceNumber: 685,
    discountPriceFormatted: "Rs. 616",
    subscriptionText: "↻ Subscribe & Save 10%",
    origin: "Gulmi, Western Nepal",
    altitude: "1,450m elevation",
    tastingNotes: ["Dark Chocolate", "Himalayan Citrus", "Brown Sugar"],
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
    sampleVariant: "250g Artisanal Tin · Spring Harvest",
    priceFormatted: "Rs. 855",
    priceNumber: 855,
    discountPriceFormatted: "Rs. 769",
    subscriptionText: "↻ 3M Prepaid Season (10% off)",
    origin: "Ilam, Eastern Nepal",
    altitude: "1,800m elevation",
    tastingNotes: ["Muscatel", "Wild Honey", "Roasted Malt"],
  },
];

export function HeroStorePreview() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tenant = PREVIEW_TENANTS[selectedIndex];
  const [purchaseType, setPurchaseType] = useState<"one_time" | "subscription">("subscription");
  const [mobileView, setMobileView] = useState<"storefront" | "console">("storefront");
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center justify-center">
      {/* Interactive Tenant Switcher */}
      <div className="flex items-center gap-1.5 p-1 mb-4 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200/80 shadow-xs text-xs">
        <span className="text-[11px] font-mono text-zinc-500 pl-2 pr-1 hidden sm:inline">Preview:</span>
        {PREVIEW_TENANTS.map((t, idx) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => {
              setSelectedIndex(idx);
              setAddedToCart(false);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedIndex === idx
                ? "bg-[#0F2D1F] text-white shadow-2xs font-semibold"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <span>{idx === 0 ? "☕" : "🍃"}</span>
            <span>{t.name}</span>
          </button>
        ))}
      </div>

      {/* Mobile-Only Device Switcher */}
      <div className="flex sm:hidden items-center gap-1 p-1 mb-4 rounded-full bg-zinc-200/70 border border-zinc-300 text-xs font-mono">
        <button
          type="button"
          onClick={() => setMobileView("storefront")}
          className={`px-3 py-1 rounded-full transition-all ${
            mobileView === "storefront"
              ? "bg-white font-bold text-zinc-950 shadow-xs"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          📱 Storefront
        </button>
        <button
          type="button"
          onClick={() => setMobileView("console")}
          className={`px-3 py-1 rounded-full transition-all ${
            mobileView === "console"
              ? "bg-white font-bold text-zinc-950 shadow-xs"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          💻 Merchant Console
        </button>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* DUAL-DEVICE SHOWCASE CONTAINER                                      */}
      {/* -------------------------------------------------------------------- */}
      <div className="relative w-full flex items-center justify-center min-h-[480px] sm:min-h-[510px]">
        {/* ------------------------------------------------------------------ */}
        {/* 1. DESKTOP MERCHANT DASHBOARD MOCKUP (Background Frame)            */}
        {/* ------------------------------------------------------------------ */}
        <div
          className={`${
            mobileView === "console" ? "block" : "hidden sm:block"
          } sm:absolute sm:left-0 sm:top-2 w-full sm:w-[450px] lg:w-[480px] rounded-2xl border border-zinc-200/90 bg-white shadow-xl shadow-zinc-950/5 overflow-hidden transition-all duration-300 select-none`}
        >
          {/* Mac OS Window Bar */}
          <div className="h-8 bg-zinc-100/95 border-b border-zinc-200/80 px-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
            </div>
            <div className="text-[10px] font-mono text-zinc-600 bg-white px-2.5 py-0.5 rounded border border-zinc-200 shadow-2xs flex items-center gap-1">
              <span className="text-[9px] opacity-60">🔒</span>
              <span>shopcraft.com.np/merchant/{tenant.slug}</span>
            </div>
            <span className="text-[9px] font-mono text-emerald-700 font-bold">● Live</span>
          </div>

          {/* Dashboard Shell Grid: Dark Forest Green Sidebar + Workspace */}
          <div className="grid grid-cols-12 min-h-[380px] bg-zinc-50/70">
            {/* Mini Sidebar */}
            <div className="col-span-3 bg-[#0F2D1F] text-zinc-300 p-3 space-y-3 flex flex-col justify-between text-[10px] font-mono">
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-white font-bold pb-2 border-b border-white/10">
                  <span className="text-xs">⛰️</span>
                  <span className="tracking-tight text-[11px]">ShopCraft</span>
                </div>
                <div className="space-y-1">
                  <div className="px-2 py-1 rounded bg-white/15 text-white font-semibold flex items-center justify-between shadow-2xs">
                    <span>Dashboard</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="px-2 py-1 rounded text-zinc-400 hover:text-white flex items-center justify-between">
                    <span>Orders</span>
                    <span className="text-[9px] bg-white/15 px-1 rounded text-white font-bold">18</span>
                  </div>
                  <div className="px-2 py-1 rounded text-zinc-400 hover:text-white flex items-center justify-between">
                    <span>Products</span>
                    <span className="text-[9px] text-zinc-400">6</span>
                  </div>
                  <div className="px-2 py-1 rounded text-zinc-400 hover:text-white flex items-center justify-between">
                    <span>Subscribers</span>
                    <span className="text-[9px] bg-emerald-500/25 text-emerald-300 px-1 rounded font-bold">24</span>
                  </div>
                  <div className="px-2 py-1 rounded text-zinc-400 hover:text-white">Settings</div>
                </div>
              </div>
              <div className="text-[9px] text-zinc-400 pt-2 border-t border-white/10 flex items-center gap-1">
                <span>🇳🇵</span>
                <span>Kathmandu, NP</span>
              </div>
            </div>

            {/* Mini Dashboard Workspace */}
            <div className="col-span-9 p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200">
                <div>
                  <p className="font-extrabold text-xs text-zinc-900 tracking-tight">Merchant Workspace</p>
                  <p className="text-[9px] font-mono text-zinc-500">{tenant.name} · Active Cloud Core</p>
                </div>
                <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  99.9% Uptime
                </span>
              </div>

              {/* Metric Tiles Row */}
              <div className="grid grid-cols-3 gap-2">
                {/* Metric 1: Today's Sales with SVG Spline */}
                <div className="bg-white p-2.5 rounded-xl border border-zinc-200 shadow-2xs space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 block">Today&apos;s Sales</span>
                  <span className="text-sm font-extrabold font-mono text-zinc-950 block">Rs. 42,500</span>
                  {/* Clean SVG Spline Wave Curve */}
                  <div className="h-5 w-full pt-1">
                    <svg className="w-full h-full text-emerald-600" viewBox="0 0 100 24" fill="none">
                      <path
                        d="M0 20 Q 20 22, 35 12 T 65 14 T 100 2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M0 20 Q 20 22, 35 12 T 65 14 T 100 2 L 100 24 L 0 24 Z"
                        fill="currentColor"
                        fillOpacity="0.12"
                      />
                    </svg>
                  </div>
                  <span className="text-[8px] font-mono text-emerald-700 block flex items-center gap-0.5 font-semibold">
                    <TrendingUp className="w-2.5 h-2.5" /> +18.4% today
                  </span>
                </div>

                {/* Metric 2: Orders Trend with Vertical Bar Graph */}
                <div className="bg-white p-2.5 rounded-xl border border-zinc-200 shadow-2xs space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 block">Orders Today</span>
                  <span className="text-sm font-extrabold font-mono text-zinc-950 block">18 Orders</span>
                  {/* Styled Bar Graph */}
                  <div className="flex items-end gap-1 h-5 pt-1">
                    <div className="w-2 bg-zinc-200 h-2.5 rounded-t-xs" />
                    <div className="w-2 bg-zinc-200 h-3.5 rounded-t-xs" />
                    <div className="w-2 bg-zinc-300 h-3 rounded-t-xs" />
                    <div className="w-2 bg-emerald-500 h-4.5 rounded-t-xs" />
                    <div className="w-2 bg-[#C2410C] h-5 rounded-t-xs" />
                  </div>
                  <span className="text-[8px] font-mono text-purple-700 block font-semibold">
                    12 Khalti · 6 COD
                  </span>
                </div>

                {/* Metric 3: Subscriptions MRR */}
                <div className="bg-white p-2.5 rounded-xl border border-zinc-200 shadow-2xs space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 block">Subscription MRR</span>
                  <span className="text-sm font-extrabold font-mono text-zinc-950 block">Rs. 38,400</span>
                  <div className="h-5 flex items-center text-[9px] font-mono text-emerald-700 font-bold">
                    ↻ 24 Active Clubs
                  </div>
                  <span className="text-[8px] font-mono text-blue-700 block font-medium">
                    Prepaid Deliveries
                  </span>
                </div>
              </div>

              {/* Orders Queue Peek */}
              <div className="bg-white rounded-xl border border-zinc-200 p-2.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-zinc-700 uppercase tracking-wider">
                    Recent Orders (Non-Blocking 5s Undo)
                  </span>
                  <span className="text-[8px] font-mono text-emerald-700 font-semibold">● Auto-sync</span>
                </div>
                <div className="space-y-1 text-[9px] font-mono">
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <div>
                      <span className="font-bold text-zinc-900">#BM-1042</span>
                      <span className="text-zinc-600 ml-1.5 font-medium">Gulmi Reserve 250g</span>
                    </div>
                    <span className="text-zinc-500 text-[8px]">Patan Ward 4</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                      PAID (Khalti)
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <div>
                      <span className="font-bold text-zinc-900">#HA-2089</span>
                      <span className="text-zinc-600 ml-1.5 font-medium">Ilam Orthodox Tin</span>
                    </div>
                    <span className="text-zinc-500 text-[8px]">Baluwatar Ward 3</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                      COD PENDING
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 2. OVERLAID SMARTPHONE STOREFRONT SIMULATOR (Foreground)           */}
        {/* ------------------------------------------------------------------ */}
        <div
          className={`${
            mobileView === "storefront" ? "flex" : "hidden sm:flex"
          } relative z-20 sm:ml-auto flex-col items-center`}
        >
          {/* Smartphone Hardware Frame */}
          <div className="w-[285px] sm:w-[310px] rounded-[38px] border-[7px] border-zinc-900 bg-zinc-950 shadow-2xl shadow-zinc-950/25 overflow-hidden transition-all duration-300">
            {/* Dynamic Island / Hardware Notch */}
            <div className="h-6 bg-zinc-950 flex justify-center items-center px-4">
              <div className="w-18 h-3.5 bg-black rounded-full flex items-center justify-between px-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                <span className="w-2 h-2 rounded-full bg-zinc-800" />
              </div>
            </div>

            {/* Live Themed Storefront Screen */}
            <div
              style={{ backgroundColor: tenant.canvasColor, color: tenant.inkColor }}
              className="p-3.5 space-y-3 min-h-[460px] flex flex-col justify-between font-sans transition-colors duration-300"
            >
              {/* Mobile Store Header */}
              <div className="flex items-center justify-between pb-2 border-b border-black/10">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{tenant.slug === "brewmellow" ? "☕" : "🍃"}</span>
                    <p className="font-extrabold text-sm tracking-tight">{tenant.name}</p>
                  </div>
                  <p className="text-[10px] opacity-75 font-mono">{tenant.tagline}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full bg-white/90 border border-black/10 flex items-center justify-center text-xs shadow-xs relative">
                    <ShoppingBag className="w-3.5 h-3.5 text-zinc-900" />
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#C2410C] text-white rounded-full text-[8px] font-bold flex items-center justify-center">
                      {addedToCart ? 1 : 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Featured Product Card with Visual Illustration */}
              <div className="bg-white rounded-2xl p-3 border border-black/10 shadow-xs space-y-2.5">
                {/* Visual Product Banner */}
                <div
                  style={{
                    backgroundColor: tenant.slug === "brewmellow" ? "#F5EFE6" : "#EBF3EE",
                    borderColor: tenant.slug === "brewmellow" ? "#E8DED1" : "#D4E5DB",
                  }}
                  className="w-full h-28 rounded-xl border flex flex-col items-center justify-center relative overflow-hidden p-2 text-center"
                >
                  <span className="text-3xl mb-1">{tenant.slug === "brewmellow" ? "🫘" : "🫖"}</span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 shadow-2xs text-zinc-800">
                    {tenant.badgeText}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 mt-0.5">
                    {tenant.origin} · {tenant.altitude}
                  </span>
                </div>

                {/* Product Title & Reviews */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">
                      In Stock · Lalitpur
                    </span>
                    <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span className="text-zinc-800">4.9</span>
                      <span className="text-zinc-400 font-normal">(48)</span>
                    </div>
                  </div>
                  <h4 className="font-extrabold text-xs text-zinc-950 mt-1 leading-tight">
                    {tenant.sampleProduct}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    {tenant.sampleVariant}
                  </p>
                </div>

                {/* Tasting Notes Tags */}
                <div className="flex flex-wrap gap-1">
                  {tenant.tastingNotes.map((note) => (
                    <span
                      key={note}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700"
                    >
                      {note}
                    </span>
                  ))}
                </div>

                {/* Interactive Purchase Type Toggle (ShopCraft Superpower) */}
                <div className="p-1 rounded-xl bg-zinc-100/90 border border-zinc-200/80 grid grid-cols-2 gap-1 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setPurchaseType("subscription")}
                    className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                      purchaseType === "subscription"
                        ? "bg-white font-bold text-zinc-950 shadow-2xs border border-zinc-200"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    <span className="block text-[8px] text-emerald-700 font-extrabold">SAVE 10%</span>
                    <span>{tenant.discountPriceFormatted}/mo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchaseType("one_time")}
                    className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                      purchaseType === "one_time"
                        ? "bg-white font-bold text-zinc-950 shadow-2xs border border-zinc-200"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    <span className="block text-[8px] text-zinc-400">ONE-TIME</span>
                    <span>{tenant.priceFormatted}</span>
                  </button>
                </div>

                {/* Interactive Add to Cart CTA */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  style={{ backgroundColor: tenant.accentColor }}
                  className="w-full py-2.5 rounded-xl text-white font-bold text-xs tracking-wide shadow-xs hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {addedToCart ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>
                        {purchaseType === "subscription"
                          ? `Subscribe · ${tenant.discountPriceFormatted}/mo`
                          : `Add to Bag · ${tenant.priceFormatted}`}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Bottom Trust Micro-Bar */}
              <div className="pt-1 border-t border-black/10 flex items-center justify-between text-[8px] font-mono opacity-80">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>Khalti Sandbox &amp; COD</span>
                </span>
                <span>Ward 1–35 Routing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
