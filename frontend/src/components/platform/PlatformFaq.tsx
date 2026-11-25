"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PlatformReveal } from "@/components/platform/PlatformReveal";
import { PLATFORM_FAQS } from "@/components/platform/platform-content";

export function PlatformFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="py-20 sm:py-28 bg-paper-2 border-t border-line scroll-mt-16"
    >
      <div className="max-w-[1180px] mx-auto px-4 sm:px-7 grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-10 lg:gap-20 items-start">
        <PlatformReveal>
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-ink-3 font-medium">
            Questions
          </p>
          <h2 className="mt-3.5 font-display font-semibold tracking-[-0.048em] leading-none text-ink text-[36px] sm:text-[54px] lg:text-[66px]">
            Questions before <span className="text-accent">you start.</span>
          </h2>
        </PlatformReveal>

        <PlatformReveal delayMs={80}>
          <div className="divide-y divide-line border-t border-b border-line">
            {PLATFORM_FAQS.map((faq, idx) => {
              const isOpen = openIdx === idx;
              const panelId = `faq-panel-${idx}`;
              return (
                <div key={faq.q}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="w-full min-h-[56px] py-5 sm:py-6 flex items-center justify-between gap-4 text-left group cursor-pointer"
                  >
                    <span className="text-lg sm:text-[19px] font-semibold tracking-[-0.01em] text-ink group-hover:text-accent transition-colors">
                      {faq.q}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-accent" : "text-ink-2"
                      }`}
                    />
                  </button>
                  <div
                    id={panelId}
                    data-open={isOpen ? "true" : "false"}
                    className="platform-accordion-body"
                  >
                    <div className="platform-accordion-inner">
                      <p className="pb-6 text-[15.5px] text-ink-2 leading-relaxed max-w-[580px]">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </PlatformReveal>
      </div>
    </section>
  );
}
