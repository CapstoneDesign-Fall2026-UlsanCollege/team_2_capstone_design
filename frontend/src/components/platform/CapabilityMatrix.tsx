"use client";

import React from "react";
import {
  Globe,
  Package,
  Truck,
  Layers,
  Search,
  Users,
  Check,
  Sparkles,
} from "lucide-react";

interface AreaCard {
  title: string;
  count: string;
  icon: any;
  items: string[];
}

const AREAS: AreaCard[] = [
  {
    title: "Store and website",
    count: "7 capabilities",
    icon: Globe,
    items: [
      "Hosted customer storefront on custom subdomain",
      "Custom domain mapping (.com.np / .com) with auto SSL",
      "Visual page builder for About, Terms & Delivery",
      "Announcement marquee and promotional banners",
      "Custom brand colors, logo, favicon, and typography",
      "Header navigation and multi-column footer builder",
      "Store maintenance mode for inventory audits",
    ],
  },
  {
    title: "Products and customers",
    count: "9 capabilities",
    icon: Package,
    items: [
      "Variant matrices for size, color, grind, and weight",
      "Category tree management and tag organization",
      "Multiple product image galleries with aspect locking",
      "Customer accounts with phone number authentication",
      "Saved addresses with cascading Nepal ward selection",
      "Authenticated slide-out cart drawer with delivery meter",
      "Bulk CSV product and variant import/export",
      "Real-time storefront search and faceted filters",
      "Customer lifetime order history and notes",
    ],
  },
  {
    title: "Orders and fulfillment",
    count: "6 capabilities",
    icon: Truck,
    items: [
      "Centralized order status workflow (Unfulfilled to Delivered)",
      "1-click Pathao & courier 4x6\" thermal shipping labels",
      "Cash on Delivery (COD) collection status guard",
      "Split and partial shipment management",
      "Customer returns, cancellations, and exchange tracking",
      "Internal timeline notes and dispatch timestamps",
    ],
  },
  {
    title: "Inventory and purchasing",
    count: "11 capabilities",
    icon: Layers,
    items: [
      "Real-time variant-level stock counting (On-hand & Available)",
      "Automated stock reservation on checkout completion",
      "Multi-location warehouse and roastery inventory tracking",
      "Low-stock automated alerts via email and dashboard badge",
      "Manual stock adjustments with audit reason logs",
      "Batch inventory updates via spreadsheet sync",
      "Supplier purchase order generation and tracking",
      "Incoming stock receipt and discrepancy logging",
      "SKU and barcode generation for physical retail",
      "Negative stock prevention toggle",
      "Dead inventory and scarcity analytics",
    ],
  },
  {
    title: "SEO and notifications",
    count: "7 capabilities",
    icon: Search,
    items: [
      "Automated XML sitemaps, robots.txt, and canonical URLs",
      "Custom SEO meta title, description, and keywords per product",
      "OpenGraph image previews for Instagram, WhatsApp, and Facebook",
      "Automated customer order confirmation via SMS and email",
      "Merchant instant order notification pings",
      "Courier dispatch tracking updates sent to customer phone",
      "Developer webhook triggers for third-party ERP integration",
    ],
  },
  {
    title: "Staff and access",
    count: "5 capabilities",
    icon: Users,
    items: [
      "Role-based staff permissions (Admin, Dispatch, Support)",
      "Email invitations for store team members",
      "Full store audit log for inventory and price changes",
      "Restricted financial and payout view for packing staff",
      "Multi-session login security and instant revoke",
    ],
  },
];

export function CapabilityMatrix() {
  return (
    <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-200 dark:border-white/5 scroll-mt-20">
      <div id="capabilities" className="scroll-mt-20">
        {/* Section Header with Metric Callout */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>45 Current capabilities across 6 Operating areas</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
            More than a storefront builder
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-sans max-w-xl mx-auto">
            A complete, localized operating system engineered for growing brands in Nepal.
          </p>
        </div>

        {/* 2x3 or 3x2 Dark Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {AREAS.map((area) => {
            const Icon = area.icon;
            return (
              <div
                key={area.title}
                className="p-6 sm:p-7 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#141416] hover:bg-zinc-50 dark:hover:bg-[#17171a] hover:border-zinc-300 dark:hover:border-white/20 transition-all flex flex-col justify-between shadow-lg shadow-black/5 dark:shadow-black/40 group"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5">
                      {area.count}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                      {area.title}
                    </h3>
                  </div>

                  {/* Capability Checklist */}
                  <ul className="space-y-2.5 pt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {area.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
