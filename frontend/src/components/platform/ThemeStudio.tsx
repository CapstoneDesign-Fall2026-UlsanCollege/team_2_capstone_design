"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Coffee,
  ExternalLink,
  Laptop,
  Layers,
  Moon,
  Palette,
  RotateCcw,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Sun,
  Tag,
  Zap,
} from "lucide-react";

interface ThemePreset {
  id: "editorial-warm" | "pahadi-sage" | "ktm-bold" | "midnight-obsidian";
  name: string;
  tagline: string;
  niche: string;
  storeSlug: string;
  storeName: string;
  primaryColor: string;
  canvasColor: string;
  surfaceColor: string;
  textColor: string;
  mutedColor: string;
  fontDisplay: string;
  sampleProduct: {
    title: string;
    subtitle: string;
    origin: string;
    oneTimePrice: number;
    subPrice: number;
    image: string;
    variants: string[];
    tastingNotes: string[];
    badge: string;
  };
}

const THEMES: ThemePreset[] = [
  {
    id: "editorial-warm",
    name: "Editorial Warm",
    tagline: "Earthy terracotta, warm paper canvas, Fraunces serif display.",
    niche: "Specialty Coffee, Roasteries, Bakeries, Books",
    storeSlug: "himalayan-roasters",
    storeName: "Himalayan Coffee Roasters",
    primaryColor: "#A3432A",
    canvasColor: "#F5F2EB",
    surfaceColor: "#FFFFFF",
    textColor: "#1A1512",
    mutedColor: "#5C5042",
    fontDisplay: "font-serif",
    sampleProduct: {
      title: "Gulmi Reserve Bourbon Arabica",
      subtitle: "Hand-picked high-altitude micro-lot · Washed process",
      origin: "Gulmi, Western Nepal · 1,450m",
      oneTimePrice: 750,
      subPrice: 675,
      image:
        "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80",
      variants: ["250g Whole Bean", "500g Pour-Over", "1kg Roastery Bag"],
      tastingNotes: ["Dark Chocolate", "Candied Mandarin", "Brown Sugar"],
      badge: "Bestseller",
    },
  },
  {
    id: "pahadi-sage",
    name: "Pahadi Sage",
    tagline: "Herbal forest green, warm sage lines, Young Serif display.",
    niche: "Organic Tea Estates, Wild Honey, Ayurvedic Wellness",
    storeSlug: "himalayan-artisans",
    storeName: "Himalayan Artisans Tea & Herbs",
    primaryColor: "#1F6F4A",
    canvasColor: "#F3F7F4",
    surfaceColor: "#FFFFFF",
    textColor: "#111C15",
    mutedColor: "#4E6558",
    fontDisplay: "font-serif",
    sampleProduct: {
      title: "Ilam Single-Estate First Flush Tea",
      subtitle: "Artisanal hand-rolled orthodox black tea from Kanyam",
      origin: "Kanyam, Ilam · 2,000m",
      oneTimePrice: 950,
      subPrice: 855,
      image:
        "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
      variants: ["100g Pouch", "250g Tin", "500g Loose Leaf"],
      tastingNotes: ["Muscatel Grape", "Wildflower Honey", "Roasted Malt"],
      badge: "Spring Harvest",
    },
  },
  {
    id: "ktm-bold",
    name: "KTM Bold",
    tagline: "High contrast electric blue, stark canvas, Space Grotesk.",
    niche: "Streetwear, Sneakers, Urban Apparel, Modern Tech",
    storeSlug: "ktm-streetwear",
    storeName: "KTM Streetwear & Apparel",
    primaryColor: "#2B3BFF",
    canvasColor: "#F4F4F0",
    surfaceColor: "#FFFFFF",
    textColor: "#0A0A0A",
    mutedColor: "#5E5E5A",
    fontDisplay: "font-mono",
    sampleProduct: {
      title: "KTM Heavyweight Boxy Tee (280 GSM)",
      subtitle: "100% Nepali combed cotton · Relaxed drop-shoulder cut",
      origin: "Crafted in Lalitpur, Nepal",
      oneTimePrice: 1850,
      subPrice: 1665,
      image:
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
      variants: ["Size M (Oversized)", "Size L (Boxy)", "Size XL"],
      tastingNotes: ["Heavyweight 280 GSM", "Drop Shoulder", "Pre-Shrunk"],
      badge: "Limited Drop",
    },
  },
  {
    id: "midnight-obsidian",
    name: "Midnight Obsidian (Dark)",
    tagline: "Deep charcoal obsidian canvas, amber gold CTA, refined dark elegance.",
    niche: "Night Roasteries, Dark Cocoa, Craft Spirits, Leather",
    storeSlug: "himalayan-roasters",
    storeName: "Midnight Himalayan Roasters",
    primaryColor: "#F2A900",
    canvasColor: "#0B0D11",
    surfaceColor: "#141720",
    textColor: "#F9FAFB",
    mutedColor: "#94A3B8",
    fontDisplay: "font-serif",
    sampleProduct: {
      title: "Midnight Reserve Dark Roast Single-Origin",
      subtitle: "Smoky dark cacao, toasted walnut & caramelized jaggery",
      origin: "Sindhupalchok Highlands · 1,550m",
      oneTimePrice: 880,
      subPrice: 792,
      image:
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
      variants: ["250g Dark Roast", "500g Whole Bean", "1kg Roastery Bag"],
      tastingNotes: ["Dark Cacao 85%", "Toasted Walnut", "Molasses"],
      badge: "Night Reserve",
    },
  },
];

