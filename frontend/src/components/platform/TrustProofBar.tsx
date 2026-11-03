"use client";

import React from "react";
import { motion } from "framer-motion";
import { Wallet, MapPin, Zap, Percent } from "lucide-react";

interface BrandLogo {
  name: string;
  category: string;
  svg: React.ReactNode;
}

const BRAND_LOGOS: BrandLogo[] = [
  {
    name: "BrewMellow",
    category: "Specialty Roasters",
    svg: (
      <svg className="h-6 w-auto" viewBox="0 0 140 28" fill="currentColor">
        <path d="M12 4C7.58 4 4 7.58 4 12c0 3.31 2.01 6.16 4.9 7.37L8 23h8l-.9-3.63C17.99 18.16 20 15.31 20 12c0-4.42-3.58-8-8-8zm-1 4h2v6h-2V8zm1 10a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
        <text x="28" y="19" fontFamily="sans-serif" fontSize="13" fontWeight="bold" letterSpacing="0.05em">
          BREWMELLOW
        </text>
      </svg>
    ),
  },
  {
    name: "Himalayan Java",
    category: "KTM Flagship",
    svg: (
      <svg className="h-6 w-auto" viewBox="0 0 160 28" fill="currentColor">
        <path d="M4 18h16l-3-12H7L4 18zm8-9c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z" />
        <text x="28" y="19" fontFamily="sans-serif" fontSize="12" fontWeight="800" letterSpacing="0.08em">
          HIMALAYAN JAVA
        </text>
      </svg>
    ),
  },
  {
    name: "Nepal Tea Collective",
    category: "Single-Estate Tea",
    svg: (
      <svg className="h-6 w-auto" viewBox="0 0 170 28" fill="currentColor">
        <path d="M12 2C8 6 4 10 4 15c0 4.4 3.6 8 8 8s8-3.6 8-8c0-5-4-9-8-13zm0 18c-2.8 0-5-2.2-5-5 0-2.8 2.2-5.5 5-8.5 2.8 3 5 5.7 5 8.5 0 2.8-2.2 5-5 5z" />
        <text x="28" y="19" fontFamily="sans-serif" fontSize="12" fontWeight="700" letterSpacing="0.06em">
          NEPAL TEA CO.
        </text>
      </svg>
    ),
  },
  {
    name: "Khalti Digital Wallet",
    category: "Payments Partner",
    svg: (
      <svg className="h-6 w-auto" viewBox="0 0 130 28" fill="currentColor">
        <rect x="4" y="5" width="18" height="18" rx="5" />
        <path d="M10 9v10h2.5v-4.5l4 4.5h3.2l-4.5-5 4.3-5H16.3l-3.8 4.6V9H10z" fill="#08080A" />
        <text x="28" y="19" fontFamily="sans-serif" fontSize="13" fontWeight="900" letterSpacing="0.04em">
          khalti
        </text>
      </svg>
    ),
  },
  {
    name: "Pahadi Goods",
    category: "Organic Goods",
    svg: (
      <svg className="h-6 w-auto" viewBox="0 0 145 28" fill="currentColor">
        <path d="M12 3l9 16H3l9-16zm0 5l-5 9h10l-5-9z" />
        <text x="28" y="19" fontFamily="sans-serif" fontSize="12" fontWeight="700" letterSpacing="0.08em">
          PAHADI GOODS
        </text>
      </svg>
    ),
  },
  {
    name: "Mountain Roasters",
    category: "Lalitpur",
    svg: (
      <svg className="h-6 w-auto" viewBox="0 0 170 28" fill="currentColor">
        <path d="M4 20L10 8l4 6 5-10 5 16H4z" />
        <text x="30" y="19" fontFamily="sans-serif" fontSize="12" fontWeight="800" letterSpacing="0.06em">
          MOUNTAIN ROAST
        </text>
      </svg>
    ),
  },
  {
    name: "Solukhumbu Organics",
    category: "Alpine Botanicals",
    svg: (
      <svg className="h-6 w-auto" viewBox="0 0 175 28" fill="currentColor">
        <circle cx="12" cy="14" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M12 9v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <text x="28" y="19" fontFamily="sans-serif" fontSize="12" fontWeight="700" letterSpacing="0.06em">
          SOLUKHUMBU
        </text>
      </svg>
    ),
  },
  {
    name: "KTM Valley Dispatch",
    category: "Logistics",
    svg: (
      <svg className="h-6 w-auto" viewBox="0 0 150 28" fill="currentColor">
        <path d="M4 8h10v8H4V8zm10 3h4l3 3v2h-7v-5zm-7 7a2 2 0 100-4 2 2 0 000 4zm11 0a2 2 0 100-4 2 2 0 000 4z" />
        <text x="28" y="19" fontFamily="sans-serif" fontSize="12" fontWeight="700" letterSpacing="0.05em">
          VALLEY DISPATCH
        </text>
      </svg>
    ),
  },
];

