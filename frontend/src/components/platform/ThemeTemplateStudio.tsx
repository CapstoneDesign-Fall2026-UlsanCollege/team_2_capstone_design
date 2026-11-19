"use client";

import React, { useState } from "react";
import Link from "next/link";

interface ThemePresetDef {
  id: string;
  name: string;
  niche: string;
  displayFont: string;
  bodyFont: string;
  aaFont: string;
  canvasHex: string;
  surfaceHex: string;
  inkHex: string;
  accentHex: string;
  ctaTextHex: string;
  productTitle: string;
  productPrice: string;
  colors: string[];
}

const TEMPLATE_PRESETS: ThemePresetDef[] = [
  {
    id: "editorial-warm",
    name: "Editorial Warm",
    niche: "Roasteries, bakeries, and tea gardens.",
    displayFont: "Fraunces",
    bodyFont: "Plus Jakarta Sans",
    aaFont: "var(--font-fraunces), Georgia, serif",
    canvasHex: "#F5F2EB",
    surfaceHex: "#FFFFFF",
    inkHex: "#1A1512",
    accentHex: "#A3432A",
    ctaTextHex: "#FFFFFF",
    productTitle: "Gulmi Bourbon Roast (250g)",
    productPrice: "Rs. 750",
    colors: ["#F5F2EB", "#FFFFFF", "#A3432A", "#1A1512"],
  },
  {
    id: "pahadi-sage",
    name: "Pahadi Botanical",
    niche: "Wild honey, herbs, and mountain wellness.",
    displayFont: "Fraunces",
    bodyFont: "Plus Jakarta Sans",
    aaFont: "var(--font-fraunces), Georgia, serif",
    canvasHex: "#F3F7F4",
    surfaceHex: "#FFFFFF",
    inkHex: "#14281D",
    accentHex: "#1F6F4A",
    ctaTextHex: "#FFFFFF",
    productTitle: "Wild Cliff Honey (500g)",
    productPrice: "Rs. 1,650",
    colors: ["#F3F7F4", "#FFFFFF", "#1F6F4A", "#14281D"],
  },
  {
    id: "midnight-obsidian",
    name: "Midnight Obsidian",
    niche: "Apparel drops, leather goods, and gear.",
    displayFont: "Plus Jakarta Sans",
    bodyFont: "Plus Jakarta Sans",
    aaFont: "var(--font-plus-jakarta), sans-serif",
    canvasHex: "#0E0F12",
    surfaceHex: "#17191E",
    inkHex: "#ECECE9",
    accentHex: "#2563EB",
    ctaTextHex: "#FFFFFF",
    productTitle: "Heavyweight Boxy Tee (L)",
    productPrice: "Rs. 2,350",
    colors: ["#0E0F12", "#17191E", "#2563EB", "#ECECE9"],
  },
  {
    id: "ktm-bold",
    name: "Modern Minimalist",
    niche: "Contemporary crafts and studio objects.",
    displayFont: "Plus Jakarta Sans",
    bodyFont: "Plus Jakarta Sans",
    aaFont: "var(--font-plus-jakarta), sans-serif",
    canvasHex: "#FAFAFA",
    surfaceHex: "#FFFFFF",
    inkHex: "#111318",
    accentHex: "#111318",
    ctaTextHex: "#FFFFFF",
    productTitle: "Nuwakot Heritage Roast (250g)",
    productPrice: "Rs. 880",
    colors: ["#FAFAFA", "#FFFFFF", "#2B3BFF", "#111318"],
  },
];

interface ThemeTemplateStudioProps {
  storeName?: string;
}

