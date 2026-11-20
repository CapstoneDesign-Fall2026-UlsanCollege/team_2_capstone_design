import React from "react";
import Image from "next/image";

export function DashboardMockupPreview() {
  return (
    <section
      id="orders"
      className="py-20 sm:py-32 bg-paper-2 border-y border-line scroll-mt-16"
    >
      <div className="max-w-[1180px] mx-auto px-4 sm:px-7">
        <div className="max-w-[820px] mx-auto text-center">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-ink-3 font-medium">
            Merchant console
          </p>
          <h2 className="mt-4 font-display font-semibold tracking-[-0.048em] leading-none text-ink text-[36px] sm:text-[60px] lg:text-[76px]">
            See every order,{" "}
            <span className="text-accent">paid or cash to collect.</span>
          </h2>
          <p className="mt-5 mx-auto max-w-[560px] text-base sm:text-lg text-ink-2 leading-relaxed">
            Orders arrive in one calm list. Open one, print the packing slip, and send it out.
          </p>
        </div>

        <div className="relative max-w-[1080px] mx-auto mt-12 sm:mt-16">
          <div className="relative aspect-[16/9.2] sm:aspect-[16/5.9] overflow-hidden rounded-2xl sm:rounded-3xl bg-card border border-line">
            <Image
              src="/images/merchant-orders-real.png"
              alt="ShopCraft merchant orders fulfillment table showing sample order #HR-2026-0001 paid via Khalti"
              width={2560}
              height={1600}
              loading="eager"
              sizes="(max-width: 1080px) 100vw, 1080px"
              className="absolute max-w-none w-[174%] -left-[27%] -top-[15.5%] sm:w-[140%] sm:-left-[29.5%] sm:-top-[16%]"
            />
          </div>

          <div className="mt-3.5 lg:mt-0 lg:absolute lg:-right-6 lg:-bottom-12 w-full lg:w-[320px] rounded-xl bg-card text-ink p-5 border border-line-strong lg:rotate-[1.8deg]">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.1em] uppercase text-ink-3">
              <span>Packing slip</span>
              <span>Sample</span>
            </div>
            <p className="font-mono text-[15px] font-semibold text-ink mt-2.5">
              #HR-2026-0001
            </p>
            <hr className="border-0 border-t border-dashed border-line-strong my-3.5" />
            <div className="text-[12.5px] text-ink-2 leading-relaxed">
              <p className="font-semibold text-ink">Aarav Shrestha</p>
              <p>Ward 04, Kathmandu</p>
              <p>Bagmati Province</p>
            </div>
            <hr className="border-0 border-t border-dashed border-line-strong my-3.5" />
            <p className="text-[12.5px] text-ink-2">
              2 × Gulmi Reserve Bourbon (250g)
            </p>
            <div className="mt-3.5 inline-block rounded-lg bg-paid-bg text-paid-ink px-3 py-1.5 font-mono text-[11.5px] font-semibold tracking-[0.04em]">
              PAID VIA KHALTI · Rs. 1,450
            </div>
          </div>
        </div>

        <p className="mt-6 lg:mt-20 text-center text-[13px] text-ink-3">
          Screenshot of the live merchant console. Packing slip matches sample order #HR-2026-0001.
        </p>
      </div>
    </section>
  );
}
