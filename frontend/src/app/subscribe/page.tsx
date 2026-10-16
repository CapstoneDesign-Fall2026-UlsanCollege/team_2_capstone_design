"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Check, Mountain, Sparkles, Coffee, ShieldCheck, ArrowRight, Flame, RotateCcw, UserCheck, Lock, Package, Scale, Zap } from "lucide-react";
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
    notes: "Walnut • Caramel • Dried Plum",
    desc: "Velvety heavy body with deep nutty tones, cultivated in Kathmandu's northern foothills.", 
    img: "https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=600&auto=format&fit=crop" 
  },
];

// 2. TIERED CATALOG PRICING MATRIX (NPR per bag for each weight tier)
// 150g: Trial pack (one-time purchase)
// 250g, 500g, 1000g: Subscription-ready sizes
const ORIGIN_PRICES: Record<number, Record<string, number>> = {
  1: { // Gulmi Reserve
    "150g": 450,
    "250g": 650,
    "500g": 1200,
    "1000g": 2200,
  },
  2: { // Ilam Gold
    "150g": 500,
    "250g": 750,
    "500g": 1400,
    "1000g": 2600,
  },
  3: { // Nuwakot Heritage
    "150g": 400,
    "250g": 600,
    "500g": 1100,
    "1000g": 2000,
  },
};

// 3. PACK SIZES / WEIGHT TIERS
const PACK_SIZES = [
  { 
    id: "150g", 
    value: 0.15, 
    label: "150g Trial", 
    subtitle: "One-Time Buy • Sample", 
    isTrial: true, 
    tag: "Trial Pack", 
    cups: "~10 Cups (Taster)",
    desc: "Single dispatch • Experience before subscribing" 
  },
  { 
    id: "250g", 
    value: 0.25, 
    label: "250g", 
    subtitle: "Personal Ritual", 
    isTrial: false, 
    tag: "Tasting Size", 
    cups: "~15 Cups / month",
    desc: "Ideal for light daily drinkers" 
  },
  { 
    id: "500g", 
    value: 0.50, 
    label: "500g", 
    subtitle: "Daily Ritual", 
    isTrial: false, 
    tag: "Most Popular", 
    cups: "~30 Cups / month",
    desc: "Fresh standard bag for everyday brew" 
  },
  { 
    id: "1000g", 
    value: 1.00, 
    label: "1.0 kg", 
    subtitle: "Aficionados & Couples", 
    isTrial: false, 
    tag: "Best Value", 
    cups: "~60 Cups / month",
    desc: "Bulk savings for serious coffee drinkers" 
  },
];

// 4. BOX CURATION FORMATS
const BOX_FORMATS = [
  { 
    id: "single", 
    name: "Single Origin", 
    bags: 1, 
    tag: "1 Bag Focus", 
    badge: "Solo Ritual", 
    discountPercent: 0, 
    desc: "1 Bag of your chosen micro-lot" 
  },
  { 
    id: "duo", 
    name: "Dual Origin Duo", 
    bags: 2, 
    tag: "2 Bags / Mo", 
    badge: "Mix & Match • 5% Off", 
    discountPercent: 5, 
    desc: "Pick any 2 bags (e.g. 2x Gulmi or 1 Gulmi + 1 Ilam)" 
  },
  { 
    id: "trio", 
    name: "Himalayan Trio", 
    bags: 3, 
    tag: "3 Bags / Mo", 
    badge: "All Regions • 10% Off", 
    discountPercent: 10, 
    desc: "All 3 micro-lots: Gulmi + Ilam + Nuwakot taster flight" 
  },
];

