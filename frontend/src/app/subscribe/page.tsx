"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Check, Mountain, Sparkles, Coffee, ShieldCheck, ArrowRight, Flame, RotateCcw, UserCheck, Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";

const ORIGINS = [
  { 
    id: 1, 
    name: "Gulmi Reserve", 
    region: "Gulmi (Western Nepal)",
    altitude: "1,600m",
    score: "86.5 SCA",
    process: "Fully Washed",
    price: 1200, 
    notes: "Citrus • Mountain Honey • Dark Chocolate",
    desc: "Bright sparkling acidity balanced by lingering mountain honey sweetness from smallholder organic farms.", 
    img: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=600&auto=format&fit=crop" 
  },
  { 
    id: 2, 
    name: "Ilam Gold", 
    region: "Ilam (Eastern Nepal)",
    altitude: "1,800m",
    score: "87.0 SCA",
    process: "Sun-Dried Natural",
    price: 1400, 
    notes: "Wild Berry • Jasmine • Brown Sugar",
    desc: "Syrupy fruit-forward cup dried with the cherry intact in the misty tea-and-coffee belt of Eastern Nepal.", 
    img: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=600&auto=format&fit=crop" 
  },
  { 
    id: 3, 
    name: "Nuwakot Heritage", 
    region: "Nuwakot (Central Nepal)",
    altitude: "1,400m",
    score: "85.0 SCA",
    process: "Honey Processed",
    price: 1100, 
    notes: "Walnut • Caramel • Dried Plum",
    desc: "Velvety heavy body with deep nutty tones, cultivated in Kathmandu's northern foothills.", 
    img: "https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=600&auto=format&fit=crop" 
  },
];

const GRINDS = [
  { id: "whole", name: "Whole Bean", desc: "For home grinders • Peak aroma" },
  { id: "espresso", name: "Espresso", desc: "Fine grind • Moka pot & espresso" },
  { id: "pourover", name: "Pour-Over / Drip", desc: "Medium grind • V60 & Chemex" },
  { id: "frenchpress", name: "French Press", desc: "Coarse grind • Immersion & Cold Brew" },
];

const WEIGHTS = [
  { value: 0.5, label: "500g", cups: "~30 Cups / month (Tasting size)" },
  { value: 1, label: "1.0 kg", cups: "~60 Cups / month (Most Popular)" },
  { value: 2, label: "2.0 kg", cups: "~120 Cups / month (Coffee Lovers)" },
  { value: 5, label: "5.0 kg", cups: "Office / Team Lot" },
];

const PLANS = [
  { id: "PAYG", name: "Pay Monthly", discount: 0, months: 1, tag: "Flexible • Cancel Anytime" },
  { id: "3M", name: "3-Month Prepay", discount: 5, months: 3, tag: "Save 5%" },
  { id: "6M", name: "6-Month Prepay", discount: 10, months: 6, tag: "Popular • Save 10%" },
  { id: "12M", name: "12-Month Prepay", discount: 15, months: 12, tag: "Best Value • Save 15%" },
];

