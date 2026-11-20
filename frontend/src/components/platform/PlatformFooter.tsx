import React from "react";
import Link from "next/link";
import { ShopCraftLogo } from "@/components/platform/ShopCraftLogo";

const linkClass =
  "inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-2.5 py-2 text-band-ink-2 hover:text-band-ink transition-colors";

export function PlatformFooter() {
  return (
    <footer className="bg-band text-band-ink-2 py-8 sm:py-9 text-[13px]">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-7 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-4">
        <p className="inline-flex flex-wrap items-center gap-2">
          <ShopCraftLogo
            markClassName="w-5 h-5 shrink-0"
            wordmarkClassName="text-[15px]"
            tone="onBand"
          />
          <span>· A capstone project, built in Nepal. Free while in beta.</span>
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 w-full sm:w-auto">
          <span className="font-devanagari text-base text-gold w-full sm:w-auto">
            नेपालमा बनेको
          </span>
          <Link href="/about" className={linkClass}>
            About
          </Link>
          <Link href="/privacy" className={linkClass}>
            Privacy
          </Link>
          <Link href="/terms" className={linkClass}>
            Terms
          </Link>
          <a href="mailto:hello@shopcraft.me" className={linkClass}>
            hello@shopcraft.me
          </a>
        </div>
      </div>
    </footer>
  );
}
