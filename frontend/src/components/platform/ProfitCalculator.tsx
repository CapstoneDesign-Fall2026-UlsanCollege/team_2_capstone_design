"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, TrendingUp } from "lucide-react";

export function ProfitCalculator() {
  const [monthlyGmv, setMonthlyGmv] = useState(250000); // Default Rs. 250,000 / month

  // Global Shopify monthly cost calculations in NPR:
  const shopifyBaseNpr = 5265; // $39/mo
  const shopifyAppsNpr = 6750; // $50/mo local apps (COD fraud check, SMS)
  const shopifyGateFee = Math.round(monthlyGmv * 0.025);
  const shopifyForexLoss = Math.round(monthlyGmv * 0.03);
  const totalShopifyCost =
    shopifyBaseNpr + shopifyAppsNpr + shopifyGateFee + shopifyForexLoss;

  // ShopCraft Nepal monthly cost in NPR:
  const isScale = monthlyGmv > 100000;
  const shopcraftSaaS = isScale ? 2499 : 0;
  const shopcraftGatewayFee = Math.round(monthlyGmv * (isScale ? 0.005 : 0.02));
  const totalShopcraftCost = shopcraftSaaS + shopcraftGatewayFee;

  const monthlySavings = Math.max(0, totalShopifyCost - totalShopcraftCost);
  const annualSavings = monthlySavings * 12;

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-sm space-y-6 text-left transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
            <Calculator className="w-3.5 h-3.5" />
            <span>Interactive ROI</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Shopify vs. ShopCraft Fees
          </h3>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] font-mono uppercase text-zinc-400 block">
            Annual Savings
          </span>
          <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            Rs. {annualSavings.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Interactive GMV Range Slider */}
      <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/50 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-white">
          <span>Monthly Sales:</span>
          <span className="text-base sm:text-lg font-mono font-black">
            Rs. {monthlyGmv.toLocaleString()}
          </span>
        </div>

        <input
          id="gmv-slider"
          type="range"
          min={30000}
          max={1500000}
          step={10000}
          value={monthlyGmv}
          onChange={(e) => setMonthlyGmv(Number(e.target.value))}
          className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-emerald-400"
        />

        <div className="flex justify-between text-[10px] font-mono text-zinc-400 pt-0.5">
          <span>Rs. 30K</span>
          <span>Rs. 500K</span>
          <span>Rs. 1.5M+</span>
        </div>
      </div>

      {/* Side-by-Side Cost Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Shopify */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-zinc-500 uppercase">Global Shopify</span>
            <span className="text-rose-600 text-[10px] bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
              USD Markup
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-mono py-2 border-y border-zinc-200/70 dark:border-zinc-700/70">
            <div className="flex justify-between">
              <span>Basic Plan ($39):</span>
              <span className="font-bold text-zinc-900 dark:text-white">Rs. {shopifyBaseNpr.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Third-party Apps ($50):</span>
              <span className="font-bold text-zinc-900 dark:text-white">Rs. {shopifyAppsNpr.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Card &amp; Forex (5.5%):</span>
              <span className="font-bold text-zinc-900 dark:text-white">Rs. {(shopifyGateFee + shopifyForexLoss).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-zinc-500">Monthly Total:</span>
            <span className="text-base font-mono font-black text-rose-600">
              Rs. {totalShopifyCost.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ShopCraft */}
        <div className="p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-emerald-700 dark:text-emerald-400 uppercase">ShopCraft Nepal</span>
            <span className="text-emerald-700 text-[10px] bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
              100% NPR
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-emerald-900 dark:text-emerald-300 font-mono py-2 border-y border-emerald-200 dark:border-emerald-800">
            <div className="flex justify-between">
              <span>{isScale ? "Growth Plan:" : "Starter Plan:"}</span>
              <span className="font-bold">Rs. {shopcraftSaaS.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Local Apps &amp; SMS:</span>
              <span className="font-bold text-emerald-600">Rs. 0 (Included)</span>
            </div>
            <div className="flex justify-between">
              <span>Khalti &amp; COD:</span>
              <span className="font-bold">Rs. {shopcraftGatewayFee.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-emerald-800 dark:text-emerald-400">Monthly Total:</span>
            <span className="text-base font-mono font-black text-emerald-700 dark:text-emerald-400">
              Rs. {totalShopcraftCost.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Result Pill */}
      <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            Keep <strong className="text-emerald-600 dark:text-emerald-400">Rs. {monthlySavings.toLocaleString()} / mo</strong> in your business.
          </span>
        </div>

        <Link
          href="/signup"
          className="w-full sm:w-auto px-4 py-2 rounded-full bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold font-mono text-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
        >
          <span>Claim Store Free</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
