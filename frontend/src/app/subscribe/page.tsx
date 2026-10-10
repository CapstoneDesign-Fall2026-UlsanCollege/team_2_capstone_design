"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Check, Mountain, Sparkles, Coffee, ShieldCheck, ArrowRight, Flame } from "lucide-react";
import { useSearchParams } from "next/navigation";

const ORIGINS = [
  { 
    id: 1, 
    name: "Gulmi Reserve", 
    region: "Gulmi (Western Nepal)",
    altitude: "1,600m",
    process: "Fully Washed",
    price: 1200, 
    notes: "Citrus • Honey • Dark Chocolate",
    desc: "Bright sparkling acidity balanced by lingering mountain honey sweetness.", 
    img: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=600&auto=format&fit=crop" 
  },
  { 
    id: 2, 
    name: "Ilam Gold", 
    region: "Ilam (Eastern Nepal)",
    altitude: "1,800m",
    process: "Sun-Dried Natural",
    price: 1400, 
    notes: "Berry • Jasmine • Caramel",
    desc: "Syrupy fruit-forward cup dried with the cherry intact in the tea-and-coffee belt.", 
    img: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=600&auto=format&fit=crop" 
  },
  { 
    id: 3, 
    name: "Nuwakot Heritage", 
    region: "Nuwakot (Central Nepal)",
    altitude: "1,400m",
    process: "Honey Processed",
    price: 1100, 
    notes: "Walnut • Brown Sugar • Plum",
    desc: "Velvety heavy body with deep nutty tones, cultivated in Kathmandu's northern foothills.", 
    img: "https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=600&auto=format&fit=crop" 
  },
];

const GRINDS = [
  { id: "whole", name: "Whole Bean", desc: "For home grinders • Peak freshness" },
  { id: "espresso", name: "Espresso", desc: "Fine grind • Moka pot & espresso" },
  { id: "pourover", name: "Pour-Over / Drip", desc: "Medium grind • V60 & Chemex" },
  { id: "frenchpress", name: "French Press", desc: "Coarse grind • Immersion & Cold Brew" },
];

const WEIGHTS = [
  { value: 0.5, label: "500g", cups: "~30 Cups / month" },
  { value: 1, label: "1.0 kg", cups: "~60 Cups / month (Popular)" },
  { value: 2, label: "2.0 kg", cups: "~120 Cups / month" },
  { value: 5, label: "5.0 kg", cups: "Office / Team Lot" },
];

const PLANS = [
  { id: "PAYG", name: "Pay Monthly", discount: 0, months: 1, tag: "Flexible" },
  { id: "3M", name: "3-Month Prepay", discount: 5, months: 3, tag: "Save 5%" },
  { id: "6M", name: "6-Month Prepay", discount: 10, months: 6, tag: "Most Popular • Save 10%" },
  { id: "12M", name: "12-Month Prepay", discount: 15, months: 12, tag: "Best Value • Save 15%" },
];

