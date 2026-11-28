"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { STOREFRONT_THEMES } from "@/lib/storefront-themes";
import { PLATFORM_DEMO_STORE_BY_THEME } from "@/components/platform/platform-content";
import { PlatformReveal } from "@/components/platform/PlatformReveal";

interface ThemeTemplateStudioProps {
  storeName?: string;
  slug?: string;
}

const EASE_APPLE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const LOOK_SHOWCASE_PHOTOS: Record<string, string> = {
  "editorial-warm": "/images/platform/look-editorial-coffee.webp",
  "pahadi-sage": "/images/platform/look-pahadi-honey.webp",
  "ktm-bold": "/images/platform/look-ktm-roast.webp",
  "midnight-obsidian": "/images/platform/look-obsidian-tea.webp",
};

export function ThemeTemplateStudio({ storeName = "" }: ThemeTemplateStudioProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const reduceMotion = useReducedMotion();
  const trimmedName = storeName.trim();
  const displayStoreName = trimmedName || "Your Store";

  return (
    <section
      id="looks"
      className="relative z-20 -mt-7 rounded-t-[28px] pt-16 sm:pt-24 pb-20 sm:pb-32 bg-paper border-t border-line scroll-mt-16 overflow-x-clip"
    >
      <div className="max-w-[1180px] mx-auto px-4 sm:px-7">
        <PlatformReveal className="max-w-[820px] mx-auto text-center">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-ink-3 font-medium">
            Storefront looks
          </p>
          <h2 className="mt-4 font-display font-semibold tracking-[-0.048em] leading-none text-ink text-[36px] sm:text-[60px] lg:text-[76px]">
            Pick a look. <span className="text-accent">Make it yours.</span>
          </h2>
          <p className="mt-4 sm:mt-5 mx-auto max-w-[560px] text-base sm:text-lg text-ink-2 leading-relaxed">
            Four ready-made looks, each with its own type and colour. Pick one, add your logo, and switch whenever you like.
          </p>
        </PlatformReveal>

        {/* Mobile horizontal snap peek carousel; Desktop 4-col even grid */}
        <div className="mt-10 sm:mt-16 flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 -mx-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 sm:items-stretch no-scrollbar pb-2">
          {STOREFRONT_THEMES.map((theme, idx) => {
            const nextWizard = trimmedName
              ? `/merchant/new?theme=${encodeURIComponent(theme.id)}&name=${encodeURIComponent(trimmedName)}`
              : `/merchant/new?theme=${encodeURIComponent(theme.id)}`;
            const href = `/signup?next=${encodeURIComponent(nextWizard)}`;
            const isOutline = theme.preview.outlineCtaInShowcase;
            const isActive = activeIdx === idx;

            return (
              <motion.div
                key={theme.id}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.48,
                  delay: reduceMotion ? 0 : idx * 0.06,
                  ease: EASE_APPLE,
                }}
                whileHover={
                  reduceMotion
                    ? undefined
                    : { y: -6, transition: { type: "spring", stiffness: 380, damping: 28 } }
                }
                onMouseEnter={() => setActiveIdx(idx)}
                onFocus={() => setActiveIdx(idx)}
                className="w-[74%] shrink-0 snap-start sm:w-auto flex flex-col"
              >
                <div
                  data-look-card={theme.id}
                  className={`group flex-1 rounded-[22px] p-5 border flex flex-col justify-between transition-shadow duration-300 ${
                    isActive ? "ring-1 ring-accent/40 shadow-lg" : "ring-1 ring-transparent"
                  }`}
                  style={{
                    backgroundColor: theme.tokens.canvas,
                    color: theme.tokens.ink,
                    borderColor: theme.tokens.borderSubtle,
                    fontFamily: theme.fontPairing.uiCssStack,
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-base">
                      <span
                        className="font-semibold truncate"
                        style={{ fontFamily: theme.fontPairing.displayCssStack }}
                      >
                        {displayStoreName}
                      </span>
                      <span
                        className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: theme.tokens.primary,
                          color: theme.tokens.primaryForeground,
                        }}
                      >
                        Bag (1)
                      </span>
                    </div>

                    <div
                      className="my-4 rounded-[14px] overflow-hidden aspect-[1/0.88]"
                      style={{
                        backgroundColor: theme.preview.photoBackdropHex,
                      }}
                    >
                      <Image
                        src={LOOK_SHOWCASE_PHOTOS[theme.id] ?? theme.preview.sampleImageSrc}
                        alt={theme.preview.sampleProductTitle}
                        width={800}
                        height={600}
                        sizes="(max-width: 640px) 74vw, (max-width: 1024px) 48vw, 270px"
                        className="w-full h-full object-cover block transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                      />
                    </div>

                    <p
                      className="text-[10px] uppercase tracking-[0.08em] font-semibold"
                      style={{ color: theme.tokens.ink2 }}
                    >
                      {theme.preview.sampleTag}
                    </p>
                    <h3
                      className="text-[19px] font-semibold mt-0.5 leading-snug"
                      style={{ fontFamily: theme.fontPairing.displayCssStack }}
                    >
                      {theme.preview.sampleProductTitle}
                    </h3>
                    <p
                      className="text-[13px] mt-1 font-medium tabular-nums"
                      style={{ color: theme.tokens.ink2 }}
                    >
                      {theme.preview.samplePrice}
                    </p>
                  </div>

                  <div className="mt-5 space-y-1.5">
                    <Link
                      href={href}
                      data-look-cta={theme.id}
                      className="w-full min-h-[44px] px-4 rounded-full inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold border transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                      style={
                        isOutline
                          ? {
                              backgroundColor: "transparent",
                              color: theme.tokens.ink,
                              borderColor: theme.tokens.ink,
                            }
                          : {
                              backgroundColor: theme.tokens.primary,
                              color: theme.tokens.primaryForeground,
                              borderColor: theme.tokens.primary,
                            }
                      }
                    >
                      <span>Use {theme.displayName}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>

                    {PLATFORM_DEMO_STORE_BY_THEME[theme.id] && (
                      <Link
                        href={`/s/${PLATFORM_DEMO_STORE_BY_THEME[theme.id].slug}`}
                        data-look-demo={theme.id}
                        className="w-full min-h-[36px] px-2 inline-flex items-center justify-center gap-1 text-[12px] font-medium opacity-75 hover:opacity-100 transition-opacity"
                        style={{ color: theme.tokens.ink }}
                      >
                        <span className="truncate">
                          Live demo: {PLATFORM_DEMO_STORE_BY_THEME[theme.id].storeName}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-center space-y-1">
                  <p className="text-[15px] font-semibold text-ink">{theme.displayName}</p>
                  <p className="text-[13px] text-ink-2">{theme.bestForLabel}</p>
                  <p className="font-mono text-[11px] text-ink-3">{theme.fontPairing.label}</p>
                  <div className="pt-1.5 h-2 flex items-center justify-center">
                    {isActive && (
                      <motion.span
                        layoutId="active-look-bar"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="block h-[2px] w-10 rounded-full bg-accent"
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
