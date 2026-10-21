"use client";

import { useState } from "react";
import { Check, SlidersHorizontal, ArrowRight, RotateCcw, X } from "lucide-react";
import { OriginItem } from "./OriginCard";

interface TasteMatcherProps {
  origins: OriginItem[];
  matchedOriginId: number | null;
  onApplyMatch: (matchedOrigin: OriginItem) => void;
}

export default function TasteMatcher({
  origins,
  matchedOriginId,
  onApplyMatch,
}: TasteMatcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [quizStep, setQuizStep] = useState<1 | 2 | 3>(1);
  const [quizBrew, setQuizBrew] = useState<string | null>(null);
  const [quizFlavor, setQuizFlavor] = useState<string | null>(null);

  const matchedOrigin = origins.find((o) => o.id === matchedOriginId);

  const calculateMatch = (): OriginItem => {
    if (quizFlavor === "fruity") return origins.find((o) => o.id === 2) || origins[1]; // Ilam Gold
    if (quizFlavor === "chocolate") return origins.find((o) => o.id === 3) || origins[2]; // Nuwakot Heritage
    return origins.find((o) => o.id === 1) || origins[0]; // Gulmi Reserve
  };

  const getMatchRationale = (originId: number) => {
    if (originId === 2) {
      return "Based on your preference for vibrant fruit and floral notes, Ilam Gold's high-altitude natural process at 1,800m delivers sparkling berry and jasmine aromatics.";
    }
    if (originId === 3) {
      return "Based on your taste for deep chocolate and rich body, Nuwakot Heritage is roasted to deliver a thick, syrupy cup with toasted walnut and dark molasses that never gets lost in milk.";
    }
    return "Based on your preference for a balanced, sweet cup, Gulmi Reserve is Nepal's historic specialty benchmark with silky mountain honey and citrus blossom.";
  };

  const handleSelectFlavor = (flavorId: string) => {
    setQuizFlavor(flavorId);
    setQuizStep(3);
  };

  const handleApply = () => {
    const match = calculateMatch();
    onApplyMatch(match);
    setIsOpen(false);
  };

  return (
    <div className="mb-4">
      {/* Roastery Cupping Calibrator Trigger */}
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="15-second coffee cupping taste calibrator"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && quizStep === 3) setQuizStep(1);
        }}
        className={`w-full min-h-[48px] rounded-xl py-3 px-4 flex items-center justify-between text-xs transition-all border cursor-pointer active:scale-[0.99] ${
          matchedOrigin
            ? "bg-[#FAF5EC] border-[#A3432A]/40 text-[#1A1512]"
            : "bg-white hover:bg-[#FAF8F5] border-[#E6DEC8] text-[#1A1512] shadow-xs"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E6DEC8] flex items-center justify-center text-[#A3432A] shrink-0">
            <SlidersHorizontal size={15} />
          </span>
          <div className="text-left">
            <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#1A1512] block">
              {matchedOrigin
                ? `Matched Terroir: ${matchedOrigin.name}`
                : "Cup Profile Matcher // 15-Second Calibration"}
            </span>
            <span className="font-mono text-xs text-[#5C5042] block">
              {matchedOrigin
                ? "Calibrated to your preferred brewing style and cup notes"
                : "Determine your ideal Himalayan micro-lot by brew method & flavor note"}
            </span>
          </div>
        </div>
        <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#A3432A] shrink-0 ml-3 flex items-center gap-1.5">
          {isOpen ? (
            <>
              <span>Close</span>
              <X size={14} />
            </>
          ) : matchedOrigin ? (
            <>
              <span>Recalibrate</span>
              <RotateCcw size={13} />
            </>
          ) : (
            <>
              <span>Calibrate</span>
              <ArrowRight size={13} />
            </>
          )}
        </span>
      </button>

      {/* Expanded Calibrator Panel */}
      {isOpen && (
        <div className="mt-3 bg-white border border-[#E6DEC8] rounded-xl p-5 shadow-sm animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#F0EAE1]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#1A1512] text-white font-mono text-xs font-bold flex items-center justify-center">
                {quizStep === 3 ? "✓" : quizStep}
              </span>
              <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#1A1512]">
                {quizStep === 1 && "Stage 01 // Extraction & Milk Preparation"}
                {quizStep === 2 && "Stage 02 // Primary Flavor Note Alignment"}
                {quizStep === 3 && "Stage 03 // Cupping Calibration Result"}
              </span>
            </div>
            <span className="font-mono text-xs uppercase font-bold text-[#A3432A] tracking-wider">
              Roastery Protocol
            </span>
          </div>

          {/* Step 1: Brew Method */}
          {quizStep === 1 && (
            <div>
              <p className="font-mono text-xs text-[#5C5042] mb-3">
                Select your primary brew style to determine optimal roast density and body:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: "black",
                    label: "Black & Pure",
                    sub: "Drip, Pour-Over, Chemex, Americano",
                    desc: "High clarity, crisp elevation acidity, pristine wash profile.",
                  },
                  {
                    id: "milk",
                    label: "With Milk & Steam",
                    sub: "Latte, Flat White, Moka Pot",
                    desc: "Thick body, deep caramelized sugars that cut through dairy.",
                  },
                  {
                    id: "coldbrew",
                    label: "Cold Brew & Chilled",
                    sub: "Immersion, Slow Drip, Iced",
                    desc: "Sweet fruit aromatics, low perceived bitterness, high syrup.",
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setQuizBrew(opt.id);
                      setQuizStep(2);
                    }}
                    className={`min-h-[72px] p-3.5 rounded-xl border text-left transition-all hover:border-[#A3432A] active:scale-[0.99] cursor-pointer ${
                      quizBrew === opt.id
                        ? "bg-[#FAF5EC] border-[#A3432A]"
                        : "bg-[#FAF8F5] border-[#E6DEC8]"
                    }`}
                  >
                    <span className="font-mono font-bold text-xs uppercase tracking-wider text-[#1A1512] block mb-1">
                      {opt.label}
                    </span>
                    <span className="font-mono text-xs text-[#A3432A] font-semibold block mb-1">
                      {opt.sub}
                    </span>
                    <span className="text-xs text-[#5C5042] block leading-relaxed">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Flavor Profile */}
          {quizStep === 2 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-xs text-[#5C5042]">
                  Select the flavor spectrum that aligns with your sensory preference:
                </p>
                <button
                  type="button"
                  onClick={() => setQuizStep(1)}
                  className="font-mono text-xs text-[#8A7966] hover:text-[#1A1512] font-semibold cursor-pointer"
                >
                  ← Stage 01
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: "fruity",
                    label: "Bright & Wild Berry",
                    tags: "Wild Berry • White Jasmine • Floral",
                    desc: "Vibrant terroir acidity, sun-dried natural process on bamboo beds.",
                  },
                  {
                    id: "balanced",
                    label: "Balanced Mountain Honey",
                    tags: "Mountain Honey • Citrus Blossom • Cacao",
                    desc: "Silky sweetness, sparkling spring-water wash, everyday benchmark.",
                  },
                  {
                    id: "chocolate",
                    label: "Deep Chocolate & Walnut",
                    tags: "Toasted Walnut • Dark Molasses • Plum",
                    desc: "Low perceived acidity, heavy rounded mouthfeel, honey processed.",
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectFlavor(opt.id)}
                    className={`min-h-[72px] p-3.5 rounded-xl border text-left transition-all hover:border-[#A3432A] active:scale-[0.99] cursor-pointer ${
                      quizFlavor === opt.id
                        ? "bg-[#FAF5EC] border-[#A3432A]"
                        : "bg-[#FAF8F5] border-[#E6DEC8]"
                    }`}
                  >
                    <span className="font-mono font-bold text-xs uppercase tracking-wider text-[#1A1512] block mb-1">
                      {opt.label}
                    </span>
                    <span className="font-mono text-xs text-[#A3432A] font-semibold block mb-1">
                      {opt.tags}
                    </span>
                    <span className="text-xs text-[#5C5042] block leading-relaxed">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Match Result */}
          {quizStep === 3 && (
            <div>
              {(() => {
                const match = calculateMatch();
                return (
                  <div className="flex flex-col sm:flex-row items-center gap-5 bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl p-5">
                    <img
                      src={match.img}
                      alt={match.name}
                      className="w-24 h-24 rounded-lg object-cover shrink-0 border border-[#E6DEC8]"
                    />
                    <div className="flex-1 text-center sm:text-left">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#E7F3E8] border border-[#C3E4C6] text-[#2E6B34] font-mono text-xs font-bold uppercase tracking-wider mb-1.5">
                        <Check size={12} className="stroke-[3]" /> Calibrated Terroir Match
                      </div>
                      <h4 className="text-lg font-serif font-bold text-[#1A1512]">
                        {match.name} <span className="font-mono text-xs text-[#5C5042] font-semibold">({match.score})</span>
                      </h4>
                      <p className="font-mono text-xs text-[#A3432A] font-bold mb-1.5">{match.notes}</p>
                      <p className="text-xs text-[#5C5042] leading-relaxed mb-4">
                        {getMatchRationale(match.id)}
                      </p>
                      <div className="flex items-center gap-3 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={handleApply}
                          className="min-h-[44px] bg-[#1A1512] hover:bg-[#2C2420] text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-xs transition-transform active:scale-[0.99] flex items-center gap-2 cursor-pointer"
                        >
                          <Check size={14} className="text-green-400 stroke-[3]" />
                          Apply {match.name} to Box
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQuizStep(1);
                            setQuizBrew(null);
                            setQuizFlavor(null);
                          }}
                          className="min-h-[44px] font-mono text-xs text-[#5C5042] hover:text-[#1A1512] py-2 px-3 font-semibold cursor-pointer"
                        >
                          ↺ Recalibrate
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
}