function SubscribeContent() {
  const searchParams = useSearchParams();
  const urlOriginId = Number(searchParams.get("origin"));
  
  const initialOrigin = ORIGINS.find(o => o.id === urlOriginId) || ORIGINS[0];

  const [selectedOrigin, setSelectedOrigin] = useState(initialOrigin);
  const [selectedGrind, setSelectedGrind] = useState(GRINDS[0]);
  const [selectedWeight, setSelectedWeight] = useState(WEIGHTS[1]);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[2]);

  useEffect(() => {
    if (urlOriginId) {
      const found = ORIGINS.find(o => o.id === urlOriginId);
      if (found) setSelectedOrigin(found);
    }
  }, [urlOriginId]);

  const totalOriginalPrice = selectedOrigin.price * selectedWeight.value * selectedPlan.months;
  const totalDiscountedPrice = Math.round(totalOriginalPrice * (1 - selectedPlan.discount / 100));
  const totalSavings = totalOriginalPrice - totalDiscountedPrice;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F2EB] text-[#2C2420] pb-48 font-sans">
      
      {/* 1. BUILDER HERO (Roastify Dark Theme Pattern) */}
      <div className="bg-[#1A1512] text-[#F5F2EB] pt-24 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[#E58A1F] text-[10px] font-bold uppercase tracking-[0.24em] mb-4">
            <Sparkles size={12} /> Interactive Coffee Configurator
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-3">
            Build Your Ritual.
          </h1>
          <p className="text-[#A89F91] text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Configure your Himalayan origin, grind profile, and commitment. Prepaid subscriptions include guaranteed 48-hour roasting and free doorstep courier.
          </p>
        </div>
      </div>

      {/* 2. MAIN CONFIGURATOR CONTAINER */}
      <main className="w-full max-w-4xl mx-auto px-6 pt-12 space-y-16">
        
        {/* Step 1: Origin Cards (Visual Bento Style) */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] uppercase tracking-[0.24em] font-bold text-[#A3432A]">Step 01</span>
              <h2 className="text-2xl font-serif font-bold text-[#1A1512]">Choose Your Himalayan Single-Origin</h2>
            </div>
            <span className="text-xs text-[#8A7966] font-medium hidden sm:inline">
              Altitude 1,400m - 1,800m
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ORIGINS.map((origin) => {
              const isSelected = selectedOrigin.id === origin.id;

              return (
                <div
                  key={origin.id}
                  onClick={() => setSelectedOrigin(origin)}
                  className={`group relative rounded-xl border p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                    isSelected 
                      ? "bg-white border-[#A3432A] shadow-xl ring-2 ring-[#A3432A]" 
                      : "bg-white/80 border-[#E6DEC8] hover:bg-white hover:border-[#C4B69E] shadow-sm"
                  }`}
                >
                  <div>
                    {/* Thumbnail Image */}
                    <div className="w-full h-36 rounded-lg overflow-hidden mb-4 relative">
                      <img 
                        src={origin.img} 
                        alt={origin.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                      <div className="absolute top-2 left-2 bg-[#1A1512]/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white">
                        {origin.altitude}
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#A3432A] text-white flex items-center justify-center shadow-md">
                          <Check size={14} />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-lg font-serif font-bold text-[#1A1512]">{origin.name}</h3>
                      <span className="text-sm font-bold text-[#A3432A]">Rs. {origin.price}</span>
                    </div>

                    <p className="text-[10px] uppercase font-bold tracking-wider text-[#8A7966] mb-2">
                      {origin.region} • {origin.process}
                    </p>

                    <p className="text-xs text-[#5C5042] leading-relaxed mb-4">
                      {origin.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#F0EAE1]">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#1A1512] block mb-0.5">
                      Tasting Notes:
                    </span>
                    <span className="text-[11px] text-[#A3432A] font-medium">
                      {origin.notes}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Step 2: Grind Profile Selection */}
        <section>
          <div className="mb-6">
            <span className="text-[10px] uppercase tracking-[0.24em] font-bold text-[#A3432A]">Step 02</span>
            <h2 className="text-2xl font-serif font-bold text-[#1A1512]">Select Grind Preparation</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GRINDS.map((grind) => {
              const isSelected = selectedGrind.id === grind.id;

              return (
                <div
                  key={grind.id}
                  onClick={() => setSelectedGrind(grind)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? "bg-[#1A1512] text-white border-[#1A1512] shadow-md" 
                      : "bg-white border-[#E6DEC8] text-[#2C2420] hover:bg-[#FAF8F5]"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">{grind.name}</span>
                    {isSelected && <Check size={14} className="text-[#E58A1F]" />}
                  </div>
                  <p className={`text-[11px] leading-snug ${isSelected ? "text-[#A89F91]" : "text-[#8A7966]"}`}>
                    {grind.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Step 3: Weight / Quantity Selection */}
        <section>
          <div className="mb-6">
            <span className="text-[10px] uppercase tracking-[0.24em] font-bold text-[#A3432A]">Step 03</span>
            <h2 className="text-2xl font-serif font-bold text-[#1A1512]">Monthly Delivery Quantity</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {WEIGHTS.map((w) => {
              const isSelected = selectedWeight.value === w.value;

              return (
                <div
                  key={w.value}
                  onClick={() => setSelectedWeight(w)}
                  className={`p-5 rounded-lg border text-center cursor-pointer transition-all ${
                    isSelected 
                      ? "bg-[#1A1512] text-white border-[#1A1512] shadow-md" 
                      : "bg-white border-[#E6DEC8] text-[#2C2420] hover:bg-[#FAF8F5]"
                  }`}
                >
                  <p className="text-xl font-serif font-bold mb-1">{w.label}</p>
                  <p className={`text-[10px] uppercase tracking-wider font-semibold ${isSelected ? "text-[#E58A1F]" : "text-[#8A7966]"}`}>
                    {w.cups}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Step 4: Commitment Plan with Live Discounts */}
        <section>
          <div className="mb-6">
            <span className="text-[10px] uppercase tracking-[0.24em] font-bold text-[#A3432A]">Step 04</span>
            <h2 className="text-2xl font-serif font-bold text-[#1A1512]">Prepayment & Delivery Frequency</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLANS.map((plan) => {
              const isSelected = selectedPlan.id === plan.id;
              const originalCost = selectedOrigin.price * selectedWeight.value * plan.months;
              const discountedCost = Math.round(originalCost * (1 - plan.discount / 100));

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-6 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected 
                      ? "bg-white border-[#A3432A] ring-2 ring-[#A3432A] shadow-lg" 
                      : "bg-white border-[#E6DEC8] hover:border-[#C4B69E]"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isSelected ? "bg-[#FAF5F2] text-[#A3432A]" : "bg-[#F0EAE1] text-[#5C5042]"
                      }`}>
                        {plan.tag}
                      </span>
                      <h3 className="text-lg font-serif font-bold text-[#1A1512] mt-2">{plan.name}</h3>
                      <p className="text-xs text-[#8A7966]">Monthly recurring roast dispatch</p>
                    </div>

                    <div className="text-right">
                      {plan.discount > 0 && (
                        <p className="text-xs line-through text-[#8A7966]">Rs. {originalCost}</p>
                      )}
                      <p className="text-2xl font-serif font-bold text-[#1A1512]">Rs. {discountedCost}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#F0EAE1] flex justify-between items-center text-xs">
                    <span className="text-[#5C5042]">Shipping: <strong className="text-[#2E6B34]">Free</strong></span>
                    {plan.discount > 0 && (
                      <span className="text-[#2E6B34] font-bold">You save Rs. {originalCost - discountedCost}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* 3. ELEGANT STICKY ACTION BAR */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-[#F5F2EB]/95 backdrop-blur-md border-t border-[#E6DEC8] p-5 md:p-6 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.06)]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Summary Preview */}
          <div className="flex items-center justify-between w-full sm:w-auto sm:gap-8">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A7966]">
                {selectedOrigin.name} • {selectedGrind.name} ({selectedWeight.label})
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-[#1A1512]">
                  Rs. {totalDiscountedPrice}
                </span>
                {totalSavings > 0 && (
                  <span className="text-xs font-bold text-[#2E6B34] bg-[#E7F3E8] px-2 py-0.5 rounded">
                    Save Rs. {totalSavings}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Checkout Action Button */}
          <Link 
            href={`/checkout?origin=${selectedOrigin.id}&name=${encodeURIComponent(selectedOrigin.name)}&weight=${selectedWeight.value}&price=${totalDiscountedPrice}&plan_id=${selectedPlan.id}&plan_name=${encodeURIComponent(selectedPlan.name)}`}
            className="w-full sm:w-auto px-10 py-4 rounded-full bg-[#A3432A] hover:bg-[#8A3722] text-white text-center uppercase tracking-widest text-xs font-bold transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2 group"
          >
            Review & Checkout <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>

        </div>
      </div>

    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F2EB]" />}>
      <SubscribeContent />
    </Suspense>
  );
}
