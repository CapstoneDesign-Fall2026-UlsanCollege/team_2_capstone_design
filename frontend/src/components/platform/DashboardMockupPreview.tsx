"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Lock, Printer } from "lucide-react";
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
  const reduceMotion = useReducedMotion();
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
          <div className="rounded-[24px] sm:rounded-[28px] bg-card border border-line p-2.5 sm:p-4 shadow-sm">
            <div className="rounded-[16px] sm:rounded-[18px] overflow-hidden border border-line bg-paper-2">
              <div className="flex items-center justify-between gap-3 px-3.5 sm:px-4 py-2.5 border-b border-line bg-card/80">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="w-2.5 h-2.5 rounded-full bg-line-strong" />
                  <span className="w-2.5 h-2.5 rounded-full bg-line-strong" />
                  <span className="w-2.5 h-2.5 rounded-full bg-line-strong" />
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-paper-2 border border-line px-3 py-1 font-mono text-[10.5px] text-ink-2 truncate max-w-[320px]">
                  <Lock className="w-3 h-3 text-accent shrink-0" />
                  <span className="truncate">shopcraft.me/merchant/himalayan-roasters/orders</span>
                </div>
                <span className="hidden sm:inline font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-3 shrink-0">
                  Orders
                </span>
              </div>
              <div className="relative aspect-[16/9.6] sm:aspect-[16/8.8] bg-paper-2">
                <Image
                  src="/images/merchant-orders-real.png"
                  alt="ShopCraft merchant orders fulfillment table showing sample order #HR-2026-0001 paid via Khalti"
                  width={2560}
                  height={1600}
                  loading="eager"
                  decoding="sync"
                  sizes="(max-width: 1080px) 100vw, 1080px"
                  className="w-full h-full object-cover object-top block"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 lg:mt-0 lg:absolute lg:right-8 lg:-bottom-10 w-full lg:w-[340px] rounded-2xl bg-card text-ink p-5 border border-line-strong shadow-xl transition-transform duration-300 hover:-translate-y-1">
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

            <AnimatePresence mode="wait">
              <motion.div
                key={order.id}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
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
                  <motion.span
                    key={order.badge}
                    initial={reduceMotion ? false : { scale: 0.94 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 24 }}
                    className={`inline-block rounded-lg px-2.5 py-1.5 font-mono text-[11px] font-semibold tracking-[0.04em] ${
                      order.paid
                        ? "bg-paid-bg text-paid-ink"
                        : "bg-cash-bg text-cash-ink"
                    }`}
                  >
                    {order.badge}
                  </motion.span>

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
              </motion.div>
            </AnimatePresence>
          </div>
        </PlatformReveal>

        <p className="mt-6 lg:mt-16 text-center text-[13px] text-ink-3">
          Screenshot of the live merchant console. Switch between Khalti &amp; COD packing slips.
        </p>
      </div>
    </section>
  );
}
