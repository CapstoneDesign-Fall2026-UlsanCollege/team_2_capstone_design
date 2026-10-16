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
      className={`group relative rounded-2xl border cursor-pointer transition-all focus:outline-hidden focus:ring-2 focus:ring-[#A3432A] ${
        compact ? "p-3.5" : "p-4"
      } ${
        isSelected
          ? "bg-white border-[#A3432A] shadow-md ring-2 ring-[#A3432A]"
          : isMatched
          ? "bg-white/95 border-[#E58A1F] ring-2 ring-[#E58A1F]/40 shadow-xs"
          : "bg-white/90 border-[#E6DEC8] hover:bg-white hover:border-[#C4B69E] shadow-xs"
      }`}
    >
      {/* Image & Badges */}
      <div
        className={`w-full rounded-xl overflow-hidden relative ${
          compact ? "h-28 mb-2.5" : "h-32 mb-3"
        }`}
      >
        <img
          src={origin.img}
          alt={`${origin.name} harvest beans`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <div className="bg-[#1A1512]/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white">
            {origin.altitude}
          </div>
          {isMatched && (
            <div className="bg-[#E58A1F] text-[#1A1512] px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Sparkles size={10} /> Match
            </div>
          )}
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-1">
          {count > 1 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#1A1512] text-white text-[10px] font-bold shadow-xs">
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

      {/* Title & Unit Price */}
      <div className="flex justify-between items-baseline mb-1">
        <h3 className="text-sm font-serif font-bold text-[#1A1512]">{origin.name}</h3>
        <span className="text-xs font-bold text-[#A3432A]">Rs. {unitPrice}</span>
      </div>

      <p className="text-[11px] uppercase font-bold text-[#8A7966] mb-2.5">
        {origin.region}
      </p>

      {/* Flavor Tags */}
      <div className="flex flex-wrap gap-1 pt-2 border-t border-[#F0EAE1]">
        {origin.flavorTags.map((tag, idx) => (
          <span
            key={idx}
            className="text-[10px] font-medium bg-[#FAF8F5] text-[#5C5042] border border-[#E6DEC8]/60 px-2 py-0.5 rounded-md"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
