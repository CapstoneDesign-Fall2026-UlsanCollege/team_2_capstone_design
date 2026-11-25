import React from "react";
import { StoreNameForm } from "@/components/platform/StoreNameForm";
import { PlatformReveal } from "@/components/platform/PlatformReveal";

export function ClosingCtaSection() {
  return (
    <section className="relative overflow-hidden text-center pt-20 sm:pt-32 bg-paper border-t border-line">
      <PlatformReveal className="max-w-[1180px] mx-auto px-4 sm:px-7">
        <p className="font-devanagari text-[34px] sm:text-[68px] lg:text-[90px] leading-[1.1] text-accent">
          तपाईंको पसल, आजै।
        </p>
        <h2 className="mt-3 font-display font-semibold tracking-[-0.048em] leading-none text-ink text-[32px] sm:text-[50px] lg:text-[58px]">
          Open your shop <span className="text-accent">today.</span>
        </h2>

        <StoreNameForm inputId="closing-store-name" />
      </PlatformReveal>

      {/* Subtle Kathmandu pagoda + Himalayan ridge line art */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 240"
        preserveAspectRatio="xMidYMax slice"
        className="block w-full h-auto mt-10 sm:mt-16"
      >
        <path
          d="M0,240 L0,175 L110,136 L190,162 L300,86 L372,128 L470,54 L560,116 L640,90 L720,138 L820,74 L900,120 L1010,36 L1100,108 L1190,82 L1290,138 L1380,106 L1440,126 L1440,240Z"
          fill="var(--sc-paper-2)"
          stroke="var(--sc-accent)"
          strokeOpacity="0.42"
          strokeWidth="1.4"
        />
        <g
          transform="translate(250,240)"
          fill="var(--sc-paper)"
          stroke="var(--sc-accent)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        >
          <rect x="-50" y="-14" width="100" height="14" />
          <rect x="-32" y="-50" width="64" height="36" />
          <path d="M-68,-48 Q-42,-50 -38,-74 L38,-74 Q42,-50 68,-48Z" />
          <rect x="-24" y="-94" width="48" height="20" />
          <path d="M-50,-92 Q-30,-94 -27,-112 L27,-112 Q30,-94 50,-92Z" />
          <rect x="-17" y="-130" width="34" height="18" />
          <path d="M-36,-128 Q-20,-130 -18,-146 L18,-146 Q20,-130 36,-128Z" />
          <line x1="0" y1="-146" x2="0" y2="-176" />
          <circle cx="0" cy="-179" r="3.4" fill="var(--sc-gold)" stroke="none" />
        </g>
      </svg>
    </section>
  );
}
