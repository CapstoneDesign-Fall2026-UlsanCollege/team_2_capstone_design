"use client";

import { useState, useEffect, Suspense } from "react";
import { Sparkles, Package, Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import OriginCard, { OriginItem } from "@/components/subscribe/OriginCard";
import TasteMatcher from "@/components/subscribe/TasteMatcher";
import UnboxingReceipt from "@/components/subscribe/UnboxingReceipt";

// 1. BASE ORIGIN SPECIFICATIONS (Clean, Professional Typography)
const ORIGINS: OriginItem[] = [
  { 
    id: 1, 
    name: "Gulmi Reserve", 
    region: "Gulmi, Western Nepal",
    altitude: "1,600m",
    score: "86.5 SCA",
    process: "Fully Washed",
    flavorTags: ["Mountain Honey", "Citrus Blossom", "Dark Chocolate"],
    notes: "Citrus • Mountain Honey • Dark Chocolate",
    img: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=600&auto=format&fit=crop" 
  },
  { 
    id: 2, 
    name: "Ilam Gold", 
    region: "Ilam, Eastern Nepal",
    altitude: "1,800m",
    score: "87.0 SCA",
    process: "Sun-Dried Natural",
    flavorTags: ["Wild Berry", "White Jasmine", "Brown Caramel"],
    notes: "Wild Berry • Jasmine • Brown Sugar",
    img: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=600&auto=format&fit=crop" 
  },
  { 
    id: 3, 
    name: "Nuwakot Heritage", 
    region: "Nuwakot Foothills",
    altitude: "1,400m",
    score: "85.0 SCA",
    process: "Honey Processed",
    flavorTags: ["Toasted Walnut", "Dark Molasses", "Spiced Plum"],
    notes: "Walnut • Caramel • Dried Plum",
    img: "https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=600&auto=format&fit=crop" 
  },
];

// 2. MATHEMATICAL PRICING MATRIX (Exact NPR per bag)
const ORIGIN_PRICES: Record<number, Record<string, number>> = {
  1: { "150g": 450, "250g": 650, "500g": 1200, "1000g": 2200 },
  2: { "150g": 500, "250g": 750, "500g": 1400, "1000g": 2600 },
  3: { "150g": 400, "250g": 600, "500g": 1100, "1000g": 2000 },
};

// 3. PACK SIZES
const TRIAL_SIZE = { id: "150g", value: 0.15, label: "150g Trial", isTrial: true, cups: "~10 Cups" };

const SUBSCRIPTION_SIZES = [
  { id: "250g", value: 0.25, label: "250g", tag: "Personal Ritual", cups: "~15 Cups / mo" },
  { id: "500g", value: 0.50, label: "500g", tag: "Most Popular", cups: "~30 Cups / mo" },
  { id: "1000g", value: 1.00, label: "1.0 kg", tag: "Aficionado / Couples", cups: "~60 Cups / mo" },
];

// 4. BOX CURATION FORMATS (For Recurring Subscriptions)
const BOX_FORMATS = [
  { id: "single", name: "1 Bag", subtitle: "Single Origin", bags: 1, discountPercent: 0 },
  { id: "duo", name: "2 Bags Duo", subtitle: "Mix & Match • 5% Off", bags: 2, discountPercent: 5 },
  { id: "trio", name: "3 Bags Trio", subtitle: "All 3 Regions • 10% Off", bags: 3, discountPercent: 10 },
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
  const urlType = searchParams.get("type");

  // 1. Experience Mode Fork: "trial" vs "subscription"
  const [experienceType, setExperienceType] = useState<"trial" | "subscription">(
    urlType === "trial" || urlWeight === 0.15 ? "trial" : "subscription"
  );

  const initialFormat = BOX_FORMATS[0];
  const initialPlan = PLANS.find(p => p.id.toLowerCase() === urlPlanId?.toLowerCase()) || PLANS[0];
  const initialGrind = GRINDS.find(g => g.id.toLowerCase() === urlGrindId?.toLowerCase()) || GRINDS[0];
  const initialSize = SUBSCRIPTION_SIZES.find(w => w.value === urlWeight) || SUBSCRIPTION_SIZES[1];

  const [selectedSubSize, setSelectedSubSize] = useState(initialSize);
  const [boxFormat, setBoxFormat] = useState(initialFormat);
  const [bagCounts, setBagCounts] = useState<{ [id: number]: number }>({ 
    1: urlOriginId === 2 ? 0 : urlOriginId === 3 ? 0 : 1, 
    2: urlOriginId === 2 ? 1 : 0, 
    3: urlOriginId === 3 ? 1 : 0 
  });
  const [selectedGrind, setSelectedGrind] = useState(initialGrind);
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [customer, setCustomer] = useState<{ name?: string; email?: string } | null>(null);
  const [matchedOriginId, setMatchedOriginId] = useState<number | null>(null);

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
    try {
      const stored = localStorage.getItem("demo_user") || localStorage.getItem("customer_user");
      if (stored) setCustomer(JSON.parse(stored));
    } catch (e) {
      // ignore
    }
  }, [urlOriginId, urlPlanId, urlGrindId]);

  // Active Size based on Experience Fork
  const activeSize = experienceType === "trial" ? TRIAL_SIZE : selectedSubSize;

  // Handle Box Format change
  const handleSelectFormat = (format: typeof BOX_FORMATS[0]) => {
    setBoxFormat(format);
    if (format.bags === 1) {
      const activeId = Number(Object.entries(bagCounts).find(([_, c]) => c > 0)?.[0] || 1);
      setBagCounts({ 1: activeId === 1 ? 1 : 0, 2: activeId === 2 ? 1 : 0, 3: activeId === 3 ? 1 : 0 });
    } else if (format.bags === 2) {
      setBagCounts({ 1: 1, 2: 1, 3: 0 }); // Default 1x Gulmi + 1x Ilam
    } else if (format.bags === 3) {
      setBagCounts({ 1: 1, 2: 1, 3: 1 }); // All 3 regions
    }
  };

  const totalSelectedBags = Object.values(bagCounts).reduce((a, b) => a + b, 0);

  // Card click handler: smoothly handles single or duo selection
  const handleOriginCardClick = (originId: number) => {
    if (experienceType === "trial" || boxFormat.bags === 1) {
      setBagCounts({ 1: originId === 1 ? 1 : 0, 2: originId === 2 ? 1 : 0, 3: originId === 3 ? 1 : 0 });
      return;
    }

    if (boxFormat.bags === 2) {
      if (bagCounts[originId] === 1 && totalSelectedBags === 2) {
        setBagCounts({ 1: originId === 1 ? 2 : 0, 2: originId === 2 ? 2 : 0, 3: originId === 3 ? 2 : 0 });
        return;
      }
      if (bagCounts[originId] === 2) {
        const otherId = originId === 1 ? 2 : 1;
        setBagCounts({ 1: originId === 1 || otherId === 1 ? 1 : 0, 2: originId === 2 || otherId === 2 ? 1 : 0, 3: 0 });
        return;
      }
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

  const activeBagArray: number[] = [];
  Object.entries(bagCounts).forEach(([idStr, count]) => {
    for (let i = 0; i < count; i++) activeBagArray.push(Number(idStr));
  });
  const slot1Origin = ORIGINS.find(o => o.id === activeBagArray[0]);
  const slot2Origin = ORIGINS.find(o => o.id === activeBagArray[1]);

  // Pricing calculations
  const rawSubtotal = ORIGINS.reduce((sum, o) => {
    const count = bagCounts[o.id] || 0;
    const unitPrice = ORIGIN_PRICES[o.id][activeSize.id] || 1200;
    return sum + (unitPrice * count);
  }, 0);

  const bundleDiscountPercent = experienceType === "trial" ? 0 : boxFormat.discountPercent;
  const bundleDiscountAmount = Math.round(rawSubtotal * (bundleDiscountPercent / 100));
  const monthlyAfterBundle = rawSubtotal - bundleDiscountAmount;

  const isTrialMode = experienceType === "trial";
  const planMonths = isTrialMode ? 1 : selectedPlan.months;
  const planDiscountPercent = isTrialMode ? 0 : selectedPlan.discount;

  const fullPeriodBase = monthlyAfterBundle * planMonths;
  const planDiscountAmount = Math.round(fullPeriodBase * (planDiscountPercent / 100));
  const totalDueToday = fullPeriodBase - planDiscountAmount;

  const effectiveMonthlyPrice = Math.round(totalDueToday / planMonths);
  const totalSavings = (rawSubtotal * planMonths) - totalDueToday;
  const totalWeightKg = Math.round(activeSize.value * totalSelectedBags * 100) / 100;

  const getBoxSummaryName = () => {
    const selectedItems = ORIGINS.filter(o => (bagCounts[o.id] || 0) > 0);
    if (experienceType === "trial") {
      const single = selectedItems[0] || ORIGINS[0];
      return `${single.name} (150g Trial Pack)`;
    }
    if (boxFormat.id === "single") {
      const single = selectedItems[0] || ORIGINS[0];
      return `${single.name} (${activeSize.label})`;
    }
    if (boxFormat.id === "trio" && selectedItems.length === 3) {
      return `Himalayan Trio (${activeSize.label}: Gulmi + Ilam + Nuwakot)`;
    }
    if (boxFormat.id === "duo") {
      if (selectedItems.length === 1) {
        return `2x ${selectedItems[0].name} (${activeSize.label} Duo)`;
      }
      return `Dual Duo: ` + selectedItems.map(o => `${bagCounts[o.id]}x ${o.name}`).join(" + ") + ` (${activeSize.label})`;
    }
    return selectedItems.map(o => `${bagCounts[o.id]}x ${o.name} (${activeSize.label})`).join(" + ");
  };

  const primaryOriginId = ORIGINS.find(o => (bagCounts[o.id] || 0) > 0)?.id || 1;
  const selectedOriginsList = ORIGINS.filter(o => (bagCounts[o.id] || 0) > 0);

  const handleApplyTasteMatch = (match: OriginItem) => {
    setMatchedOriginId(match.id);
    if (experienceType === "trial" || boxFormat.bags === 1) {
      setBagCounts({ 1: match.id === 1 ? 1 : 0, 2: match.id === 2 ? 1 : 0, 3: match.id === 3 ? 1 : 0 });
    } else if (boxFormat.bags === 2) {
      setBagCounts({ 
        1: match.id === 1 ? 1 : 1, 
        2: match.id === 2 ? 1 : (match.id === 1 ? 1 : 0), 
        3: match.id === 3 ? 1 : 0 
      });
    }
  };

  const checkoutHref = `/checkout?origin=${primaryOriginId}&name=${encodeURIComponent(getBoxSummaryName())}&weight=${totalWeightKg}&price=${totalDueToday}&plan_id=${isTrialMode ? "TRIAL_ONETIME" : selectedPlan.id}&plan_name=${encodeURIComponent(isTrialMode ? "One-Time Trial Pack" : selectedPlan.name)}`;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F2EB] text-[#2C2420] font-sans">
      
      {/* 1. BUILDER HERO */}
      <div className="bg-[#1A1512] text-[#F5F2EB] pt-20 pb-12 px-6 relative overflow-hidden border-b border-[#2C2420]">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#E58A1F] text-xs font-bold uppercase tracking-[0.2em] mb-3">
            <Sparkles size={12} /> Himalayan Artisanal Coffee
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-2.5">
            Build Your Coffee Ritual.
          </h1>
          <p className="text-[#A89F91] text-xs md:text-sm max-w-md mx-auto">
            Order a zero-commitment trial sample or subscribe to smallholder micro-lots fresh roasted in Lalitpur.
          </p>
        </div>
      </div>

      {/* 2. THE BEAN BOX / MISTOBOX EXPERIENCE FORK */}
      <div className="bg-[#EAE4D7] border-b border-[#DDD4C3] py-4 px-4 sticky top-16 z-30 shadow-xs">
        <div className="max-w-md mx-auto bg-white/70 backdrop-blur-md p-1.5 rounded-2xl flex gap-1.5 border border-[#DDD4C3]">
          <button
            type="button"
            aria-pressed={experienceType === "trial"}
            onClick={() => {
              setExperienceType("trial");
              handleSelectFormat(BOX_FORMATS[0]);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              experienceType === "trial"
                ? "bg-[#1A1512] text-white shadow-sm font-bold"
                : "text-[#5C5042] hover:text-[#1A1512]"
            }`}
          >
            <Sparkles size={13} className={experienceType === "trial" ? "text-[#E58A1F]" : "text-[#8A7966]"} />
            <span>150g Trial (One-Time)</span>
          </button>
          <button
            type="button"
            aria-pressed={experienceType === "subscription"}
            onClick={() => {
              setExperienceType("subscription");
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              experienceType === "subscription"
                ? "bg-[#1A1512] text-white shadow-sm font-bold"
                : "text-[#5C5042] hover:text-[#1A1512]"
            }`}
          >
            <Package size={13} className={experienceType === "subscription" ? "text-[#E58A1F]" : "text-[#8A7966]"} />
            <span>Monthly Subscription</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN BUILDER CONTAINER */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* LEFT COLUMN: Clean, Breathable Steps (7 Cols) */}
          <div className="lg:col-span-7 space-y-10">
            
            {experienceType === "trial" ? (
              /* EXPERIENCE A: 150g TRIAL FLOW */
              <>
                <section id="trial-origin">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-widest font-bold text-[#A3432A]">
                      Step 01 • Choose Your 150g Trial Sample
                    </span>
                    <span className="text-xs font-semibold text-[#2E6B34]">
                      Single Purchase • No Subscription
                    </span>
                  </div>

                  <TasteMatcher
                    origins={ORIGINS}
                    matchedOriginId={matchedOriginId}
                    onApplyMatch={handleApplyTasteMatch}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {ORIGINS.map((origin) => (
                      <OriginCard
                        key={origin.id}
                        origin={origin}
                        count={bagCounts[origin.id] || 0}
                        unitPrice={ORIGIN_PRICES[origin.id]["150g"]}
                        isMatched={matchedOriginId === origin.id}
                        onClick={() => handleOriginCardClick(origin.id)}
                      />
                    ))}
                  </div>
                </section>

                <section id="trial-grind">
                  <div className="mb-3">
                    <span className="text-xs uppercase tracking-widest font-bold text-[#A3432A]">
                      Step 02 • Select Grind Preparation
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {GRINDS.map((grind) => {
                      const isSelected = selectedGrind.id === grind.id;
                      return (
                        <button
                          key={grind.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelectedGrind(grind)}
                          className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-[#1A1512] text-white border-[#1A1512] shadow-sm" 
                              : "bg-white border-[#E6DEC8] text-[#2C2420] hover:bg-[#FAF8F5]"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="text-xs font-bold uppercase tracking-wider">{grind.name}</span>
                            <span
                              className={`w-3.5 h-3.5 rounded-full border transition-all flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "bg-green-500 border-green-500 ring-2 ring-green-500/20"
                                  : "border-[#C8BFAB] bg-transparent"
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                            </span>
                          </div>
                          <p className={`text-[11px] ${isSelected ? "text-[#A89F91]" : "text-[#8A7966]"}`}>
                            {grind.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </>
            ) : (
              /* EXPERIENCE B: RECURRING SUBSCRIPTION FLOW */
              <>
                <section id="step-origin">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-widest font-bold text-[#A3432A]">
                      Step 01 • Choose Format & Origins
                    </span>
                    {boxFormat.bags > 1 && (
                      <span className="text-xs font-bold text-[#2E6B34] flex items-center gap-1">
                        <Check size={13} className="stroke-[3]" /> {totalSelectedBags} of {boxFormat.bags} bags filled
                      </span>
                    )}
                  </div>

                  {/* Format Bar */}
                  <div className="bg-[#EAE4D7] p-1 rounded-xl flex gap-1 mb-4 border border-[#DDD4C3]">
                    {BOX_FORMATS.map((fmt) => {
                      const isSelected = boxFormat.id === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          type="button"
                          aria-pressed={isSelected}
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

                  {/* Visual Parcel Slots (Duo) */}
                  {boxFormat.bags === 2 && (
                    <div className="bg-white border border-[#E6DEC8] rounded-2xl p-4 mb-4 shadow-xs">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-bold text-[#1A1512] flex items-center gap-1.5">
                          <Package size={14} className="text-[#A3432A]" />
                          Your 2-Bag Parcel Slots
                        </span>
                        <span className="text-[10px] text-[#2E6B34] font-bold bg-[#E7F3E8] px-2 py-0.5 rounded-full">
                          5% Duo Discount Active
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl p-3 flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#1A1512] text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-[#8A7966] block">Slot 1 ({activeSize.label})</span>
                            <strong className="text-xs font-serif text-[#1A1512] block truncate">
                              {slot1Origin ? slot1Origin.name : "Select Coffee"}
                            </strong>
                          </div>
                        </div>

                        <div className="bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl p-3 flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#1A1512] text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-[#8A7966] block">Slot 2 ({activeSize.label})</span>
                            <strong className="text-xs font-serif text-[#1A1512] block truncate">
                              {slot2Origin ? slot2Origin.name : "Select Coffee"}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                        <span className="text-[#8A7966] text-[11px] font-medium shrink-0">Quick pairings:</span>
                        <button
                          type="button"
                          onClick={() => setDuoPreset(1, 2)}
                          className={`px-2.5 py-1 rounded-full border transition-colors ${
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
                          className={`px-2.5 py-1 rounded-full border transition-colors ${
                            bagCounts[1] === 2
                              ? "bg-[#1A1512] text-white border-[#1A1512] font-semibold"
                              : "bg-white text-[#5C5042] border-[#E6DEC8] hover:bg-[#FAF8F5]"
                          }`}
                        >
                          2x Gulmi Reserve
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuoPreset(2, 2)}
                          className={`px-2.5 py-1 rounded-full border transition-colors ${
                            bagCounts[2] === 2
                              ? "bg-[#1A1512] text-white border-[#1A1512] font-semibold"
                              : "bg-white text-[#5C5042] border-[#E6DEC8] hover:bg-[#FAF8F5]"
                          }`}
                        >
                          2x Ilam Gold
                        </button>
                      </div>
                    </div>
                  )}

                  <TasteMatcher
                    origins={ORIGINS}
                    matchedOriginId={matchedOriginId}
                    onApplyMatch={handleApplyTasteMatch}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {ORIGINS.map((origin) => (
                      <OriginCard
                        key={origin.id}
                        origin={origin}
                        count={bagCounts[origin.id] || 0}
                        unitPrice={ORIGIN_PRICES[origin.id][activeSize.id] || 1200}
                        isMatched={matchedOriginId === origin.id}
                        onClick={() => handleOriginCardClick(origin.id)}
                        compact
                      />
                    ))}
                  </div>
                </section>

                {/* Step 2: Grind */}
                <section id="step-grind">
                  <div className="mb-3">
                    <span className="text-xs uppercase tracking-widest font-bold text-[#A3432A]">
                      Step 02 • Select Grind Preparation
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {GRINDS.map((grind) => {
                      const isSelected = selectedGrind.id === grind.id;
                      return (
                        <button
                          key={grind.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelectedGrind(grind)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-[#1A1512] text-white border-[#1A1512] shadow-sm" 
                              : "bg-white border-[#E6DEC8] text-[#2C2420] hover:bg-[#FAF8F5]"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="text-xs font-bold uppercase tracking-wider">{grind.name}</span>
                            <span
                              className={`w-3.5 h-3.5 rounded-full border transition-all flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "bg-green-500 border-green-500 ring-2 ring-green-500/20"
                                  : "border-[#C8BFAB] bg-transparent"
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                            </span>
                          </div>
                          <p className={`text-[11px] ${isSelected ? "text-[#A89F91]" : "text-[#8A7966]"}`}>
                            {grind.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Step 3: Size */}
                <section id="step-size">
                  <div className="mb-3">
                    <span className="text-xs uppercase tracking-widest font-bold text-[#A3432A]">
                      Step 03 • Select Pack Size per Bag
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SUBSCRIPTION_SIZES.map((size) => {
                      const isSelected = selectedSubSize.id === size.id;
                      return (
                        <button
                          key={size.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelectedSubSize(size)}
                          className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all relative flex flex-col justify-between ${
                            isSelected 
                              ? "bg-[#1A1512] text-white border-[#1A1512] shadow-sm" 
                              : "bg-white border-[#E6DEC8] text-[#2C2420] hover:bg-[#FAF8F5]"
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-base font-serif font-bold">{size.label}</span>
                              <span
                                className={`w-3.5 h-3.5 rounded-full border transition-all flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-green-500 border-green-500 ring-2 ring-green-500/20"
                                    : "border-[#C8BFAB] bg-transparent"
                                }`}
                              >
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                              </span>
                            </div>
                            <span className={`text-[11px] font-semibold block ${isSelected ? "text-[#E58A1F]" : "text-[#A3432A]"}`}>
                              {size.tag}
                            </span>
                          </div>
                          <p className={`text-[11px] mt-2 pt-2 border-t ${isSelected ? "border-white/10 text-[#A89F91]" : "border-[#F0EAE1] text-[#8A7966]"}`}>
                            {size.cups}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Step 4: Commitment Plan */}
                <section id="step-plan">
                  <div className="mb-3">
                    <span className="text-xs uppercase tracking-widest font-bold text-[#A3432A]">
                      Step 04 • Choose Commitment & Savings
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PLANS.map((plan) => {
                      const isSelected = selectedPlan.id === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelectedPlan(plan)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected 
                              ? "bg-[#1A1512] text-white border-[#1A1512] shadow-sm" 
                              : "bg-white border-[#E6DEC8] text-[#2C2420] hover:bg-[#FAF8F5]"
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold">{plan.name}</span>
                              <span
                                className={`w-3.5 h-3.5 rounded-full border transition-all flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-green-500 border-green-500 ring-2 ring-green-500/20"
                                    : "border-[#C8BFAB] bg-transparent"
                                }`}
                              >
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                              </span>
                            </div>
                            <span className={`text-[11px] font-semibold block ${plan.discount > 0 ? (isSelected ? "text-green-400" : "text-[#2E6B34]") : (isSelected ? "text-[#A89F91]" : "text-[#8A7966]")}`}>
                              {plan.tag}
                            </span>
                          </div>
                          <span className={`text-[10px] block mt-2 pt-1.5 border-t ${isSelected ? "border-white/10 text-[#A89F91]" : "border-[#F0EAE1] text-[#8A7966]"}`}>
                            {plan.months === 1 ? "1 cycle" : `${plan.months} deliveries`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </>
            )}

          </div>

          {/* RIGHT COLUMN: Modular Sticky Unboxing Manifest (5 Cols) */}
          <div className="lg:col-span-5">
            <UnboxingReceipt
              isTrialMode={isTrialMode}
              summaryName={getBoxSummaryName()}
              selectedOriginsList={selectedOriginsList}
              bagCounts={bagCounts}
              activeSize={activeSize}
              selectedGrind={selectedGrind}
              selectedPlan={selectedPlan}
              totalSelectedBags={totalSelectedBags}
              totalWeightKg={totalWeightKg}
              rawSubtotal={rawSubtotal}
              bundleDiscountPercent={bundleDiscountPercent}
              bundleDiscountAmount={bundleDiscountAmount}
              monthlyAfterBundle={monthlyAfterBundle}
              planDiscountPercent={planDiscountPercent}
              planDiscountAmount={planDiscountAmount}
              totalDueToday={totalDueToday}
              effectiveMonthlyPrice={effectiveMonthlyPrice}
              totalSavings={totalSavings}
              customer={customer}
              checkoutHref={checkoutHref}
            />
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
