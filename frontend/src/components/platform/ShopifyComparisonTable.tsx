"use client";

import React, { useState } from "react";
import {
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Sparkles,
  Smartphone,
  MapPin,
  CreditCard,
  Repeat,
  DollarSign,
  TrendingUp,
} from "lucide-react";

type CategoryFilter = "all" | "payments" | "logistics" | "subscriptions" | "cost";

interface ComparisonRow {
  feature: string;
  category: "payments" | "logistics" | "subscriptions" | "cost";
  shopcraft: {
    title: string;
    description: string;
    status: "yes" | "warning" | "no";
  };
  shopify: {
    title: string;
    description: string;
    status: "yes" | "warning" | "no";
  };
  instagram: {
    title: string;
    description: string;
    status: "yes" | "warning" | "no";
  };
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Monthly Platform Cost",
    category: "cost",
    shopcraft: {
      title: "Rs. 0 / month",
      description: "Free forever during Beta. No international USD credit card or Nepal Rastra Bank Dollar Card required.",
      status: "yes",
    },
    shopify: {
      title: "$39 / month (~Rs. 5,200/mo)",
      description: "Charged in foreign USD. Depletes your $500 annual prepaid Dollar Card limit just to keep your store online.",
      status: "no",
    },
    instagram: {
      title: "Rs. 0 (Hidden time loss)",
      description: "Zero upfront software fee, but costs 20+ hours per week in manual chat messaging and verifying slips.",
      status: "warning",
    },
  },
  {
    feature: "Khalti & Local Wallets",
    category: "payments",
    shopcraft: {
      title: "Native Day-One Integration",
      description: "Direct Khalti ePayment v2 sandbox with instant web redirect and verified server-side pidx callbacks.",
      status: "yes",
    },
    shopify: {
      title: "Not Supported Natively",
      description: "Requires expensive custom Shopify Plus apps or manual bank wire transfer with manual proof checking.",
      status: "no",
    },
    instagram: {
      title: "Manual Screenshot Verification",
      description: "Customers text screenshots of Fonepay/Khalti transfers. High risk of forged photos and zero auto-verification.",
      status: "no",
    },
  },
  {
    feature: "Cash on Delivery (COD)",
    category: "payments",
    shopcraft: {
      title: "Built-In with Collection Guard",
      description: "Single-tap COD checkout with automated ward dispatch receipts and rider cash collected verification.",
      status: "yes",
    },
    shopify: {
      title: "Generic Manual Method",
      description: "Offers a basic manual checkbox, but lacks Nepali courier delivery coordination and collection status tracking.",
      status: "warning",
    },
    instagram: {
      title: "Informal Arrangement",
      description: "Negotiated manually per customer in chat. Extremely high rate of fake orders and courier return fees.",
      status: "warning",
    },
  },
  {
    feature: "Address & Geographic Hierarchy",
    category: "logistics",
    shopcraft: {
      title: "7 Provinces, 77 Districts, Wards 1–35",
      description: "Native cascading Nepali selector tailored for local courier networks. Validates 10-digit 98/97 mobile numbers.",
      status: "yes",
    },
    shopify: {
      title: "Forces US/EU 'Zip Code' & State",
      description: "Nepali shoppers get stuck on mandatory 'Postal Code' fields, resulting in 40–55% checkout abandonment.",
      status: "no",
    },
    instagram: {
      title: "Unstructured Chat Text",
      description: "Shoppers send vague landmark descriptions. Couriers repeatedly call lost trying to locate the customer.",
      status: "no",
    },
  },
  {
    feature: "Delivery Fees Calculation",
    category: "logistics",
    shopcraft: {
      title: "Kathmandu Valley vs Outside Valley",
      description: "Automatically computes Inside Valley (Rs. 100) vs Outside Valley (Rs. 200) with free threshold meter.",
      status: "yes",
    },
    shopify: {
      title: "Complex Distance Zones",
      description: "Requires manual shipping zone setups that do not understand Valley vs Terai courier pricing boundaries.",
      status: "warning",
    },
    instagram: {
      title: "Manual Courier Inquiry",
      description: "Merchant manually calculates delivery per parcel by calling Pathao or Nepal Post after the chat.",
      status: "no",
    },
  },
  {
    feature: "Recurring Himalayan Subscriptions",
    category: "subscriptions",
    shopcraft: {
      title: "Prepaid Cycles & 1-Tap WhatsApp Links",
      description: "Built for Nepal's zero auto-debit banking rules. Prepaid 3M/6M commitments with automated zero-dollar fulfillment.",
      status: "yes",
    },
    shopify: {
      title: "Requires Stripe Auto-Debits",
      description: "Shopify Subscriptions rely on automated recurring card debits, which Nepali domestic debit cards block completely.",
      status: "no",
    },
    instagram: {
      title: "Purely Manual Follow-ups",
      description: "Merchant must remember to text customers every month to request a manual re-order.",
      status: "no",
    },
  },
  {
    feature: "Mobile Speed (3G / 4G Networks)",
    category: "logistics",
    shopcraft: {
      title: "0.8s Ultra-Fast PWA",
      description: "Loads instantly in Instagram & TikTok in-app browsers without heavy theme bundles or bloated scripts.",
      status: "yes",
    },
    shopify: {
      title: "3.5s – 6.0s Heavy Bundles",
      description: "Liquid themes and third-party app scripts cause noticeable lag on mobile data outside Kathmandu.",
      status: "warning",
    },
    instagram: {
      title: "Instant (inside Instagram)",
      description: "Opens inside the Instagram chat, but lacks a searchable catalog, cart, or variant selector.",
      status: "yes",
    },
  },
  {
    feature: "Store Customization & Branding",
    category: "cost",
    shopcraft: {
      title: "Curated Nepali Presets",
      description: "Editorial Warm (coffee/bakeries), Pahadi Sage (herbal/tea), Modern Minimalist. Zero CSS coding required.",
      status: "yes",
    },
    shopify: {
      title: "Paid Themes ($150–$350)",
      description: "Free themes look generic. Premium themes require USD payment and Liquid developer tweaking.",
      status: "warning",
    },
    instagram: {
      title: "Grid Only (No Website)",
      description: "No brand identity, no custom domain, no search, no automated inventory ledger.",
      status: "no",
    },
  },
];

