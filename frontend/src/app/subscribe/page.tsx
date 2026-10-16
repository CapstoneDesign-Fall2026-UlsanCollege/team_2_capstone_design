"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Check, Sparkles, ShieldCheck, ArrowRight, Flame, RotateCcw, UserCheck, Lock, Package, Scale } from "lucide-react";
import { useSearchParams } from "next/navigation";

// 1. BASE ORIGIN SPECIFICATIONS
const ORIGINS = [
  { 
    id: 1, 
    name: "Gulmi Reserve", 
    region: "Gulmi (Western Nepal)",
    altitude: "1,600m",
    score: "86.5 SCA",
    process: "Fully Washed",
    notes: "Citrus • Mountain Honey • Dark Chocolate",
    img: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=600&auto=format&fit=crop" 
  },
  { 
    id: 2, 
    name: "Ilam Gold", 
    region: "Ilam (Eastern Nepal)",
    altitude: "1,800m",
    score: "87.0 SCA",
    process: "Sun-Dried Natural",
    notes: "Wild Berry • Jasmine • Brown Sugar",
    img: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=600&auto=format&fit=crop" 
  },
  { 
    id: 3, 
    name: "Nuwakot Heritage", 
    region: "Nuwakot (Central Nepal)",
    altitude: "1,400m",
    score: "85.0 SCA",
    process: "Honey Processed",
    notes: "Walnut • Caramel • Dried Plum",
    img: "https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=600&auto=format&fit=crop" 
  },
];

// 2. PRICING MATRIX (Exact NPR per bag for each weight tier)
const ORIGIN_PRICES: Record<number, Record<string, number>> = {
  1: { "150g": 450, "250g": 650, "500g": 1200, "1000g": 2200 },
  2: { "150g": 500, "250g": 750, "500g": 1400, "1000g": 2600 },
  3: { "150g": 400, "250g": 600, "500g": 1100, "1000g": 2000 },
};

// 3. PACK SIZES
const PACK_SIZES = [
  { id: "150g", value: 0.15, label: "150g Trial", isTrial: true, tag: "One-Time Buy", cups: "~10 Cups" },
  { id: "250g", value: 0.25, label: "250g", isTrial: false, tag: "Tasting Size", cups: "~15 Cups / mo" },
  { id: "500g", value: 0.50, label: "500g", isTrial: false, tag: "Most Popular", cups: "~30 Cups / mo" },
  { id: "1000g", value: 1.00, label: "1.0 kg", isTrial: false, tag: "Best Value", cups: "~60 Cups / mo" },
];

// 4. BOX CURATION FORMATS
const BOX_FORMATS = [
  { id: "single", name: "1 Bag", subtitle: "Single Origin", bags: 1, discountPercent: 0 },
  { id: "duo", name: "2 Bags Duo", subtitle: "Mix & Match • 5% Off", bags: 2, discountPercent: 5 },
  { id: "trio", name: "3 Bags Trio", subtitle: "All Regions • 10% Off", bags: 3, discountPercent: 10 },
];

const GRINDS = [
  { id: "whole", name: "Whole Bean", desc: "For home grinders" },
  { id: "espresso", name: "Espresso", desc: "Moka pot & espresso" },
  { id: "pourover", name: "Pour-Over", desc: "V60, Chemex & Drip" },
  { id: "frenchpress", name: "French Press", desc: "Coarse & Cold Brew" },
];

