"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, ExternalLink } from "lucide-react";

interface ThemePresetDef {
  id: string;
  name: string;
  niche: string;
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
    imageSrc: string;
  };
}

const TEMPLATE_PRESETS: ThemePresetDef[] = [
  {
    id: "editorial-warm",
    name: "Editorial Warm",
    niche: "Coffee roasters, tea gardens, and bakeries",
    canvasHex: "#F5F2EB",
    surfaceHex: "#FFFFFF",
    inkHex: "#1A1512",
    accentHex: "#A3432A",
    ctaHex: "#A3432A",
    ctaTextHex: "#FFFFFF",
    cardPreview: {
      title: "Gulmi Reserve Arabica (250g)",
      category: "Single-Origin Coffee",
      price: "Rs. 750",
      badge: "Fresh Roast",
      imageSrc: "/images/products/gulmi-reserve.svg",
    },
  },
  {
    id: "pahadi-sage",
    name: "Pahadi Botanical",
    niche: "Wild honey, herbs, and natural goods",
    canvasHex: "#F3F7F4",
    surfaceHex: "#FFFFFF",
    inkHex: "#14281D",
    accentHex: "#1F6F4A",
    ctaHex: "#1F6F4A",
    ctaTextHex: "#FFFFFF",
    cardPreview: {
      title: "Himalayan Wild Cliff Honey (500g)",
      category: "Mountain Harvest",
      price: "Rs. 1,650",
      badge: "Raw & Cold Extracted",
      imageSrc: "/images/products/himalayan-honey.svg",
    },
  },
  {
    id: "midnight-obsidian",
    name: "Midnight Obsidian",
    niche: "Dark theme for bold drops and specialty lots",
    canvasHex: "#0D0D0E",
    surfaceHex: "#161619",
    inkHex: "#F9FAFB",
    accentHex: "#F59E0B",
    ctaHex: "#2563EB",
    ctaTextHex: "#FFFFFF",
    cardPreview: {
      title: "Ilam Gold Typica (250g)",
      category: "Sandakphu · 1,750m",
      price: "Rs. 820",
      badge: "Light Roast",
      imageSrc: "/images/products/ilam-gold.svg",
    },
  },
  {
    id: "ktm-bold",
    name: "Modern Minimalist",
    niche: "Clean monochrome for crafts and everyday goods",
    canvasHex: "#FAFAFA",
    surfaceHex: "#FFFFFF",
    inkHex: "#0B0B0B",
    accentHex: "#2B3BFF",
    ctaHex: "#0B0B0B",
    ctaTextHex: "#FFFFFF",
    cardPreview: {
      title: "Nuwakot Heritage Roast (250g)",
      category: "Kakani · 1,400m",
      price: "Rs. 880",
      badge: "Honey Process",
      imageSrc: "/images/products/nuwakot-heritage.svg",
    },
  },
];

interface ThemeTemplateStudioProps {
  storeName?: string;
}

