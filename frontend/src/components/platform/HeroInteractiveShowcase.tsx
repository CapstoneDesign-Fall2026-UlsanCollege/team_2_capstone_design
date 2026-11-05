"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  CreditCard,
  ExternalLink,
  Layers,
  MapPin,
  Package,
  Repeat,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Zap,
} from "lucide-react";

interface TenantPreviewData {
  slug: string;
  name: string;
  tagline: string;
  themePreset: string;
  accentColor: string;
  badge: string;
  product: {
    title: string;
    sub: string;
    origin: string;
    priceOneTime: number;
    imageUrl: string;
    notes: string;
  };
}

const PREVIEWS: TenantPreviewData[] = [
  {
    slug: "himalayan-roasters",
    name: "Himalayan Coffee Roasters",
    tagline: "Single-origin specialty coffee from Gulmi & Ilam",
    themePreset: "Editorial Warm",
    accentColor: "#A3432A",
    badge: "Artisanal Coffee & Roastery",
    product: {
      title: "Gulmi Reserve Bourbon Arabica",
      sub: "Washed Process · Single Estate · Medium Roast",
      origin: "Gulmi (1,450m)",
      priceOneTime: 750,
      imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80",
      notes: "Dark Chocolate · Candied Mandarin · Brown Sugar",
    },
  },
  {
    slug: "himalayan-artisans",
    name: "Himalayan Artisans Collective",
    tagline: "Hand-spun organic cashmere & wild cliff honey",
    themePreset: "Pahadi Sage",
    accentColor: "#1F6F4A",
    badge: "Crafts & Consumables",
    product: {
      title: "Lamjung Cliff Wild Honey (500g)",
      sub: "Raw & Unfiltered · High Himalayan Harvest",
      origin: "Lamjung (2,200m)",
      priceOneTime: 1850,
      imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80",
      notes: "Wild Rhododendron · Smoky Pine · Herbal Amber",
    },
  },
  {
    slug: "ktm-streetwear",
    name: "KTM Streetwear Co.",
    tagline: "Limited urban drops designed in Kathmandu",
    themePreset: "KTM Bold",
    accentColor: "#2B3BFF",
    badge: "Streetwear Drops",
    product: {
      title: "Heavyweight Boxy Tee (Black)",
      sub: "320 GSM French Terry Cotton · Relaxed Drop Shoulder",
      origin: "Kathmandu Valley",
      priceOneTime: 2200,
      imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
      notes: "Pre-shrunk · High-density Screenprint · Unisex",
    },
  },
];

export function HeroInteractiveShowcase() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const activeTenant = PREVIEWS[selectedIdx];

  const handleAddToCart = () => {
    setCartCount((c) => c + 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2200);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto mt-12">
      {/* Brand Switcher Pills (Top of Frame) */}
      <div className="flex items-center justify-center gap-2 mb-4 overflow-x-auto pb-1">
        {PREVIEWS.map((t, idx) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => {
              setSelectedIdx(idx);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedIdx === idx
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md scale-102"
                : "bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: t.accentColor }}
            />
            <span>{t.name.split(" ")[0]} {t.name.split(" ")[1]}</span>
            <span className="hidden sm:inline text-[10px] opacity-70 font-mono">({t.badge})</span>
          </button>
        ))}
      </div>

      {/* Main Browser Mockup Container */}
      <div className="relative rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-[#0E1015]/95 shadow-2xl backdrop-blur-xl overflow-hidden text-left transition-all">
        
        {/* Browser Top Bar with URL ghost */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 pl-2 hidden sm:inline">
              ShopCraft Storefront Engine
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
            <span className="text-emerald-500">🔒</span>
            <span className="text-zinc-400">shopcraft.com.np/s/</span>
            <span className="font-bold text-zinc-900 dark:text-white">{activeTenant.slug}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/s/${activeTenant.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
            >
              <span className="hidden sm:inline">Open Live</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Content Inside Mockup */}
        <div className="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Left: Product Image with Floating Origin Badges (5 cols) */}
          <div className="md:col-span-5 relative">
            <div className="aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 relative shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeTenant.product.imageUrl}
                alt={activeTenant.product.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-zinc-900/90 text-white text-[10px] font-mono font-bold tracking-wide backdrop-blur-xs">
                {activeTenant.product.origin}
              </div>
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-bold tracking-wider uppercase shadow-xs">
                In Stock · Ships 48h
              </div>
            </div>
          </div>

          {/* Right: Live Interactive Selector (7 cols) */}
          <div className="md:col-span-7 space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {activeTenant.product.sub}
                </span>
                <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Free KTM Delivery
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight mt-1">
                {activeTenant.product.title}
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-sans">
                {activeTenant.product.notes}
              </p>
            </div>

            {/* Purchase Mode Radio Cards */}
            <div className="space-y-2.5">
            {/* Pricing & Checkout Options */}
            <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <span>Direct Purchase</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    Khalti · COD
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Instant mobile checkout · Dispatched via Pathao
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-black font-mono text-zinc-900 dark:text-white">
                  Rs. {activeTenant.product.priceOneTime.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* Action Bar with Micro-Feedback */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3 px-5 rounded-full bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs font-mono transition-all active:scale-98 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Added to Cart! (Bag: {cartCount})</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Bag · Rs. {activeTenant.product.priceOneTime.toLocaleString("en-IN")}</span>
                  </>
                )}
              </button>

              <Link
                href={`/s/${activeTenant.slug}`}
                className="py-3 px-4 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition-colors"
              >
                Visit Store
              </Link>
            </div>
          </div>
        </div>

      </div>
      </div>

      {/* Floating Glassmorphic Badges (Lovable & Linear Signature Pattern) */}
      <div className="absolute -top-4 -right-2 sm:-right-6 hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-700 shadow-xl backdrop-blur-md text-[11px] font-mono z-20 animate-bounce duration-1000">
        <div className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
        <span className="font-bold text-zinc-900 dark:text-white">Rs. 2,400 Khalti Verified</span>
        <span className="text-zinc-400">· 8s ago</span>
      </div>

      <div className="absolute -bottom-4 -left-2 sm:-left-6 hidden sm:flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-700 shadow-xl backdrop-blur-md text-[11px] font-mono z-20">
        <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <div>
          <span className="font-bold text-zinc-900 dark:text-white">Pathao Slip #PTH-8921</span>
          <span className="text-zinc-500 dark:text-zinc-400"> · Lazimpat Ward 03</span>
        </div>
      </div>
    </div>
  );
}