const PLANS = [
  { id: "PAYG", name: "Pay Monthly", discount: 0, months: 1, tag: "Cancel Anytime" },
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
  const urlBoxId = searchParams.get("box");
  
  const initialFormat = BOX_FORMATS.find(b => b.id === urlBoxId) || BOX_FORMATS[0];
  const initialPlan = PLANS.find(p => p.id.toLowerCase() === urlPlanId?.toLowerCase()) || PLANS[0];
  const initialGrind = GRINDS.find(g => g.id.toLowerCase() === urlGrindId?.toLowerCase()) || GRINDS[0];
  const initialSize = PACK_SIZES.find(w => w.value === urlWeight) || PACK_SIZES[2]; // Default: 500g

  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [boxFormat, setBoxFormat] = useState(initialFormat);
  const [bagCounts, setBagCounts] = useState<{ [id: number]: number }>({ 
    1: urlOriginId === 2 ? 0 : urlOriginId === 3 ? 0 : 1, 
    2: urlOriginId === 2 ? 1 : 0, 
    3: urlOriginId === 3 ? 1 : 0 
  });
  const [selectedGrind, setSelectedGrind] = useState(initialGrind);
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [customer, setCustomer] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    if (urlOriginId && boxFormat.bags === 1) {
      setBagCounts({ 1: urlOriginId === 1 ? 1 : 0, 2: urlOriginId === 2 ? 1 : 0, 3: urlOriginId === 3 ? 1 : 0 });
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
      const foundWeight = PACK_SIZES.find(w => w.value === urlWeight);
      if (foundWeight) setSelectedSize(foundWeight);
    }
    try {
      const stored = localStorage.getItem("demo_user") || localStorage.getItem("customer_user");
      if (stored) setCustomer(JSON.parse(stored));
    } catch (e) {
      // ignore
    }
  }, [urlOriginId, urlPlanId, urlGrindId, urlWeight]);

  // Handle Box Format change
  const handleSelectFormat = (format: typeof BOX_FORMATS[0]) => {
    setBoxFormat(format);
    if (format.bags === 1) {
      const activeId = Number(Object.entries(bagCounts).find(([_, c]) => c > 0)?.[0] || 1);
      setBagCounts({ 1: activeId === 1 ? 1 : 0, 2: activeId === 2 ? 1 : 0, 3: activeId === 3 ? 1 : 0 });
    } else if (format.bags === 2) {
      setBagCounts({ 1: 1, 2: 1, 3: 0 }); // Default Gulmi + Ilam
    } else if (format.bags === 3) {
      setBagCounts({ 1: 1, 2: 1, 3: 1 }); // All 3 regions
    }
  };

  const totalSelectedBags = Object.values(bagCounts).reduce((a, b) => a + b, 0);

  // Intuitive card click handler for frictionless selection
  const handleOriginCardClick = (originId: number) => {
    if (boxFormat.bags === 1) {
      setBagCounts({ 1: originId === 1 ? 1 : 0, 2: originId === 2 ? 1 : 0, 3: originId === 3 ? 1 : 0 });
      return;
    }

    if (boxFormat.bags === 2) {
      // If clicking this origin when it's already 1x, toggle to 2x (both bags this origin)
      if (bagCounts[originId] === 1 && totalSelectedBags === 2) {
        setBagCounts({ 1: originId === 1 ? 2 : 0, 2: originId === 2 ? 2 : 0, 3: originId === 3 ? 2 : 0 });
        return;
      }
      // If already 2x of this origin, cycle back to a mix
      if (bagCounts[originId] === 2) {
        const otherId = originId === 1 ? 2 : 1;
        setBagCounts({ 1: originId === 1 || otherId === 1 ? 1 : 0, 2: originId === 2 || otherId === 2 ? 1 : 0, 3: 0 });
        return;
      }
      // If at 0 and box is full, swap out the largest other origin
      if (!bagCounts[originId] && totalSelectedBags >= 2) {
        const donorId = Number(Object.entries(bagCounts).find(([_, c]) => c > 0)?.[0] || 1);
        setBagCounts(prev => ({
          ...prev,
          [donorId]: Math.max(0, (prev[donorId] || 0) - 1),
          [originId]: 1,
        }));
        return;
      }
    }

    // Default increment
    if (totalSelectedBags < boxFormat.bags) {
      setBagCounts(prev => ({ ...prev, [originId]: (prev[originId] || 0) + 1 }));
    }
  };

  // Quick preset for Duo box
  const setDuoPreset = (id1: number, id2: number) => {
    const next: { [id: number]: number } = { 1: 0, 2: 0, 3: 0 };
    next[id1] = (next[id1] || 0) + 1;
    next[id2] = (next[id2] || 0) + 1;
    setBagCounts(next);
  };

  // ==========================================
  // MATHEMATICAL PRICING ENGINE
  // ==========================================
  const rawSubtotal = ORIGINS.reduce((sum, o) => {
    const count = bagCounts[o.id] || 0;
    const unitPrice = ORIGIN_PRICES[o.id][selectedSize.id] || 1200;
    return sum + (unitPrice * count);
  }, 0);

  const bundleDiscountPercent = selectedSize.isTrial ? 0 : boxFormat.discountPercent;
  const bundleDiscountAmount = Math.round(rawSubtotal * (bundleDiscountPercent / 100));
  const monthlyAfterBundle = rawSubtotal - bundleDiscountAmount;

  const isTrialMode = selectedSize.isTrial;
  const planMonths = isTrialMode ? 1 : selectedPlan.months;
  const planDiscountPercent = isTrialMode ? 0 : selectedPlan.discount;

  const fullPeriodBase = monthlyAfterBundle * planMonths;
  const planDiscountAmount = Math.round(fullPeriodBase * (planDiscountPercent / 100));
  const totalDueToday = fullPeriodBase - planDiscountAmount;

  const effectiveMonthlyPrice = Math.round(totalDueToday / planMonths);
  const totalSavings = (rawSubtotal * planMonths) - totalDueToday;
  const totalWeightKg = Math.round(selectedSize.value * totalSelectedBags * 100) / 100;

  // Box Summary Title
  const getBoxSummaryName = () => {
    const selectedItems = ORIGINS.filter(o => (bagCounts[o.id] || 0) > 0);
    if (selectedSize.isTrial) {
      const single = selectedItems[0] || ORIGINS[0];
      return `${single.name} (150g Trial Pack)`;
    }
    if (boxFormat.id === "single") {
      const single = selectedItems[0] || ORIGINS[0];
      return `${single.name} (${selectedSize.label})`;
    }
    if (boxFormat.id === "trio" && selectedItems.length === 3) {
      return `Himalayan Trio (${selectedSize.label}: Gulmi + Ilam + Nuwakot)`;
    }
    if (boxFormat.id === "duo") {
      if (selectedItems.length === 1) {
        return `2x ${selectedItems[0].name} (${selectedSize.label} Duo)`;
      }
      return `Dual Duo: ` + selectedItems.map(o => `${bagCounts[o.id]}x ${o.name}`).join(" + ") + ` (${selectedSize.label})`;
    }
    return selectedItems.map(o => `${bagCounts[o.id]}x ${o.name}`).join(" + ");
  };

  const primaryOriginId = ORIGINS.find(o => (bagCounts[o.id] || 0) > 0)?.id || 1;
  const selectedOriginsList = ORIGINS.filter(o => (bagCounts[o.id] || 0) > 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F2EB] text-[#2C2420] font-sans">
      
      {/* 1. BUILDER HERO */}
      <div className="bg-[#1A1512] text-[#F5F2EB] pt-20 pb-12 px-6 relative overflow-hidden border-b border-[#2C2420]">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#E58A1F] text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
            <Sparkles size={11} /> Himalayan Coffee Subscription
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-2.5">
            Build Your Himalayan Ritual.
          </h1>
          <p className="text-[#A89F91] text-xs md:text-sm max-w-lg mx-auto">
            Order a one-time 150g trial pack or configure your custom monthly subscription. Roasted fresh in Lalitpur.
          </p>
        </div>
      </div>

      {/* 2. MAIN BUILDER CONTAINER */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* LEFT COLUMN: Clean, Breathable Steps (7 Cols) */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* Step 1: Origins & Box Format */}
            <section id="step-origin">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-widest font-bold text-[#A3432A]">
                  Step 01 • Choose Origins
                </span>
                {boxFormat.bags > 1 && !selectedSize.isTrial && (
                  <span className="text-[11px] font-bold text-[#2E6B34] flex items-center gap-1">
                    <Check size={12} className="stroke-[3]" /> {totalSelectedBags} of {boxFormat.bags} bags filled
                  </span>
                )}
              </div>

              {/* Segmented Box Format Switcher */}
              {!selectedSize.isTrial && (
                <div className="bg-[#EAE4D7] p-1 rounded-xl flex gap-1 mb-4 border border-[#DDD4C3]">
                  {BOX_FORMATS.map((fmt) => {
                    const isSelected = boxFormat.id === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => handleSelectFormat(fmt)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center ${
                          isSelected
                            ? "bg-white text-[#1A1512] shadow-sm font-bold"
                            : "text-[#6B5E4F] hover:text-[#1A1512]"
                        }`}
                      >
                        <span className="block">{fmt.name}</span>
                        <span className={`text-[10px] block font-normal ${isSelected ? "text-[#A3432A] font-semibold" : "text-[#8A7966]"}`}>
                          {fmt.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Quick Duo Shortcuts (When Duo is active) */}
              {boxFormat.bags === 2 && !selectedSize.isTrial && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3 text-[11px]">
                  <span className="text-[#8A7966] font-medium shrink-0">Quick picks:</span>
                  <button
                    type="button"
                    onClick={() => setDuoPreset(1, 2)}
                    className={`px-2.5 py-1 rounded-full border shrink-0 transition-colors ${
                      bagCounts[1] === 1 && bagCounts[2] === 1
                        ? "bg-[#1A1512] text-white border-[#1A1512] font-semibold"
                        : "bg-white text-[#5C5042] border-[#E6DEC8] hover:bg-[#FAF8F5]"
                    }`}
                  >
                    Gulmi + Ilam (Mix)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuoPreset(1, 1)}
                    className={`px-2.5 py-1 rounded-full border shrink-0 transition-colors ${
                      bagCounts[1] === 2
                        ? "bg-[#1A1512] text-white border-[#1A1512] font-semibold"
                        : "bg-white text-[#5C5042] border-[#E6DEC8] hover:bg-[#FAF8F5]"
                    }`}
                  >
                    2x Gulmi
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuoPreset(2, 2)}
                    className={`px-2.5 py-1 rounded-full border shrink-0 transition-colors ${
                      bagCounts[2] === 2
                        ? "bg-[#1A1512] text-white border-[#1A1512] font-semibold"
                        : "bg-white text-[#5C5042] border-[#E6DEC8] hover:bg-[#FAF8F5]"
                    }`}
                  >
                    2x Ilam
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuoPreset(1, 3)}
                    className={`px-2.5 py-1 rounded-full border shrink-0 transition-colors ${
                      bagCounts[1] === 1 && bagCounts[3] === 1
                        ? "bg-[#1A1512] text-white border-[#1A1512] font-semibold"
                        : "bg-white text-[#5C5042] border-[#E6DEC8] hover:bg-[#FAF8F5]"
                    }`}
                  >
                    Gulmi + Nuwakot
                  </button>
                </div>
              )}

              {/* Clean Origin Cards (Paragraph Clutter Removed) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {ORIGINS.map((origin) => {
                  const count = bagCounts[origin.id] || 0;
                  const isSelected = count > 0;
                  const unitPrice = ORIGIN_PRICES[origin.id][selectedSize.id] || 1200;

                  return (
                    <div
                      key={origin.id}
                      onClick={() => handleOriginCardClick(origin.id)}
                      className={`group relative rounded-xl border p-3.5 cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-white border-[#A3432A] shadow-md ring-2 ring-[#A3432A]" 
                          : "bg-white/90 border-[#E6DEC8] hover:bg-white hover:border-[#C4B69E] shadow-xs"
                      }`}
                    >
                      {/* Thumbnail Image */}
                      <div className="w-full h-24 rounded-lg overflow-hidden mb-2.5 relative">
                        <img 
                          src={origin.img} 
                          alt={origin.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                        <div className="absolute top-2 left-2 bg-[#1A1512]/80 backdrop-blur-xs px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-white">
                          {origin.altitude}
                        </div>

                        {/* Top-Right Green Circle Indicator + Count Badge */}
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          {count > 1 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-[#1A1512] text-white text-[9px] font-bold shadow-xs">
                              {count}x
                            </span>
                          )}
                          <span
                            className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center shadow-xs ${
                              isSelected
                                ? "bg-green-500 border-green-500 ring-2 ring-green-500/20"
                                : "border-white/70 bg-black/40"
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                          </span>
                        </div>
                      </div>

                      {/* Header & Price */}
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className="text-sm font-serif font-bold text-[#1A1512]">{origin.name}</h3>
                        <span className="text-xs font-bold text-[#A3432A]">
                          Rs. {unitPrice}
                        </span>
                      </div>

                      <p className="text-[10px] uppercase font-bold text-[#8A7966] mb-2">
                        {origin.region}
                      </p>

                      {/* Clean Tasting Notes */}
                      <div className="pt-2 border-t border-[#F0EAE1]">
                        <span className="text-[10px] text-[#5C5042] font-medium leading-tight block truncate">
                          {origin.notes}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Step 2: Grind Profile (Compact) */}
            <section id="step-grind">
              <div className="mb-3">
                <span className="text-[11px] uppercase tracking-widest font-bold text-[#A3432A]">
                  Step 02 • Select Grind
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {GRINDS.map((grind) => {
                  const isSelected = selectedGrind.id === grind.id;
                  return (
                    <div
                      key={grind.id}
                      onClick={() => setSelectedGrind(grind)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-[#1A1512] text-white border-[#1A1512] shadow-sm" 
                          : "bg-white border-[#E6DEC8] text-[#2C2420] hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="text-xs font-bold uppercase tracking-wider pr-1">{grind.name}</span>
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
                      <p className={`text-[10px] ${isSelected ? "text-[#A89F91]" : "text-[#8A7966]"}`}>
                        {grind.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Step 3: Coffee Pack Size (Clean & Minimal) */}
            <section id="step-size">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-widest font-bold text-[#A3432A]">
                  Step 03 • Select Pack Size
                </span>
                <span className="text-xs text-[#8A7966] font-medium flex items-center gap-1">
                  <Scale size={12} /> {selectedSize.label} / bag
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PACK_SIZES.map((size) => {
                  const isSelected = selectedSize.id === size.id;
                  
                  const sampleSubtotal = ORIGINS.reduce((sum, o) => {
                    const count = bagCounts[o.id] || 0;
                    const p = ORIGIN_PRICES[o.id][size.id] || 1200;
                    return sum + (p * count);
                  }, 0);
                  const samplePrice = Math.round(sampleSubtotal * (1 - (size.isTrial ? 0 : bundleDiscountPercent) / 100));

                  return (
                    <div
                      key={size.id}
                      onClick={() => {
                        setSelectedSize(size);
                        if (size.isTrial && boxFormat.bags > 1) {
                          handleSelectFormat(BOX_FORMATS[0]);
                        }
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                        isSelected 
                          ? "bg-[#1A1512] text-white border-[#1A1512] shadow-md ring-2 ring-[#A3432A]" 
                          : "bg-white border-[#E6DEC8] text-[#2C2420] hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <div className="absolute top-2.5 right-2.5">
                        <span
                          className={`w-3.5 h-3.5 rounded-full border transition-all flex items-center justify-center ${
                            isSelected
                              ? "bg-green-500 border-green-500 ring-2 ring-green-500/20"
                              : "border-[#C8BFAB] bg-transparent"
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                        </span>
                      </div>

                      <div>
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-block mb-1 ${
                          size.isTrial 
                            ? (isSelected ? "bg-[#A3432A] text-white" : "bg-[#FAF5F2] text-[#A3432A]")
                            : (isSelected ? "bg-white/10 text-[#E58A1F]" : "bg-[#F0EAE1] text-[#5C5042]")
                        }`}>
                          {size.tag}
                        </span>
                        <p className="text-base font-serif font-bold">{size.label}</p>
                        <p className={`text-[10px] mb-2 ${isSelected ? "text-[#E58A1F]" : "text-[#8A7966]"}`}>
                          {size.cups}
                        </p>
                      </div>

                      <div className={`pt-2 border-t text-xs font-bold ${
                        isSelected ? "border-white/15 text-white" : "border-[#F0EAE1] text-[#A3432A]"
                      }`}>
                        Rs. {samplePrice} <span className="text-[9px] font-normal opacity-80">{size.isTrial ? "total" : "/mo"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Step 4: Billing Commitment */}
            <section id="step-plan">
              <div className="mb-3">
                <span className="text-[11px] uppercase tracking-widest font-bold text-[#A3432A]">
                  Step 04 • {selectedSize.isTrial ? "Trial Commitment" : "Billing Commitment"}
                </span>
              </div>

              {selectedSize.isTrial ? (
                // Clean One-Time Trial Card
                <div className="p-4 rounded-xl border border-[#A3432A] bg-white ring-2 ring-[#A3432A] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FAF5F2] text-[#A3432A] inline-block mb-1">
                      One-Time Discovery Buy
                    </span>
                    <h3 className="text-sm font-serif font-bold text-[#1A1512]">150g Trial Sample Pack</h3>
                    <p className="text-xs text-[#5C5042]">Single delivery • Zero recurring commitment</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-serif font-bold text-[#1A1512]">Rs. {totalDueToday}</span>
                    <span className="text-[10px] text-[#2E6B34] font-semibold block">Free Shipping</span>
                  </div>
                </div>
              ) : (
                // 4 Clean Subscription Plans
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PLANS.map((plan) => {
                    const isSelected = selectedPlan.id === plan.id;
                    const planPeriodBase = monthlyAfterBundle * plan.months;
                    const planDiscountVal = Math.round(planPeriodBase * (plan.discount / 100));
                    const planTotal = planPeriodBase - planDiscountVal;
                    const planMonthly = Math.round(planTotal / plan.months);

                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected 
                            ? "bg-white border-[#A3432A] ring-2 ring-[#A3432A] shadow-sm" 
                            : "bg-white border-[#E6DEC8] hover:border-[#C4B69E]"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              isSelected ? "bg-[#FAF5F2] text-[#A3432A]" : "bg-[#F0EAE1] text-[#5C5042]"
                            }`}>
                              {plan.tag}
                            </span>
                            <h3 className="text-sm font-serif font-bold text-[#1A1512] mt-1">{plan.name}</h3>
                            <p className="text-[10px] text-[#8A7966]">
                              {plan.months === 1 ? "Billed monthly" : `Total: Rs. ${planTotal} for ${plan.months} mos`}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-serif font-bold text-[#1A1512]">
                              Rs. {planMonthly} <span className="text-[10px] font-normal text-[#8A7966]">/mo</span>
                            </p>
                            {plan.discount > 0 && (
                              <span className="text-[10px] text-[#2E6B34] font-bold">Save {plan.discount}%</span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#F0EAE1] flex justify-between items-center text-[10px] text-[#8A7966]">
                          <span>Courier: <strong className="text-[#2E6B34]">Free</strong></span>
                          <span>Cancel anytime</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

          </div>

          {/* RIGHT COLUMN: Streamlined, Luxury Unboxing Summary */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-white rounded-2xl border border-[#E6DEC8] shadow-lg p-5 sm:p-6">
              
              <div className="flex items-center justify-between pb-3.5 border-b border-[#F0EAE1] mb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#A3432A] block">
                    {selectedSize.isTrial ? "Trial Discovery" : "Your Ritual"}
                  </span>
                  <h3 className="text-base font-serif font-bold text-[#1A1512]">
                    {selectedSize.isTrial ? "Trial Pack Summary" : "Box Summary Preview"}
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-[#E7F3E8] text-[#2E6B34] text-[9px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                  <ShieldCheck size={11} /> Direct Trade
                </span>
              </div>

              {/* Box Format Indicator Strip */}
              <div className="mb-3.5 flex items-center justify-between bg-[#FAF8F5] px-3 py-2 rounded-lg border border-[#E6DEC8] text-xs">
                <span className="font-semibold text-[#5C5042] flex items-center gap-1.5">
                  <Package size={13} className="text-[#A3432A]" />
                  {selectedSize.isTrial ? "150g Trial Sample" : boxFormat.name}
                </span>
                <span className="text-[10px] font-bold text-[#A3432A] bg-[#FAF5F2] px-2 py-0.5 rounded">
                  {selectedSize.label} {selectedSize.isTrial ? "Pack" : "/ Bag"}
                </span>
              </div>

              {/* Clean Coffee Items Preview */}
              <div className="space-y-2 mb-4">
                {selectedOriginsList.map((origin) => {
                  const bagCount = bagCounts[origin.id] || 0;
                  const unitPrice = ORIGIN_PRICES[origin.id][selectedSize.id] || 1200;
                  return (
                    <div key={origin.id} className="flex gap-2.5 items-center bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E6DEC8]">
                      <img 
                        src={origin.img} 
                        alt={origin.name} 
                        className="w-10 h-10 rounded-lg object-cover shadow-xs shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-serif font-bold text-xs text-[#1A1512] truncate">
                            {origin.name}
                          </h4>
                          <span className="text-[10px] font-bold text-[#A3432A]">
                            {bagCount}x (Rs. {unitPrice * bagCount})
                          </span>
                        </div>
                        <p className="text-[9px] text-[#8A7966] truncate">{origin.notes}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Compact Box Specs */}
              <div className="space-y-1.5 text-xs text-[#5C5042] pb-3.5 border-b border-[#F0EAE1] mb-3.5">
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Grind:</span>
                  <strong className="text-[#1A1512] font-semibold">{selectedGrind.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Shipment Weight:</span>
                  <strong className="text-[#1A1512] font-semibold">{totalWeightKg} kg ({totalSelectedBags}x {selectedSize.label})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Plan:</span>
                  <strong className="text-[#1A1512] font-semibold">
                    {selectedSize.isTrial ? "One-Time Purchase" : selectedPlan.name}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Delivery:</span>
                  <strong className="text-[#2E6B34] font-semibold">Free Nationwide</strong>
                </div>
              </div>

              {/* Itemized Pricing */}
              <div className="space-y-1.5 text-xs text-[#5C5042] pb-3.5 border-b border-[#F0EAE1] mb-4">
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Subtotal:</span>
                  <span className="text-[#1A1512] font-semibold">Rs. {rawSubtotal}</span>
                </div>

                {bundleDiscountAmount > 0 && !selectedSize.isTrial && (
                  <div className="flex justify-between text-[#2E6B34]">
                    <span>{boxFormat.name} Perk ({bundleDiscountPercent}%):</span>
                    <span className="font-semibold">- Rs. {bundleDiscountAmount}</span>
                  </div>
                )}

                {!selectedSize.isTrial && planDiscountAmount > 0 && (
                  <div className="flex justify-between text-[#2E6B34]">
                    <span>{selectedPlan.name} Perk ({planDiscountPercent}%):</span>
                    <span className="font-semibold">- Rs. {planDiscountAmount}</span>
                  </div>
                )}
              </div>

              {/* Total Due */}
              <div className="mb-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-[#8A7966] uppercase tracking-wider">
                    {selectedSize.isTrial || selectedPlan.months === 1 ? "Total Due:" : "Due Today:"}
                  </span>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1512]">
                      Rs. {totalDueToday}
                    </span>
                    {!selectedSize.isTrial && selectedPlan.months > 1 && (
                      <span className="block text-[10px] text-[#8A7966]">
                        (Rs. {effectiveMonthlyPrice} / month)
                      </span>
                    )}
                  </div>
                </div>

                {totalSavings > 0 && (
                  <div className="mt-2 py-1 px-2.5 bg-[#E7F3E8] text-[#2E6B34] text-[11px] font-bold rounded-lg flex items-center justify-between">
                    <span>Savings:</span>
                    <span>Save Rs. {totalSavings}</span>
                  </div>
                )}
              </div>

              {/* Customer Account Indicator */}
              <div className="mb-4 py-1.5 px-2.5 bg-[#FAF8F5] border border-[#E6DEC8] rounded-lg flex items-center justify-between text-xs">
                {customer ? (
                  <span className="flex items-center gap-1.5 text-[#2E6B34] font-medium text-[11px]">
                    <UserCheck size={13} />
                    <span>Ordering as <strong>{customer.name}</strong></span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[#8A7966] text-[11px]">
                    <Lock size={11} />
                    <span>Guest checkout or sign in next</span>
                  </span>
                )}
                <Link href={customer ? "/dashboard" : "/login"} className="text-[10px] font-bold text-[#A3432A] hover:underline">
                  {customer ? "Account" : "Sign In"}
                </Link>
              </div>

              {/* Primary Action Button */}
              {totalSelectedBags !== boxFormat.bags ? (
                <div className="w-full py-3.5 rounded-xl bg-gray-300 text-gray-600 text-center uppercase tracking-widest text-xs font-bold cursor-not-allowed">
                  Select {boxFormat.bags - totalSelectedBags} more origin{boxFormat.bags - totalSelectedBags > 1 ? "s" : ""}
                </div>
              ) : (
                <Link 
                  href={`/checkout?origin=${primaryOriginId}&name=${encodeURIComponent(getBoxSummaryName())}&weight=${totalWeightKg}&price=${totalDueToday}&plan_id=${selectedSize.isTrial ? "TRIAL_ONETIME" : selectedPlan.id}&plan_name=${encodeURIComponent(selectedSize.isTrial ? "One-Time Trial Pack" : selectedPlan.name)}`}
                  className="w-full py-3.5 rounded-xl bg-[#A3432A] hover:bg-[#8A3722] text-white text-center uppercase tracking-widest text-xs font-bold transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2 group"
                >
                  Proceed to Checkout <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )}

              {/* Guarantees */}
              <div className="mt-3.5 grid grid-cols-2 gap-2 text-[10px] text-[#8A7966] text-center pt-2.5 border-t border-[#F0EAE1]">
                <span className="flex items-center justify-center gap-1">
                  <Flame size={11} className="text-[#A3432A]" /> 48h Fresh Roast
                </span>
                <span className="flex items-center justify-center gap-1">
                  <RotateCcw size={11} className="text-[#A3432A]" /> {selectedSize.isTrial ? "Trial Guarantee" : "Cancel Anytime"}
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
