"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { STOREFRONT_THEMES } from "@/lib/storefront-themes";
import { PlatformReveal } from "@/components/platform/PlatformReveal";

interface ThemeTemplateStudioProps {
  storeName?: string;
  slug?: string;
}

export function ThemeTemplateStudio({ storeName = "" }: ThemeTemplateStudioProps) {
  const trimmedName = storeName.trim();
  const displayStoreName = trimmedName || "Your Store";

  return (
    <section
      id="looks"
      className="py-20 sm:py-32 bg-paper border-t border-line scroll-mt-16 overflow-x-clip"
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

        {/* Mobile horizontal snap peek carousel; Desktop 4-col staggered grid */}
        <div className="mt-10 sm:mt-16 flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 -mx-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 no-scrollbar pb-2 lg:pb-8">
          {STOREFRONT_THEMES.map((theme, idx) => {
            const nextWizard = trimmedName
              ? `/merchant/new?theme=${encodeURIComponent(theme.id)}&name=${encodeURIComponent(trimmedName)}`
              : `/merchant/new?theme=${encodeURIComponent(theme.id)}`;
            const href = `/signup?next=${encodeURIComponent(nextWizard)}`;
            const isOutline = theme.preview.outlineCtaInShowcase;

            return (
              <PlatformReveal
                key={theme.id}
                delayMs={idx * 70}
                className={`w-[74%] shrink-0 snap-start sm:w-auto flex flex-col ${
                  theme.preview.staggeredInShowcase ? "lg:translate-y-7" : ""
                }`}
              >
                <div
                  className="group flex-1 p-5 border flex flex-col justify-between transition-transform duration-300 ease-out hover:-translate-y-1.5"
                  style={{
                    backgroundColor: theme.tokens.canvas,
                    color: theme.tokens.ink,
                    borderColor: theme.tokens.borderSubtle,
                    borderRadius: theme.radius.card,
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
                      className="my-4 overflow-hidden aspect-[1/0.88]"
                      style={{
                        backgroundColor: theme.preview.photoBackdropHex,
                        borderRadius: theme.radius.control,
                      }}
                    >
                      <Image
                        src={theme.preview.sampleImageSrc}
                        alt={theme.preview.sampleProductTitle}
                        width={800}
                        height={800}
                        unoptimized
                        className="w-full h-full object-cover block transition-transform duration-500 ease-out group-hover:scale-[1.04]"
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

                  <Link
                    href={href}
                    className="mt-4 min-h-[44px] px-3 grid place-items-center text-[13px] font-semibold transition-all duration-150 hover:opacity-90 active:scale-[0.98] border"
                    style={
                      isOutline
                        ? {
                            backgroundColor: "transparent",
                            color: theme.tokens.ink,
                            borderColor: theme.tokens.ink,
                            borderRadius: theme.radius.control,
                          }
                        : {
                            backgroundColor: theme.tokens.primary,
                            color: theme.tokens.primaryForeground,
                            borderColor: theme.tokens.primary,
                            borderRadius: theme.radius.control,
                          }
                    }
                  >
                    Use {theme.displayName}
                  </Link>
                </div>

                <div className="mt-4 text-center space-y-0.5">
                  <p className="text-[15px] font-semibold text-ink">{theme.displayName}</p>
                  <p className="text-[13px] text-ink-2">{theme.bestForLabel}</p>
                  <p className="font-mono text-[11px] text-ink-3">{theme.fontPairing.label}</p>
                </div>
              </PlatformReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
