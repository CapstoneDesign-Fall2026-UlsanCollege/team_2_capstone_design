"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Check, Sparkles, ShieldCheck, ArrowRight, Flame, RotateCcw, UserCheck, Lock, Package, Scale, Heart } from "lucide-react";
import { useSearchParams } from "next/navigation";

// 1. BASE ORIGIN SPECIFICATIONS (Flavor-First Presentation)
const ORIGINS = [
  { 
    id: 1, 
    name: "Gulmi Reserve", 
    region: "Gulmi, Western Nepal",
    altitude: "1,600m",
    score: "86.5 SCA",
    process: "Fully Washed",
    flavorTags: ["🍯 Mountain Honey", "🍊 Citrus Blossom", "🍫 Dark Chocolate"],
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
    flavorTags: ["🍓 Wild Berry", "🌸 White Jasmine", "🍬 Brown Caramel"],
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
    flavorTags: ["🌰 Toasted Walnut", "🍯 Dark Molasses", "🍑 Spiced Plum"],
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
  const urlType = searchParams.get("type"); // "trial" or "subscription"

  // 1. Experience Mode Fork: "trial" vs "subscription"
  const [experienceType, setExperienceType] = useState<"trial" | "subscription">(
    urlType === "trial" || urlWeight === 0.15 ? "trial" : "subscription"
  );

  const initialFormat = BOX_FORMATS[0];
  const initialPlan = PLANS.find(p => p.id.toLowerCase() === urlPlanId?.toLowerCase()) || PLANS[0];
  const initialGrind = GRINDS.find(g => g.id.toLowerCase() === urlGrindId?.toLowerCase()) || GRINDS[0];
  const initialSize = SUBSCRIPTION_SIZES.find(w => w.value === urlWeight) || SUBSCRIPTION_SIZES[1]; // Default: 500g

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

  // 15-Second Taste Matcher State
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState<1 | 2 | 3>(1);
  const [quizBrew, setQuizBrew] = useState<string | null>(null);
  const [quizFlavor, setQuizFlavor] = useState<string | null>(null);
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
      // If clicking origin that already has 1 bag while total is 2, toggle to 2x of this origin!
      if (bagCounts[originId] === 1 && totalSelectedBags === 2) {
        setBagCounts({ 1: originId === 1 ? 2 : 0, 2: originId === 2 ? 2 : 0, 3: originId === 3 ? 2 : 0 });
        return;
      }
      // If already 2x, cycle back to a mix
      if (bagCounts[originId] === 2) {
        const otherId = originId === 1 ? 2 : 1;
        setBagCounts({ 1: originId === 1 || otherId === 1 ? 1 : 0, 2: originId === 2 || otherId === 2 ? 1 : 0, 3: 0 });
        return;
      }
      // If 0, swap out the other origin
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

  // Derive which origins are in slot 1 and slot 2 for visual unboxing display
  const activeBagArray: number[] = [];
  Object.entries(bagCounts).forEach(([idStr, count]) => {
    for (let i = 0; i < count; i++) activeBagArray.push(Number(idStr));
  });
  const slot1Origin = ORIGINS.find(o => o.id === activeBagArray[0]);
  const slot2Origin = ORIGINS.find(o => o.id === activeBagArray[1]);

  // ==========================================
  // MATHEMATICAL PRICING ENGINE
  // ==========================================
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

  // Box Summary Title
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

  // Taste Matcher Algorithms & Curated Pairings
  const getMatchedOrigin = () => {
    if (quizFlavor === "fruity") return ORIGINS.find(o => o.id === 2) || ORIGINS[1]; // Ilam Gold
    if (quizFlavor === "chocolate") return ORIGINS.find(o => o.id === 3) || ORIGINS[2]; // Nuwakot Heritage
    return ORIGINS.find(o => o.id === 1) || ORIGINS[0]; // Gulmi Reserve (Balanced Honey & Citrus)
  };

  const getMatchRationale = (originId: number) => {
    if (originId === 2) {
      return "Based on your preference for bright, fruit-forward notes, Ilam Gold's high-altitude natural process at 1,800m delivers vibrant wild berry and jasmine aromatics.";
    }
    if (originId === 3) {
      return "Based on your taste for deep chocolate and rich body, Nuwakot Heritage is roasted to deliver a thick, syrupy cup with toasted walnut and dark molasses that never gets lost.";
    }
    return "Based on your preference for a balanced, sweet cup, Gulmi Reserve is Nepal's historic specialty standard with silky mountain honey and citrus blossom.";
  };

  const handleApplyMatch = () => {
    const match = getMatchedOrigin();
    setMatchedOriginId(match.id);
    if (experienceType === "trial" || boxFormat.bags === 1) {
      setBagCounts({ 1: match.id === 1 ? 1 : 0, 2: match.id === 2 ? 1 : 0, 3: match.id === 3 ? 1 : 0 });
    } else if (boxFormat.bags === 2) {
      // For Duo, pair matched bean with another origin or 2x
      setBagCounts({ 
        1: match.id === 1 ? 1 : 1, 
        2: match.id === 2 ? 1 : (match.id === 1 ? 1 : 0), 
        3: match.id === 3 ? 1 : 0 
      });
    }
    setIsQuizOpen(false);
  };

  const renderTasteMatcher = () => (
    <div className="mb-4">
      {/* Sleek Trigger Pill */}
      <button
        type="button"
        onClick={() => {
          setIsQuizOpen(!isQuizOpen);
          if (!isQuizOpen && quizStep === 3) setQuizStep(1);
        }}
        className={`w-full rounded-2xl py-2.5 px-3.5 sm:px-4 flex items-center justify-between text-xs transition-all border ${
          matchedOriginId
            ? "bg-[#FAF5EC] border-[#E58A1F]/50 text-[#1A1512]"
            : "bg-white/80 hover:bg-white border-[#DDD4C3] hover:border-[#A3432A]/40 text-[#1A1512] shadow-xs"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`p-1 rounded-lg ${matchedOriginId ? "bg-[#E58A1F] text-white" : "bg-[#E58A1F]/15 text-[#A3432A]"}`}>
            <Sparkles size={13} />
          </span>
          <div className="text-left">
            <span className="font-bold text-[#1A1512] block">
              {matchedOriginId
                ? `🎯 Your Match: ${ORIGINS.find(o => o.id === matchedOriginId)?.name}`
                : "Not sure which coffee fits your palate?"}
            </span>
            <span className="text-[10px] text-[#8A7966] block">
              {matchedOriginId
                ? "Click to retake the 15-second taste quiz"
                : "Take the 15-second taste matcher to pick the perfect bean"}
            </span>
          </div>
        </div>
        <span className="text-[11px] font-bold text-[#A3432A] shrink-0 ml-2">
          {isQuizOpen ? "Close ✕" : matchedOriginId ? "Retake ↺" : "Find My Bean →"}
        </span>
      </button>

      {/* Expanded Matcher Panel */}
      {isQuizOpen && (
        <div className="mt-2.5 bg-white border border-[#E6DEC8] rounded-2xl p-4 sm:p-5 shadow-sm animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F0EAE1]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#A3432A] text-white text-[10px] font-bold flex items-center justify-center">
                {quizStep === 3 ? "✓" : quizStep}
              </span>
              <span className="text-xs font-bold text-[#1A1512]">
                {quizStep === 1 && "Step 1 of 2 • How do you brew / drink your coffee?"}
                {quizStep === 2 && "Step 2 of 2 • What flavor notes do you love most?"}
                {quizStep === 3 && "Your Himalayan Match Found!"}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-[#8A7966] tracking-wider">
              15s Taste Matcher
            </span>
          </div>

          {/* Step 1: Brew Method */}
          {quizStep === 1 && (
            <div>
              <p className="text-[11px] text-[#8A7966] mb-3">
                Select your primary style to match the optimal bean body and roast profile:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: "black", label: "☕ Black & Pure", sub: "Drip, Pour-Over, Chemex, Americano", desc: "Aromatic clarity & clean mountain acidity" },
                  { id: "milk", label: "🥛 With Milk", sub: "Latte, Cappuccino, Flat White", desc: "Bold body that cuts through steamed milk" },
                  { id: "coldbrew", label: "🧊 Cold Brew / Iced", sub: "Chilled extraction, sweet & smooth", desc: "Sweet fruit notes & low bitterness" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setQuizBrew(opt.id);
                      setQuizStep(2);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all hover:border-[#A3432A] ${
                      quizBrew === opt.id ? "bg-[#FAF5EC] border-[#A3432A]" : "bg-[#FAF8F5] border-[#E6DEC8]"
                    }`}
                  >
                    <span className="font-bold text-xs text-[#1A1512] block mb-0.5">{opt.label}</span>
                    <span className="text-[10px] text-[#A3432A] font-semibold block mb-1">{opt.sub}</span>
                    <span className="text-[9px] text-[#8A7966] block">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Flavor Profile */}
          {quizStep === 2 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-[#8A7966]">
                  What flavor notes excite your tastebuds most?
                </p>
                <button
                  type="button"
                  onClick={() => setQuizStep(1)}
                  className="text-[10px] text-[#8A7966] hover:text-[#1A1512] font-semibold"
                >
                  ← Back
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { 
                    id: "fruity", 
                    label: "🍓 Bright & Wild Berry", 
                    tags: "Wild Berry • Jasmine • Floral", 
                    desc: "Vibrant mountain acidity, juicy natural process" 
                  },
                  { 
                    id: "balanced", 
                    label: "🍯 Balanced & Sweet Honey", 
                    tags: "Mountain Honey • Blossom • Dark Choc", 
                    desc: "Silky balance, smooth mouthfeel, everyday ritual" 
                  },
                  { 
                    id: "chocolate", 
                    label: "🍫 Deep Chocolate & Walnut", 
                    tags: "Toasted Walnut • Molasses • Plum", 
                    desc: "Low acidity, comforting nutty cocoa sweetness" 
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setQuizFlavor(opt.id);
                      setQuizStep(3);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all hover:border-[#A3432A] ${
                      quizFlavor === opt.id ? "bg-[#FAF5EC] border-[#A3432A]" : "bg-[#FAF8F5] border-[#E6DEC8]"
                    }`}
                  >
                    <span className="font-bold text-xs text-[#1A1512] block mb-0.5">{opt.label}</span>
                    <span className="text-[10px] text-[#A3432A] font-semibold block mb-1">{opt.tags}</span>
                    <span className="text-[9px] text-[#8A7966] block">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Match Result */}
          {quizStep === 3 && (
            <div>
              {(() => {
                const match = getMatchedOrigin();
                return (
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#FAF5EC] border border-[#E58A1F]/30 rounded-xl p-4">
                    <img
                      src={match.img}
                      alt={match.name}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-xs border border-[#E6DEC8]"
                    />
                    <div className="flex-1 text-center sm:text-left">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#E58A1F]/20 text-[#1A1512] text-[9px] font-black uppercase tracking-wider mb-1">
                        <Sparkles size={10} className="text-[#A3432A]" /> Perfect Match Found
                      </div>
                      <h4 className="text-sm font-serif font-bold text-[#1A1512]">{match.name} ({match.score})</h4>
                      <p className="text-xs text-[#A3432A] font-bold mb-1">{match.notes}</p>
                      <p className="text-[11px] text-[#5C5042] leading-relaxed mb-3">
                        {getMatchRationale(match.id)}
                      </p>
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={handleApplyMatch}
                          className="bg-[#1A1512] hover:bg-black text-white text-xs font-bold py-2 px-4 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
                        >
                          <Check size={13} className="text-green-400 stroke-[3]" />
                          Apply {match.name} to Box
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQuizStep(1);
                            setQuizBrew(null);
                            setQuizFlavor(null);
                          }}
                          className="text-xs text-[#8A7966] hover:text-[#1A1512] py-2 px-3 font-semibold"
                        >
                          ↺ Retake
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F2EB] text-[#2C2420] font-sans">
      
      {/* 1. BUILDER HERO */}
      <div className="bg-[#1A1512] text-[#F5F2EB] pt-20 pb-12 px-6 relative overflow-hidden border-b border-[#2C2420]">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#E58A1F] text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
            <Sparkles size={11} /> Himalayan Artisanal Coffee
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-2.5">
            Build Your Coffee Ritual.
          </h1>
          <p className="text-[#A89F91] text-xs md:text-sm max-w-md mx-auto">
            Order a zero-commitment trial sample or subscribe to smallholder micro-lots fresh roasted in Lalitpur.
          </p>
        </div>
      </div>

      {/* 2. THE BEAN BOX / MISTOBOX "EXPERIENCE FORK" */}
      <div className="bg-[#EAE4D7] border-b border-[#DDD4C3] py-4 px-4 sticky top-16 z-30 shadow-xs">
        <div className="max-w-md mx-auto bg-white/70 backdrop-blur-md p-1.5 rounded-2xl flex gap-1.5 border border-[#DDD4C3]">
          <button
            type="button"
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
            
            {/* ========================================================
                EXPERIENCE A: 150g TRIAL PACK (ONE-TIME BUY FLOW)
               ======================================================== */}
            {experienceType === "trial" ? (
              <>
                {/* Trial Step 1: Origin */}
                <section id="trial-origin">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] uppercase tracking-widest font-bold text-[#A3432A]">
                      Step 01 • Choose Your 150g Trial Sample
                    </span>
                    <span className="text-xs font-semibold text-[#2E6B34]">
                      Single Purchase • No Subscription
                    </span>
                  </div>

                  {renderTasteMatcher()}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {ORIGINS.map((origin) => {
                      const isSelected = (bagCounts[origin.id] || 0) > 0;
                      const unitPrice = ORIGIN_PRICES[origin.id]["150g"];
                      const isMatched = matchedOriginId === origin.id;

                      return (
                        <div
                          key={origin.id}
                          onClick={() => handleOriginCardClick(origin.id)}
                          className={`group relative rounded-2xl border p-4 cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-white border-[#A3432A] shadow-md ring-2 ring-[#A3432A]" 
                              : isMatched
                              ? "bg-white/95 border-[#E58A1F] ring-2 ring-[#E58A1F]/40 shadow-xs"
                              : "bg-white/90 border-[#E6DEC8] hover:bg-white hover:border-[#C4B69E] shadow-xs"
                          }`}
                        >
                          <div className="w-full h-32 rounded-xl overflow-hidden mb-3 relative">
                            <img 
                              src={origin.img} 
                              alt={origin.name} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            />
                            <div className="absolute top-2 left-2 flex items-center gap-1">
                              <div className="bg-[#1A1512]/80 backdrop-blur-xs px-2 py-0.5 rounded text-[8px] font-bold uppercase text-white">
                                {origin.altitude}
                              </div>
                              {isMatched && (
                                <div className="bg-[#E58A1F] text-[#1A1512] px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                                  <Sparkles size={8} /> Match
                                </div>
                              )}
                            </div>
                            <div className="absolute top-2 right-2">
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

                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="text-sm font-serif font-bold text-[#1A1512]">{origin.name}</h3>
                            <span className="text-xs font-bold text-[#A3432A]">Rs. {unitPrice}</span>
                          </div>

                          <p className="text-[10px] uppercase font-bold text-[#8A7966] mb-3">
                            {origin.region}
                          </p>

                          <div className="space-y-1 pt-2 border-t border-[#F0EAE1]">
                            {origin.flavorTags.map((tag, idx) => (
                              <span key={idx} className="inline-block text-[10px] font-medium bg-[#FAF8F5] text-[#5C5042] px-2 py-0.5 rounded-md mr-1 mb-1">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Trial Step 2: Grind */}
                <section id="trial-grind">
                  <div className="mb-3">
                    <span className="text-[11px] uppercase tracking-widest font-bold text-[#A3432A]">
                      Step 02 • Select Grind Preparation
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {GRINDS.map((grind) => {
                      const isSelected = selectedGrind.id === grind.id;
                      return (
                        <div
                          key={grind.id}
                          onClick={() => setSelectedGrind(grind)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
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
                          <p className={`text-[10px] ${isSelected ? "text-[#A89F91]" : "text-[#8A7966]"}`}>
                            {grind.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            ) : (
              /* ========================================================
                  EXPERIENCE B: RECURRING ROASTERY SUBSCRIPTION FLOW
                 ======================================================== */
              <>
                {/* Step 1: Format & Origins */}
                <section id="step-origin">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] uppercase tracking-widest font-bold text-[#A3432A]">
                      Step 01 • Choose Format & Origins
                    </span>
                    {boxFormat.bags > 1 && (
                      <span className="text-[11px] font-bold text-[#2E6B34] flex items-center gap-1">
                        <Check size={12} className="stroke-[3]" /> {totalSelectedBags} of {boxFormat.bags} bags filled
                      </span>
                    )}
                  </div>

                  {/* Segmented Format Bar */}
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

                  {/* Bean Box Style Visual "Unboxing Slots" (For Duo Plans) */}
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

                      {/* 2 Visual Box Slots */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl p-3 flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#1A1512] text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] uppercase tracking-wider font-bold text-[#8A7966] block">Slot 1 ({activeSize.label})</span>
                            <strong className="text-xs font-serif text-[#1A1512] block truncate">
                              {slot1Origin ? slot1Origin.name : "Select Coffee"}
                            </strong>
                          </div>
                        </div>

                        <div className="bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl p-3 flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#1A1512] text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] uppercase tracking-wider font-bold text-[#8A7966] block">Slot 2 ({activeSize.label})</span>
                            <strong className="text-xs font-serif text-[#1A1512] block truncate">
                              {slot2Origin ? slot2Origin.name : "Select Coffee"}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Quick Switch Chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
                        <span className="text-[#8A7966] text-[10px] font-medium shrink-0">Quick pairings:</span>
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

                  {/* 15-Second Taste Matcher */}
                  {renderTasteMatcher()}

                  {/* Clean Origin Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {ORIGINS.map((origin) => {
                      const count = bagCounts[origin.id] || 0;
                      const isSelected = count > 0;
                      const unitPrice = ORIGIN_PRICES[origin.id][activeSize.id] || 1200;
                      const isMatched = matchedOriginId === origin.id;

                      return (
                        <div
                          key={origin.id}
                          onClick={() => handleOriginCardClick(origin.id)}
                          className={`group relative rounded-2xl border p-3.5 cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-white border-[#A3432A] shadow-md ring-2 ring-[#A3432A]" 
                              : isMatched
                              ? "bg-white/95 border-[#E58A1F] ring-2 ring-[#E58A1F]/40 shadow-xs"
                              : "bg-white/90 border-[#E6DEC8] hover:bg-white hover:border-[#C4B69E] shadow-xs"
                          }`}
                        >
                          <div className="w-full h-28 rounded-xl overflow-hidden mb-2.5 relative">
                            <img 
                              src={origin.img} 
                              alt={origin.name} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            />
                            <div className="absolute top-2 left-2 flex items-center gap-1">
                              <div className="bg-[#1A1512]/80 backdrop-blur-xs px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-white">
                                {origin.altitude}
                              </div>
                              {isMatched && (
                                <div className="bg-[#E58A1F] text-[#1A1512] px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                                  <Sparkles size={8} /> Match
                                </div>
                              )}
                            </div>

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

                          <div className="flex justify-between items-baseline mb-0.5">
                            <h3 className="text-sm font-serif font-bold text-[#1A1512]">{origin.name}</h3>
                            <span className="text-xs font-bold text-[#A3432A]">
                              Rs. {unitPrice}
                            </span>
                          </div>

                          <p className="text-[10px] uppercase font-bold text-[#8A7966] mb-2">
                            {origin.region}
                          </p>

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

                {/* Step 2: Grind Preparation */}
                <section id="step-grind">
                  <div className="mb-3">
                    <span className="text-[11px] uppercase tracking-widest font-bold text-[#A3432A]">
                      Step 02 • Select Grind Preparation
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {GRINDS.map((grind) => {
                      const isSelected = selectedGrind.id === grind.id;
                      return (
                        <div
                          key={grind.id}
                          onClick={() => setSelectedGrind(grind)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
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
                          <p className={`text-[10px] ${isSelected ? "text-[#A89F91]" : "text-[#8A7966]"}`}>
                            {grind.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Step 3: Bag Size */}
                <section id="step-size">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] uppercase tracking-widest font-bold text-[#A3432A]">
                      Step 03 • Select Bag Weight
                    </span>
                    <span className="text-xs text-[#8A7966] font-medium flex items-center gap-1">
                      <Scale size={12} /> {selectedSubSize.label} per bag
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SUBSCRIPTION_SIZES.map((size) => {
                      const isSelected = selectedSubSize.id === size.id;
                      const sampleSubtotal = ORIGINS.reduce((sum, o) => {
                        const count = bagCounts[o.id] || 0;
                        const p = ORIGIN_PRICES[o.id][size.id] || 1200;
                        return sum + (p * count);
                      }, 0);
                      const samplePrice = Math.round(sampleSubtotal * (1 - bundleDiscountPercent / 100));

                      return (
                        <div
                          key={size.id}
                          onClick={() => setSelectedSubSize(size)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                            isSelected 
                              ? "bg-[#1A1512] text-white border-[#1A1512] shadow-md ring-2 ring-[#A3432A]" 
                              : "bg-white border-[#E6DEC8] text-[#2C2420] hover:bg-[#FAF8F5]"
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
                            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-block mb-1 ${
                              isSelected ? "bg-white/10 text-[#E58A1F]" : "bg-[#F0EAE1] text-[#5C5042]"
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
                            Rs. {samplePrice} <span className="text-[9px] font-normal opacity-80">/mo</span>
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
                      Step 04 • Delivery & Billing Frequency
                    </span>
                  </div>

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
                </section>
              </>
            )}

          </div>

          {/* RIGHT COLUMN: Streamlined, Luxury Unboxing Manifest */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-white rounded-2xl border border-[#E6DEC8] shadow-lg p-5 sm:p-6">
              
              <div className="flex items-center justify-between pb-3.5 border-b border-[#F0EAE1] mb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#A3432A] block">
                    {experienceType === "trial" ? "Trial Discovery" : "Your Ritual"}
                  </span>
                  <h3 className="text-base font-serif font-bold text-[#1A1512]">
                    {experienceType === "trial" ? "Trial Pack Summary" : "Box Summary Preview"}
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
                  {experienceType === "trial" ? "150g Trial Sample" : boxFormat.name}
                </span>
                <span className="text-[10px] font-bold text-[#A3432A] bg-[#FAF5F2] px-2 py-0.5 rounded">
                  {activeSize.label} {experienceType === "trial" ? "Pack" : "/ Bag"}
                </span>
              </div>

              {/* Clean Coffee Items Preview */}
              <div className="space-y-2 mb-4">
                {selectedOriginsList.map((origin) => {
                  const bagCount = bagCounts[origin.id] || 0;
                  const unitPrice = ORIGIN_PRICES[origin.id][activeSize.id] || 1200;
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
                  <span className="text-[#8A7966]">Total Coffee:</span>
                  <strong className="text-[#1A1512] font-semibold">{totalWeightKg} kg ({totalSelectedBags}x {activeSize.label})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Frequency:</span>
                  <strong className="text-[#1A1512] font-semibold">
                    {experienceType === "trial" ? "One-Time Purchase" : selectedPlan.name}
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

                {bundleDiscountAmount > 0 && !isTrialMode && (
                  <div className="flex justify-between text-[#2E6B34]">
                    <span>{boxFormat.name} Perk ({bundleDiscountPercent}%):</span>
                    <span className="font-semibold">- Rs. {bundleDiscountAmount}</span>
                  </div>
                )}

                {!isTrialMode && planDiscountAmount > 0 && (
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
                    {isTrialMode || selectedPlan.months === 1 ? "Total Due:" : "Due Today:"}
                  </span>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1512]">
                      Rs. {totalDueToday}
                    </span>
                    {!isTrialMode && selectedPlan.months > 1 && (
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
              {totalSelectedBags !== (isTrialMode ? 1 : boxFormat.bags) ? (
                <div className="w-full py-3.5 rounded-xl bg-gray-300 text-gray-600 text-center uppercase tracking-widest text-xs font-bold cursor-not-allowed">
                  Select {boxFormat.bags - totalSelectedBags} more origin{boxFormat.bags - totalSelectedBags > 1 ? "s" : ""}
                </div>
              ) : (
                <Link 
                  href={`/checkout?origin=${primaryOriginId}&name=${encodeURIComponent(getBoxSummaryName())}&weight=${totalWeightKg}&price=${totalDueToday}&plan_id=${isTrialMode ? "TRIAL_ONETIME" : selectedPlan.id}&plan_name=${encodeURIComponent(isTrialMode ? "One-Time Trial Pack" : selectedPlan.name)}`}
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
                  <RotateCcw size={11} className="text-[#A3432A]" /> {isTrialMode ? "Trial Guarantee" : "Cancel Anytime"}
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
