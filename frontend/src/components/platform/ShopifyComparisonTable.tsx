"use client";

import React, { useState } from "react";
import { Check, X, AlertTriangle } from "lucide-react";

type CategoryFilter = "all" | "payments" | "logistics" | "subscriptions" | "cost";

interface ComparisonRow {
  feature: string;
  category: "payments" | "logistics" | "subscriptions" | "cost";
  shopcraft: {
    status: "yes" | "warning" | "no";
    label: string;
  };
  shopify: {
    status: "yes" | "warning" | "no";
    label: string;
  };
  instagram: {
    status: "yes" | "warning" | "no";
    label: string;
  };
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Monthly Software Cost",
    category: "cost",
    shopcraft: { status: "yes", label: "Rs. 0 (Free in Beta)" },
    shopify: { status: "no", label: "$39/mo (~Rs. 5,200)" },
    instagram: { status: "warning", label: "Free (20h/wk lost)" },
  },
  {
    feature: "Foreign USD Dollar Card",
    category: "cost",
    shopcraft: { status: "yes", label: "Not Needed (100% NPR)" },
    shopify: { status: "no", label: "Requires $500 Card" },
    instagram: { status: "yes", label: "Not Needed" },
  },
  {
    feature: "Khalti Web Wallet",
    category: "payments",
    shopcraft: { status: "yes", label: "Native 1-Tap" },
    shopify: { status: "no", label: "Not Supported" },
    instagram: { status: "no", label: "Manual Screenshots" },
  },
  {
    feature: "Cash on Delivery (COD)",
    category: "payments",
    shopcraft: { status: "yes", label: "Verified Phone Guard" },
    shopify: { status: "warning", label: "Basic Checkbox Only" },
    instagram: { status: "warning", label: "Unverified / High Return" },
  },
  {
    feature: "Nepali Ward & Province Dropdowns",
    category: "logistics",
    shopcraft: { status: "yes", label: "7 Provinces + 753 Municipalities" },
    shopify: { status: "no", label: "Forces US Zip Codes" },
    instagram: { status: "no", label: "Manual Chat Copy-Paste" },
  },
  {
    feature: "Pathao Courier Waybills",
    category: "logistics",
    shopcraft: { status: "yes", label: "1-Click Thermal Print" },
    shopify: { status: "no", label: "Manual Portal Entry" },
    instagram: { status: "no", label: "Manual Copy-Paste" },
  },
  {
    feature: "Consumable Subscriptions",
    category: "subscriptions",
    shopcraft: { status: "yes", label: "Prepaid 3/6/12 + WhatsApp" },
    shopify: { status: "no", label: "Requires $99/mo App" },
    instagram: { status: "no", label: "Manual Notes" },
  },
  {
    feature: "Mobile In-App Browser Speed",
    category: "logistics",
    shopcraft: { status: "yes", label: "Sub-2.8s on 4G" },
    shopify: { status: "warning", label: "5-8s with heavy plugins" },
    instagram: { status: "yes", label: "Native App" },
  },
];

export function ShopifyComparisonTable() {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("all");

  const filteredRows =
    activeFilter === "all"
      ? COMPARISON_ROWS
      : COMPARISON_ROWS.filter((r) => r.category === activeFilter);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-left">
      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[
          { id: "all", label: "All Features" },
          { id: "payments", label: "Payments" },
          { id: "logistics", label: "Logistics" },
          { id: "subscriptions", label: "Subscriptions" },
          { id: "cost", label: "Pricing & Currency" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id as CategoryFilter)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
              activeFilter === tab.id
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Clean Comparison Matrix */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 overflow-hidden shadow-2xs">
        {/* Table Header */}
        <div className="grid grid-cols-12 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-3.5 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
          <div className="col-span-5 sm:col-span-4">Capability</div>
          <div className="col-span-7 sm:col-span-8 grid grid-cols-3 gap-2 text-center">
            <div className="text-emerald-700 dark:text-emerald-400 font-bold">ShopCraft 🇳🇵</div>
            <div className="text-zinc-500">Shopify</div>
            <div className="text-zinc-500">Instagram DMs</div>
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {filteredRows.map((row, idx) => (
            <div
              key={row.feature}
              className={`grid grid-cols-12 px-4 sm:px-6 py-3.5 items-center gap-2 text-xs transition-colors ${
                idx % 2 === 0 ? "bg-white dark:bg-zinc-900/40" : "bg-zinc-50/50 dark:bg-zinc-900/80"
              }`}
            >
              <div className="col-span-5 sm:col-span-4 font-bold text-zinc-900 dark:text-white truncate">
                {row.feature}
              </div>

              <div className="col-span-7 sm:col-span-8 grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
                {/* ShopCraft */}
                <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 py-1.5 px-2 rounded-xl">
                  <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                  <span className="truncate">{row.shopcraft.label}</span>
                </div>

                {/* Shopify */}
                <div className="flex items-center justify-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400 py-1.5 px-2 rounded-xl">
                  {row.shopify.status === "no" ? (
                    <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className="truncate">{row.shopify.label}</span>
                </div>

                {/* Instagram */}
                <div className="flex items-center justify-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400 py-1.5 px-2 rounded-xl">
                  {row.instagram.status === "no" ? (
                    <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  ) : row.instagram.status === "warning" ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  )}
                  <span className="truncate">{row.instagram.label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
