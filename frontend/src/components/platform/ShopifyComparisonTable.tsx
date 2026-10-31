"use client";

import React, { useState } from "react";
import { Check, X, AlertCircle, ArrowRight, ShieldCheck, DollarSign, Smartphone, MapPin, Zap } from "lucide-react";

interface ComparisonRow {
  feature: string;
  category: "payments" | "checkout" | "cost" | "performance";
  shopcraft: {
    status: "yes" | "warning" | "no";
    title: string;
    description: string;
  };
  shopify: {
    status: "yes" | "warning" | "no";
    title: string;
    description: string;
  };
  instagram: {
    status: "yes" | "warning" | "no";
    title: string;
    description: string;
  };
}

const COMPARISON_DATA: ComparisonRow[] = [
  {
    feature: "Monthly Platform Cost",
    category: "cost",
    shopcraft: {
      status: "yes",
      title: "Rs. 0 / month",
      description: "Free hosting. No international USD credit card or Nepal Rastra Bank Dollar Card required.",
    },
    shopify: {
      status: "no",
      title: "$39 / month (~Rs. 5,200/mo)",
      description: "Charged in USD. Requires a $500 annual limit prepaid Dollar Card with bank KYC & issuance fees.",
    },
    instagram: {
      status: "warning",
      title: "Free (Hidden labor cost)",
      description: "Zero software fee, but hours spent manually messaging, verifying bank slips, and lost customers.",
    },
  },
  {
    feature: "Khalti & Local Wallets",
    category: "payments",
    shopcraft: {
      status: "yes",
      title: "Native Day-One Integration",
      description: "Direct Khalti ePayment v2 sandbox with instant server-side pidx verification and callbacks.",
    },
    shopify: {
      status: "no",
      title: "Not Supported Natively",
      description: "Requires expensive third-party custom apps or manual bank wire transfer with manual proof verification.",
    },
    instagram: {
      status: "no",
      title: "Manual Screenshot Verification",
      description: "Customers take screenshots of Fonepay/Khalti transfers. High fraud risk and manual matching.",
    },
  },
  {
    feature: "Cash on Delivery (COD)",
    category: "payments",
    shopcraft: {
      status: "yes",
      title: "Built-In with Collection Guard",
      description: "Single-tap COD checkout with ward-level dispatch receipts and cash collected verification guard.",
    },
    shopify: {
      status: "warning",
      title: "Generic Manual Method",
      description: "Offers basic manual COD checkbox, but lacks Nepali courier delivery coordination tools.",
    },
    instagram: {
      status: "warning",
      title: "Informal Arrangement",
      description: "Negotiated manually per customer in chat. High rate of fake orders and courier returns.",
    },
  },
  {
    feature: "Address & Geographic Hierarchy",
    category: "checkout",
    shopcraft: {
      status: "yes",
      title: "7 Provinces, 77 Districts, Wards 1–35",
      description: "Cascading Nepali selector tailored for local courier networks. Validates 10-digit 98/97 mobile numbers.",
    },
    shopify: {
      status: "no",
      title: "Forces US/EU 'Zip Code' & State",
      description: "Nepali shoppers get stuck on mandatory 'Postal Code' fields, resulting in 40–60% checkout abandonment.",
    },
    instagram: {
      status: "no",
      title: "Unstructured Chat Text",
      description: "Shoppers send vague landmark descriptions. Couriers repeatedly call lost trying to locate the customer.",
    },
  },
  {
    feature: "Delivery Fees Calculation",
    category: "checkout",
    shopcraft: {
      status: "yes",
      title: "Kathmandu Valley vs Outside Valley",
      description: "Automatically computes Inside Valley (Rs. 100) vs Outside Valley (Rs. 200) with free threshold meter.",
    },
    shopify: {
      status: "warning",
      title: "Weight/Distance Setup Needed",
      description: "Requires complex manual shipping zone setups that do not understand Valley vs Terai courier boundaries.",
    },
    instagram: {
      status: "no",
      title: "Manual Courier Inquiry",
      description: "Merchant manually calculates delivery per parcel by calling Pathao or Nepal Post.",
    },
  },
  {
    feature: "Recurring Subscriptions",
    category: "payments",
    shopcraft: {
      status: "yes",
      title: "Prepaid Cycles & 1-Tap WhatsApp Links",
      description: "Engineered for Nepal's zero auto-debit banking laws. Prepaid 3M/6M/12M commitments with auto-fulfillment.",
    },
    shopify: {
      status: "no",
      title: "Requires Stripe Auto-Debits",
      description: "Shopify Subscriptions rely on automated recurring card charges, which Nepali debit cards block completely.",
    },
    instagram: {
      status: "no",
      title: "Purely Manual Follow-ups",
      description: "Merchant must remember to text customers each month to request a re-order.",
    },
  },
  {
    feature: "Mobile Speed (3G / 4G Networks)",
    category: "performance",
    shopcraft: {
      status: "yes",
      title: "0.8s Ultra-Fast PWA",
      description: "Loads instantly in Instagram & TikTok in-app browsers without heavy theme bundles or bloated apps.",
    },
    shopify: {
      status: "warning",
      title: "3.5s – 7.0s Heavy Bundles",
      description: "Liquid themes and third-party app scripts cause noticeable lag on mobile data outside Kathmandu.",
    },
    instagram: {
      status: "yes",
      title: "Instant (inside Instagram)",
      description: "Loads inside the Instagram chat, but lacks a catalog, cart, or search capability.",
    },
  },
  {
    feature: "Customer Communication",
    category: "checkout",
    shopcraft: {
      status: "yes",
      title: "1-Tap WhatsApp & Phone Dialing",
      description: "Order queue gives merchant direct WhatsApp link with prefilled order receipt + direct phone calling.",
    },
    shopify: {
      status: "warning",
      title: "Email-Centric Notifications",
      description: "Sends automated emails that most Nepali shoppers never open or have filtered into spam folders.",
    },
    instagram: {
      status: "yes",
      title: "Direct DM",
      description: "Good for conversation, but messages get buried when managing more than 10 orders per day.",
    },
  },
];