export function ThemeStudio() {
  const [selectedThemeId, setSelectedThemeId] = useState<ThemePreset["id"]>("editorial-warm");
  const [deviceMode, setDeviceMode] = useState<"mobile" | "desktop">("mobile");
  const [purchaseMode, setPurchaseMode] = useState<"one_time" | "subscription">("subscription");
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [addedNotice, setAddedNotice] = useState(false);

  const activeTheme = THEMES.find((t) => t.id === selectedThemeId) || THEMES[0];

  const handleAddToCart = () => {
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  return (
    <div className="w-full space-y-8">
      {/* 1. Theme Selector Tabs & Device Toggle */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#E1E3E5] dark:border-zinc-800 pb-6">
        {/* Preset Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#F6F6F7] dark:bg-[#151720] border border-[#E1E3E5] dark:border-zinc-800 overflow-x-auto w-full md:w-auto">
          {THEMES.map((theme) => {
            const isSelected = theme.id === selectedThemeId;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  setSelectedThemeId(theme.id);
                  setSelectedVariantIdx(0);
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white dark:bg-[#202533] text-[#121212] dark:text-white shadow-xs font-bold"
                    : "text-[#555555] dark:text-zinc-400 hover:text-[#121212] dark:hover:text-white hover:bg-white/50"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-black/10 dark:border-white/20"
                  style={{ backgroundColor: theme.primaryColor }}
                />
                <span>{theme.name}</span>
                <span className="text-[10px] text-[#707070] dark:text-zinc-500 hidden sm:inline">
                  · {theme.niche.split(",")[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Device Switcher (Mobile 375px vs Desktop) */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#F6F6F7] dark:bg-[#151720] border border-[#E1E3E5] dark:border-zinc-800 shrink-0 self-end md:self-auto">
          <button
            onClick={() => setDeviceMode("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              deviceMode === "mobile"
                ? "bg-white dark:bg-[#202533] text-[#121212] dark:text-white shadow-xs font-bold"
                : "text-[#707070] dark:text-zinc-400 hover:text-[#121212]"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile (375px)</span>
          </button>
          <button
            onClick={() => setDeviceMode("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              deviceMode === "desktop"
                ? "bg-white dark:bg-[#202533] text-[#121212] dark:text-white shadow-xs font-bold"
                : "text-[#707070] dark:text-zinc-400 hover:text-[#121212]"
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Simulator Frame */}
      <div className="flex flex-col items-center justify-center">
        {/* Device Wrapper */}
        <div
          className={`transition-all duration-300 w-full ${
            deviceMode === "mobile"
              ? "max-w-[390px] rounded-[36px] p-3 bg-[#1A1A1A] dark:bg-[#08090C] shadow-2xl border-4 border-[#2A2A2A] dark:border-[#1E222B]"
              : "max-w-5xl rounded-2xl bg-[#E8E8E8] dark:bg-[#181B24] p-2 shadow-2xl border border-[#D0D0D0] dark:border-zinc-800"
          }`}
        >
          {/* Mobile Speaker / Camera Notch */}
          {deviceMode === "mobile" && (
            <div className="w-full flex justify-center pb-2">
              <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-[#1A1A1A] mr-2" />
                <span className="w-8 h-1 bg-[#2A2A2A] rounded-full" />
              </div>
            </div>
          )}

          {/* Browser Header Bar for Desktop */}
          {deviceMode === "desktop" && (
            <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-[#12141C] rounded-t-xl border-b border-[#E1E3E5] dark:border-zinc-800 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 max-w-sm mx-4 bg-[#F0F0F0] dark:bg-[#1A1E29] rounded-md px-3 py-1 text-[11px] font-mono text-[#555555] dark:text-zinc-300 truncate text-center">
                https://myshopcraft.com/s/{activeTheme.storeSlug}
              </div>
              <Link
                href={`/s/${activeTheme.storeSlug}`}
                className="text-[11px] font-bold text-[#121212] dark:text-white hover:underline flex items-center gap-1"
              >
                <span>Open in Tab</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Storefront Viewport Inside Device */}
          <div
            style={{
              backgroundColor: activeTheme.canvasColor,
              color: activeTheme.textColor,
            }}
            className={`w-full overflow-hidden text-left transition-colors duration-200 border border-black/10 dark:border-white/10 ${
              deviceMode === "mobile"
                ? "rounded-[28px] min-h-[580px] text-xs"
                : "rounded-b-xl min-h-[480px] p-6 text-sm"
            }`}
          >
            {/* Announcement Banner */}
            <div
              style={{
                backgroundColor: activeTheme.primaryColor,
                color: activeTheme.id === "midnight-obsidian" ? "#0B0D11" : "#FFFFFF",
              }}
              className="px-3 py-1.5 text-center text-[10px] font-mono font-bold tracking-wide flex items-center justify-center gap-2"
            >
              <span>🚚 Kathmandu Valley Free 24h Express over Rs. 1,500</span>
              <span className="hidden sm:inline">· Khalti &amp; COD</span>
            </div>

            {/* Storefront Mini Header */}
            <div
              style={{ backgroundColor: activeTheme.surfaceColor }}
              className="px-4 py-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold tracking-tight block">
                  {activeTheme.storeName}
                </span>
                <span style={{ color: activeTheme.mutedColor }} className="text-[10px]">
                  {activeTheme.tagline.split(",")[0]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 font-bold">
                  Rs. (NPR)
                </span>
                <div className="relative p-1.5 rounded-full bg-black/5 dark:bg-white/10">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span
                    style={{ backgroundColor: activeTheme.primaryColor, color: activeTheme.id === "midnight-obsidian" ? "#0B0D11" : "#FFFFFF" }}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center"
                  >
                    {addedNotice ? "1" : "0"}
                  </span>
                </div>
              </div>
            </div>

            {/* Hero & Product Detail Preview */}
            <div className={`p-4 sm:p-6 ${deviceMode === "desktop" ? "grid grid-cols-2 gap-8 items-center" : "space-y-4"}`}>
              {/* Product Visual Container */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black/5 border border-black/10 dark:border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeTheme.sampleProduct.image}
                  alt={activeTheme.sampleProduct.title}
                  className="w-full h-full object-cover"
                />
                <div
                  style={{
                    backgroundColor: activeTheme.primaryColor,
                    color: activeTheme.id === "midnight-obsidian" ? "#0B0D11" : "#FFFFFF",
                  }}
                  className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs"
                >
                  {activeTheme.sampleProduct.badge}
                </div>
                <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/80 text-white backdrop-blur-xs text-[10px] font-mono">
                  {activeTheme.sampleProduct.origin}
                </div>
              </div>

              {/* Product Buy Box */}
              <div className="space-y-3.5">
                <div>
                  <div
                    style={{ color: activeTheme.mutedColor }}
                    className="text-[10px] font-mono uppercase tracking-wider"
                  >
                    Nepal Direct-to-Consumer
                  </div>
                  <h4 className={`text-base sm:text-lg font-bold leading-tight ${activeTheme.fontDisplay}`}>
                    {activeTheme.sampleProduct.title}
                  </h4>
                  <p style={{ color: activeTheme.mutedColor }} className="text-xs mt-0.5">
                    {activeTheme.sampleProduct.subtitle}
                  </p>
                </div>

                {/* Variant Selector Pills */}
                <div className="space-y-1.5">
                  <div
                    style={{ color: activeTheme.mutedColor }}
                    className="text-[10px] font-mono font-bold uppercase"
                  >
                    Select Option
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTheme.sampleProduct.variants.map((v, i) => (
                      <button
                        key={v}
                        onClick={() => setSelectedVariantIdx(i)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                          selectedVariantIdx === i
                            ? "bg-black dark:bg-white text-white dark:text-black font-bold"
                            : "bg-black/5 dark:bg-white/10 hover:bg-black/10 text-inherit border border-black/10 dark:border-white/10"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recharge-Style Buy Box Toggle Card */}
                <div
                  style={{ backgroundColor: activeTheme.surfaceColor }}
                  className="rounded-xl border border-black/15 dark:border-white/15 p-2.5 space-y-2 shadow-xs"
                >
                  {/* Option 1: One-Time */}
                  <div
                    onClick={() => setPurchaseMode("one_time")}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      purchaseMode === "one_time"
                        ? "border-black dark:border-white font-bold"
                        : "border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          purchaseMode === "one_time" ? "border-black dark:border-white" : "border-black/30 dark:border-white/30"
                        }`}
                      >
                        {purchaseMode === "one_time" && (
                          <span className="w-2 h-2 rounded-full bg-black dark:bg-white" />
                        )}
                      </span>
                      <span>One-Time Purchase</span>
                    </div>
                    <span className="font-mono font-bold">
                      Rs. {activeTheme.sampleProduct.oneTimePrice}
                    </span>
                  </div>

                  {/* Option 2: Subscribe & Save 10% */}
                  <div
                    onClick={() => setPurchaseMode("subscription")}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      purchaseMode === "subscription"
                        ? "border-black dark:border-white font-bold"
                        : "border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          purchaseMode === "subscription" ? "border-black dark:border-white" : "border-black/30 dark:border-white/30"
                        }`}
                      >
                        {purchaseMode === "subscription" && (
                          <span className="w-2 h-2 rounded-full bg-black dark:bg-white" />
                        )}
                      </span>
                      <div>
                        <span>Subscribe &amp; Save 10%</span>
                        <div style={{ color: activeTheme.mutedColor }} className="text-[10px] font-normal">
                          Prepaid or WhatsApp renewal link
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        style={{ color: activeTheme.primaryColor }}
                        className="font-mono font-bold block"
                      >
                        Rs. {activeTheme.sampleProduct.subPrice}
                      </span>
                      <span className="text-[9px] line-through opacity-60">
                        Rs. {activeTheme.sampleProduct.oneTimePrice}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary CTA Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  style={{
                    backgroundColor: activeTheme.primaryColor,
                    color: activeTheme.id === "midnight-obsidian" ? "#0B0D11" : "#FFFFFF",
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>
                    {addedNotice
                      ? "✓ Added to Bag!"
                      : `Add to Bag • Rs. ${
                          purchaseMode === "subscription"
                            ? activeTheme.sampleProduct.subPrice
                            : activeTheme.sampleProduct.oneTimePrice
                        }`}
                  </span>
                </button>
              </div>
            </div>

            {/* Bottom Bar inside frame */}
            <div
              style={{ backgroundColor: activeTheme.surfaceColor }}
              className="p-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[11px]"
            >
              <span style={{ color: activeTheme.mutedColor }}>
                Built with ShopCraft Theme: <strong className="text-inherit">{activeTheme.name}</strong>
              </span>
              <Link
                href={`/s/${activeTheme.storeSlug}`}
                className="font-bold underline hover:opacity-80 flex items-center gap-1 text-inherit"
              >
                <span>Launch Live Storefront</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Caption & Direct Store Links */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-[#707070] dark:text-zinc-400">
          <span>Theme: <strong className="text-[#121212] dark:text-white">{activeTheme.name}</strong></span>
          <span>·</span>
          <span>Niche: <strong className="text-[#121212] dark:text-white">{activeTheme.niche}</strong></span>
          <span>·</span>
          <Link
            href={`/s/${activeTheme.storeSlug}`}
            className="text-[#121212] dark:text-white font-bold hover:underline flex items-center gap-1"
          >
            <span>Visit /s/{activeTheme.storeSlug}</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <span>·</span>
          <Link
            href={`/merchant/${activeTheme.storeSlug}`}
            className="text-[#121212] dark:text-white font-bold hover:underline flex items-center gap-1"
          >
            <span>Open Polaris Admin</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
