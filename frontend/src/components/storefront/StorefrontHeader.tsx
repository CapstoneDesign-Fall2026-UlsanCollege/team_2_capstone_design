"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Globe,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import { formatNpr } from "@/lib/api";

export interface StorefrontHeaderProps {
  storeSlug: string;
  storeName: string;
  tagline?: string;
  logoUrl?: string | null;
  contactPhone?: string | null;
  cartCount?: number;
  freeShippingThresholdMinor?: number | null;
  categories?: string[];
  onOpenCart?: () => void;
  onOpenSearch?: () => void;
  onSelectCategory?: (category: string) => void;
  activeCategory?: string;
}

export function StorefrontHeader({
  storeSlug,
  storeName,
  tagline,
  logoUrl,
  contactPhone,
  cartCount = 0,
  freeShippingThresholdMinor,
  categories = [],
  onOpenCart,
  onOpenSearch,
  onSelectCategory,
  activeCategory = "all",
}: StorefrontHeaderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const marqueeAnnouncements = [
    freeShippingThresholdMinor
      ? {
          icon: Truck,
          text: `FREE KATHMANDU VALLEY DELIVERY ON ORDERS OVER ${formatNpr(freeShippingThresholdMinor).toUpperCase()}`,
        }
      : {
          icon: Truck,
          text: "FAST KATHMANDU VALLEY & 7-PROVINCE NATIONWIDE DELIVERY",
        },
    {
      icon: RefreshCw,
      text: "VERIFIED KHALTI EPAYMENTS & CASH ON DELIVERY (COD) ACCEPTED",
    },
    {
      icon: Sparkles,
      text: "AUTHENTIC QUALITY GOODS DIRECT FROM NEPALI MAKERS",
    },
    {
      icon: MapPin,
      text: `OFFICIAL ONLINE STORE OF ${storeName.toUpperCase()}`,
    },
  ];

  // Auto-rotate announcement marquee every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % marqueeAnnouncements.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [marqueeAnnouncements.length]);

  const ActiveIcon = marqueeAnnouncements[currentSlide].icon;

  return (
    <div className="w-full font-sf-body">
      {/* 1. Sliding Marquee Announcement Bar */}
      <div className="w-full bg-sf-ink text-sf-surface text-[11px] font-sf-mono tracking-wider py-2 px-4 transition-all overflow-hidden border-b border-sf-line/40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex-1 flex items-center justify-center gap-2 overflow-hidden text-center">
            <ActiveIcon className="w-3.5 h-3.5 text-sf-cta shrink-0" />
            <span className="font-semibold truncate uppercase">
              {marqueeAnnouncements[currentSlide].text}
            </span>
          </div>

          {/* Micro dots */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0 pl-3">
            {marqueeAnnouncements.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-1 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx ? "w-4 bg-sf-surface" : "w-1.5 bg-sf-surface/30"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 2. Minimalist Masthead Sticky Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-sf-line bg-sf-surface/95 backdrop-blur-md transition-all">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Brand Identity */}
          <Link
            href={`/s/${encodeURIComponent(storeSlug)}`}
            className="flex items-center gap-3 min-w-0 group shrink-0"
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={storeName}
                className="h-9 max-w-[140px] object-contain rounded"
              />
            ) : (
              <div className="flex flex-col text-left">
                <span className="font-sf-display text-base sm:text-lg font-bold tracking-tight text-sf-ink uppercase group-hover:opacity-80 transition-opacity">
                  {storeName}
                </span>
                <span className="text-[10px] font-sf-mono text-sf-muted tracking-wider uppercase truncate max-w-[200px]">
                  {tagline || "Online Storefront · Nepal"}
                </span>
              </div>
            )}
          </Link>

          {/* Center: Dynamic Category & Store Page Links */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-5 text-xs font-semibold text-sf-ink tracking-wide">
            <button
              type="button"
              onClick={() => onSelectCategory && onSelectCategory("all")}
              className={`hover:underline underline-offset-4 cursor-pointer transition-colors ${
                activeCategory === "all" ? "text-sf-ink font-bold underline" : "text-sf-muted"
              }`}
            >
              Catalog
            </button>
            {categories.slice(0, 3).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory && onSelectCategory(cat)}
                className={`hover:underline underline-offset-4 cursor-pointer transition-colors ${
                  activeCategory === cat ? "text-sf-ink font-bold underline" : "text-sf-muted"
                }`}
              >
                {cat}
              </button>
            ))}
            <Link
              href={`/s/${encodeURIComponent(storeSlug)}/subscriptions`}
              className="text-sf-muted hover:text-sf-ink transition-colors"
            >
              Subscriptions
            </Link>
            <Link
              href={`/s/${encodeURIComponent(storeSlug)}/about`}
              className="text-sf-muted hover:text-sf-ink transition-colors"
            >
              About
            </Link>
            <Link
              href={`/s/${encodeURIComponent(storeSlug)}/shipping`}
              className="text-sf-muted hover:text-sf-ink transition-colors"
            >
              Delivery &amp; COD
            </Link>
            <Link
              href={`/s/${encodeURIComponent(storeSlug)}/contact`}
              className="text-sf-muted hover:text-sf-ink transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Right: Actions (Search, WhatsApp, Cart) */}
          <div className="flex items-center gap-2">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="p-2 text-sf-ink hover:text-sf-cta rounded-full hover:bg-sf-canvas transition-colors cursor-pointer"
              aria-label="Search catalog"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Direct Phone / WhatsApp Button */}
            {contactPhone && (
              <a
                href={`https://wa.me/${(() => {
                  const d = contactPhone.replace(/\D/g, "").replace(/^0+/, "");
                  return d.startsWith("977") ? d : `977${d}`;
                })()}?text=Hi%20${encodeURIComponent(storeName)}%2C%20I%20have%20an%20inquiry%20about%20your%20products.`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-sf-line text-[11px] font-sf-mono text-sf-muted hover:text-sf-ink hover:border-sf-ink transition-colors"
              >
                <Phone className="w-3 h-3 text-sf-accent" />
                <span>Contact</span>
              </a>
            )}

            {/* Slide-Out Cart Trigger Button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sf-ink text-sf-surface hover:opacity-90 transition-all active:scale-95 shadow-xs cursor-pointer text-xs font-semibold"
              aria-label={`Open shopping cart with ${cartCount} items`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Bag</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-sf-cta text-sf-cta-ink text-[10px] font-bold font-sf-mono">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>
    </div>
  );
}
