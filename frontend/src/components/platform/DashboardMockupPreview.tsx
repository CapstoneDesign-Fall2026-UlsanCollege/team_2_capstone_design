"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

const VIEWS = [
  {
    id: "home" as const,
    label: "Store home",
    src: "/images/merchant-dashboard-real.png",
    alt: "Real screenshot of the ShopCraft merchant dashboard showing setup progress, orders to dispatch, and NPR performance cards",
    url: "shopcraft.me/merchant/himalayan-roasters",
  },
  {
    id: "orders" as const,
    label: "Orders queue",
    src: "/images/merchant-orders-real.png",
    alt: "Real screenshot of the ShopCraft orders fulfillment table showing a paid Rs. 1,450 order ready to ship",
    url: "shopcraft.me/merchant/himalayan-roasters/orders",
  },
];

export function DashboardMockupPreview() {
  const [activeId, setActiveId] = useState<"home" | "orders">("home");
  const activeView = VIEWS.find((v) => v.id === activeId) || VIEWS[0];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {VIEWS.map((view) => {
            const selected = view.id === activeId;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => setActiveId(view.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold cursor-pointer transition-colors ${
                  selected
                    ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"
                    : "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-white/10"
                }`}
              >
                {view.label}
              </button>
            );
          })}
        </div>

        <Link
          href="/s/himalayan-roasters"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
        >
          <span>Open Himalayan Coffee Roasters storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121214] overflow-hidden shadow-sm">
        <Image
          src={activeView.src}
          alt={activeView.alt}
          width={2560}
          height={1600}
          className="w-full h-auto block"
          priority={false}
        />
      </div>

      <p className="mt-3 text-xs font-mono text-zinc-500 text-center">
        Screenshot from{" "}
        <span className="text-zinc-700 dark:text-zinc-300">{activeView.url}</span>
      </p>
    </div>
  );
}
