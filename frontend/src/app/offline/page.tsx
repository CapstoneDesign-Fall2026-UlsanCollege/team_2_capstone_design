"use client";

import Link from "next/link";
import { WifiOff, Coffee, ArrowLeft, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] flex flex-col items-center justify-center p-6 font-sans text-center">
      <div className="w-full max-w-md bg-white border border-[#E6DEC8] p-10 md:p-12 shadow-md">
        
        <div className="w-16 h-16 bg-[#FAF5F2] rounded-full flex items-center justify-center mx-auto mb-6 text-[#A3432A]">
          <WifiOff size={32} />
        </div>

        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A3432A] bg-[#FAF5F2] px-3 py-1 rounded-full">
          PWA Offline Resilience
        </span>

        <h1 className="text-3xl font-serif font-bold text-[#1A1512] mt-4 mb-3">
          You are currently offline
        </h1>

        <p className="text-xs text-[#5C5042] leading-relaxed mb-6">
          Your internet connection was lost, but your BrewMellow PWA cached subscription data is safe. Reconnect to place new orders or adjust delivery schedules.
        </p>

        <div className="p-4 bg-[#FAF8F5] border border-[#E6DEC8] text-xs text-left mb-8 space-y-2">
          <p className="font-bold text-[#1A1512] flex items-center gap-1.5">
            <Coffee size={14} className="text-[#A3432A]" /> Himalayan Roast Data Cached:
          </p>
          <ul className="text-[#8A7966] text-[11px] list-disc list-inside space-y-1">
            <li>Gulmi Reserve, Ilam Gold & Nuwakot profiles</li>
            <li>Stored delivery address & past invoice receipts</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleReload}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#1A1512] text-white py-3.5 text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors"
          >
            <RefreshCw size={14} /> Try Reconnecting
          </button>
          
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-1.5 py-3 text-xs uppercase tracking-widest font-bold text-[#8A7966] hover:text-[#1A1512] transition-colors"
          >
            <ArrowLeft size={14} /> View Cached Home
          </Link>
        </div>

      </div>
    </div>
  );
}
