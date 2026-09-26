"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900 pb-24 md:pb-0">
      {/* App Header */}
      <header className="bg-amber-900 text-white py-8 md:py-12 shadow-md">
        <div className="max-w-5xl mx-auto px-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-wide mb-2">BrewMellow</h1>
            <p className="text-sm md:text-xl text-amber-100">The Himalayan Coffee Subscription</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-6 md:py-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Origin Selection */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-stone-800 mb-6 border-b-2 border-stone-200 pb-2">1. Choose your origin</h2>
          <div className="space-y-4">
            {ORIGINS.map((origin) => (
              <label
                key={origin.id}
                className={`flex flex-col md:flex-row md:items-center p-5 rounded-2xl border-2 cursor-pointer transition-all shadow-sm ${
                  selectedOrigin.id === origin.id ? "border-amber-600 bg-amber-50" : "border-stone-200 bg-white hover:border-amber-300"
                }`}
              >
                <div className="flex-1 mb-2 md:mb-0">
                  <div className="font-bold text-lg">{origin.name}</div>
                  <div className="text-sm text-stone-500 mt-1">{origin.desc}</div>
                </div>
                <div className="md:text-right flex justify-between items-center md:block">
                  <div className="font-bold text-amber-800 text-lg">Rs. {origin.price} / kg</div>
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

        {/* Plan Selection */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-stone-800 mb-6 border-b-2 border-stone-200 pb-2">2. Choose your plan</h2>
          <div className="space-y-4">
            {PLANS.map((plan) => {
              const discountedPrice = selectedOrigin.price * (1 - plan.discount / 100);
              return (
                <label
                  key={plan.id}
                  className={`flex flex-col md:flex-row md:items-center p-5 rounded-2xl border-2 cursor-pointer transition-all shadow-sm ${
                    selectedPlan.id === plan.id ? "border-amber-600 bg-amber-50" : "border-stone-200 bg-white hover:border-amber-300"
                  }`}
                >
                  <div className="flex-1 mb-2 md:mb-0">
                    <div className="font-bold text-lg">{plan.name}</div>
                    {plan.discount > 0 && (
                      <div className="text-sm font-semibold text-green-600 mt-1">Saves {plan.discount}% per delivery</div>
                    )}
                  </div>
                  <div className="md:text-right flex justify-between items-center md:block">
                    <div className="font-bold text-amber-800 text-lg">Rs. {discountedPrice} / kg</div>
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
      </main>

      {/* Responsive Bottom Action Bar */}
      <div className="fixed md:sticky bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 md:p-6 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex justify-between items-center w-full md:w-auto md:gap-6">
            <span className="text-stone-500 font-medium md:text-lg">Total per delivery:</span>
            <span className="text-2xl md:text-4xl font-black text-amber-900">
              Rs. {selectedOrigin.price * (1 - selectedPlan.discount / 100)}
            </span>
          </div>
          <Link 
            href="/checkout"
            className="w-full text-center md:w-auto px-10 bg-amber-900 hover:bg-amber-800 active:bg-amber-950 text-white py-4 rounded-2xl font-bold text-lg transition-transform active:scale-[0.98]"
          >
            Checkout with Khalti
          </Link>
        </div>
      </div>
    </div>
  );
}
