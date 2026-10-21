"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Mountain, Award, ShieldCheck, Flame, ArrowRight, 
  MapPin, Clock, Scale
} from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F2EB] text-[#2C2420]">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (EDITORIAL HIMALAYAN SHOWCASE)                            */}
      {/* ========================================================================= */}
      <section className="relative pt-36 pb-24 px-6 flex items-center justify-center min-h-[78vh] overflow-hidden bg-[#1A1512]">
        {/* Authentic Background Terroir Imagery */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=75&w=1400&auto=format&fit=crop')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1512] via-[#1A1512]/60 to-[#1A1512]/40" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Editorial Eyebrow Header */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="w-8 h-[1px] bg-[#A3432A]" />
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#E58A1F] font-bold">
              Single-Origin Himalayan Specialty Coffee
            </span>
            <span className="w-8 h-[1px] bg-[#A3432A]" />
          </div>

          {/* Fraunces Editorial Display Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight text-white mb-6 leading-[1.08]">
            Mist-Grown at 2,000m.<br />
            Roasted to Order in Lalitpur.
          </h1>

          <p className="text-[#F5F2EB]/85 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
            High-altitude Bourbon and Typica cherries hand-sorted on the terraced slopes of Gulmi, Ilam, and Nuwakot. Small-batch drum roasted and delivered within 48 hours of degassing.
          </p>

          {/* Action Gateways */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/subscribe?plan=PAYG"
              className="min-h-[48px] inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#A3432A] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#8A3722] transition-colors shadow-md group"
            >
              <span>Build Your Subscription</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/origins"
              className="min-h-[48px] inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-white/30 bg-white/5 text-[#F5F2EB] text-xs uppercase tracking-widest font-bold hover:bg-white/15 transition-colors backdrop-blur-xs"
            >
              Explore Origin Terroirs
            </Link>
          </div>

          {/* Empirical Coffee Ledger Header Strip */}
          <div className="mt-14 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
            <div className="p-2">
              <span className="font-mono text-xs text-[#E58A1F] block uppercase tracking-wider font-semibold">
                Elevation Terroir
              </span>
              <span className="font-mono text-sm text-white font-bold block mt-0.5">
                1,600m – 2,000m MASL
              </span>
              <span className="text-xs text-[#A89F91] block mt-0.5">
                Strictly Hard Bean (SHB) density
              </span>
            </div>

            <div className="p-2 border-t sm:border-t-0 sm:border-l border-white/10">
              <span className="font-mono text-xs text-[#E58A1F] block uppercase tracking-wider font-semibold">
                Cupping Standard
              </span>
              <span className="font-mono text-sm text-white font-bold block mt-0.5">
                84+ to 87.0 SCA Certified
              </span>
              <span className="text-xs text-[#A89F91] block mt-0.5">
                Zero primary defects guaranteed
              </span>
            </div>

            <div className="p-2 border-t sm:border-t-0 sm:border-l border-white/10">
              <span className="font-mono text-xs text-[#E58A1F] block uppercase tracking-wider font-semibold">
                Direct Trade Sourcing
              </span>
              <span className="font-mono text-sm text-white font-bold block mt-0.5">
                +40% Above Fair Market
              </span>
              <span className="text-xs text-[#A89F91] block mt-0.5">
                100% smallholder cooperative paid
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ROASTERY INDEX & GATEWAYS (ARCHITECTURAL LEDGER IN PLACE OF DARK BENTO) */}
      {/* ========================================================================= */}
      <section className="w-full bg-[#FAF8F5] border-y border-[#E6DEC8]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E6DEC8]">
            
            {/* Gateway 01: Single Origins */}
            <Link 
              href="/origins" 
              className="group p-8 md:p-10 flex flex-col justify-between hover:bg-white transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-[#A3432A] tracking-widest">
                    01 / TERROIR CATALOG
                  </span>
                  <MapPin size={16} className="text-[#A3432A]" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#1A1512] mb-3 group-hover:text-[#A3432A] transition-colors">
                  Single-Origin Harvests
                </h2>
                <p className="text-[#5C5042] text-[15px] leading-relaxed font-normal">
                  Explore distinct mountain micro-lots from Gulmi, Ilam, and Nuwakot. Calibrated cupping scorecards, washing methods, and tasting notes direct from the farm.
                </p>
              </div>

              <div className="pt-8 mt-6 border-t border-[#F0EAE1] flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#A3432A] group-hover:underline">
                  Browse 3 Origins
                </span>
                <ArrowRight size={14} className="text-[#A3432A] group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>

            {/* Gateway 02: Custom Subscription */}
            <Link 
              href="/subscribe?plan=6M&origin=1" 
              className="group p-8 md:p-10 flex flex-col justify-between hover:bg-white transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-[#A3432A] tracking-widest">
                    02 / RECURRING CLUB
                  </span>
                  <Scale size={16} className="text-[#A3432A]" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#1A1512] mb-3 group-hover:text-[#A3432A] transition-colors">
                  Tailored Delivery Cycles
                </h2>
                <p className="text-[#5C5042] text-[15px] leading-relaxed font-normal">
                  Customize your bean lot, grind calibration, and monthly box cadence. Save up to 15% with prepaid roasting memberships and free doorstep shipping across Nepal.
                </p>
              </div>

              <div className="pt-8 mt-6 border-t border-[#F0EAE1] flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#A3432A] group-hover:underline">
                  Configure Your Plan
                </span>
                <ArrowRight size={14} className="text-[#A3432A] group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>

            {/* Gateway 03: Roastery Heritage */}
            <Link 
              href="/about#story" 
              className="group p-8 md:p-10 flex flex-col justify-between hover:bg-white transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-[#A3432A] tracking-widest">
                    03 / ROASTERY CRAFT
                  </span>
                  <Flame size={16} className="text-[#A3432A]" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#1A1512] mb-3 group-hover:text-[#A3432A] transition-colors">
                  Lalitpur Roastery Heritage
                </h2>
                <p className="text-[#5C5042] text-[15px] leading-relaxed font-normal">
                  Contracting directly with 180+ smallholder families with zero commodity brokers. 100% shade-grown canopy, organic mountain compost, and artisan drum profiling.
                </p>
              </div>

              <div className="pt-8 mt-6 border-t border-[#F0EAE1] flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#A3432A] group-hover:underline">
                  Read Roastery Story
                </span>
                <ArrowRight size={14} className="text-[#A3432A] group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. ASYMMETRIC EDITORIAL SPREAD (PURGES 4-CARD BENTO CLONE ARMY)           */}
      {/* ========================================================================= */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full">
        {/* Section Header */}
        <div className="max-w-2xl mb-14">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-[1px] bg-[#A3432A]" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-[#A3432A]">
              Pillars of Specialty Craft
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1A1512] tracking-tight mb-4">
            The Himalayan Specialty Standard
          </h2>
          <p className="text-[#5C5042] text-[15px] md:text-base leading-relaxed">
            Specialty coffee is not an abstract slogan—it is an empirical, calibrated protocol from extreme elevation cherries to certified Q-Grader cupping bowls.
          </p>
        </div>

        {/* Asymmetrical 7-Col vs 5-Col Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* FEATURED ANCHOR (7 COLS): Flagship High-Altitude Terroir Showcase */}
          <div className="lg:col-span-7 bg-white border border-[#E6DEC8] rounded-2xl p-8 md:p-10 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#A3432A] bg-[#FAF5F2] px-3 py-1 rounded border border-[#E6DEC8]">
                  Anchor Pillar 01 & 02 • Micro-Lot Terroir & Grading
                </span>
                <span className="font-mono text-xs text-[#5C5042] font-semibold">
                  Gulmi & Ilam High Ridges
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1512] mb-4">
                Extreme Elevation Slows Maturation
              </h3>

              <p className="text-[#5C5042] text-[15px] leading-relaxed mb-6 font-normal">
                Nepal sits at the northern fringe of the coffee belt. Combined with elevations between 1,400m and 2,000m, freezing Himalayan night temperatures drop cherry respiration, extending fruit development from the typical 6 months to 9 full months. This extreme climatic stress packs dense sucrose, malic acids, and complex floral lipids directly into the seed.
              </p>

              {/* Technical Roastery Spec Ledger Table */}
              <div className="border border-[#E6DEC8] rounded-xl overflow-hidden bg-[#FAF8F5] mb-6">
                <div className="px-4 py-2.5 bg-[#EAE4D3] border-b border-[#E6DEC8] flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1A1512]">
                    Technical Lot Specification
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#A3432A]">
                    Verified Lab Data
                  </span>
                </div>
                <div className="divide-y divide-[#E6DEC8] text-xs font-mono">
                  <div className="px-4 py-3 flex justify-between items-center">
                    <span className="text-[#5C5042]">Altitude Range</span>
                    <span className="font-bold text-[#1A1512]">1,600m – 2,000m MASL (Strictly Hard Bean)</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between items-center">
                    <span className="text-[#5C5042]">SCA Cupping Lot Score</span>
                    <span className="font-bold text-[#2E6B34]">86.5 / 100 Certified Specialty Lot</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between items-center">
                    <span className="text-[#5C5042]">Botanical Varieties</span>
                    <span className="font-bold text-[#1A1512]">Bourbon & Typica (100% Arabica)</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between items-center">
                    <span className="text-[#5C5042]">Post-Harvest Processing</span>
                    <span className="font-bold text-[#1A1512]">Glacial Spring Wash & Raised Bamboo Beds</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#F0EAE1] flex flex-wrap items-center justify-between gap-4">
              <Link
                href="/origins?section=terroir"
                className="font-mono text-xs uppercase tracking-wider font-bold text-[#A3432A] hover:underline flex items-center gap-1.5"
              >
                Inspect Elevation Terroir <ArrowRight size={13} />
              </Link>
              <Link
                href="/origins?section=sca-quality"
                className="font-mono text-xs uppercase tracking-wider font-bold text-[#5C5042] hover:text-[#1A1512] flex items-center gap-1.5"
              >
                View SCA Lab Protocol <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* SUPPORTING STACK (5 COLS): Direct Trade & Roast-to-Door Freshness */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Supporting Card A: 100% Farmer Direct Trade */}
            <div className="bg-white border border-[#E6DEC8] rounded-2xl p-7 flex-1 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#2E6B34]">
                    Pillar 03 • Living Wages
                  </span>
                  <ShieldCheck size={18} className="text-[#2E6B34]" />
                </div>
                <h4 className="text-xl font-serif font-bold text-[#1A1512] mb-2">
                  100% Direct-Trade Cooperative Contracts
                </h4>
                <p className="text-[#5C5042] text-[15px] leading-relaxed mb-4 font-normal">
                  We bypass speculative commodity brokers. Smallholder cooperatives in Gulmi receive <strong>+40% above fair trade market minimums</strong>, paid directly into bank accounts to fund raised drying beds and organic compost.
                </p>
              </div>

              <div className="pt-4 border-t border-[#F0EAE1]">
                <Link
                  href="/origins?section=farmer-impact"
                  className="font-mono text-xs uppercase tracking-wider font-bold text-[#A3432A] hover:underline inline-flex items-center gap-1.5"
                >
                  Verify Farmer Compensation <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Supporting Card B: 48-Hour Roast Freshness */}
            <div className="bg-[#1A1512] text-[#F5F2EB] border border-[#2C2420] rounded-2xl p-7 flex-1 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#E58A1F]">
                    Pillar 04 • Small-Batch Freshness
                  </span>
                  <Flame size={18} className="text-[#E58A1F]" />
                </div>
                <h4 className="text-xl font-serif font-bold text-white mb-2">
                  48-Hour Cast-Iron Roast Schedule
                </h4>
                <p className="text-[#A89F91] text-[15px] leading-relaxed mb-4 font-normal">
                  Supermarket coffee often sits warehouse-shelved for 6 months. We roast in 5kg micro-batches in Lalitpur every Monday and Wednesday morning, dispatching at optimal CO2 stabilization for peak aroma bloom.
                </p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <Link
                  href="/origins?section=roast-schedule"
                  className="font-mono text-xs uppercase tracking-wider font-bold text-[#E58A1F] hover:underline inline-flex items-center gap-1.5"
                >
                  View Lalitpur Roast Calendar <ArrowRight size={13} />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. VERIFIED SUBSCRIBER TASTING JOURNAL (PURGES GENERIC MARQUEE)           */}
      {/* ========================================================================= */}
      <section className="bg-[#FAF8F5] py-20 px-6 border-y border-[#E6DEC8]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-[#E6DEC8] gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-[1px] bg-[#A3432A]" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-[#A3432A]">
                  Tasting Journal Entries
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1512]">
                Brewed Daily Across Nepal
              </h3>
            </div>
            <div className="font-mono text-xs text-[#5C5042] flex items-center gap-3">
              <span>Verified Direct-Trade Subscribers</span>
              <span>•</span>
              <span className="text-[#2E6B34] font-bold">100% Arabica Micro-Lots</span>
            </div>
          </div>

          {/* 3 Journal Entries */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Entry 1 */}
            <div className="bg-white border border-[#E6DEC8] p-6 rounded-xl flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-3 font-mono text-xs text-[#5C5042]">
                  <span className="text-[#A3432A] font-bold">Entry #042</span>
                  <span>Biratnagar • V60 Drip</span>
                </div>
                <p className="text-[#2C2420] text-[15px] leading-relaxed mb-6 font-normal">
                  "The Ilam Gold natural process has genuine wild berry esters without any sour fermentation taint. Fresh roast date is stamped right on the bag valve. Unmatched morning cup."
                </p>
              </div>
              <div className="pt-4 border-t border-[#F0EAE1] flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-[#1A1512]">Priya Sharma</p>
                  <p className="text-[#5C5042] font-mono">Ilam Gold • 500g Bi-Weekly</p>
                </div>
                <span className="font-mono text-[#2E6B34] font-bold">Verified</span>
              </div>
            </div>

            {/* Entry 2 */}
            <div className="bg-white border border-[#E6DEC8] p-6 rounded-xl flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-3 font-mono text-xs text-[#5C5042]">
                  <span className="text-[#A3432A] font-bold">Entry #089</span>
                  <span>Kathmandu • Aeropress</span>
                </div>
                <p className="text-[#2C2420] text-[15px] leading-relaxed mb-6 font-normal">
                  "Being able to change grind sizes or pause deliveries directly in the customer portal makes this effortless. The Gulmi Reserve has a distinct malic acidity reminiscent of high Kenyan lots."
                </p>
              </div>
              <div className="pt-4 border-t border-[#F0EAE1] flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-[#1A1512]">Bikash Thapa</p>
                  <p className="text-[#5C5042] font-mono">Gulmi Reserve • Whole Bean</p>
                </div>
                <span className="font-mono text-[#2E6B34] font-bold">Verified</span>
              </div>
            </div>

            {/* Entry 3 */}
            <div className="bg-white border border-[#E6DEC8] p-6 rounded-xl flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-3 font-mono text-xs text-[#5C5042]">
                  <span className="text-[#A3432A] font-bold">Entry #114</span>
                  <span>Lalitpur • French Press</span>
                </div>
                <p className="text-[#2C2420] text-[15px] leading-relaxed mb-6 font-normal">
                  "Nuwakot Heritage has a heavy, syrupy body with walnut and dark molasses notes. It pairs wonderfully with a dash of milk while retaining distinct single-origin clarity."
                </p>
              </div>
              <div className="pt-4 border-t border-[#F0EAE1] flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-[#1A1512]">Dr. R. Shrestha</p>
                  <p className="text-[#5C5042] font-mono">Nuwakot Heritage • 3M Cycle</p>
                </div>
                <span className="font-mono text-[#2E6B34] font-bold">Verified</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. GROUNDED FINAL CALL TO ACTION (PURGES "ELEVATE YOUR DAILY RITUAL")      */}
      {/* ========================================================================= */}
      <section className="py-24 px-6 text-center bg-[#F5F2EB]">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-8 h-[1px] bg-[#A3432A]" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-[#A3432A]">
              Freshly Roasted to Order
            </span>
            <span className="w-8 h-[1px] bg-[#A3432A]" />
          </div>

          <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1A1512] mb-4 tracking-tight">
            Taste the Himalayan Altitude.
          </h3>

          <p className="text-[#5C5042] text-[15px] md:text-base mb-8 leading-relaxed font-normal">
            Select your preferred single-origin lot, customize your grind for your brewing method, and receive freshly roasted batches on flexible recurring cycles.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/subscribe?plan=PAYG"
              className="min-h-[48px] inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#1A1512] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors shadow-sm"
            >
              <span>Build Your Subscription</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/origins"
              className="min-h-[48px] inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-[#E6DEC8] bg-[#FAF8F5] text-[#1A1512] text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors"
            >
              Explore 3 Signature Lots
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
