"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { StoreNameForm, slugifyStoreName } from "@/components/platform/StoreNameForm";
import { ThemeTemplateStudio } from "@/components/platform/ThemeTemplateStudio";

const PRAYER_FLAG_COLORS = [
  "var(--sc-flag-blue)",
  "var(--sc-card)",
  "var(--sc-flag-red)",
  "var(--sc-flag-green)",
  "var(--sc-flag-yellow)",
];

function buildPrayerFlagPoints() {
  const p0 = [-20, 14];
  const p1 = [720, 62];
  const p2 = [1460, 14];
  const count = 44;
  const items: { x: number; y: number; angle: number; color: string }[] = [];

  for (let i = 1; i < count; i++) {
    const t = i / count;
    const oneMinus = 1 - t;
    const x = oneMinus * oneMinus * p0[0] + 2 * oneMinus * t * p1[0] + t * t * p2[0];
    const y = oneMinus * oneMinus * p0[1] + 2 * oneMinus * t * p1[1] + t * t * p2[1];
    const dx = 2 * oneMinus * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * oneMinus * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    items.push({
      x,
      y,
      angle,
      color: PRAYER_FLAG_COLORS[i % PRAYER_FLAG_COLORS.length],
    });
  }

  return items;
}

export function HomeInteractiveTop() {
  const [storeName, setStoreName] = useState("");
  const [bagCount, setBagCount] = useState(1);
  const [bagPulse, setBagPulse] = useState(0);
  const prayerFlags = useMemo(() => buildPrayerFlagPoints(), []);
  const resolvedSlug = slugifyStoreName(storeName);
  const previewBrand = storeName.trim() || "Himalayan Roasters";

  const handleAddSample = () => {
    setBagCount((c) => c + 1);
    setBagPulse((k) => k + 1);
  };

  return (
    <>
      {/* 1. Hero: Mountain silhouette, prayer flags, one input, storefront peek above the fold */}
      <section className="relative pt-6 sm:pt-8 pb-0 overflow-hidden bg-paper text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 right-0 h-[560px] sm:h-[740px] platform-mtn-wrap"
        >
          <Image
            src="/images/hero-mountain.jpg"
            alt=""
            width={1024}
            height={572}
            priority
            fetchPriority="high"
            sizes="100vw"
            className="w-full h-full object-cover object-[center_22%] platform-mtn-img"
          />
        </div>

        {/* Lungta Prayer Flag String (decorative only) */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 96"
          preserveAspectRatio="xMidYMin slice"
          className="pointer-events-none absolute top-0 left-0 w-full h-11 sm:h-20 z-[2]"
        >
          <path
            d="M-20,14 Q720,62 1460,14"
            fill="none"
            stroke="var(--sc-line-strong)"
            strokeWidth="1.2"
          />
          {prayerFlags.map((flag, idx) => (
            <g
              key={idx}
              transform={`translate(${flag.x.toFixed(1)},${flag.y.toFixed(1)}) rotate(${flag.angle.toFixed(1)})`}
            >
              <rect
                x="-8"
                y="0"
                width="16"
                height="20"
                rx="1"
                fill={flag.color}
                fillOpacity="0.92"
              />
            </g>
          ))}
        </svg>

        <div className="relative z-10 max-w-[1180px] mx-auto px-4 sm:px-7 pt-6 sm:pt-5">
          <div className="inline-flex items-center gap-3 text-[13.5px] font-medium text-ink-2">
            <span className="font-devanagari text-[22px] text-accent leading-none">
              नमस्ते
            </span>
            <span aria-hidden="true" className="w-6 h-px bg-line-strong" />
            <span>Welcome to ShopCraft</span>
          </div>

          <h1 className="mt-4 mx-auto max-w-[1040px] font-display font-semibold tracking-[-0.048em] leading-none text-ink text-[38px] sm:text-[64px] lg:text-[82px]">
            Your shop, online, before your{" "}
            <span className="text-accent">chiya</span> cools.
          </h1>

          <p className="mt-4 sm:mt-5 mx-auto max-w-[560px] text-base sm:text-[19px] text-ink-2 leading-relaxed">
            Set up your online store in Nepal and add your products. Customers pay with Khalti or cash on delivery.
          </p>

          <StoreNameForm
            value={storeName}
            onChange={setStoreName}
            showMeta
            inputId="hero-store-name"
          />

          {/* Compact Storefront Preview Rising Into the First Fold */}
          <div className="relative z-10 w-full max-w-[340px] sm:max-w-[320px] mx-auto mt-5">
            {/* Desktop floating sample badges */}
            <div className="hidden xl:block absolute -left-[256px] top-[76px] min-w-[214px] rounded-2xl p-4 text-left bg-card border border-line transition-transform duration-300 hover:-translate-y-1">
              <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-3">
                Sample order
              </p>
              <p className="text-[14.5px] font-semibold text-ink mt-1">
                #HR-1044 · Rs. 1,450
              </p>
              <span className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cash-bg text-cash-ink">
                Cash to collect
              </span>
            </div>

            <div className="hidden xl:block absolute -right-[262px] top-4 min-w-[214px] rounded-2xl p-4 text-left bg-card border border-line transition-transform duration-300 hover:-translate-y-1">
              <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-3">
                Deliver to
              </p>
              <p className="text-[14.5px] font-semibold text-ink mt-1">
                Ward 04, Kathmandu
              </p>
              <p className="text-xs text-ink-2 mt-0.5">Bagmati Province</p>
            </div>

            <div className="hidden xl:block absolute -right-[236px] top-[146px] min-w-[214px] rounded-2xl p-4 text-left bg-card border border-line transition-transform duration-300 hover:-translate-y-1">
              <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-3">
                Payment
              </p>
              <p className="text-[14.5px] font-semibold text-ink mt-1">
                Khalti · test mode
              </p>
              <p className="text-xs text-ink-2 mt-0.5">Until you add your live key</p>
            </div>

            {/* Hardware bezel on sm+, borderless native store card on <640px */}
            <div className="sm:rounded-t-[42px] sm:p-2.5 sm:pb-0 sm:platform-phone-shell sm:border sm:border-line-strong sm:border-b-0">
              <div className="relative rounded-t-[18px] sm:rounded-t-[33px] border border-line sm:border-0 border-b-0 platform-screen-editorial px-[18px] pt-5 sm:pt-10 pb-7 text-left overflow-hidden">
                <div
                  aria-hidden="true"
                  className="hidden sm:block absolute top-2.5 left-1/2 -translate-x-1/2 w-[84px] h-[22px] rounded-full platform-phone-island"
                />

                <div className="flex items-center justify-between gap-2">
                  <span className="font-serif-brand text-[18px] truncate">
                    {previewBrand}
                  </span>
                  <span
                    key={bagCount}
                    className="font-mono text-[10.5px] px-2.5 py-1 rounded-full screen-badge shrink-0 platform-pop-in"
                  >
                    Bag ({bagCount})
                  </span>
                </div>

                <div className="mt-3 rounded-[14px] overflow-hidden aspect-[16/9] screen-photo">
                  <Image
                    src="/images/products/gulmi-reserve.svg"
                    alt="Gulmi Reserve Bourbon"
                    width={800}
                    height={800}
                    unoptimized
                    className="w-full h-full object-cover block"
                  />
                </div>

                <p className="text-[11px] screen-muted mt-3">
                  Single-origin coffee · 250g
                </p>
                <p className="font-serif-brand text-[20px] leading-tight mt-0.5">
                  Gulmi Reserve Bourbon
                </p>

                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <span className="font-mono text-sm font-medium">Rs. 750</span>
                  <div className="flex items-center gap-2">
                    {bagPulse > 0 && (
                      <span
                        key={bagPulse}
                        aria-live="polite"
                        className="font-mono text-[11px] font-semibold screen-muted platform-pop-in"
                      >
                        +1 added
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleAddSample}
                      className="min-h-[44px] sm:min-h-[36px] px-4 rounded-full text-xs font-medium screen-cta cursor-pointer transition-transform duration-150 active:scale-95"
                    >
                      Add to bag
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Staggered Desktop / Swipeable Mobile Storefront Looks */}
      <ThemeTemplateStudio storeName={storeName} slug={resolvedSlug} />
    </>
  );
}
