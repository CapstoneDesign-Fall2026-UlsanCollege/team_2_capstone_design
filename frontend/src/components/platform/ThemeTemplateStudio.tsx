"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Coffee,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  Leaf,
  Moon,
  Package,
  Palette,
  ShoppingBag,
  Sparkles,
  Sun,
  Truck,
} from "lucide-react";

interface ThemePresetDef {
  id: string;
  name: string;
  niche: string;
  displayFont: string;
  bodyFont: string;
  canvasHex: string;
  surfaceHex: string;
  inkHex: string;
  accentHex: string;
  ctaHex: string;
  ctaTextHex: string;
  cardPreview: {
    title: string;
    category: string;
    price: string;
    badge: string;
    tagline: string;
  };
  sampleConsoleTag: string;
}

const TEMPLATE_PRESETS: ThemePresetDef[] = [
  {
    id: "editorial-warm",
    name: "Editorial Warm",
    niche: "Roasteries, Teas, Bakeries & Artisan Food",
    displayFont: "Fraunces Serif",
    bodyFont: "Plus Jakarta Sans",
    canvasHex: "#F5F2EB",
    surfaceHex: "#FFFFFF",
    inkHex: "#1A1512",
    accentHex: "#A3432A",
    ctaHex: "#A3432A",
    ctaTextHex: "#FFFFFF",
    cardPreview: {
      title: "Handcrafted Terracotta Ceramic Mug",
      category: "Artisan Living",
      price: "Rs. 1,250",
      badge: "Handmade Lot",
      tagline: "Earthy warmth with rich editorial serif headings and tactile paper surfaces.",
    },
    sampleConsoleTag: "Coffee / Consumables",
  },
  {
    id: "pahadi-sage",
    name: "Pahadi Botanical",
    niche: "Wild Honey, Herbs, Ayurveda & Wellness",
    displayFont: "Young Serif",
    bodyFont: "Manrope",
    canvasHex: "#F3F7F4",
    surfaceHex: "#FFFFFF",
    inkHex: "#14281D",
    accentHex: "#1F6F4A",
    ctaHex: "#1F6F4A",
    ctaTextHex: "#FFFFFF",
    cardPreview: {
      title: "Wild Cliff Honey & Raw Herbal Elixir",
      category: "Mountain Wellness",
      price: "Rs. 1,650",
      badge: "Organic Certified",
      tagline: "Calming herbal greens, balanced botanical serifs, and high-trust organic certification badges.",
    },
    sampleConsoleTag: "Organic Organics",
  },
  {
    id: "midnight-obsidian",
    name: "Midnight Obsidian",
    niche: "Streetwear, Apparel Drops, Leather & Tech",
    displayFont: "Space Grotesk",
    bodyFont: "Inter",
    canvasHex: "#0D0D0E",
    surfaceHex: "#161619",
    inkHex: "#F9FAFB",
    accentHex: "#F59E0B",
    ctaHex: "#2563EB",
    ctaTextHex: "#FFFFFF",
    cardPreview: {
      title: "Heavyweight 320GSM Boxy Drop Tee",
      category: "Kathmandu Streetwear",
      price: "Rs. 2,400",
      badge: "Limited Drop",
      tagline: "Ultra-sleek dark mode canvas with high-contrast electric accents and bold modern typography.",
    },
    sampleConsoleTag: "Streetwear Drops",
  },
  {
    id: "ktm-bold",
    name: "Modern Minimalist",
    niche: "Contemporary Crafts, Design Goods & Jewelry",
    displayFont: "Space Grotesk",
    bodyFont: "Inter",
    canvasHex: "#FAFAFA",
    surfaceHex: "#FFFFFF",
    inkHex: "#0B0B0B",
    accentHex: "#2B3BFF",
    ctaHex: "#0B0B0B",
    ctaTextHex: "#FFFFFF",
    cardPreview: {
      title: "Minimalist Solid Brass Desk Compass",
      category: "Studio Objects",
      price: "Rs. 3,200",
      badge: "Studio Edition",
      tagline: "Swiss-inspired monochrome precision with crisp line dividers and high-legibility geometric type.",
    },
    sampleConsoleTag: "Modern Objects",
  },
];