export function ThemeTemplateStudio({ storeName = "" }: ThemeTemplateStudioProps) {
  const [selectedPresetId, setSelectedPresetId] = useState("editorial-warm");
  const [bagCount, setBagCount] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const activePreset =
    TEMPLATE_PRESETS.find((p) => p.id === selectedPresetId) || TEMPLATE_PRESETS[0];

  const previewStoreTitle = storeName.trim() || `${activePreset.name} Store`;
  const trimmedName = storeName.trim();
  const nextWizardPath = trimmedName
    ? `/merchant/new?theme=${activePreset.id}&name=${encodeURIComponent(trimmedName)}`
    : `/merchant/new?theme=${activePreset.id}`;

  const handlePreviewAdd = () => {
    setBagCount((c) => c + 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <section
      id="templates"
      className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-zinc-200 dark:border-white/5 scroll-mt-20"
    >
      <div id="demo-stores" className="scroll-mt-20">
        <div className="max-w-2xl mx-auto text-center mb-10 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
            Pick a look. Your logo, your colors, your fonts.
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            Switch between the four looks below to see what your customers get.
          </p>
        </div>

        {/* Interactive Preset Selector Tabs */}
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
                    ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-sm"
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

        {/* Preview Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column (5 cols): Plain summary & actions */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#141416] flex flex-col justify-between text-left">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white">
                  {activePreset.name}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  {activePreset.niche}.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-zinc-200 dark:border-white/10">
                <span className="text-xs text-zinc-500 mr-2">Colors:</span>
                {[
                  { label: "Background", hex: activePreset.canvasHex },
                  { label: "Card", hex: activePreset.surfaceHex },
                  { label: "Accent", hex: activePreset.accentHex },
                  { label: "Button", hex: activePreset.ctaHex },
                ].map((swatch) => (
                  <span
                    key={swatch.label}
                    title={swatch.label}
                    className="w-5 h-5 rounded-full border border-zinc-300 dark:border-white/20"
                    style={{ backgroundColor: swatch.hex }}
                  />
                ))}
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Checkout built for mobile phones</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Khalti and cash on delivery</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Your store looks like your brand, not ours</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 space-y-3">
              <Link
                href={`/signup?next=${encodeURIComponent(nextWizardPath)}`}
                className="w-full py-3.5 rounded-full bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Use this look</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/s/himalayan-roasters"
                className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <span>See live example store</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Right Column (7 cols): Live Storefront Preview */}
          <div
            className="lg:col-span-7 rounded-3xl border border-zinc-200 dark:border-white/10 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden transition-colors duration-200"
            style={{
              backgroundColor: activePreset.canvasHex,
              color: activePreset.inkHex,
            }}
          >
            {/* Store Header */}
            <div className="w-full pb-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: activePreset.accentHex }}
                />
                <span
                  className="font-bold text-sm tracking-tight truncate"
                  style={{ color: activePreset.inkHex }}
                >
                  {previewStoreTitle}
                </span>
              </div>
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold shrink-0"
                style={{
                  backgroundColor: activePreset.ctaHex,
                  color: activePreset.ctaTextHex,
                }}
              >
                Bag ({bagCount})
              </span>
            </div>

            {/* Product Card */}
            <div
              className="my-8 max-w-xs mx-auto w-full p-4 rounded-2xl border border-black/10 dark:border-white/10 space-y-4"
              style={{
                backgroundColor: activePreset.surfaceHex,
              }}
            >
              <div className="aspect-square rounded-xl overflow-hidden relative bg-black/5">
                <Image
                  src={activePreset.cardPreview.imageSrc}
                  alt={activePreset.cardPreview.title}
                  fill
                  className="object-cover"
                />
                <span
                  className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold"
                  style={{ backgroundColor: activePreset.accentHex, color: "#FFFFFF" }}
                >
                  {activePreset.cardPreview.badge}
                </span>
              </div>

              <div className="space-y-1 text-left">
                <span className="text-[10px] font-mono uppercase tracking-wider opacity-60 block">
                  {activePreset.cardPreview.category}
                </span>
                <h4
                  className="text-base font-bold tracking-tight"
                  style={{ color: activePreset.inkHex }}
                >
                  {activePreset.cardPreview.title}
                </h4>
                <div className="flex items-baseline gap-2 pt-0.5">
                  <span
                    className="text-base font-black font-mono"
                    style={{ color: activePreset.inkHex }}
                  >
                    {activePreset.cardPreview.price}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePreviewAdd}
                className="w-full py-2.5 rounded-lg text-xs font-bold font-mono transition-transform active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: activePreset.ctaHex,
                  color: activePreset.ctaTextHex,
                }}
              >
                {justAdded ? "Added to bag ✓" : "Add to Cart →"}
              </button>
            </div>

            <div className="pt-4 border-t border-black/10 dark:border-white/10 text-[11px] opacity-70 text-left">
              Your store looks like your brand, not ours.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
