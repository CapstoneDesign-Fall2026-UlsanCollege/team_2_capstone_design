"use client";

import { useState } from "react";
import Link from "next/link";
import { Coffee, Scale, CalendarDays, ChevronRight, Leaf } from "lucide-react";

const ORIGINS = [
  { id: 1, name: "Gulmi Reserve", price: 1200, desc: "Bright acidity with citrus notes." },
  { id: 2, name: "Ilam Estate", price: 1500, desc: "Smooth body with chocolate and caramel." },
  { id: 3, name: "Bharatpur Blend", price: 1100, desc: "Earthy and bold, perfect for espresso." },
];

const PLANS = [
  { id: "PAYG", name: "Pay-per-delivery", discount: 0 },
  { id: "3M", name: "3 Months", discount: 5 },
  { id: "6M", name: "6 Months", discount: 10 },
  { id: "12M", name: "12 Months", discount: 15 },
];

export default function Home() {
  const [selectedOrigin, setSelectedOrigin] = useState(ORIGINS[0]);
  const [selectedWeight, setSelectedWeight] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7] text-stone-900 pb-32 md:pb-0 font-sans selection:bg-amber-200">
      {/* Premium Hero Header */}
      <header className="relative bg-gradient-to-r from-amber-900 via-amber-800 to-orange-900 text-white py-16 md:py-24 overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-black/10 mix-blend-multiply"></div>
        <div className="absolute -top-24 -right-24 text-white/5 opacity-10">
          <Coffee size={400} />
        </div>
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Leaf className="text-amber-400" size={28} />
            <span className="text-amber-200 font-semibold tracking-widest uppercase text-sm">Team 2 Capstone</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 drop-shadow-md">
            BrewMellow<span className="text-amber-400">.</span>
          </h1>
          <p className="text-lg md:text-2xl text-amber-100 max-w-xl font-light leading-relaxed">
            Authentic Himalayan coffee, roasted to order and delivered directly to your door.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-6 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 relative -top-8 bg-white md:bg-transparent rounded-3xl md:rounded-none shadow-sm md:shadow-none">
        
        {/* Origin Selection */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b-2 border-amber-100 pb-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-900">
              <Coffee size={24} />
            </div>
            <h2 className="text-2xl font-bold text-stone-800">1. Choose Origin</h2>
          </div>
          <div className="space-y-4">
            {ORIGINS.map((origin) => (
              <label
                key={origin.id}
                className={`group flex flex-col md:flex-row md:items-center p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                  selectedOrigin.id === origin.id 
                    ? "border-amber-600 bg-amber-50/50 shadow-md transform scale-[1.02]" 
                    : "border-stone-100 bg-white hover:border-amber-300 hover:shadow-sm"
                }`}
              >
                <div className="flex-1 mb-2 md:mb-0">
                  <div className="font-bold text-lg text-stone-900 group-hover:text-amber-900 transition-colors">{origin.name}</div>
                  <div className="text-sm text-stone-500 mt-1 leading-relaxed">{origin.desc}</div>
                </div>
                <div className="md:text-right flex justify-between items-center md:block">
                  <div className={`font-bold text-lg transition-colors ${selectedOrigin.id === origin.id ? "text-amber-700" : "text-stone-700"}`}>
                    Rs. {origin.price} <span className="text-sm font-normal text-stone-400">/ kg</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="origin"
                  className="hidden"
                  checked={selectedOrigin.id === origin.id}
                  onChange={() => setSelectedOrigin(origin)}
                />
              </label>
            ))}
          </div>
        </section>

        {/* Right Column: Weight and Plan */}
        <div className="flex flex-col gap-10">
          
          {/* Weight Selection */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-amber-100 pb-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-900">
                <Scale size={24} />
              </div>
              <h2 className="text-2xl font-bold text-stone-800">2. Select Weight</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[0.5, 1, 2, 5].map((weight) => (
                <label
                  key={weight}
                  className={`flex items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedWeight === weight 
                      ? "border-amber-600 bg-amber-600 text-white font-bold shadow-md transform scale-[1.03]" 
                      : "border-stone-100 bg-white text-stone-700 hover:border-amber-300 hover:bg-amber-50"
                  }`}
                >
                  <span className="text-lg">{weight} kg</span>
                  <input
                    type="radio"
                    name="weight"
                    className="hidden"
                    checked={selectedWeight === weight}
                    onChange={() => setSelectedWeight(weight)}
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Plan Selection */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-amber-100 pb-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-900">
                <CalendarDays size={24} />
              </div>
              <h2 className="text-2xl font-bold text-stone-800">3. Delivery Plan</h2>
            </div>
            <div className="space-y-4">
              {PLANS.map((plan) => {
                const discountedPrice = selectedOrigin.price * selectedWeight * (1 - plan.discount / 100);
                return (
                  <label
                    key={plan.id}
                    className={`group flex flex-col md:flex-row md:items-center p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedPlan.id === plan.id 
                        ? "border-amber-600 bg-amber-50/50 shadow-md transform scale-[1.02]" 
                        : "border-stone-100 bg-white hover:border-amber-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex-1 mb-2 md:mb-0">
                      <div className="font-bold text-lg text-stone-900 group-hover:text-amber-900 transition-colors">{plan.name}</div>
                      {plan.discount > 0 && (
                        <div className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md mt-2">
                          SAVE {plan.discount}%
                        </div>
                      )}
                    </div>
                    <div className="md:text-right flex justify-between items-center md:block mt-2 md:mt-0">
                      <div className={`font-black text-xl transition-colors ${selectedPlan.id === plan.id ? "text-amber-700" : "text-stone-700"}`}>
                        Rs. {discountedPrice}
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="plan"
                      className="hidden"
                      checked={selectedPlan.id === plan.id}
                      onChange={() => setSelectedPlan(plan)}
                    />
                  </label>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* Glassmorphism Bottom Action Bar */}
      <div className="fixed md:sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-stone-200/50 p-5 md:p-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex justify-between items-center w-full md:w-auto md:gap-6">
            <span className="text-stone-500 font-semibold uppercase tracking-wider text-sm md:text-base">Order Total</span>
            <span className="text-3xl md:text-4xl font-black text-amber-900 drop-shadow-sm">
              Rs. {selectedOrigin.price * selectedWeight * (1 - selectedPlan.discount / 100)}
            </span>
          </div>
          <Link 
            href="/checkout"
            className="group flex items-center justify-center gap-2 w-full md:w-auto px-10 bg-amber-900 hover:bg-amber-800 active:bg-amber-950 text-white py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
          >
            Continue to Checkout
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
