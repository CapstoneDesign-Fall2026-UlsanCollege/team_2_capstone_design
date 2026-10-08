"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Coffee, Star } from "lucide-react";

const origins = [
  {
    id: 1,
    name: "Gulmi Reserve",
    region: "Gulmi, Western Nepal",
    altitude: "1,400 – 1,800m",
    process: "Washed",
    flavor: "Citrus, Honey, Dark Chocolate",
    description:
      "Hand-picked from the misty hills of Gulmi district, these beans develop a bright citrus acidity balanced by a lingering honey sweetness.",
    price_per_kg: 1200,
  },
  {
    id: 2,
    name: "Ilam Gold",
    region: "Ilam, Eastern Nepal",
    altitude: "1,500 – 2,000m",
    process: "Natural",
    flavor: "Berry, Jasmine, Caramel",
    description:
      "Grown in Nepal's premier tea-and-coffee belt, Ilam Gold is sun-dried to intensify its berry-forward profile and floral aroma.",
    price_per_kg: 1400,
  },
  {
    id: 3,
    name: "Nuwakot Heritage",
    region: "Nuwakot, Central Nepal",
    altitude: "1,200 – 1,600m",
    process: "Honey",
    flavor: "Walnut, Brown Sugar, Plum",
    description:
      "A heritage cultivar from the foothills north of Kathmandu. The honey process gives it a velvety body with nutty, brown-sugar depth.",
    price_per_kg: 1100,
  },
];

export default function OriginsPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EB] font-sans">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#8A7966] hover:text-[#2C2420] transition-colors mb-8 text-sm uppercase tracking-widest font-bold"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1A1512] mb-3">
          Select Your Origin
        </h1>
        <p className="text-[#8A7966] text-sm uppercase tracking-widest font-bold">
          Single-origin Nepali beans — roasted to order
        </p>
      </div>

      {/* Origin Cards */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {origins.map((origin) => (
            <div
              key={origin.id}
              className="bg-white border border-[#E6DEC8] shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Color band */}
              <div className="h-2 bg-[#2C2420]" />

              <div className="p-6 flex flex-col flex-1">
                {/* Name & Region */}
                <h2 className="text-2xl font-serif font-bold text-[#1A1512] mb-1">
                  {origin.name}
                </h2>
                <div className="flex items-center gap-1 text-[#8A7966] text-xs uppercase tracking-widest mb-4">
                  <MapPin size={12} />
                  {origin.region}
                </div>

                {/* Description */}
                <p className="text-[#5C5042] text-sm leading-relaxed mb-6">
                  {origin.description}
                </p>

                {/* Details */}
                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex justify-between text-[#5C5042] uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      <Coffee size={12} /> Process
                    </span>
                    <span className="font-bold text-[#1A1512]">
                      {origin.process}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#5C5042] uppercase tracking-wide">
                    <span>Altitude</span>
                    <span className="font-bold text-[#1A1512]">
                      {origin.altitude}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#5C5042] uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      <Star size={12} /> Flavor
                    </span>
                    <span className="font-bold text-[#1A1512]">
                      {origin.flavor}
                    </span>
                  </div>
                </div>

                {/* Price & CTA */}
                <div className="mt-auto">
                  <div className="border-t border-[#E6DEC8] pt-4 mb-4">
                    <div className="flex justify-between items-end">
                      <span className="text-[#8A7966] text-xs uppercase tracking-widest font-bold">
                        Per kg
                      </span>
                      <span className="text-2xl font-serif text-[#1A1512]">
                        Rs. {origin.price_per_kg}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="block w-full bg-[#2C2420] text-white py-3 text-center text-sm uppercase tracking-widest font-bold hover:bg-[#1A1512] transition-colors"
                  >
                    Select Origin
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
