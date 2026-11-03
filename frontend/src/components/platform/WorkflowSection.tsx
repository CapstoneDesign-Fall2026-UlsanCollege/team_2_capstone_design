"use client";

import React from "react";
import { ArrowRight, BellRing, Layers, PackageCheck, ShoppingBag } from "lucide-react";

export function WorkflowSection() {
  const STEPS = [
    {
      num: "01",
      title: "Customer places order",
      desc: "Shoppers select grind or size variants on your hosted storefront and checkout in seconds via Khalti or Cash on Delivery.",
      icon: ShoppingBag,
      tag: "Storefront Checkout",
    },
    {
      num: "02",
      title: "Workspace & roast sync",
      desc: "Incoming orders immediately sync to your unified merchant console with instant payment status and batch production counts.",
      icon: Layers,
      tag: "Real-time Order Feed",
    },
    {
      num: "03",
      title: "Stock reservation & dispatch",
      desc: "Inventory deducts across variants automatically. 1-click printable 4x6\" thermal shipping waybills for Pathao couriers.",
      icon: PackageCheck,
      tag: "Automated Logistics",
    },
    {
      num: "04",
      title: "Real-time customer updates",
      desc: "Automated dispatch notifications with live courier tracking links sent directly to the customer's mobile phone.",
      icon: BellRing,
      tag: "Delivery Confirmation",
    },
  ];

  return (
    <section id="workflow" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-200 dark:border-white/5 scroll-mt-20">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full inline-block">
          One connected workflow
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
          From checkout to everything that follows
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-sans max-w-xl mx-auto">
          Every step of the customer journey coordinated in a single, calm merchant workspace.
        </p>
      </div>

      {/* Sequential 4-Step Cards Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.num}
              className="group p-6 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#141416] hover:bg-zinc-50 dark:hover:bg-[#18181b] hover:border-zinc-300 dark:hover:border-white/20 transition-all flex flex-col justify-between shadow-lg shadow-black/5 dark:shadow-black/40 text-left relative"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black font-mono text-zinc-400 dark:text-zinc-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {s.num}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400/90 font-bold block mb-1">
                    {s.tag}
                  </span>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                    {s.title}
                  </h3>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                  {s.desc}
                </p>
              </div>

              {idx < STEPS.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-zinc-400 dark:text-zinc-600">
                  <ArrowRight className="w-5 h-5 opacity-40" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