const PROOF_METRICS = [
  {
    metric: "15M+",
    label: "Connected Digital Wallets",
    highlight: "Zero Dollar Cards",
    description: "Let customers pay natively via Khalti, eSewa, and mobile banking without dollar cards.",
    gradient: "from-purple-400 via-indigo-300 to-cyan-400",
    glow: "group-hover:shadow-[0_0_35px_rgba(168,85,247,0.14)]",
    icon: Wallet,
  },
  {
    metric: "77 Districts",
    label: "Ward-Level Precision",
    highlight: "Structured Tole Forms",
    description: "Clean drop-down forms for local riders instead of broken US-style zip codes.",
    gradient: "from-emerald-400 via-teal-300 to-green-400",
    glow: "group-hover:shadow-[0_0_35px_rgba(52,211,153,0.14)]",
    icon: MapPin,
  },
  {
    metric: "< 30s",
    label: "Checkout Flow",
    highlight: "-50% Cart Abandonment",
    description: "Native in-app payment authorization that cuts cart abandonment in half.",
    gradient: "from-amber-400 via-orange-300 to-yellow-400",
    glow: "group-hover:shadow-[0_0_35px_rgba(251,191,36,0.14)]",
    icon: Zap,
  },
  {
    metric: "0%",
    label: "Transaction Platform Fees",
    highlight: "Open Beta Advantage",
    description: "Keep 100% of your revenue during open beta with zero monthly software tolls.",
    gradient: "from-blue-400 via-sky-300 to-teal-400",
    glow: "group-hover:shadow-[0_0_35px_rgba(56,189,248,0.14)]",
    icon: Percent,
  },
];

export function TrustProofBar() {
  return (
    <section className="relative w-full py-16 sm:py-20 border-y border-white/5 bg-[#08080A]/80 backdrop-blur-md overflow-hidden">
      {/* Background ambient subtle glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
        <div className="w-[800px] h-[300px] bg-gradient-to-r from-emerald-500/10 via-white/5 to-purple-500/10 blur-3xl rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16 relative z-10">
        {/* 1. Sleek Brand Marquee Row */}
        <div className="space-y-4">
          <p className="text-center text-xs font-mono tracking-widest uppercase text-zinc-500">
            TRUSTED BY INDEPENDENT ROASTERS, PRODUCERS &amp; MERCHANTS ACROSS NEPAL
          </p>

          <div className="relative w-full overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
            <div className="animate-marquee flex items-center gap-12 sm:gap-16 py-3">
              {/* First Track */}
              {BRAND_LOGOS.map((brand, i) => (
                <div
                  key={`track-1-${brand.name}-${i}`}
                  className="flex items-center text-zinc-400 opacity-40 hover:opacity-100 hover:text-white transition-all duration-300 cursor-pointer select-none shrink-0"
                  title={`${brand.name} · ${brand.category}`}
                >
                  {brand.svg}
                </div>
              ))}

              {/* Second Track for seamless infinite loop */}
              {BRAND_LOGOS.map((brand, i) => (
                <div
                  key={`track-2-${brand.name}-${i}`}
                  className="flex items-center text-zinc-400 opacity-40 hover:opacity-100 hover:text-white transition-all duration-300 cursor-pointer select-none shrink-0"
                  title={`${brand.name} · ${brand.category}`}
                >
                  {brand.svg}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Key Proof Metrics: 4-Column Micro-Stats Card with Glowing Top Border Gradients */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROOF_METRICS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`relative rounded-2xl bg-white/[0.02] border border-white/10 p-6 sm:p-7 backdrop-blur-xl overflow-hidden group hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 ${item.glow}`}
              >
                {/* Glowing Top Border Gradient */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-white/70 transition-all duration-500" />
                <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xs" />

                <div className="space-y-4">
                  {/* Top Bar with Icon & Tag */}
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white group-hover:scale-105 transition-transform duration-300">
                      <Icon className="w-4 h-4 text-zinc-300" />
                    </div>
                    <span className="text-[10px] font-mono font-medium text-emerald-400/90 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      {item.highlight}
                    </span>
                  </div>

                  {/* Main Metric & Headline */}
                  <div>
                    <div
                      className={`text-3xl sm:text-4xl font-black tracking-tight font-sans bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}
                    >
                      {item.metric}
                    </div>
                    <div className="text-sm font-semibold text-white mt-1">
                      {item.label}
                    </div>
                  </div>

                  {/* Micro Description */}
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
