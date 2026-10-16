"use client";

import { useState } from "react";
import { Sparkles, Check } from "lucide-react";
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
      {/* Sleek Trigger Pill */}
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="15-second coffee taste matcher"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && quizStep === 3) setQuizStep(1);
        }}
        className={`w-full rounded-2xl py-2.5 px-3.5 sm:px-4 flex items-center justify-between text-xs transition-all border ${
          matchedOrigin
            ? "bg-[#FAF5EC] border-[#E58A1F]/50 text-[#1A1512]"
            : "bg-white/80 hover:bg-white border-[#DDD4C3] hover:border-[#A3432A]/40 text-[#1A1512] shadow-xs"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`p-1.5 rounded-lg ${
              matchedOrigin ? "bg-[#E58A1F] text-white" : "bg-[#E58A1F]/15 text-[#A3432A]"
            }`}
          >
            <Sparkles size={14} />
          </span>
          <div className="text-left">
            <span className="font-bold text-[#1A1512] block">
              {matchedOrigin
                ? `Matched for You: ${matchedOrigin.name}`
                : "Not sure which Himalayan roast fits your taste?"}
            </span>
            <span className="text-[11px] text-[#8A7966] block">
              {matchedOrigin
                ? "Click to retake the 15-second taste questionnaire"
                : "Take our 15-second taste matcher to pick your bean"}
            </span>
          </div>
        </div>
        <span className="text-xs font-bold text-[#A3432A] shrink-0 ml-2">
          {isOpen ? "Close ✕" : matchedOrigin ? "Retake ↺" : "Find My Bean →"}
        </span>
      </button>

      {/* Expanded Matcher Panel */}
      {isOpen && (
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
              <p className="text-xs text-[#8A7966] mb-3">
                Select your primary style to match the optimal bean body and roast profile:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: "black",
                    label: "Black & Pure",
                    sub: "Drip, Pour-Over, Chemex, Americano",
                    desc: "Aromatic clarity & clean mountain acidity",
                  },
                  {
                    id: "milk",
                    label: "With Milk & Steam",
                    sub: "Latte, Cappuccino, Flat White",
                    desc: "Bold body that cuts through steamed milk",
                  },
                  {
                    id: "coldbrew",
                    label: "Cold Brew & Chilled",
                    sub: "Chilled extraction, sweet & smooth",
                    desc: "Sweet fruit notes & low bitterness",
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setQuizBrew(opt.id);
                      setQuizStep(2);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all hover:border-[#A3432A] ${
                      quizBrew === opt.id
                        ? "bg-[#FAF5EC] border-[#A3432A]"
                        : "bg-[#FAF8F5] border-[#E6DEC8]"
                    }`}
                  >
                    <span className="font-bold text-xs text-[#1A1512] block mb-0.5">
                      {opt.label}
                    </span>
                    <span className="text-[11px] text-[#A3432A] font-semibold block mb-1">
                      {opt.sub}
                    </span>
                    <span className="text-[10px] text-[#8A7966] block">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Flavor Profile */}
          {quizStep === 2 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[#8A7966]">
                  What flavor notes excite your tastebuds most?
                </p>
                <button
                  type="button"
                  onClick={() => setQuizStep(1)}
                  className="text-xs text-[#8A7966] hover:text-[#1A1512] font-semibold"
                >
                  ← Back
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: "fruity",
                    label: "Bright & Wild Berry",
                    tags: "Wild Berry • Jasmine • Floral",
                    desc: "Vibrant mountain acidity, natural process",
                  },
                  {
                    id: "balanced",
                    label: "Balanced Mountain Honey",
                    tags: "Mountain Honey • Blossom • Dark Choc",
                    desc: "Silky balance, smooth mouthfeel, everyday ritual",
                  },
                  {
                    id: "chocolate",
                    label: "Deep Chocolate & Walnut",
                    tags: "Toasted Walnut • Molasses • Plum",
                    desc: "Low acidity, comforting nutty cocoa sweetness",
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectFlavor(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all hover:border-[#A3432A] ${
                      quizFlavor === opt.id
                        ? "bg-[#FAF5EC] border-[#A3432A]"
                        : "bg-[#FAF8F5] border-[#E6DEC8]"
                    }`}
                  >
                    <span className="font-bold text-xs text-[#1A1512] block mb-0.5">
                      {opt.label}
                    </span>
                    <span className="text-[11px] text-[#A3432A] font-semibold block mb-1">
                      {opt.tags}
                    </span>
                    <span className="text-[10px] text-[#8A7966] block">{opt.desc}</span>
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
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#FAF5EC] border border-[#E58A1F]/30 rounded-xl p-4">
                    <img
                      src={match.img}
                      alt={match.name}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-xs border border-[#E6DEC8]"
                    />
                    <div className="flex-1 text-center sm:text-left">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#E58A1F]/20 text-[#1A1512] text-[10px] font-black uppercase tracking-wider mb-1">
                        <Sparkles size={11} className="text-[#A3432A]" /> Perfect Match Found
                      </div>
                      <h4 className="text-base font-serif font-bold text-[#1A1512]">
                        {match.name} ({match.score})
                      </h4>
                      <p className="text-xs text-[#A3432A] font-bold mb-1">{match.notes}</p>
                      <p className="text-xs text-[#5C5042] leading-relaxed mb-3">
                        {getMatchRationale(match.id)}
                      </p>
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={handleApply}
                          className="bg-[#1A1512] hover:bg-black text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
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
}