export function ThemeTemplateStudio({ storeName = "" }: ThemeTemplateStudioProps) {
  const [selectedPresetId, setSelectedPresetId] = useState("editorial-warm");
  const [bagCount, setBagCount] = useState(0);

  const activePreset =
    TEMPLATE_PRESETS.find((p) => p.id === selectedPresetId) || TEMPLATE_PRESETS[0];

  const previewStoreTitle = storeName.trim() || `${activePreset.name} Store`;
  const trimmedName = storeName.trim();
  const nextWizardPath = trimmedName
    ? `/merchant/new?theme=${activePreset.id}&name=${encodeURIComponent(trimmedName)}`
    : `/merchant/new?theme=${activePreset.id}`;

  return (
    <section
      id="looks"
      className="py-14 sm:py-18 px-5 border-b border-[#E2E2DC] dark:border-white/10 scroll-mt-20"
    >
      <div id="templates" className="max-w-[1040px] mx-auto scroll-mt-20">
        <h2
          className="text-[28px] sm:text-[36px] font-semibold tracking-[-0.01em] leading-[1.18] text-left text-[#161614] dark:text-[#ECECE9] mb-6"
          style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
        >
          Four store looks, ready to customize.
        </h2>

        {/* Softly rounded rectangle look tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TEMPLATE_PRESETS.map((preset) => {
            const isSelected = preset.id === activePreset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedPresetId(preset.id)}
                className={`inline-flex items-center gap-2 min-h-[44px] px-3.5 rounded-lg border text-[13px] font-semibold cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[#161614] dark:bg-[#ECECE9] text-[#F9F9F7] dark:text-[#0E0F12] border-[#161614] dark:border-[#ECECE9]"
                    : "bg-white dark:bg-[#15171B] text-[#4A4A45] dark:text-[#B4B6BD] border-[#E2E2DC] dark:border-white/10 hover:text-[#161614] dark:hover:text-[#ECECE9]"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-[3px] border border-black/15 dark:border-white/20 shrink-0"
                  style={{ backgroundColor: preset.accentHex }}
                />
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>

        {/* Left Info Card + Right Storefront Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-5 rounded-xl border border-[#E2E2DC] dark:border-white/10 bg-white dark:bg-[#15171B] p-6 flex flex-col justify-between text-left">
            <div>
              <h3
                className="text-[24px] font-semibold text-[#161614] dark:text-[#ECECE9]"
                style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
              >
                {activePreset.name}
              </h3>
              <p className="mt-1.5 text-[14px] text-[#4A4A45] dark:text-[#B4B6BD]">
                {activePreset.niche}
              </p>

              {/* Type specimen & hex palette */}
              <div className="mt-5 p-4 rounded-[10px] border border-[#E2E2DC] dark:border-white/10 bg-[#F2F2EE] dark:bg-[#1A1D23]">
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className="text-[42px] leading-none font-semibold text-[#161614] dark:text-[#ECECE9]"
                    style={{ fontFamily: activePreset.aaFont }}
                  >
                    Aa
                  </span>
                  <div className="text-right text-[12px] text-[#4A4A45] dark:text-[#B4B6BD] leading-relaxed">
                    <div>
                      Display:{" "}
                      <strong className="text-[#161614] dark:text-[#ECECE9] font-semibold">
                        {activePreset.displayFont}
                      </strong>
                    </div>
                    <div>
                      Body:{" "}
                      <strong className="text-[#161614] dark:text-[#ECECE9] font-semibold">
                        {activePreset.bodyFont}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-[#E2E2DC] dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {activePreset.colors.map((hex) => (
                    <div
                      key={hex}
                      className="flex items-center gap-1.5 text-[11px] text-[#4A4A45] dark:text-[#B4B6BD]"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-[4px] border border-black/15 dark:border-white/20 shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <span>{hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href={`/signup?next=${encodeURIComponent(nextWizardPath)}`}
              className="mt-5 w-full min-h-[44px] rounded-lg border border-[#161614] dark:border-[#ECECE9] bg-[#161614] dark:bg-[#ECECE9] text-[#F9F9F7] dark:text-[#0E0F12] text-[14px] font-semibold inline-flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              Use this look
            </Link>
          </div>

          {/* Right: Storefront Preview with plain marked photo placeholder */}
          <div
            className="lg:col-span-7 rounded-xl border border-[#E2E2DC] dark:border-white/10 p-5 flex flex-col justify-between gap-5"
            style={{
              backgroundColor: activePreset.canvasHex,
              color: activePreset.inkHex,
            }}
          >
            <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-black/15 dark:border-white/15 text-[14px] font-bold">
              <span className="truncate">{previewStoreTitle}</span>
              <span
                className="px-2.5 py-1 rounded-[6px] text-[12px] font-semibold shrink-0"
                style={{
                  backgroundColor: activePreset.accentHex,
                  color: activePreset.ctaTextHex,
                }}
              >
                Bag ({bagCount})
              </span>
            </div>

            <div
              className="max-w-[310px] w-full mx-auto rounded-[10px] p-4 border border-black/15 dark:border-white/15"
              style={{ backgroundColor: activePreset.surfaceHex }}
            >
              <div className="aspect-[4/3] rounded-lg border border-dashed border-black/35 dark:border-white/30 flex items-center justify-center p-4 text-center text-[12px] font-medium opacity-75">
                Photo: your product here
              </div>

              <p className="mt-3 text-[16px] font-bold text-left">
                {activePreset.productTitle}
              </p>
              <p className="mt-1 mb-3.5 text-[15px] font-semibold sc-mono text-left">
                {activePreset.productPrice}
              </p>

              <button
                type="button"
                onClick={() => setBagCount((c) => c + 1)}
                className="w-full min-h-[44px] rounded-lg text-[13px] font-bold cursor-pointer"
                style={{
                  backgroundColor: activePreset.accentHex,
                  color: activePreset.ctaTextHex,
                }}
              >
                Add to Bag
              </button>
            </div>

            <div className="text-[12px] opacity-75 text-left">
              Your store looks like your brand, not ours.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