export function ShopifyComparisonTable() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredRows =
    activeCategory === "all"
      ? COMPARISON_DATA
      : COMPARISON_DATA.filter((r) => r.category === activeCategory);

  return (
    <div className="space-y-8">
      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
            activeCategory === "all"
              ? "bg-[#C2410C] text-white font-semibold shadow-xs"
              : "bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950"
          }`}
        >
          All Capabilities ({COMPARISON_DATA.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory("cost")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
            activeCategory === "cost"
              ? "bg-[#C2410C] text-white font-semibold shadow-xs"
              : "bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950"
          }`}
        >
          Pricing &amp; Cost
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory("payments")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
            activeCategory === "payments"
              ? "bg-[#C2410C] text-white font-semibold shadow-xs"
              : "bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950"
          }`}
        >
          Khalti, COD &amp; Subscriptions
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory("checkout")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
            activeCategory === "checkout"
              ? "bg-[#C2410C] text-white font-semibold shadow-xs"
              : "bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950"
          }`}
        >
          Nepali Addresses &amp; Wards
        </button>
      </div>

      {/* Comparison Grid */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200/90 bg-white shadow-sm">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80">
              <th className="p-4 sm:p-5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 w-1/4">
                Capability
              </th>
              <th className="p-4 sm:p-5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-950 bg-orange-50/50 border-x border-orange-200/60 w-5/12">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C2410C] inline-block" />
                  <span className="text-sm font-extrabold text-zinc-950">ShopCraft</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C2410C] text-white font-bold ml-1">
                    BUILT FOR NEPAL
                  </span>
                </div>
              </th>
              <th className="p-4 sm:p-5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-600 w-1/3">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-zinc-800">Shopify</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700">US / Global</span>
                </div>
              </th>
              <th className="p-4 sm:p-5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-600 w-1/4 hidden lg:table-cell">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-zinc-800">Instagram DMs</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700">Manual</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80">
            {filteredRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                {/* Feature Label */}
                <td className="p-4 sm:p-5 align-top">
                  <span className="font-bold text-xs sm:text-sm text-zinc-900 block">
                    {row.feature}
                  </span>
                </td>

                {/* ShopCraft Column (Highlighted) */}
                <td className="p-4 sm:p-5 align-top bg-orange-50/30 border-x border-orange-200/60 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 p-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-zinc-950">
                        {row.shopcraft.title}
                      </p>
                      <p className="text-xs text-zinc-600 leading-relaxed mt-0.5">
                        {row.shopcraft.description}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Shopify Column */}
                <td className="p-4 sm:p-5 align-top space-y-1.5">
                  <div className="flex items-start gap-2">
                    {row.shopify.status === "no" ? (
                      <span className="mt-0.5 p-0.5 rounded-full bg-red-100 text-red-700 shrink-0">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="mt-0.5 p-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                        <AlertCircle className="w-3.5 h-3.5 stroke-[2]" />
                      </span>
                    )}
                    <div>
                      <p className="font-semibold text-xs sm:text-sm text-zinc-900">
                        {row.shopify.title}
                      </p>
                      <p className="text-xs text-zinc-600 leading-relaxed mt-0.5">
                        {row.shopify.description}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Instagram Column */}
                <td className="p-4 sm:p-5 align-top space-y-1.5 hidden lg:table-cell">
                  <div className="flex items-start gap-2">
                    {row.instagram.status === "no" ? (
                      <span className="mt-0.5 p-0.5 rounded-full bg-red-100 text-red-700 shrink-0">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="mt-0.5 p-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                        <AlertCircle className="w-3.5 h-3.5 stroke-[2]" />
                      </span>
                    )}
                    <div>
                      <p className="font-semibold text-xs sm:text-sm text-zinc-800">
                        {row.instagram.title}
                      </p>
                      <p className="text-xs text-zinc-600 leading-relaxed mt-0.5">
                        {row.instagram.description}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Annual Cost Savings Callout */}
      <div className="p-6 sm:p-8 rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-white to-zinc-50 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C2410C]">
              The True Cost of Selling Online in Nepal
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-950">
              Save over Rs. 64,000 every year vs Shopify.
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Shopify costs $39/mo (~Rs. 62,400/yr), plus bank Dollar Card issuance and exchange fees, plus 30–50% lost orders from confused shoppers trying to enter a &quot;Zip Code&quot;. On ShopCraft, your store is free to host, accepts Khalti and Cash on Delivery out of the box, and speaks native Nepali geography.
            </p>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 shrink-0 bg-white p-4 sm:p-6 rounded-xl border border-zinc-200 shadow-2xs">
            <div className="text-center px-3 border-r border-zinc-200">
              <span className="block text-[11px] font-mono text-zinc-500 uppercase">Shopify Cost</span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-red-600">
                Rs. 64,400+<span className="text-xs text-zinc-500 font-normal">/yr</span>
              </span>
            </div>
            <div className="text-center px-3">
              <span className="block text-[11px] font-mono text-emerald-600 font-semibold uppercase">ShopCraft Cost</span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-600">
                Rs. 0<span className="text-xs text-zinc-500 font-normal">/mo</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
