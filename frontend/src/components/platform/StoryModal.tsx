"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coffee, ArrowRight } from "lucide-react";

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StoryModal({ isOpen, onClose }: StoryModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl rounded-2xl border border-[#E5E5E5] bg-white shadow-2xl overflow-hidden z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 border border-[#E5E5E5] text-[#707070] hover:text-[#121212] hover:bg-zinc-100 transition-colors shadow-sm"
              aria-label="Close story dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Video / Cinema Canvas */}
            <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden flex items-center justify-center group">
              <div
                className="absolute inset-0 bg-cover bg-center filter brightness-75 contrast-105 transform group-hover:scale-105 transition-transform duration-700"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=80')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Cinematic Center Visual */}
              <div className="relative z-10 text-center px-6 max-w-md space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-white/20 backdrop-blur-md text-xs font-medium text-white">
                  <Coffee className="w-3.5 h-3.5 text-amber-300" />
                  <span>Direct-From-Estate Artisan Story</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Empowering Nepal&apos;s Specialty Roasters &amp; Tea Estates
                </h3>
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                  How artisanal roasteries earn predictable recurring revenue with ShopCraft&apos;s subscription engine.
                </p>
              </div>
            </div>

            {/* Content & Mission Statement */}
            <div className="p-6 sm:p-7 space-y-5 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#F6F6F7] border border-[#E5E5E5] space-y-1">
                  <div className="text-[11px] font-semibold text-[#707070] uppercase tracking-wider">The Problem</div>
                  <div className="text-sm font-semibold text-[#121212]">Global Tools Fail Nepal</div>
                  <div className="text-xs text-[#555] leading-relaxed">Shopify charges USD monthly fees and lacks native Khalti &amp; ward delivery.</div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                  <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">The Breakthrough</div>
                  <div className="text-sm font-semibold text-emerald-950">Native Khalti + COD</div>
                  <div className="text-xs text-emerald-900/80 leading-relaxed">Instant 1-click Nepali checkout with accurate 7-province ward delivery.</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F6F6F7] border border-[#E5E5E5] space-y-1">
                  <div className="text-[11px] font-semibold text-[#707070] uppercase tracking-wider">The Advantage</div>
                  <div className="text-sm font-semibold text-[#121212]">Repeat Subscriptions</div>
                  <div className="text-xs text-[#555] leading-relaxed">Turn one-time bag buyers into recurring bi-weekly coffee subscribers.</div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E5E5E5]">
                <div className="flex items-center gap-2 text-xs text-[#707070]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Demo Tenant: Himalayan Roasters</span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Link
                    href="/s/demo-roastery"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-[#E5E5E5] bg-white text-[#121212] hover:bg-[#F6F6F7] text-xs font-semibold transition-colors text-center"
                  >
                    View Storefront ↗
                  </Link>
                  <Link
                    href="/merchant/new"
                    onClick={onClose}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#121212] text-white text-xs font-semibold hover:bg-black transition-colors text-center shadow-sm"
                  >
                    <span>Launch Store Free</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
