import React from "react";
import Image from "next/image";
import { PlatformReveal } from "@/components/platform/PlatformReveal";
import { PLATFORM_STEPS } from "@/components/platform/platform-content";

export function WorkflowSection() {
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

        <div className="mt-14 sm:mt-20 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-12 items-center">
          <ol className="divide-y divide-line border-t border-b border-line">
            {PLATFORM_STEPS.map((s, idx) => (
              <li key={s.label}>
                <PlatformReveal
                  delayMs={idx * 70}
                  className="py-6 sm:py-7 flex items-start gap-5 group"
                >
                  <span
                    aria-hidden="true"
                    className="font-devanagari text-[52px] sm:text-[64px] leading-[0.9] text-accent shrink-0 w-10 sm:w-12 transition-transform duration-200 group-hover:scale-105"
                  >
                    {s.num}
                  </span>
                  <div>
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
                </PlatformReveal>
              </li>
            ))}
          </ol>

          <PlatformReveal delayMs={120}>
            <div className="rounded-3xl bg-card border border-line p-2.5">
              <div className="rounded-2xl overflow-hidden aspect-[16/10] bg-paper-2">
                <Image
                  src="/images/platform/dispatch-pack.webp"
                  alt="Nepali independent shop maker wrapping kraft delivery parcels at a sunlit studio counter"
                  width={880}
                  height={495}
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 460px"
                  className="w-full h-full object-cover transition-transform duration-500 ease-out hover:scale-[1.03]"
                />
              </div>
              <div className="px-3 pt-2.5 pb-1 flex items-center justify-between gap-2 text-xs text-ink-3 font-mono">
                <span>Nepali studio · Preparing orders</span>
                <span>Free in beta</span>
              </div>
            </div>
          </PlatformReveal>
        </div>
      </div>
    </section>
  );
}