export function ShopifyComparisonTable() {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("all");

  const filteredRows =
    activeFilter === "all"
      ? COMPARISON_ROWS
      : COMPARISON_ROWS.filter((r) => r.category === activeFilter);

  return (
    <div className="space-y-12">
      {/* ------------------------------------------------------------------- */}
      {/* 1. AT-A-GLANCE VERDICT CARDS (3-COLUMN HIGHLIGHT)                   */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ShopCraft Verdict Card (Winner) */}
        <div className="rounded-2xl border-2 border-[#C2410C] bg-white p-6 space-y-4 shadow-md relative flex flex-col justify-between">
          <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-[#C2410C] text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs">
            BUILT FOR NEPAL
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#0F2D1F] text-white text-xs flex items-center justify-center font-bold">
                  ⛰️
                </span>
                <span className="font-extrabold text-base text-zinc-950">ShopCraft</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                88%+ Conversion
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold font-mono text-zinc-950">Rs. 0</span>
                <span className="text-xs text-zinc-500 font-mono">/ month</span>
              </div>
              <p className="text-xs text-zinc-600 mt-1">
                Free hosting during Beta. Zero USD dollar card required.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-zinc-700 pt-2 border-t border-zinc-100">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Native Khalti Sandbox + Cash on Delivery</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Cascading Province → District → Ward 1–35</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Prepaid subscriptions without blocked auto-debit</span>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-zinc-100 text-[11px] font-mono text-emerald-800 font-semibold bg-emerald-50/60 p-2.5 rounded-xl text-center">
            ✓ Recommended for Nepali Brands &amp; Creators
          </div>
        </div>

        {/* Shopify Verdict Card (Fails in Nepal) */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#95BF47] text-white text-xs flex items-center justify-center font-bold">
                  S
                </span>
                <span className="font-extrabold text-base text-zinc-950">Shopify</span>
              </div>
              <span className="text-xs font-mono font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                55%+ Abandonment
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold font-mono text-zinc-950">$39</span>
                <span className="text-xs text-zinc-500 font-mono">/ mo (~Rs. 5,200)</span>
              </div>
              <p className="text-xs text-zinc-600 mt-1">
                Depletes your $500 annual prepaid Dollar Card limit.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-zinc-600 pt-2 border-t border-zinc-200/60">
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>No native Khalti/eSewa; domestic cards decline</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>Forces 5-digit US Zip Code, confusing shoppers</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>Subscriptions fail (NRB blocks card auto-debit)</span>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-zinc-200/60 text-[11px] font-mono text-red-700 bg-red-50/50 p-2.5 rounded-xl text-center">
            ✕ Built for US/EU Cards &amp; Zip Codes
          </div>
        </div>

        {/* Instagram DMs Verdict Card (Manual Chaos) */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-linear-to-tr from-[#FD5949] to-[#D6249F] text-white text-xs flex items-center justify-center font-bold">
                  IG
                </span>
                <span className="font-extrabold text-base text-zinc-950">Instagram DMs</span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                High Labor Cost
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold font-mono text-zinc-950">Rs. 0</span>
                <span className="text-xs text-zinc-500 font-mono">+ 20 hrs/wk lost</span>
              </div>
              <p className="text-xs text-zinc-600 mt-1">
                Free to text, but loses sales to manual back-and-forth.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-zinc-600 pt-2 border-t border-zinc-200/60">
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Forged Fonepay screenshots &amp; fake COD orders</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Vague landmark addresses confuse courier riders</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Zero real-time inventory or automatic re-orders</span>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-zinc-200/60 text-[11px] font-mono text-amber-800 bg-amber-50/50 p-2.5 rounded-xl text-center">
            ⚠️ Does not scale past 5 orders/day
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. THE ANNUAL COST COMPARISON CALLOUT                                */}
      {/* ------------------------------------------------------------------- */}
      <div className="rounded-2xl border border-emerald-900/15 bg-[#0F2D1F] text-white p-6 sm:p-8 shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
              THE HARD NUMBERS
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              Selling on Shopify in Nepal costs Rs. 97,900+ every year.
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
              Shopify basic plan ($39/mo = Rs. 62,400) + essential third-party apps ($20/mo = Rs. 32,000) + bank prepaid Dollar Card issuance and forex markup (3.5% = Rs. 3,500). ShopCraft is Rs. 0 during Beta.
            </p>
          </div>

          <div className="lg:col-span-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15 text-center space-y-1">
            <span className="text-[11px] font-mono text-emerald-300 uppercase tracking-wider block">
              You Save with ShopCraft
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white block">
              Rs. 97,900
            </span>
            <span className="text-[10px] font-mono text-zinc-300 block">
              Per year kept in your own pocket
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 3. INTERACTIVE CATEGORY TABS & COMPARISON MATRIX                    */}
      {/* ------------------------------------------------------------------- */}
      <div className="space-y-4">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <span className="text-xs font-mono text-zinc-500 mr-1 hidden sm:inline">Filter by:</span>
          {[
            { id: "all", label: "All Features (8)" },
            { id: "payments", label: "💳 Payments & Wallets" },
            { id: "logistics", label: "🛵 Address & Delivery" },
            { id: "subscriptions", label: "↻ Subscriptions" },
            { id: "cost", label: "💰 Fees & Currency" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as CategoryFilter)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? "bg-[#C2410C] text-white font-semibold shadow-2xs"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Detailed Comparison Table */}
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-zinc-100/80 border-b border-zinc-200 px-4 sm:px-6 py-3.5 text-xs font-mono font-bold text-zinc-800">
            <div className="col-span-5 sm:col-span-4">Capability / Feature</div>
            <div className="col-span-7 sm:col-span-8 grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div className="text-[#C2410C]">ShopCraft 🇳🇵</div>
              <div className="text-zinc-600">Shopify</div>
              <div className="text-zinc-600">Instagram DMs</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-zinc-200">
            {filteredRows.map((row, idx) => (
              <div
                key={row.feature}
                className={`grid grid-cols-12 px-4 sm:px-6 py-4 items-start gap-2 text-xs transition-colors ${
                  idx % 2 === 0 ? "bg-white" : "bg-zinc-50/50"
                }`}
              >
                {/* Feature Column */}
                <div className="col-span-5 sm:col-span-4 pr-2">
                  <p className="font-extrabold text-zinc-950">{row.feature}</p>
                  <span className="inline-block text-[9px] font-mono uppercase text-zinc-400 mt-0.5">
                    {row.category}
                  </span>
                </div>

                {/* 3 Competitor Columns */}
                <div className="col-span-7 sm:col-span-8 grid grid-cols-3 gap-2 sm:gap-4">
                  {/* ShopCraft */}
                  <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                    <div className="flex items-center gap-1 text-emerald-800 font-bold text-[11px]">
                      <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-700 shrink-0" />
                      <span>{row.shopcraft.title}</span>
                    </div>
                    <p className="text-[10px] text-zinc-600 leading-normal hidden sm:block">
                      {row.shopcraft.description}
                    </p>
                  </div>

                  {/* Shopify */}
                  <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                    <div className="flex items-center gap-1 text-zinc-800 font-semibold text-[11px]">
                      {row.shopify.status === "no" ? (
                        <X className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                      <span>{row.shopify.title}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-normal hidden sm:block">
                      {row.shopify.description}
                    </p>
                  </div>

                  {/* Instagram DMs */}
                  <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                    <div className="flex items-center gap-1 text-zinc-800 font-semibold text-[11px]">
                      {row.instagram.status === "no" ? (
                        <X className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      ) : row.instagram.status === "warning" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      )}
                      <span>{row.instagram.title}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-normal hidden sm:block">
                      {row.instagram.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