const GRINDS = [
  { id: "whole", name: "Whole Bean", desc: "For home grinders • Peak aroma" },
  { id: "espresso", name: "Espresso", desc: "Fine grind • Moka pot & espresso" },
  { id: "pourover", name: "Pour-Over / Drip", desc: "Medium grind • V60 & Chemex" },
  { id: "frenchpress", name: "French Press", desc: "Coarse grind • Immersion & Cold Brew" },
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
    if (urlOriginId) {
      if (boxFormat.bags === 1) {
        setBagCounts({ 1: urlOriginId === 1 ? 1 : 0, 2: urlOriginId === 2 ? 1 : 0, 3: urlOriginId === 3 ? 1 : 0 });
      }
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
    // Check if user is logged in
    try {
      const stored = localStorage.getItem("demo_user") || localStorage.getItem("customer_user");
      if (stored) {
        setCustomer(JSON.parse(stored));
      }
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
      // Default to 1 Gulmi + 1 Ilam (can be changed to 2x Gulmi or any pair)
      setBagCounts({ 1: 1, 2: 1, 3: 0 });
    } else if (format.bags === 3) {
      // 1 of each signature origin
      setBagCounts({ 1: 1, 2: 1, 3: 1 });
    }
  };

  const totalSelectedBags = Object.values(bagCounts).reduce((a, b) => a + b, 0);

  // Card click handler: smoothly allows selecting same origin or different origin
  const handleOriginCardClick = (originId: number) => {
    if (boxFormat.bags === 1) {
      setBagCounts({ 1: originId === 1 ? 1 : 0, 2: originId === 2 ? 1 : 0, 3: originId === 3 ? 1 : 0 });
      return;
    }

    if (boxFormat.bags === 2) {
      // If clicking origin that already has 1 bag while total is 2, make it 2x of this origin!
      if ((bagCounts[originId] || 0) === 1 && totalSelectedBags === 2) {
        setBagCounts({ 1: originId === 1 ? 2 : 0, 2: originId === 2 ? 2 : 0, 3: originId === 3 ? 2 : 0 });
        return;
      }
    }

    if (totalSelectedBags < boxFormat.bags) {
      setBagCounts(prev => ({ ...prev, [originId]: (prev[originId] || 0) + 1 }));
    } else {
      // Swap slot to the clicked origin
      if ((bagCounts[originId] || 0) === 0) {
        const donorId = Number(Object.entries(bagCounts).find(([_, c]) => c > 0)?.[0] || 1);
        setBagCounts(prev => ({
          ...prev,
          [donorId]: Math.max(0, (prev[donorId] || 0) - 1),
          [originId]: 1,
        }));
      }
    }
  };

  // Direct stepper control for exact bag counts
  const updateBagCount = (originId: number, delta: number) => {
    const current = bagCounts[originId] || 0;
    const next = current + delta;
    if (next < 0) return;
    if (delta > 0 && totalSelectedBags >= boxFormat.bags) return;
    setBagCounts(prev => ({ ...prev, [originId]: next }));
  };

  // Preset shortcut for Duo mode (e.g. 2x of same origin or mix)
  const setDuoPreset = (id1: number, id2: number) => {
    const next: { [id: number]: number } = { 1: 0, 2: 0, 3: 0 };
    next[id1] = (next[id1] || 0) + 1;
    next[id2] = (next[id2] || 0) + 1;
    setBagCounts(next);
  };

  // ==========================================
  // MATHEMATICAL PRICING ENGINE
  // ==========================================

  // 1. Raw Catalog Subtotal: sum(price_per_bag * count)
  const rawSubtotal = ORIGINS.reduce((sum, o) => {
    const count = bagCounts[o.id] || 0;
    const unitPrice = ORIGIN_PRICES[o.id][selectedSize.id] || 1200;
    return sum + (unitPrice * count);
  }, 0);

  // 2. Multi-Bag Box Bundle Discount (5% for Duo, 10% for Trio, 0% for Single)
  const bundleDiscountPercent = boxFormat.discountPercent;
  const bundleDiscountAmount = Math.round(rawSubtotal * (bundleDiscountPercent / 100));
  const monthlyAfterBundle = rawSubtotal - bundleDiscountAmount;

  // 3. Plan Prepayment Discount (0% PAYG, 5% 3M, 10% 6M, 15% 12M)
  // If 150g Trial Pack is selected, it is strictly a One-Time Buy (1 month, 0% prepay)
  const isTrialMode = selectedSize.isTrial;
  const planMonths = isTrialMode ? 1 : selectedPlan.months;
  const planDiscountPercent = isTrialMode ? 0 : selectedPlan.discount;

  const fullPeriodBase = monthlyAfterBundle * planMonths;
  const planDiscountAmount = Math.round(fullPeriodBase * (planDiscountPercent / 100));
  const totalDueToday = fullPeriodBase - planDiscountAmount;

  // Effective Monthly Rate & Total Savings
  const effectiveMonthlyPrice = Math.round(totalDueToday / planMonths);
  const totalSavings = (rawSubtotal * planMonths) - totalDueToday;
  const totalWeightKg = Math.round(selectedSize.value * totalSelectedBags * 100) / 100;

  // Box Summary Title
  const getBoxSummaryName = () => {
    const selectedItems = ORIGINS.filter(o => (bagCounts[o.id] || 0) > 0);
    if (selectedSize.isTrial) {
      const single = selectedItems[0] || ORIGINS[0];
      return `${single.name} (150g Trial Pack - One-Time)`;
    }
    if (boxFormat.id === "single") {
      const single = selectedItems[0] || ORIGINS[0];
      return `${single.name} (${selectedSize.label})`;
    }
    if (boxFormat.id === "trio" && selectedItems.length === 3 && Object.values(bagCounts).every(c => c === 1)) {
      return `Himalayan Trio Bundle (${selectedSize.label} each: Gulmi + Ilam + Nuwakot)`;
    }
    if (boxFormat.id === "duo") {
      // Check if same origin (e.g. 2x Gulmi)
      if (selectedItems.length === 1) {
        return `2x ${selectedItems[0].name} (${selectedSize.label} Duo)`;
      }
      return `Dual Duo: ` + selectedItems.map(o => `${bagCounts[o.id]}x ${o.name}`).join(" + ") + ` (${selectedSize.label})`;
    }
    return selectedItems.map(o => `${bagCounts[o.id]}x ${o.name} (${selectedSize.label})`).join(" + ");
  };

  const primaryOriginId = ORIGINS.find(o => (bagCounts[o.id] || 0) > 0)?.id || 1;
  const selectedOriginsList = ORIGINS.filter(o => (bagCounts[o.id] || 0) > 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F2EB] text-[#2C2420] font-sans">
      
      {/* 1. BUILDER HERO */}
      <div className="bg-[#1A1512] text-[#F5F2EB] pt-20 pb-14 px-6 relative overflow-hidden border-b border-[#2C2420]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-25 mix-blend-overlay"></div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[#E58A1F] text-[10px] font-bold uppercase tracking-[0.24em] mb-4">
            <Sparkles size={12} /> Custom Coffee Subscription & Trial Packs
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-3">
            Build Your Himalayan Ritual.
          </h1>
          <p className="text-[#A89F91] text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
            Order a 150g one-time trial pack or customize your monthly coffee subscription across 250g, 500g, and 1.0 kg fresh lots.
          </p>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mt-8 text-[11px] uppercase tracking-wider font-semibold text-[#8A7966]">
            <span className="text-[#E58A1F] flex items-center gap-1.5 font-bold">
              <span className="w-5 h-5 rounded-full bg-[#E58A1F] text-[#1A1512] flex items-center justify-center text-[10px]">1</span>
              Origins & Format
            </span>
            <span>→</span>
            <span className="text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px]">2</span>
              Grind
            </span>
            <span>→</span>
            <span className="text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px]">3</span>
              Pack Size
            </span>
            <span>→</span>
            <span className="text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px]">4</span>
              Plan
            </span>
          </div>
        </div>
      </div>

      {/* 2. TWO-COLUMN SPLIT CONTAINER */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Interactive Steps (7 Cols) */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Step 1: Origins & Box Format */}
            <section id="step-origin">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.24em] font-bold text-[#A3432A]">Step 01</span>
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-[#1A1512]">Choose Origins & Box Format</h2>
                </div>
                <span className="text-xs text-[#8A7966] font-medium hidden sm:inline">
                  Mix & Match or Same Origin
                </span>
              </div>

              {/* Box Format Selector Tabs (Disabled if 150g Trial Pack is selected) */}
              {selectedSize.isTrial ? (
                <div className="p-3.5 rounded-xl border border-[#A3432A] bg-[#FAF5F2] mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[#A3432A]" />
                    <span className="text-xs font-semibold text-[#1A1512]">
                      150g Trial Pack Active — Single Discovery Purchase
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#A3432A] tracking-wider">
                    One-Time Buy
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  {BOX_FORMATS.map((fmt) => {
                    const isSelected = boxFormat.id === fmt.id;
                    return (
                      <div
                        key={fmt.id}
                        onClick={() => handleSelectFormat(fmt)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                          isSelected 
                            ? "bg-white border-[#A3432A] shadow-md ring-2 ring-[#A3432A]" 
                            : "bg-white/80 border-[#E6DEC8] hover:bg-white hover:border-[#C4B69E] shadow-xs"
                        }`}
                      >
                        <div className="absolute top-3 right-3">
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
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block mb-1 ${
                            isSelected ? "bg-[#FAF5F2] text-[#A3432A]" : "bg-[#F0EAE1] text-[#5C5042]"
                          }`}>
                            {fmt.badge}
                          </span>
                          <h3 className="font-serif font-bold text-xs sm:text-sm text-[#1A1512] pr-5">{fmt.name}</h3>
                          <p className="text-[10px] font-semibold text-[#8A7966]">{fmt.tag}</p>
                        </div>

                        <p className="text-[10px] text-[#5C5042] leading-tight mt-1.5 pt-1.5 border-t border-[#F0EAE1]">
                          {fmt.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Duo Fast Quick-Select Presets (When in Duo mode) */}
              {boxFormat.bags === 2 && !selectedSize.isTrial && (
                <div className="mb-4 bg-white p-3 rounded-xl border border-[#E6DEC8] shadow-xs">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#8A7966] block mb-2">
                    Quick Duo Combinations:
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setDuoPreset(1, 2)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        bagCounts[1] === 1 && bagCounts[2] === 1
                          ? "bg-[#1A1512] text-white border-[#1A1512]"
                          : "bg-[#FAF8F5] text-[#5C5042] border-[#E6DEC8] hover:bg-[#EFEAE2]"
                      }`}
                    >
                      Gulmi + Ilam (Mix & Match)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuoPreset(1, 1)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        bagCounts[1] === 2
                          ? "bg-[#1A1512] text-white border-[#1A1512]"
                          : "bg-[#FAF8F5] text-[#5C5042] border-[#E6DEC8] hover:bg-[#EFEAE2]"
                      }`}
                    >
                      2x Gulmi Reserve (Double Same)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuoPreset(2, 2)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        bagCounts[2] === 2
                          ? "bg-[#1A1512] text-white border-[#1A1512]"
                          : "bg-[#FAF8F5] text-[#5C5042] border-[#E6DEC8] hover:bg-[#EFEAE2]"
                      }`}
                    >
                      2x Ilam Gold (Double Same)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuoPreset(1, 3)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        bagCounts[1] === 1 && bagCounts[3] === 1
                          ? "bg-[#1A1512] text-white border-[#1A1512]"
                          : "bg-[#FAF8F5] text-[#5C5042] border-[#E6DEC8] hover:bg-[#EFEAE2]"
                      }`}
                    >
                      Gulmi + Nuwakot
                    </button>
                  </div>
                </div>
              )}

              {/* Box Slots Indicator (If multi-bag) */}
              {boxFormat.bags > 1 && !selectedSize.isTrial && (
                <div className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-[#E6DEC8] mb-5 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Package size={15} className="text-[#A3432A]" />
                    <span className="text-xs text-[#5C5042]">
                      Box Allocation: <strong className="text-[#1A1512] font-semibold">{totalSelectedBags} of {boxFormat.bags} Bags Filled</strong>
                    </span>
                  </div>
                  {totalSelectedBags === boxFormat.bags ? (
                    <span className="text-xs text-[#2E6B34] font-bold flex items-center gap-1.5 bg-[#E7F3E8] px-2.5 py-0.5 rounded-full">
                      <Check size={12} className="stroke-[3]" /> Box Complete ({boxFormat.badge})
                    </span>
                  ) : (
                    <span className="text-xs text-[#A3432A] font-bold bg-[#FAF5F2] px-2.5 py-0.5 rounded-full animate-pulse">
                      Select {boxFormat.bags - totalSelectedBags} more bag{boxFormat.bags - totalSelectedBags > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}

              {/* Origin Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {ORIGINS.map((origin) => {
                  const count = bagCounts[origin.id] || 0;
                  const isSelected = count > 0;
                  const unitPrice = ORIGIN_PRICES[origin.id][selectedSize.id] || 1200;

                  return (
                    <div
                      key={origin.id}
                      onClick={() => handleOriginCardClick(origin.id)}
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
                                  : "border-white/70 bg-black/40 backdrop-blur-xs"
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-sm font-serif font-bold text-[#1A1512]">{origin.name}</h3>
                          <div className="text-right">
                            <span className="text-xs font-bold text-[#A3432A]">
                              Rs. {unitPrice}
                            </span>
                            <span className="text-[9px] text-[#8A7966] block">
                              /{selectedSize.label}
                            </span>
                          </div>
                        </div>

                        <p className="text-[9px] uppercase font-bold tracking-wider text-[#8A7966] mb-2">
                          {origin.region}
                        </p>

                        <p className="text-[11px] text-[#5C5042] leading-snug mb-3 line-clamp-2">
                          {origin.desc}
                        </p>
                      </div>

                      {/* Card Footer: Notes & Multi-Bag Stepper */}
                      <div className="pt-2.5 border-t border-[#F0EAE1]">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 pr-1">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-[#1A1512] block">
                              Notes:
                            </span>
                            <span className="text-[10px] text-[#A3432A] font-medium leading-tight block truncate">
                              {origin.notes}
                            </span>
                          </div>

                          {/* Multi-Bag Direct Stepper */}
                          {boxFormat.bags > 1 && !selectedSize.isTrial && (
                            <div 
                              className="flex items-center gap-1 bg-[#FAF8F5] border border-[#E6DEC8] rounded-lg p-0.5 shrink-0" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => updateBagCount(origin.id, -1)}
                                disabled={count === 0}
                                className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs transition-colors ${
                                  count === 0 ? "text-gray-300 cursor-not-allowed" : "text-[#1A1512] hover:bg-[#E6DEC8]"
                                }`}
                                title="Remove slot"
                              >
                                -
                              </button>
                              <span className="w-4 text-center text-[11px] font-bold text-[#1A1512]">
                                {count}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateBagCount(origin.id, 1)}
                                disabled={totalSelectedBags >= boxFormat.bags}
                                className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs transition-colors ${
                                  totalSelectedBags >= boxFormat.bags ? "text-gray-300 cursor-not-allowed" : "text-white bg-[#A3432A] hover:bg-[#8A3722]"
                                }`}
                                title="Add slot"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
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

            {/* Step 3: Coffee Pack Size / Weight Selection */}
            <section id="step-size">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.24em] font-bold text-[#A3432A]">Step 03</span>
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-[#1A1512]">Select Coffee Pack Size</h2>
                </div>
                <span className="text-xs text-[#8A7966] font-medium hidden sm:inline flex items-center gap-1">
                  <Scale size={13} /> {selectedSize.label} per bag
                </span>
              </div>

              <p className="text-xs text-[#5C5042] mb-4">
                Choose the <strong>150g Trial Pack</strong> for a one-time purchase, or select <strong>250g, 500g, or 1.0 kg</strong> for recurring roastery subscriptions.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {PACK_SIZES.map((size) => {
                  const isSelected = selectedSize.id === size.id;
                  
                  // Calculate cost sample for currently selected origin configuration at this size
                  const sampleSubtotal = ORIGINS.reduce((sum, o) => {
                    const count = bagCounts[o.id] || 0;
                    const p = ORIGIN_PRICES[o.id][size.id] || 1200;
                    return sum + (p * count);
                  }, 0);
                  const sampleAfterBundle = Math.round(sampleSubtotal * (1 - (size.isTrial ? 0 : bundleDiscountPercent) / 100));

                  return (
                    <div
                      key={size.id}
                      onClick={() => {
                        setSelectedSize(size);
                        // If switching to trial, lock to 1 bag
                        if (size.isTrial && boxFormat.bags > 1) {
                          handleSelectFormat(BOX_FORMATS[0]);
                        }
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between ${
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
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block mb-1.5 ${
                          size.isTrial 
                            ? (isSelected ? "bg-[#A3432A] text-white" : "bg-[#FAF5F2] text-[#A3432A]")
                            : (isSelected ? "bg-white/10 text-[#E58A1F]" : "bg-[#F0EAE1] text-[#5C5042]")
                        }`}>
                          {size.tag}
                        </span>
                        <p className="text-xl font-serif font-bold mb-0.5">{size.label}</p>
                        <p className={`text-[10px] font-semibold mb-2 ${
                          isSelected ? "text-[#E58A1F]" : "text-[#8A7966]"
                        }`}>
                          {size.cups}
                        </p>
                      </div>

                      <div className={`pt-2 border-t text-[11px] font-bold ${
                        isSelected ? "border-white/15 text-white" : "border-[#F0EAE1] text-[#A3432A]"
                      }`}>
                        Rs. {sampleAfterBundle} <span className="text-[9px] font-normal opacity-80">{size.isTrial ? "one-time" : "/mo"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Step 4: Billing Frequency or One-Time Trial Commitment */}
            <section id="step-plan">
              <div className="mb-4">
                <span className="text-[10px] uppercase tracking-[0.24em] font-bold text-[#A3432A]">Step 04</span>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-[#1A1512]">
                  {selectedSize.isTrial ? "Trial Order Commitment" : "Billing & Delivery Commitment"}
                </h2>
              </div>

              {selectedSize.isTrial ? (
                // 150g TRIAL PACK: Focused One-Time Purchase Card
                <div className="p-6 rounded-xl border border-[#A3432A] bg-white ring-2 ring-[#A3432A] shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#FAF5F2] text-[#A3432A] inline-block mb-2">
                      One-Time Discovery Buy
                    </span>
                    <h3 className="text-lg font-serif font-bold text-[#1A1512]">150g One-Time Trial Pack</h3>
                    <p className="text-xs text-[#5C5042] mt-1 max-w-md">
                      Experience Himalayan artisanal coffee with zero recurring commitment. Roasted fresh in Lalitpur and dispatched straight to your door.
                    </p>
                    <p className="text-[11px] text-[#2E6B34] font-semibold mt-2 flex items-center gap-1">
                      <Check size={13} className="stroke-[3]" /> No recurring subscription • Free Kathmandu delivery
                    </p>
                  </div>

                  <div className="text-right sm:border-l sm:border-[#F0EAE1] sm:pl-6 shrink-0">
                    <span className="text-xs font-semibold text-[#8A7966] uppercase tracking-wider block">Single Charge</span>
                    <span className="text-3xl font-serif font-bold text-[#1A1512]">Rs. {totalDueToday}</span>
                    <span className="text-[10px] text-[#8A7966] block mt-1">VAT & courier included</span>
                  </div>
                </div>
              ) : (
                // 250g, 500g, 1000g: 4 Prepay Subscription Discount Plans
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                            <p className="text-[11px] text-[#8A7966]">
                              {plan.months === 1 ? "Billed monthly • Cancel anytime" : `Total: Rs. ${planTotal} for ${plan.months} months`}
                            </p>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="text-right">
                              {plan.discount > 0 && (
                                <p className="text-[11px] line-through text-[#8A7966]">Rs. {monthlyAfterBundle}/mo</p>
                              )}
                              <p className="text-xl font-serif font-bold text-[#1A1512]">
                                Rs. {planMonthly} <span className="text-xs font-normal text-[#8A7966]">/mo</span>
                              </p>
                            </div>
                            <span
                              className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center shrink-0 mt-1 ${
                                isSelected
                                  ? "bg-green-500 border-green-500 ring-2 ring-green-500/20"
                                  : "border-[#C8BFAB] bg-transparent"
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-[#F0EAE1] flex justify-between items-center text-[11px]">
                          <span className="text-[#5C5042]">Delivery: <strong className="text-[#2E6B34]">Free Courier</strong></span>
                          {plan.discount > 0 ? (
                            <span className="text-[#2E6B34] font-bold">Save Rs. {planDiscountVal} ({plan.discount}% off)</span>
                          ) : (
                            <span className="text-[#8A7966]">Cancel anytime</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

          </div>

          {/* RIGHT COLUMN: Sticky "Your Box Summary" Card */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-white rounded-2xl border border-[#E6DEC8] shadow-xl overflow-hidden p-6 md:p-7">
              
              <div className="flex items-center justify-between pb-4 border-b border-[#F0EAE1] mb-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#A3432A] block">
                    {selectedSize.isTrial ? "Trial Discovery Box" : "Your Coffee Ritual"}
                  </span>
                  <h3 className="text-lg font-serif font-bold text-[#1A1512]">
                    {selectedSize.isTrial ? "Trial Pack Summary" : "Subscription Box Preview"}
                  </h3>
                </div>
                <span className="px-2.5 py-1 bg-[#E7F3E8] text-[#2E6B34] text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} /> Direct Trade
                </span>
              </div>

              {/* Box Format Indicator */}
              <div className="mb-4 flex items-center justify-between bg-[#FAF8F5] px-3.5 py-2.5 rounded-lg border border-[#E6DEC8]">
                <span className="text-xs font-semibold text-[#5C5042] flex items-center gap-1.5">
                  <Package size={14} className="text-[#A3432A]" />
                  {selectedSize.isTrial ? "150g One-Time Trial" : boxFormat.name}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A3432A] bg-[#FAF5F2] px-2 py-0.5 rounded">
                  {selectedSize.label} {selectedSize.isTrial ? "Pack" : "/ Bag"}
                </span>
              </div>

              {/* Selected Origin Mini Cards */}
              <div className="space-y-2.5 mb-5">
                {selectedOriginsList.map((origin) => {
                  const bagCount = bagCounts[origin.id] || 0;
                  const unitPrice = ORIGIN_PRICES[origin.id][selectedSize.id] || 1200;
                  return (
                    <div key={origin.id} className="flex gap-3 items-center bg-[#FAF8F5] p-3 rounded-xl border border-[#E6DEC8]">
                      <img 
                        src={origin.img} 
                        alt={origin.name} 
                        className="w-12 h-12 rounded-lg object-cover shadow-xs shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-serif font-bold text-xs text-[#1A1512] truncate">
                            {origin.name}
                          </h4>
                          <span className="text-[10px] font-bold text-[#A3432A]">
                            {bagCount}x ({selectedSize.label} • Rs. {unitPrice * bagCount})
                          </span>
                        </div>
                        <p className="text-[9px] text-[#8A7966] uppercase tracking-wider">
                          {origin.altitude} • {origin.process}
                        </p>
                        <p className="text-[10px] text-[#A3432A] font-medium truncate">
                          {origin.notes}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Box Specifications */}
              <div className="space-y-2.5 text-xs text-[#5C5042] pb-5 border-b border-[#F0EAE1] mb-5">
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Grind Profile:</span>
                  <strong className="text-[#1A1512] font-semibold">{selectedGrind.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Total Shipment Weight:</span>
                  <strong className="text-[#1A1512] font-semibold">{totalWeightKg} kg ({totalSelectedBags}x {selectedSize.label})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Order Model:</span>
                  <strong className="text-[#1A1512] font-semibold">
                    {selectedSize.isTrial ? "One-Time Buy (No Recurring)" : selectedPlan.name}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Doorstep Delivery:</span>
                  <strong className="text-[#2E6B34] font-semibold">Free (Kathmandu & Nationwide)</strong>
                </div>
              </div>

              {/* Itemized Pricing Breakdown */}
              <div className="space-y-2 text-xs text-[#5C5042] pb-4 border-b border-[#F0EAE1] mb-5">
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Bags Subtotal:</span>
                  <span className="text-[#1A1512] font-semibold">Rs. {rawSubtotal}</span>
                </div>

                {bundleDiscountAmount > 0 && !selectedSize.isTrial && (
                  <div className="flex justify-between text-[#2E6B34]">
                    <span>{boxFormat.name} Perk ({bundleDiscountPercent}%):</span>
                    <span className="font-semibold">- Rs. {bundleDiscountAmount} / mo</span>
                  </div>
                )}

                {!selectedSize.isTrial && selectedPlan.months > 1 && (
                  <div className="flex justify-between">
                    <span className="text-[#8A7966]">{selectedPlan.months}-Month Total Base:</span>
                    <span className="text-[#1A1512] font-semibold">Rs. {fullPeriodBase}</span>
                  </div>
                )}

                {!selectedSize.isTrial && planDiscountAmount > 0 && (
                  <div className="flex justify-between text-[#2E6B34]">
                    <span>{selectedPlan.name} Perk ({planDiscountPercent}%):</span>
                    <span className="font-semibold">- Rs. {planDiscountAmount}</span>
                  </div>
                )}
              </div>

              {/* Pricing Totals */}
              <div className="mb-6">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs font-semibold text-[#8A7966] uppercase tracking-wider">
                    {selectedSize.isTrial ? "Total Due Today:" : selectedPlan.months > 1 ? "Total Due Today:" : "Monthly Charge:"}
                  </span>
                  <div className="text-right">
                    <span className="text-3xl font-serif font-bold text-[#1A1512]">
                      Rs. {totalDueToday}
                    </span>
                    {!selectedSize.isTrial && selectedPlan.months > 1 && (
                      <span className="block text-[11px] text-[#8A7966]">
                        (Rs. {effectiveMonthlyPrice} / month)
                      </span>
                    )}
                  </div>
                </div>

                {totalSavings > 0 && (
                  <div className="mt-2 py-1.5 px-3 bg-[#E7F3E8] text-[#2E6B34] text-xs font-bold rounded-lg flex items-center justify-between">
                    <span>Total Savings Applied:</span>
                    <span>Save Rs. {totalSavings}</span>
                  </div>
                )}
              </div>

              {/* Customer Account Status Indicator */}
              <div className="mb-5 py-2 px-3 bg-[#FAF8F5] border border-[#E6DEC8] rounded-lg flex items-center justify-between text-xs">
                {customer ? (
                  <span className="flex items-center gap-1.5 text-[#2E6B34] font-medium">
                    <UserCheck size={14} />
                    <span>Ordering as <strong>{customer.name}</strong></span>
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
              {totalSelectedBags !== boxFormat.bags ? (
                <div className="w-full py-4 rounded-xl bg-gray-300 text-gray-600 text-center uppercase tracking-widest text-xs font-bold shadow-xs cursor-not-allowed">
                  Select {boxFormat.bags - totalSelectedBags} more origin{boxFormat.bags - totalSelectedBags > 1 ? "s" : ""} to continue
                </div>
              ) : (
                <Link 
                  href={`/checkout?origin=${primaryOriginId}&name=${encodeURIComponent(getBoxSummaryName())}&weight=${totalWeightKg}&price=${totalDueToday}&plan_id=${selectedSize.isTrial ? "TRIAL_ONETIME" : selectedPlan.id}&plan_name=${encodeURIComponent(selectedSize.isTrial ? "One-Time Trial Pack" : selectedPlan.name)}`}
                  className="w-full py-4 rounded-xl bg-[#A3432A] hover:bg-[#8A3722] text-white text-center uppercase tracking-widest text-xs font-bold transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2 group"
                >
                  Proceed to Checkout <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )}

              {/* Reassurance Guarantees */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-[#8A7966] text-center pt-3 border-t border-[#F0EAE1]">
                <span className="flex items-center justify-center gap-1">
                  <Flame size={12} className="text-[#A3432A]" /> 48h Fresh Roast
                </span>
                <span className="flex items-center justify-center gap-1">
                  <RotateCcw size={12} className="text-[#A3432A]" /> {selectedSize.isTrial ? "Freshness Guarantee" : "Cancel Anytime"}
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
