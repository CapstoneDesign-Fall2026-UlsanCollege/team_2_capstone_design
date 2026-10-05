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
  const [selectedWeight, setSelectedWeight] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 pb-32 font-sans">
      
      {/* Simple Header */}
      <header className="bg-amber-900 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">BrewMellow</h1>
          <p className="text-lg text-amber-200">The Himalayan Coffee Subscription</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Origin Selection */}
        <section>
          <h2 className="text-xl font-bold mb-4 border-b border-gray-200 pb-2">1. Choose Origin</h2>
          <div className="space-y-3">
            {ORIGINS.map((origin) => (
              <label
                key={origin.id}
                className={`flex flex-col md:flex-row md:items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedOrigin.id === origin.id 
                    ? "border-amber-700 bg-amber-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex-1 mb-2 md:mb-0">
                  <div className="font-bold">{origin.name}</div>
                  <div className="text-sm text-gray-600">{origin.desc}</div>
                </div>
                <div className="font-bold text-gray-800">
                  Rs. {origin.price} / kg
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

        {/* Right Column */}
        <div className="flex flex-col gap-10">
          
          {/* Weight Selection */}
          <section>
            <h2 className="text-xl font-bold mb-4 border-b border-gray-200 pb-2">2. Select Weight</h2>
            <div className="grid grid-cols-2 gap-3">
              {[0.5, 1, 2, 5].map((weight) => (
                <label
                  key={weight}
                  className={`text-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedWeight === weight 
                      ? "border-amber-700 bg-amber-700 text-white font-bold" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {weight} kg
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
          <section>
            <h2 className="text-xl font-bold mb-4 border-b border-gray-200 pb-2">3. Delivery Plan</h2>
            <div className="space-y-3">
              {PLANS.map((plan) => {
                const discountedPrice = selectedOrigin.price * selectedWeight * (1 - plan.discount / 100);
                return (
                  <label
                    key={plan.id}
                    className={`flex flex-col md:flex-row md:items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedPlan.id === plan.id 
                        ? "border-amber-700 bg-amber-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-bold">{plan.name}</div>
                      {plan.discount > 0 && (
                        <div className="text-sm text-green-700 mt-1">Saves {plan.discount}%</div>
                      )}
                    </div>
                    <div className="font-bold text-xl mt-2 md:mt-0">
                      Rs. {discountedPrice}
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

      {/* Flat Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex justify-between w-full md:w-auto md:gap-4 items-center">
            <span className="text-gray-600 font-medium">Total per delivery:</span>
            <span className="text-2xl font-bold text-amber-900">
              Rs. {selectedOrigin.price * selectedWeight * (1 - selectedPlan.discount / 100)}
            </span>
          </div>
          <Link 
            href="/checkout"
            className="w-full md:w-auto px-8 py-3 bg-amber-900 hover:bg-amber-800 text-white text-center rounded-lg font-bold transition-colors"
          >
            Continue to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