export function ThemeTemplateStudio() {
  const [selectedPresetId, setSelectedPresetId] = useState("editorial-warm");
  const activePreset =
    TEMPLATE_PRESETS.find((p) => p.id === selectedPresetId) || TEMPLATE_PRESETS[0];

  return (
    <section
      id="templates"
      className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-200 dark:border-white/5 scroll-mt-20"
    >
      <div id="demo-stores" className="scroll-mt-20">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Palette className="w-3.5 h-3.5" />
            <span>Pure Multi-Tenant Template Engine</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
            Pure Templates. Any Niche. Zero Code.
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-sans max-w-xl mx-auto">
            Choose a pre-tuned theme or customize tokens. Every store includes single-screen mobile checkout, native Khalti, COD verification, and 1-click Pathao dispatch.
          </p>
        </div>

        {/* 1. Interactive Preset Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {TEMPLATE_PRESETS.map((preset) => {
            const isSelected = preset.id === activePreset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedPresetId(preset.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold font-mono transition-all cursor-pointer ${
                  isSelected
                    ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md scale-105"
                    : "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-white/10"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: preset.accentHex }}
                />
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>

        {/* 2. Interactive Template Live Preview Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column (5 cols): Theme Specifications & Launch CTA */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#141416] flex flex-col justify-between shadow-xl shadow-black/5 dark:shadow-black/40 text-left">
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block mb-1">
                  Template Spec // {activePreset.id}
                </span>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white">
                  {activePreset.name}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans mt-1">
                  Engineered for {activePreset.niche}.
                </p>
              </div>

              {/* Typography & Swatches */}
              <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-mono">Display Typeface</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{activePreset.displayFont}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-mono">Body Typeface</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{activePreset.bodyFont}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-mono">Palette Tokens</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      title="Canvas"
                      className="w-4 h-4 rounded-full border border-zinc-300 dark:border-white/20"
                      style={{ backgroundColor: activePreset.canvasHex }}
                    />
                    <span
                      title="Surface"
                      className="w-4 h-4 rounded-full border border-zinc-300 dark:border-white/20"
                      style={{ backgroundColor: activePreset.surfaceHex }}
                    />
                    <span
                      title="Accent"
                      className="w-4 h-4 rounded-full border border-zinc-300 dark:border-white/20"
                      style={{ backgroundColor: activePreset.accentHex }}
                    />
                    <span
                      title="CTA"
                      className="w-4 h-4 rounded-full border border-zinc-300 dark:border-white/20"
                      style={{ backgroundColor: activePreset.ctaHex }}
                    />
                  </div>
                </div>
              </div>

              {/* Built-in Features */}
              <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-white/10 text-xs text-zinc-600 dark:text-zinc-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Single-screen mobile checkout drawer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Native Khalti ePayment &amp; Verified COD</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>1-click Pathao 4x6&quot; thermal courier labels</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Prepaid 3/6/12-cycle repeat subscriptions</span>
                </div>
              </div>
            </div>

            {/* Launch Action */}
            <div className="pt-8">
              <Link
                href={`/signup?theme=${encodeURIComponent(activePreset.id)}`}
                className="w-full py-3.5 rounded-full bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer"
              >
                <span>Launch Store With This Template</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column (7 cols): Live Responsive Preview Simulation */}
          <div className="lg:col-span-7 rounded-3xl border border-zinc-200 dark:border-white/10 p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-black/5 dark:shadow-black/40 relative overflow-hidden"
            style={{
              backgroundColor: activePreset.canvasHex,
              color: activePreset.inkHex,
            }}
          >
            {/* Top Store Header Bar Simulation */}
            <div className="w-full pb-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activePreset.accentHex }} />
                <span className="font-bold text-sm tracking-tight uppercase" style={{ color: activePreset.inkHex }}>
                  {activePreset.name} Store
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: activePreset.surfaceHex, color: activePreset.inkHex }}>
                  Khalti &amp; COD Active
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: activePreset.ctaHex, color: activePreset.ctaTextHex }}>
                  Bag (1)
                </span>
              </div>
            </div>

            {/* Center: Live Product Card Simulation */}
            <div className="my-8 max-w-sm mx-auto w-full p-5 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 space-y-4"
              style={{
                backgroundColor: activePreset.surfaceHex,
              }}
            >
              <div className="aspect-[4/3] rounded-xl overflow-hidden relative flex items-center justify-center"
                style={{
                  backgroundColor: activePreset.canvasHex,
                }}
              >
                <div className="text-center space-y-1 p-4">
                  <Package className="w-8 h-8 mx-auto opacity-60" style={{ color: activePreset.inkHex }} />
                  <span className="text-[10px] font-mono uppercase tracking-wider block opacity-70">
                    Product Image &amp; Gallery
                  </span>
                </div>
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                  style={{ backgroundColor: activePreset.accentHex, color: "#FFFFFF" }}
                >
                  {activePreset.cardPreview.badge}
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <span className="text-[10px] font-mono uppercase tracking-wider opacity-60 block">
                  {activePreset.cardPreview.category}
                </span>
                <h4 className="text-base font-bold tracking-tight" style={{ color: activePreset.inkHex }}>
                  {activePreset.cardPreview.title}
                </h4>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-lg font-black font-mono" style={{ color: activePreset.inkHex }}>
                    {activePreset.cardPreview.price}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                    In Stock
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="w-full py-2.5 rounded-lg text-xs font-bold font-mono transition-transform active:scale-95 cursor-pointer shadow-xs"
                style={{
                  backgroundColor: activePreset.ctaHex,
                  color: activePreset.ctaTextHex,
                }}
              >
                Add to Cart →
              </button>
            </div>

            {/* Bottom Merchant Synchronization Strip */}
            <div className="pt-4 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono opacity-70">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant Merchant Sync: <code className="font-bold">/merchant/[storeSlug]</code></span>
              </div>
              <div>
                Multi-Tenant CSS Isolated
              </div>
            </div>

          </div>

        </div>

        {/* 3. Create Store Directly From Homepage */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-white/10 bg-zinc-100/60 dark:bg-white/[0.02] max-w-3xl mx-auto text-center space-y-4">
          <h4 className="text-lg font-bold text-zinc-900 dark:text-white">
            Have a brand ready? Launch your store now.
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
            Choose any name, select your preferred theme preset, and get your hosted store and merchant console running in seconds.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/merchant/new"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs font-mono hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-md active:scale-95"
            >
              Open Store Creation Wizard →
            </Link>
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/5 font-semibold text-xs font-mono transition-colors"
            >
              Create Merchant Account
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
