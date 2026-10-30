"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Repeat, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";

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
    <div className="flex flex-col items-center">
      {/* Store Switcher Pill */}
      <div className="flex items-center gap-1.5 p-1 mb-4 rounded-full bg-[var(--sc-surface,#FFFFFF)] border border-[var(--sc-line,#E8E8E1)] shadow-xs">
        {PREVIEW_TENANTS.map((t, idx) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => setSelectedIndex(idx)}
            className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedIndex === idx
                ? "bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] font-semibold shadow-xs"
                : "text-[var(--sc-ink-2,#4B5060)] hover:text-[var(--sc-ink,#111318)]"
            }`}
          >
            <span>{idx === 0 ? "☕" : "🍃"}</span>
            <span>{t.name}</span>
          </button>
        ))}
      </div>

      {/* Realistic Mobile Device Frame */}
      <div className="w-[300px] sm:w-[325px] rounded-[36px] border-[7px] border-zinc-900 bg-zinc-900 shadow-2xl overflow-hidden transition-all duration-300">
        {/* Dynamic Island / Notch */}
        <div className="h-5 bg-zinc-900 flex justify-center items-center">
          <div className="w-16 h-1 bg-zinc-700/60 rounded-full" />
        </div>

        {/* Screen Content Container with Store's Custom Theme */}
        <div
          style={{ backgroundColor: tenant.canvasColor, color: tenant.inkColor }}
          className="p-4 space-y-3.5 min-h-[460px] flex flex-col justify-between font-sans transition-colors duration-300"
        >
          {/* Store Mock Header */}
          <div className="flex items-center justify-between pb-2 border-b border-black/10">
            <div>
              <p className="font-extrabold text-sm tracking-tight">{tenant.name}</p>
              <p className="text-[10px] opacity-75 font-mono">{tenant.tagline}</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-white/80 border border-black/10 flex items-center justify-center text-xs shadow-xs">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Product Showcase Card */}
          <div className="rounded-xl bg-white p-3.5 shadow-sm border border-black/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span
                style={{ backgroundColor: `${tenant.accentColor}18`, color: tenant.accentColor }}
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
              >
                {tenant.badgeText}
              </span>
              <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                In Stock
              </span>
            </div>

            <div>
              <h4 className="font-bold text-sm leading-tight text-zinc-900">{tenant.sampleProduct}</h4>
              <p className="text-xs text-zinc-600 font-mono pt-0.5">{tenant.sampleVariant}</p>
            </div>

            {/* Tasting Notes */}
            <div className="flex flex-wrap gap-1">
              {tenant.sampleNotes.map((note) => (
                <span
                  key={note}
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200"
                >
                  {note}
                </span>
              ))}
            </div>

            {/* Purchase Mode Toggle */}
            <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-zinc-100 text-[10px] font-mono">
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
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-base font-extrabold font-mono text-zinc-900">
                {tenant.priceFormatted}
              </span>
              <span className="text-[10px] font-mono font-medium text-emerald-600">
                {purchaseType === "subscription" ? tenant.subscriptionText : "Standard order"}
              </span>
            </div>
          </div>

          {/* Sticky Mock CTA Button */}
          <div className="space-y-2 pt-1">
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
              Open live store in new tab →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
