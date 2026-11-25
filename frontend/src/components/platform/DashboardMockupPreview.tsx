"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Printer } from "lucide-react";
import { PlatformReveal } from "@/components/platform/PlatformReveal";

const SLIP_ORDERS = [
  {
    id: "#HR-2026-0001",
    customer: "Aarav Shrestha",
    ward: "Ward 04, Kathmandu",
    province: "Bagmati Province",
    items: "2 × Gulmi Reserve Bourbon (250g)",
    badge: "PAID VIA KHALTI · Rs. 1,450",
    paid: true,
  },
  {
    id: "#HR-1044",
    customer: "Sita Gurung",
    ward: "Ward 06, Kaski (Pokhara)",
    province: "Gandaki Province",
    items: "1 × Nuwakot Heritage Roast (500g)",
    badge: "COLLECT CASH · Rs. 1,450",
    paid: false,
  },
] as const;

export function DashboardMockupPreview() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [printed, setPrinted] = useState(false);
  const order = SLIP_ORDERS[selectedIdx] ?? SLIP_ORDERS[0];

  return (
    <section
      id="orders"
      className="py-20 sm:py-32 bg-paper-2 border-y border-line scroll-mt-16"
    >
      <div className="max-w-[1180px] mx-auto px-4 sm:px-7">
        <PlatformReveal className="max-w-[820px] mx-auto text-center">
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
        </PlatformReveal>

        <PlatformReveal delayMs={90} className="relative max-w-[1080px] mx-auto mt-12 sm:mt-16">
          <div className="relative aspect-[16/9.2] sm:aspect-[16/5.9] overflow-hidden rounded-2xl sm:rounded-3xl bg-card border border-line">
            <Image
              src="/images/merchant-orders-real.png"
              alt="ShopCraft merchant orders fulfillment table showing sample order #HR-2026-0001 paid via Khalti"
              width={2560}
              height={1600}
              loading="eager"
              decoding="sync"
              sizes="(max-width: 1080px) 100vw, 1080px"
              className="absolute max-w-none w-[174%] -left-[27%] -top-[15.5%] sm:w-[140%] sm:-left-[29.5%] sm:-top-[16%]"
            />
          </div>

          <div className="mt-3.5 lg:mt-0 lg:absolute lg:-right-6 lg:-bottom-12 w-full lg:w-[332px] rounded-xl bg-card text-ink p-5 border border-line-strong lg:rotate-[1.5deg] transition-transform duration-300 hover:lg:rotate-0">
            <div className="flex items-center justify-between gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-ink-3">
              <span>Packing slip</span>
              <div className="flex items-center gap-1">
                {SLIP_ORDERS.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedIdx(idx);
                      setPrinted(false);
                    }}
                    aria-pressed={idx === selectedIdx}
                    className={`min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-0 px-2.5 rounded-md text-[10px] font-mono tracking-normal transition-colors cursor-pointer ${
                      idx === selectedIdx
                        ? "bg-btn text-btn-ink font-semibold"
                        : "bg-paper-2 text-ink-2 hover:text-ink"
                    }`}
                  >
                    {idx === 0 ? "Khalti" : "COD"}
                  </button>
                ))}
              </div>
            </div>

            <div key={order.id} className="platform-pop-in">
              <p className="font-mono text-[15px] font-semibold text-ink mt-2.5">
                {order.id}
              </p>
              <hr className="border-0 border-t border-dashed border-line-strong my-3" />
              <div className="text-[12.5px] text-ink-2 leading-relaxed">
                <p className="font-semibold text-ink">{order.customer}</p>
                <p>{order.ward}</p>
                <p>{order.province}</p>
              </div>
              <hr className="border-0 border-t border-dashed border-line-strong my-3" />
              <p className="text-[12.5px] text-ink-2">{order.items}</p>

              <div className="mt-3.5 flex items-center justify-between gap-2">
                <span
                  className={`inline-block rounded-lg px-2.5 py-1.5 font-mono text-[11px] font-semibold tracking-[0.04em] ${
                    order.paid
                      ? "bg-paid-bg text-paid-ink"
                      : "bg-cash-bg text-cash-ink"
                  }`}
                >
                  {order.badge}
                </span>

                <button
                  type="button"
                  onClick={() => setPrinted(true)}
                  aria-label="Preview packing slip print formatting"
                  className="min-h-[44px] sm:min-h-[32px] px-2.5 rounded-lg border border-line text-[11px] font-medium text-ink-2 hover:text-ink hover:bg-paper-2 inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>

              {printed && (
                <p
                  aria-live="polite"
                  className="mt-2 font-mono text-[11px] text-accent platform-pop-in"
                >
                  Ready for A4 / 80mm thermal slip
                </p>
              )}
            </div>
          </div>
        </PlatformReveal>

        <p className="mt-6 lg:mt-20 text-center text-[13px] text-ink-3">
          Screenshot of the live merchant console. Switch between Khalti &amp; COD packing slips.
        </p>
      </div>
    </section>
  );
}
