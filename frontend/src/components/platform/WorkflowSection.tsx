"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Palette, Store, Tag } from "lucide-react";
import { PlatformReveal } from "@/components/platform/PlatformReveal";
import { PLATFORM_STEPS } from "@/components/platform/platform-content";
import { STOREFRONT_THEMES } from "@/lib/storefront-themes";

const STEP_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function WorkflowSection() {
  const [activeStep, setActiveStep] = useState(0);
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="how-it-works"
      className="py-20 sm:py-32 bg-paper scroll-mt-16"
    >
      <div className="max-w-[1180px] mx-auto px-4 sm:px-7">
        <PlatformReveal className="max-w-[820px] mx-auto text-center">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-ink-3 font-medium">
            How it works
          </p>
          <h2 className="mt-4 font-display font-semibold tracking-[-0.048em] leading-none text-ink text-[36px] sm:text-[60px] lg:text-[76px]">
            Three steps to <span className="text-accent">open.</span>
          </h2>
        </PlatformReveal>

        <div className="mt-14 sm:mt-20 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-12 items-center">
          <ol className="divide-y divide-line border-t border-b border-line">
            {PLATFORM_STEPS.map((s, idx) => {
              const isSelected = activeStep === idx;
              return (
                <li key={s.label}>
                  <button
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    onMouseEnter={() => setActiveStep(idx)}
                    aria-pressed={isSelected}
                    className="relative w-full text-left py-6 sm:py-7 px-3 flex items-start gap-5 group cursor-pointer transition-colors hover:bg-paper-2/50 rounded-xl"
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="workflow-step-bar"
                        aria-hidden="true"
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 380, damping: 32 }
                        }
                        className="absolute left-0 top-5 bottom-5 w-[3px] rounded-full bg-accent"
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className={`font-devanagari text-[52px] sm:text-[64px] leading-[0.9] shrink-0 w-10 sm:w-12 transition-transform duration-200 ${
                        isSelected
                          ? "text-accent scale-105"
                          : "text-ink-3 group-hover:text-accent group-hover:scale-105"
                      }`}
                    >
                      {s.num}
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] tracking-[0.1em] text-ink-3">
                        {s.label}
                      </p>
                      <h3 className="mt-1 font-display font-semibold tracking-[-0.03em] text-[24px] sm:text-[28px] leading-tight text-ink">
                        {s.title}
                      </h3>
                      <p className="mt-1.5 text-[15px] text-ink-2 leading-relaxed max-w-[420px]">
                        {s.desc}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>

          <PlatformReveal delayMs={120}>
            <div className="rounded-3xl bg-card border border-line p-5 sm:p-6 min-h-[360px] flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-line">
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
                  {PLATFORM_STEPS[activeStep]?.label} · Live preview
                </span>
                <div className="flex items-center gap-1.5">
                  {PLATFORM_STEPS.map((s, idx) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setActiveStep(idx)}
                      aria-label={`Preview ${s.title}`}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        activeStep === idx ? "w-5 bg-accent" : "w-2 bg-line-strong"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center py-5">
                <AnimatePresence mode="wait">
                  {activeStep === 0 && (
                    <motion.div
                      key="step-0"
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.28, ease: STEP_EASE }}
                      className="space-y-4"
                    >
                      <div className="rounded-2xl overflow-hidden aspect-[16/9] bg-paper-2 border border-line relative">
                        <Image
                          src="/images/platform/hero-patan-roaster.webp"
                          alt="Independent coffee roaster in Patan preparing specialty coffee orders"
                          width={1376}
                          height={768}
                          sizes="(max-width: 1024px) 100vw, 440px"
                          className="w-full h-full object-cover object-[74%_24%]"
                        />
                      </div>
                      <div className="rounded-2xl bg-paper-2 border border-line p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-8 h-8 rounded-full bg-card border border-line flex items-center justify-center text-accent shrink-0">
                            <Store className="w-4 h-4" />
                          </span>
                          <span className="font-mono text-[13px] text-ink truncate">
                            shopcraft.me/s/himalayan-roasters
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-paid-bg text-paid-ink px-2.5 py-1 font-mono text-[10.5px] font-semibold shrink-0">
                          <Check className="w-3 h-3" />
                          <span>Ready</span>
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {activeStep === 1 && (
                    <motion.div
                      key="step-1"
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.28, ease: STEP_EASE }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2 text-xs font-mono text-ink-3">
                        <Palette className="w-3.5 h-3.5 text-accent" />
                        <span>4 storefront presets · switch anytime</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {STOREFRONT_THEMES.map((t) => (
                          <div
                            key={t.id}
                            className="rounded-2xl border p-3.5 flex flex-col justify-between gap-3"
                            style={{
                              backgroundColor: t.tokens.canvas,
                              color: t.tokens.ink,
                              borderColor: t.tokens.borderSubtle,
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className="text-[13.5px] font-semibold truncate"
                                style={{ fontFamily: t.fontPairing.displayCssStack }}
                              >
                                {t.displayName}
                              </span>
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: t.tokens.primary }}
                              />
                            </div>
                            <p
                              className="font-mono text-[10px] truncate"
                              style={{ color: t.tokens.ink2 }}
                            >
                              {t.fontPairing.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeStep === 2 && (
                    <motion.div
                      key="step-2"
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.28, ease: STEP_EASE }}
                      className="rounded-2xl bg-paper-2 border border-line p-4 space-y-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-20 rounded-xl overflow-hidden border border-line shrink-0">
                          <Image
                            src="/images/platform/look-editorial-coffee.webp"
                            alt="Gulmi Reserve Bourbon coffee pouch"
                            width={800}
                            height={600}
                            sizes="96px"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-accent font-semibold">
                            Product · NPR pricing
                          </p>
                          <p className="text-[17px] font-semibold text-ink truncate mt-0.5">
                            Gulmi Reserve Bourbon
                          </p>
                          <p className="font-mono text-[14px] text-ink-2 mt-0.5">
                            Rs. 750
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-line">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink-2">
                          <Tag className="w-3.5 h-3.5 text-accent" />
                          <span>Variants: 250g · 500g · 1kg</span>
                        </div>
                        <span className="rounded-full bg-btn text-btn-ink px-3 py-1 text-[11px] font-semibold">
                          In stock
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-3 border-t border-line flex items-center justify-between gap-2 text-xs text-ink-3 font-mono">
                <span>Nepali shop workflow · 3 steps</span>
                <span>Free while in beta</span>
              </div>
            </div>
          </PlatformReveal>
        </div>
      </div>
    </section>
  );
}