function SubscribeContent() {
  const searchParams = useSearchParams();
  const urlOriginId = Number(searchParams.get("origin"));
  const urlPlanId = searchParams.get("plan");
  const urlGrindId = searchParams.get("grind");
  const urlWeight = Number(searchParams.get("weight"));
  
  const initialOrigin = ORIGINS.find(o => o.id === urlOriginId) || ORIGINS[0];
  const initialPlan = PLANS.find(p => p.id.toLowerCase() === urlPlanId?.toLowerCase()) || PLANS[0];
  const initialGrind = GRINDS.find(g => g.id.toLowerCase() === urlGrindId?.toLowerCase()) || GRINDS[0];
  const initialWeight = WEIGHTS.find(w => w.value === urlWeight) || WEIGHTS[1];

  const [selectedOrigin, setSelectedOrigin] = useState(initialOrigin);
  const [selectedGrind, setSelectedGrind] = useState(initialGrind);
  const [selectedWeight, setSelectedWeight] = useState(initialWeight);
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [customer, setCustomer] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    if (urlOriginId) {
      const found = ORIGINS.find(o => o.id === urlOriginId);
      if (found) setSelectedOrigin(found);
    }
    if (urlPlanId) {
      const foundPlan = PLANS.find(p => p.id.toLowerCase() === urlPlanId.toLowerCase());
      if (foundPlan) setSelectedPlan(foundPlan);
    }
    if (urlGrindId) {
      const foundGrind = GRINDS.find(g => g.id.toLowerCase() === urlGrindId.toLowerCase());
      if (foundGrind) setSelectedGrind(foundGrind);
    }
    if (urlWeight) {
      const foundWeight = WEIGHTS.find(w => w.value === urlWeight);
      if (foundWeight) setSelectedWeight(foundWeight);
    }
    // Check if user is logged in
    try {
      const stored = localStorage.getItem("customer_user");
      if (stored) {
        setCustomer(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
  }, [urlOriginId, urlPlanId, urlGrindId, urlWeight]);

  const baseMonthlyPrice = selectedOrigin.price * selectedWeight.value;
  const totalOriginalPrice = baseMonthlyPrice * selectedPlan.months;
  const totalDiscountedPrice = Math.round(totalOriginalPrice * (1 - selectedPlan.discount / 100));
  const totalSavings = totalOriginalPrice - totalDiscountedPrice;
  const effectiveMonthlyPrice = Math.round(totalDiscountedPrice / selectedPlan.months);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F2EB] text-[#2C2420] font-sans">
      
      {/* 1. BUILDER HERO */}
      <div className="bg-[#1A1512] text-[#F5F2EB] pt-20 pb-14 px-6 relative overflow-hidden border-b border-[#2C2420]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-25 mix-blend-overlay"></div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[#E58A1F] text-[10px] font-bold uppercase tracking-[0.24em] mb-4">
            <Sparkles size={12} /> Custom Coffee Subscription
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-3">
            Build Your Himalayan Ritual.
          </h1>
          <p className="text-[#A89F91] text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
            Select your preferred mountain origin, grind size, and delivery frequency. Roasted fresh in Lalitpur and delivered to your doorstep.
          </p>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mt-8 text-[11px] uppercase tracking-wider font-semibold text-[#8A7966]">
            <span className="text-[#E58A1F] flex items-center gap-1.5 font-bold">
              <span className="w-5 h-5 rounded-full bg-[#E58A1F] text-[#1A1512] flex items-center justify-center text-[10px]">1</span>
              Origin
            </span>
            <span>→</span>
            <span className="text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px]">2</span>
              Grind
            </span>
            <span>→</span>
            <span className="text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px]">3</span>
              Size
            </span>
            <span>→</span>
            <span className="text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px]">4</span>
              Plan
            </span>
          </div>
        </div>
      </div>

      {/* 2. TWO-COLUMN SPLIT CONTAINER (Trade Coffee / Apple Pattern) */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Interactive Steps (7 Cols) */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Step 1: Origin Cards */}
            <section id="step-origin">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.24em] font-bold text-[#A3432A]">Step 01</span>
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-[#1A1512]">Choose Mountain Origin</h2>
                </div>
                <span className="text-xs text-[#8A7966] font-medium hidden sm:inline">
                  Single-Origin Lots
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {ORIGINS.map((origin) => {
                  const isSelected = selectedOrigin.id === origin.id;

                  return (
                    <div
                      key={origin.id}
                      onClick={() => setSelectedOrigin(origin)}
                      className={`group relative rounded-xl border p-4 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                        isSelected 
                          ? "bg-white border-[#A3432A] shadow-lg ring-2 ring-[#A3432A]" 
                          : "bg-white/80 border-[#E6DEC8] hover:bg-white hover:border-[#C4B69E] shadow-sm"
                      }`}
                    >
                      <div>
                        {/* Thumbnail Image */}
                        <div className="w-full h-28 rounded-lg overflow-hidden mb-3 relative">
                          <img 
                            src={origin.img} 
                            alt={origin.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          />
                          <div className="absolute top-2 left-2 bg-[#1A1512]/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white">
                            {origin.altitude}
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#A3432A] text-white flex items-center justify-center shadow-md">
                              <Check size={12} />
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-sm font-serif font-bold text-[#1A1512]">{origin.name}</h3>
                          <span className="text-xs font-bold text-[#A3432A]">Rs. {origin.price}</span>
                        </div>

                        <p className="text-[9px] uppercase font-bold tracking-wider text-[#8A7966] mb-2">
                          {origin.region}
                        </p>

                        <p className="text-[11px] text-[#5C5042] leading-snug mb-3 line-clamp-2">
                          {origin.desc}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#F0EAE1]">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-[#1A1512] block">
                          Notes:
                        </span>
                        <span className="text-[10px] text-[#A3432A] font-medium leading-tight">
                          {origin.notes}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Step 2: Grind Profile */}
            <section id="step-grind">
              <div className="mb-4">
                <span className="text-[10px] uppercase tracking-[0.24em] font-bold text-[#A3432A]">Step 02</span>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-[#1A1512]">Select Grind Preparation</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {GRINDS.map((grind) => {
                  const isSelected = selectedGrind.id === grind.id;

                  return (
                    <div
                      key={grind.id}
                      onClick={() => setSelectedGrind(grind)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-[#1A1512] text-white border-[#1A1512] shadow-md" 
                          : "bg-white border-[#E6DEC8] text-[#2C2420] hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider pr-2">{grind.name}</span>
                        <span
                          className={`w-3.5 h-3.5 rounded-full border transition-all flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? "bg-green-500 border-green-500 ring-2 ring-green-500/20"
                              : "border-[#C8BFAB] bg-transparent"
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                        </span>
                      </div>
                      <p className={`text-[10px] leading-tight ${isSelected ? "text-[#A89F91]" : "text-[#8A7966]"}`}>
                        {grind.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Step 3: Bag Size Selection */}
            <section id="step-size">
              <div className="mb-4">
                <span className="text-[10px] uppercase tracking-[0.24em] font-bold text-[#A3432A]">Step 03</span>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-[#1A1512]">Monthly Bag Quantity</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {WEIGHTS.map((w) => {
                  const isSelected = selectedWeight.value === w.value;

                  return (
                    <div
                      key={w.value}
                      onClick={() => setSelectedWeight(w)}
                      className={`p-4 rounded-lg border text-center cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-[#1A1512] text-white border-[#1A1512] shadow-md" 
                          : "bg-white border-[#E6DEC8] text-[#2C2420] hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <p className="text-lg font-serif font-bold mb-0.5">{w.label}</p>
                      <p className={`text-[9px] uppercase tracking-wider font-semibold ${isSelected ? "text-[#E58A1F]" : "text-[#8A7966]"}`}>
                        {w.cups}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Step 4: Frequency & Commitment */}
            <section id="step-plan">
              <div className="mb-4">
                <span className="text-[10px] uppercase tracking-[0.24em] font-bold text-[#A3432A]">Step 04</span>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-[#1A1512]">Billing & Delivery Frequency</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {PLANS.map((plan) => {
                  const isSelected = selectedPlan.id === plan.id;
                  const originalCost = baseMonthlyPrice * plan.months;
                  const discountedCost = Math.round(originalCost * (1 - plan.discount / 100));

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected 
                          ? "bg-white border-[#A3432A] ring-2 ring-[#A3432A] shadow-md" 
                          : "bg-white border-[#E6DEC8] hover:border-[#C4B69E]"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            isSelected ? "bg-[#FAF5F2] text-[#A3432A]" : "bg-[#F0EAE1] text-[#5C5042]"
                          }`}>
                            {plan.tag}
                          </span>
                          <h3 className="text-base font-serif font-bold text-[#1A1512] mt-1.5">{plan.name}</h3>
                          <p className="text-[11px] text-[#8A7966]">Monthly roasted dispatch</p>
                        </div>

                        <div className="text-right">
                          {plan.discount > 0 && (
                            <p className="text-[11px] line-through text-[#8A7966]">Rs. {originalCost}</p>
                          )}
                          <p className="text-xl font-serif font-bold text-[#1A1512]">Rs. {discountedCost}</p>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-[#F0EAE1] flex justify-between items-center text-[11px]">
                        <span className="text-[#5C5042]">Delivery: <strong className="text-[#2E6B34]">Free Courier</strong></span>
                        {plan.discount > 0 ? (
                          <span className="text-[#2E6B34] font-bold">Save Rs. {originalCost - discountedCost}</span>
                        ) : (
                          <span className="text-[#8A7966]">Cancel anytime</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: Sticky "Your Box Summary" Card (5 Cols on lg) */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-white rounded-2xl border border-[#E6DEC8] shadow-xl overflow-hidden p-6 md:p-7">
              
              <div className="flex items-center justify-between pb-4 border-b border-[#F0EAE1] mb-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#A3432A] block">
                    Your Coffee Ritual
                  </span>
                  <h3 className="text-lg font-serif font-bold text-[#1A1512]">
                    Subscription Box Preview
                  </h3>
                </div>
                <span className="px-2.5 py-1 bg-[#E7F3E8] text-[#2E6B34] text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} /> Direct Trade
                </span>
              </div>

              {/* Coffee Visual Mini Card */}
              <div className="flex gap-4 items-center bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E6DEC8] mb-5">
                <img 
                  src={selectedOrigin.img} 
                  alt={selectedOrigin.name} 
                  className="w-16 h-16 rounded-lg object-cover shadow-sm shrink-0" 
                />
                <div className="min-w-0">
                  <h4 className="font-serif font-bold text-sm text-[#1A1512] truncate">
                    {selectedOrigin.name}
                  </h4>
                  <p className="text-[10px] text-[#8A7966] uppercase tracking-wider">
                    {selectedOrigin.altitude} • {selectedOrigin.process}
                  </p>
                  <p className="text-[11px] text-[#A3432A] font-medium truncate mt-0.5">
                    {selectedOrigin.notes}
                  </p>
                </div>
              </div>

              {/* Box Specifications */}
              <div className="space-y-2.5 text-xs text-[#5C5042] pb-5 border-b border-[#F0EAE1] mb-5">
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Grind Profile:</span>
                  <strong className="text-[#1A1512] font-semibold">{selectedGrind.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Monthly Quantity:</span>
                  <strong className="text-[#1A1512] font-semibold">{selectedWeight.label} ({selectedWeight.cups})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Plan Frequency:</span>
                  <strong className="text-[#1A1512] font-semibold">{selectedPlan.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Doorstep Delivery:</span>
                  <strong className="text-[#2E6B34] font-semibold">Free (Kathmandu & Nationwide)</strong>
                </div>
              </div>

              {/* Pricing Totals */}
              <div className="mb-6">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs font-semibold text-[#8A7966] uppercase tracking-wider">
                    {selectedPlan.months > 1 ? "Total Due Today:" : "Monthly Charge:"}
                  </span>
                  <div className="text-right">
                    <span className="text-3xl font-serif font-bold text-[#1A1512]">
                      Rs. {totalDiscountedPrice}
                    </span>
                    {selectedPlan.months > 1 && (
                      <span className="block text-[11px] text-[#8A7966]">
                        (Rs. {effectiveMonthlyPrice} / month)
                      </span>
                    )}
                  </div>
                </div>

                {totalSavings > 0 && (
                  <div className="mt-2 py-1.5 px-3 bg-[#E7F3E8] text-[#2E6B34] text-xs font-bold rounded-lg flex items-center justify-between">
                    <span>Discount Applied:</span>
                    <span>Save Rs. {totalSavings} ({selectedPlan.discount}%)</span>
                  </div>
                )}
              </div>

              {/* Customer Account Status Indicator */}
              <div className="mb-5 py-2 px-3 bg-[#FAF8F5] border border-[#E6DEC8] rounded-lg flex items-center justify-between text-xs">
                {customer ? (
                  <span className="flex items-center gap-1.5 text-[#2E6B34] font-medium">
                    <UserCheck size={14} />
                    <span>Subscribing as <strong>{customer.name}</strong></span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[#8A7966]">
                    <Lock size={12} />
                    <span>Guest checkout or sign in next</span>
                  </span>
                )}
                <Link href={customer ? "/dashboard" : "/login"} className="text-[11px] font-bold text-[#A3432A] hover:underline">
                  {customer ? "My Account" : "Sign In"}
                </Link>
              </div>

              {/* Primary Action Button */}
              <Link 
                href={`/checkout?origin=${selectedOrigin.id}&name=${encodeURIComponent(selectedOrigin.name)}&weight=${selectedWeight.value}&price=${totalDiscountedPrice}&plan_id=${selectedPlan.id}&plan_name=${encodeURIComponent(selectedPlan.name)}`}
                className="w-full py-4 rounded-xl bg-[#A3432A] hover:bg-[#8A3722] text-white text-center uppercase tracking-widest text-xs font-bold transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                Proceed to Checkout <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Reassurance Guarantees */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-[#8A7966] text-center pt-3 border-t border-[#F0EAE1]">
                <span className="flex items-center justify-center gap-1">
                  <Flame size={12} className="text-[#A3432A]" /> 48h Fresh Roast
                </span>
                <span className="flex items-center justify-center gap-1">
                  <RotateCcw size={12} className="text-[#A3432A]" /> Cancel Anytime
                </span>
              </div>

            </div>
          </div>

        </div>
      </main>

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
