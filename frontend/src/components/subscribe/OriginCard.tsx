"use client";

import { Sparkles } from "lucide-react";

export interface OriginItem {
  id: number;
  name: string;
  region: string;
  altitude: string;
  score: string;
  process: string;
  flavorTags: string[];
  notes: string;
  img: string;
}

interface OriginCardProps {
  origin: OriginItem;
  count: number;
  unitPrice: number;
  isMatched?: boolean;
  onClick: () => void;
  compact?: boolean;
}

export default function OriginCard({
  origin,
  count,
  unitPrice,
  isMatched,
  onClick,
  compact = false,
}: OriginCardProps) {
  const isSelected = count > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${origin.name}, ${origin.region}, NPR ${unitPrice}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      onClick={onClick}
      className={`group relative rounded-2xl border cursor-pointer transition-all active:scale-[0.99] focus:outline-hidden focus:ring-2 focus:ring-[#A3432A] ${
        compact ? "p-3.5" : "p-4"
      } ${
        isSelected
          ? "bg-white border-[#1A1512] shadow-md ring-2 ring-[#1A1512]/15"
          : isMatched
          ? "bg-white border-[#E58A1F] ring-2 ring-[#E58A1F]/30 shadow-xs"
          : "bg-white border-[#E6DEC8] hover:bg-[#FAF8F5] hover:border-[#1A1512]/30 shadow-xs"
      }`}
    >
      {/* Image & Badges */}
      <div
        className={`w-full rounded-xl overflow-hidden relative ${
          compact ? "h-28 mb-3" : "h-36 mb-3.5"
        }`}
      >
        <img
          src={origin.img}
          alt={`${origin.name} micro-lot`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <div className="bg-[#1A1512]/90 backdrop-blur-xs px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase text-[#F5F2EB]">
            {origin.altitude}
          </div>
          {isMatched && (
            <div className="bg-[#E58A1F] text-[#1A1512] px-2 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Sparkles size={11} /> Match
            </div>
          )}
        </div>

        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          {count > 1 && (
            <span className="px-2 py-0.5 rounded-full bg-[#1A1512] text-white text-xs font-mono font-bold shadow-xs">
              {count}x
            </span>
          )}
          <span
            className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center shadow-xs ${
              isSelected
                ? "bg-green-500 border-green-500 ring-2 ring-green-500/20"
                : "border-white/80 bg-black/50"
            }`}
          >
            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
          </span>
        </div>
      </div>

      {/* Title & Unit Price */}
      <div className="flex justify-between items-baseline mb-1">
        <h3 className="text-base font-serif font-bold text-[#1A1512]">{origin.name}</h3>
        <span className="text-sm font-mono font-bold text-[#A3432A]">Rs. {unitPrice}</span>
      </div>

      <div className="flex items-center justify-between font-mono text-xs text-[#5C5042] mb-3">
        <span>{origin.region}</span>
        <span className="text-[#2E6B34] font-semibold">{origin.score}</span>
      </div>

      {/* Flavor Notes Chips */}
      <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-[#F0EAE1]">
        {origin.flavorTags.map((tag, idx) => (
          <span
            key={idx}
            className="text-xs font-medium bg-[#FAF8F5] text-[#5C5042] border border-[#E6DEC8] px-2.5 py-0.5 rounded-md"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
