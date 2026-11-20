import React from "react";

const SILK_WAVE_UPPER_PATH =
  "M46 14.5C46 12.6 44.4 11 42.5 11H25.5C17.4 11 12 16.2 12 23.2C12 29.8 16.8 34.4 25.2 35.4H29L31.4 28H26.2C21.4 27.4 19.2 25.6 19.2 23C19.2 20 21.8 18.2 26.2 18.2H42.5C44.4 18.2 46 16.6 46 14.5Z";
const SILK_WAVE_LOWER_PATH =
  "M18 49.5C18 51.4 19.6 53 21.5 53H38.5C46.6 53 52 47.8 52 40.8C52 34.2 47.2 29.6 38.8 28.6H35L32.6 36H37.8C42.6 36.6 44.8 38.4 44.8 41C44.8 44 42.2 45.8 37.8 45.8H21.5C19.6 45.8 18 47.4 18 49.5Z";

export type ShopCraftBrandTone = "theme" | "onBand";

interface ShopCraftMarkProps {
  className?: string;
  tone?: ShopCraftBrandTone;
}

/** Silk Wave brand icon mark for ShopCraft platform surfaces. */
export function ShopCraftMark({
  className = "w-7 h-7",
  tone = "theme",
}: ShopCraftMarkProps) {
  const upperFill = tone === "onBand" ? "fill-band-ink" : "fill-btn";
  const lowerFill = tone === "onBand" ? "fill-band-accent" : "fill-accent";

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path d={SILK_WAVE_UPPER_PATH} className={upperFill} />
      <path d={SILK_WAVE_LOWER_PATH} className={lowerFill} />
    </svg>
  );
}

interface ShopCraftWordmarkProps {
  className?: string;
  tone?: ShopCraftBrandTone;
}

/** Paired geometric sans + italic serif wordmark ("ShopCraft"). */
export function ShopCraftWordmark({
  className = "text-[17px]",
  tone = "theme",
}: ShopCraftWordmarkProps) {
  const primaryText = tone === "onBand" ? "text-band-ink" : "text-ink";
  const accentText = tone === "onBand" ? "text-band-accent" : "text-accent";

  return (
    <span className={`tracking-tight leading-none inline-flex items-baseline ${primaryText} ${className}`}>
      <span className="font-semibold">Shop</span>
      <span className={`font-serif-brand italic font-normal text-[1.14em] ${accentText}`}>
        Craft
      </span>
    </span>
  );
}

interface ShopCraftLogoProps {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  tone?: ShopCraftBrandTone;
}

/** Complete horizontal ShopCraft brand lockup (Silk Wave mark + ShopCraft wordmark). */
export function ShopCraftLogo({
  className = "inline-flex items-center gap-2",
  markClassName = "w-7 h-7 shrink-0",
  wordmarkClassName = "text-[17px]",
  tone = "theme",
}: ShopCraftLogoProps) {
  return (
    <span className={className}>
      <ShopCraftMark className={markClassName} tone={tone} />
      <ShopCraftWordmark className={wordmarkClassName} tone={tone} />
    </span>
  );
}
