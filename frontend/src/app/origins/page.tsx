"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Coffee, Star, ChevronRight, Package } from "lucide-react";

const origins = [
  {
    id: 1,
    name: "Gulmi Reserve",
    region: "Gulmi, Western Nepal",
    altitude: "1,400 – 1,800m",
    process: "Washed",
    flavor: "Citrus · Honey · Dark Chocolate",
    description:
      "Hand-picked from the misty hills of Gulmi district. Bright citrus acidity balanced by a lingering honey sweetness.",
    price_per_kg: 1200,
  },
  {
    id: 2,
    name: "Ilam Gold",
    region: "Ilam, Eastern Nepal",
    altitude: "1,500 – 2,000m",
    process: "Natural",
    flavor: "Berry · Jasmine · Caramel",
    description:
      "Grown in Nepal's premier tea-and-coffee belt. Sun-dried to intensify its berry-forward profile and floral aroma.",
    price_per_kg: 1400,
  },
  {
    id: 3,
    name: "Nuwakot Heritage",
    region: "Nuwakot, Central Nepal",
    altitude: "1,200 – 1,600m",
    process: "Honey",
    flavor: "Walnut · Brown Sugar · Plum",
    description:
      "A heritage cultivar from the foothills north of Kathmandu. Velvety body with nutty, brown-sugar depth.",
    price_per_kg: 1100,
  },
];

const weights = [0.5, 1, 2];

export default function OriginsPage() {
  const [selectedOrigin, setSelectedOrigin] = useState(origins[0]);
  const [selectedWeight, setSelectedWeight] = useState(1);

  const total = selectedOrigin.price_per_kg * selectedWeight;

  return (
    <div className="min-h-screen bg-[#F5F2EB] font-sans pb-32">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#8A7966] hover:text-[#2C2420] transition-colors mb-8 text-sm uppercase tracking-widest font-bold"
        >
          <ArrowLeft size={16} /> Home
        </Link>

        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1A1512] mb-2">
          Choose Your Beans
        </h1>
        <p className="text-[#5C5042] text-sm">
          Single-origin Nepali coffee, roasted to order and delivered to your door.
        </p>
      </div>

      {/* Origin Cards */}
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-xs uppercase tracking-widest text-[#8A7966] font-bold mb-4">
          01. Select Origin
        </h2>
        <div className="space-y-3">
          {origins.map((origin) => {
            const isSelected = selectedOrigin.id === origin.id;
            return (
              <button
                key={origin.id}
                onClick={() => setSelectedOrigin(origin)}
                className={`w-full text-left p-6 transition-all ${
                  isSelected
                    ? "bg-[#2C2420] text-[#F5F2EB]"
                    : "bg-white text-[#2C2420] hover:bg-[#EAE4D3] border border-[#E6DEC8]"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className={`text-xl font-serif font-bold ${isSelected ? "text-white" : "text-[#1A1512]"}`}>
                      {origin.name}
                    </div>
                    <div className={`flex items-center gap-1 text-xs uppercase tracking-widest mt-1 ${isSelected ? "text-[#A89F91]" : "text-[#8A7966]"}`}>
                      <MapPin size={11} /> {origin.region} · {origin.altitude}
                    </div>
                  </div>
                  <div className={`text-xl font-serif ${isSelected ? "text-[#D3C7B1]" : "text-[#1A1512]"}`}>
                    Rs. {origin.price_per_kg}<span className="text-xs">/kg</span>
                  </div>
                </div>

                <p className={`text-sm mb-3 ${isSelected ? "text-[#C4BDB0]" : "text-[#5C5042]"}`}>
                  {origin.description}
                </p>

                <div className={`flex gap-4 text-xs uppercase tracking-wider ${isSelected ? "text-[#A89F91]" : "text-[#8A7966]"}`}>
                  <span className="flex items-center gap-1"><Coffee size={11} /> {origin.process}</span>
                  <span className="flex items-center gap-1"><Star size={11} /> {origin.flavor}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weight Selection */}
      <div className="max-w-4xl mx-auto px-6 mt-10">
        <h2 className="text-xs uppercase tracking-widest text-[#8A7966] font-bold mb-4">
          02. Select Weight
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {weights.map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWeight(w)}
              className={`py-4 text-center transition-all flex flex-col items-center gap-1 ${
                selectedWeight === w
                  ? "bg-[#2C2420] text-[#F5F2EB] font-bold"
                  : "bg-white text-[#5C5042] hover:bg-[#EAE4D3] border border-[#E6DEC8]"
              }`}
            >
              <Package size={16} />
              <span>{w} kg</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E6DEC8] p-5 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <div className="text-xs text-[#8A7966] uppercase tracking-widest font-bold">
              {selectedOrigin.name} · {selectedWeight} kg
            </div>
            <div className="text-2xl font-serif text-[#1A1512]">
              Rs. {total}
            </div>
          </div>
          <Link
            href={`/checkout?origin=${selectedOrigin.id}&name=${encodeURIComponent(selectedOrigin.name)}&weight=${selectedWeight}&price=${total}`}
            className="px-10 py-4 bg-[#A3432A] hover:bg-[#8A3722] text-white uppercase tracking-widest text-sm font-bold transition-colors flex items-center gap-2"
          >
            Checkout <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
