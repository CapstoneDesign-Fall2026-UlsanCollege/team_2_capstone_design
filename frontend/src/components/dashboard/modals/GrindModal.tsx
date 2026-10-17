"use client";

import { X } from "lucide-react";

interface GrindModalProps {
  isOpen: boolean;
  grindType: string;
  onClose: () => void;
  onSelectGrind: (grind: string) => void;
}

export default function GrindModal({
  isOpen,
  grindType,
  onClose,
  onSelectGrind,
}: GrindModalProps) {
  if (!isOpen) return null;

  const grinds = [
    { name: "Whole Bean", desc: "For home burr grinders • Retains peak aroma longest" },
    { name: "Espresso (Fine)", desc: "Tailored for manual espresso & moka pots" },
    { name: "Pour-Over (Medium)", desc: "Optimized for V60, Chemex, and drip machines" },
    { name: "French Press (Coarse)", desc: "Coarse ground for cold brew & French press" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full border border-[#E6DEC8] p-8 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-serif font-bold text-[#1A1512]">Customize Grind Profile</h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-[#8A7966] hover:text-[#1A1512] cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        <p className="text-xs text-[#5C5042] mb-6 leading-relaxed">
          Choose how you want your Himalayan beans prepared for your upcoming monthly roast:
        </p>

        <div className="space-y-3 mb-6">
          {grinds.map((g) => (
            <div 
              key={g.name}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectGrind(g.name);
                }
              }}
              onClick={() => onSelectGrind(g.name)}
              className={`flex items-start justify-between p-3.5 border rounded-xl cursor-pointer transition-colors ${
                grindType === g.name 
                  ? "border-[#A3432A] bg-[#FAF5F2]" 
                  : "border-[#E6DEC8] hover:bg-[#FAF8F5]"
              }`}
            >
              <div>
                <span className="text-xs font-bold text-[#1A1512] block">{g.name}</span>
                <span className="text-[11px] text-[#8A7966]">{g.desc}</span>
              </div>
              <span
                className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center shrink-0 mt-0.5 ${
                  grindType === g.name
                    ? "bg-green-500 border-green-500 ring-2 ring-green-500/20"
                    : "border-[#C8BFAB] bg-transparent"
                }`}
              >
                {grindType === g.name && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-[#1A1512] text-white py-3.5 text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors rounded-xl cursor-pointer"
        >
          Save Grind Preferences
        </button>
      </div>
    </div>
  );
}
