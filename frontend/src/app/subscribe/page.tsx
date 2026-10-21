"use client";

import { useState, useEffect, Suspense } from "react";
import { Package, Check, X, ChevronUp, ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import OriginCard, { OriginItem } from "@/components/subscribe/OriginCard";
import TasteMatcher from "@/components/subscribe/TasteMatcher";
import UnboxingReceipt from "@/components/subscribe/UnboxingReceipt";
import Link from "next/link";

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

  // Mobile Bottom Sheet Drawer State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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
    <div className="flex flex-col min-h-screen bg-[#F5F2EB] text-[#1A1512] font-sans">
      
      {/* 1. BUILDER HERO (Editorial Roastery Ledger Style) */}
      <section className="bg-[#1A1512] text-[#F5F2EB] pt-24 pb-14 px-6 relative border-b border-[#3E342F]">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-8 h-[1px] bg-[#E58A1F]/60" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-[#E58A1F]">
              Roastery Dispatch Builder • Lalitpur, Nepal
            </span>
            <span className="w-8 h-[1px] bg-[#E58A1F]/60" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-3 tracking-tight">
            Calibrate Your Himalayan Coffee Manifest.
          </h1>
          <p className="text-[#C8BFAB] text-sm md:text-base max-w-xl mx-auto font-sans leading-relaxed">
            Configure single-origin micro-lots roasted fresh to order in Lalitpur. Available as an uncommitted 150g tasting sample or an automated roastery subscription.
          </p>
        </div>
      </section>

      {/* 2. THE EXPERIENCE FORK (Editorial Switcher) */}
      <div className="bg-[#EAE4D7] border-b border-[#DDD4C3] py-3.5 px-4 sticky top-16 z-30 shadow-xs">
        <div className="max-w-md mx-auto bg-white/90 p-1.5 rounded-xl flex gap-1.5 border border-[#DDD4C3] shadow-xs">
          <button
            type="button"
            aria-pressed={experienceType === "trial"}
            onClick={() => {
              setExperienceType("trial");
              handleSelectFormat(BOX_FORMATS[0]);
            }}
            className={`flex-1 min-h-[44px] py-2 px-3 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              experienceType === "trial"
                ? "bg-[#1A1512] text-white shadow-sm font-bold"
                : "text-[#5C5042] hover:text-[#1A1512] hover:bg-black/5"
            }`}
          >
            <span className="font-mono text-[11px] text-[#E58A1F] font-bold">01</span>
            <span>150g Trial Sample</span>
          </button>
          <button
            type="button"
            aria-pressed={experienceType === "subscription"}
            onClick={() => {
              setExperienceType("subscription");
            }}
            className={`flex-1 min-h-[44px] py-2 px-3 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              experienceType === "subscription"
                ? "bg-[#1A1512] text-white shadow-sm font-bold"
                : "text-[#5C5042] hover:text-[#1A1512] hover:bg-black/5"
            }`}
          >
            <span className="font-mono text-[11px] text-[#E58A1F] font-bold">02</span>
            <span>Roastery Subscription</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN BUILDER CONTAINER */}
      {/* pb-44 ensures plenty of clearance for the mobile sticky bar + MobileNav dock */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 pb-44 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* LEFT COLUMN: Configuration Steps (7 Cols) */}
          <div className="lg:col-span-7 space-y-12">
            
            {experienceType === "trial" ? (
              /* EXPERIENCE A: 150g TRIAL FLOW */
              <>
                <section id="trial-origin" className="space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b border-[#1A1512]/15">
                    <span className="font-mono text-xs uppercase tracking-[0.18em] font-bold text-[#A3432A]">
                      STEP 01 // 150G TRIAL LOT SELECTION
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#2E6B34] bg-[#E7F3E8] px-2.5 py-0.5 rounded-full border border-[#C3E4C6]">
                      Single Purchase • Free Shipping
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

                <section id="trial-grind" className="space-y-4">
                  <div className="pb-2 border-b border-[#1A1512]/15">
                    <span className="font-mono text-xs uppercase tracking-[0.18em] font-bold text-[#A3432A]">
                      STEP 02 // GRIND CALIBRATION
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
                          className={`min-h-[56px] p-3.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.99] ${
                            isSelected 
                              ? "bg-[#1A1512] text-white border-[#1A1512] shadow-sm" 
                              : "bg-white border-[#E6DEC8] text-[#1A1512] hover:bg-[#FAF8F5]"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-mono text-xs font-bold uppercase tracking-wider">{grind.name}</span>
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
                          <p className={`text-xs ${isSelected ? "text-[#C8BFAB]" : "text-[#5C5042]"}`}>
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
                {/* Step 1: Format & Origins */}
                <section id="step-origin" className="space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b border-[#1A1512]/15">
                    <span className="font-mono text-xs uppercase tracking-[0.18em] font-bold text-[#A3432A]">
                      STEP 01 // FORMAT & ORIGIN SELECTION
                    </span>
                    {boxFormat.bags > 1 && (
                      <span className="font-mono text-xs font-bold text-[#2E6B34] bg-[#E7F3E8] px-2.5 py-0.5 rounded-full border border-[#C3E4C6] flex items-center gap-1.5">
                        <Check size={13} className="stroke-[3]" /> {totalSelectedBags} of {boxFormat.bags} bags filled
                      </span>
                    )}
                  </div>

                  {/* Format Switcher */}
                  <div className="bg-[#EAE4D7] p-1.5 rounded-xl flex gap-1.5 border border-[#DDD4C3]">
                    {BOX_FORMATS.map((fmt) => {
                      const isSelected = boxFormat.id === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => handleSelectFormat(fmt)}
                          className={`flex-1 min-h-[48px] py-2 px-3 rounded-lg text-xs md:text-sm font-semibold transition-all text-center cursor-pointer active:scale-[0.99] ${
                            isSelected
                              ? "bg-white text-[#1A1512] shadow-sm font-bold"
                              : "text-[#5C5042] hover:text-[#1A1512]"
                          }`}
                        >
                          <span className="block font-serif font-bold text-sm">{fmt.name}</span>
                          <span className={`font-mono text-xs block font-medium mt-0.5 ${isSelected ? "text-[#A3432A] font-bold" : "text-[#5C5042]"}`}>
                            {fmt.subtitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Visual Parcel Slots (Duo Mode) */}
                  {boxFormat.bags === 2 && (
                    <div className="bg-white border border-[#E6DEC8] rounded-2xl p-4 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1A1512] flex items-center gap-2">
                          <Package size={15} className="text-[#A3432A]" />
                          Duo Batch Parcel Slots
                        </span>
                        <span className="font-mono text-xs text-[#2E6B34] font-bold bg-[#E7F3E8] border border-[#C3E4C6] px-2.5 py-0.5 rounded-full">
                          5% Duo Discount Active
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl p-3 flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#1A1512] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">1</span>
                          <div className="min-w-0 flex-1">
                            <span className="font-mono text-xs uppercase tracking-wider text-[#5C5042] block">Slot 1 ({activeSize.label})</span>
                            <strong className="text-sm font-serif font-bold text-[#1A1512] block truncate">
                              {slot1Origin ? slot1Origin.name : "Select Coffee"}
                            </strong>
                          </div>
                        </div>

                        <div className="bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl p-3 flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#1A1512] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">2</span>
                          <div className="min-w-0 flex-1">
                            <span className="font-mono text-xs uppercase tracking-wider text-[#5C5042] block">Slot 2 ({activeSize.label})</span>
                            <strong className="text-sm font-serif font-bold text-[#1A1512] block truncate">
                              {slot2Origin ? slot2Origin.name : "Select Coffee"}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                        <span className="font-mono text-xs text-[#5C5042] font-semibold shrink-0">Quick Pairings:</span>
                        <button
                          type="button"
                          onClick={() => setDuoPreset(1, 2)}
                          className={`min-h-[40px] px-3 py-1.5 rounded-lg border font-mono text-xs transition-colors cursor-pointer shrink-0 ${
                            bagCounts[1] === 1 && bagCounts[2] === 1
                              ? "bg-[#1A1512] text-white border-[#1A1512] font-bold"
                              : "bg-[#FAF8F5] text-[#1A1512] border-[#E6DEC8] hover:bg-white"
                          }`}
                        >
                          Gulmi + Ilam (Mix)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuoPreset(1, 1)}
                          className={`min-h-[40px] px-3 py-1.5 rounded-lg border font-mono text-xs transition-colors cursor-pointer shrink-0 ${
                            bagCounts[1] === 2
                              ? "bg-[#1A1512] text-white border-[#1A1512] font-bold"
                              : "bg-[#FAF8F5] text-[#1A1512] border-[#E6DEC8] hover:bg-white"
                          }`}
                        >
                          2x Gulmi Reserve
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuoPreset(2, 2)}
                          className={`min-h-[40px] px-3 py-1.5 rounded-lg border font-mono text-xs transition-colors cursor-pointer shrink-0 ${
                            bagCounts[2] === 2
                              ? "bg-[#1A1512] text-white border-[#1A1512] font-bold"
                              : "bg-[#FAF8F5] text-[#1A1512] border-[#E6DEC8] hover:bg-white"
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

                {/* Step 2: Grind Calibration */}
                <section id="step-grind" className="space-y-4">
                  <div className="pb-2 border-b border-[#1A1512]/15">
                    <span className="font-mono text-xs uppercase tracking-[0.18em] font-bold text-[#A3432A]">
                      STEP 02 // GRIND CALIBRATION
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
                          className={`min-h-[56px] p-3.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.99] ${
                            isSelected 
                              ? "bg-[#1A1512] text-white border-[#1A1512] shadow-sm" 
                              : "bg-white border-[#E6DEC8] text-[#1A1512] hover:bg-[#FAF8F5]"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-mono text-xs font-bold uppercase tracking-wider">{grind.name}</span>
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
                          <p className={`text-xs ${isSelected ? "text-[#C8BFAB]" : "text-[#5C5042]"}`}>
                            {grind.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Step 3: Size Selection */}
                <section id="step-size" className="space-y-4">
                  <div className="pb-2 border-b border-[#1A1512]/15">
                    <span className="font-mono text-xs uppercase tracking-[0.18em] font-bold text-[#A3432A]">
                      STEP 03 // BATCH SIZE PER SHIPMENT
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
                          className={`min-h-[72px] p-4 rounded-xl border text-left cursor-pointer transition-all relative flex flex-col justify-between active:scale-[0.99] ${
                            isSelected 
                              ? "bg-[#1A1512] text-white border-[#1A1512] shadow-sm" 
                              : "bg-white border-[#E6DEC8] text-[#1A1512] hover:bg-[#FAF8F5]"
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-lg font-serif font-bold">{size.label}</span>
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
                            <span className={`font-mono text-xs font-bold block ${isSelected ? "text-[#E58A1F]" : "text-[#A3432A]"}`}>
                              {size.tag}
                            </span>
                          </div>
                          <p className={`font-mono text-xs mt-3 pt-2 border-t ${isSelected ? "border-white/10 text-[#C8BFAB]" : "border-[#F0EAE1] text-[#5C5042]"}`}>
                            {size.cups}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Step 4: Commitment Plan */}
                <section id="step-plan" className="space-y-4">
                  <div className="pb-2 border-b border-[#1A1512]/15">
                    <span className="font-mono text-xs uppercase tracking-[0.18em] font-bold text-[#A3432A]">
                      STEP 04 // ROASTERY SCHEDULE & SAVINGS
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
                          className={`min-h-[72px] p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between active:scale-[0.99] ${
                            isSelected 
                              ? "bg-[#1A1512] text-white border-[#1A1512] shadow-sm" 
                              : "bg-white border-[#E6DEC8] text-[#1A1512] hover:bg-[#FAF8F5]"
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-mono text-xs font-bold uppercase tracking-wider">{plan.name}</span>
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
                            <span className={`font-mono text-xs font-bold block ${plan.discount > 0 ? (isSelected ? "text-green-400" : "text-[#2E6B34]") : (isSelected ? "text-[#C8BFAB]" : "text-[#5C5042]")}`}>
                              {plan.tag}
                            </span>
                          </div>
                          <span className={`font-mono text-xs block mt-3 pt-2 border-t ${isSelected ? "border-white/10 text-[#C8BFAB]" : "border-[#F0EAE1] text-[#5C5042]"}`}>
                            {plan.months === 1 ? "Single cycle" : `${plan.months} deliveries`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </>
            )}

          </div>

          {/* RIGHT COLUMN: Modular Sticky Unboxing Manifest (Desktop Only: 5 Cols) */}
          <div className="hidden lg:block lg:col-span-5">
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

      {/* 4. MOBILE STICKY CHECKOUT BAR (Anchored directly above MobileNav at 4rem) */}
      <aside 
        aria-label="Mobile Order Summary and Checkout Bar"
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 bg-[#1A1512] text-[#F5F2EB] border-t border-[#3E342F] px-4 py-3 shadow-2xl flex items-center justify-between lg:hidden"
      >
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold text-white tracking-tight">
              Rs. {totalDueToday.toLocaleString()}
            </span>
            <span className="font-mono text-xs text-[#E58A1F] font-semibold">
              {activeSize.label} • {isTrialMode ? "Trial" : selectedPlan.name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="text-xs font-mono text-[#C8BFAB] hover:text-white flex items-center gap-1 font-semibold touch-manipulation cursor-pointer mt-0.5"
          >
            <span>View Lot Manifest</span>
            <ChevronUp size={13} className="text-[#E58A1F]" />
          </button>
        </div>

        <Link
          href={checkoutHref}
          className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#A3432A] hover:bg-[#8A3722] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <span>Checkout</span>
          <ArrowRight size={14} />
        </Link>
      </aside>

      {/* 5. MOBILE EXPANDABLE RECEIPT DRAWER (Bottom Sheet Modal) */}
      {isMobileDrawerOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="Order Lot Manifest & Breakdown"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end lg:hidden transition-opacity"
        >
          {/* Backdrop click area */}
          <div 
            className="flex-1 w-full"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-h-[85vh] bg-[#FAF8F5] rounded-t-2xl shadow-2xl border-t border-[#E6DEC8] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Header Ribbon */}
            <div className="bg-[#1A1512] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#3E342F]">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-[#E58A1F]" />
                <span className="font-mono text-xs uppercase tracking-widest font-bold">
                  Roastery Dispatch Manifest
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                aria-label="Close Manifest Drawer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Receipt Container */}
            <div className="overflow-y-auto p-4 pb-safe">
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
                isDrawer={true}
              />
            </div>
          </div>
        </div>
      )}

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
