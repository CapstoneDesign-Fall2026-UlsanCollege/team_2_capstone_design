"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

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
    <div className="flex flex-col min-h-screen bg-[#F5F2EB] text-[#2C2420] pb-32">
      
      {/* Boutique Header */}
      <header className="pt-16 pb-12 px-6 border-b border-[#E6DEC8]">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-[#1A1512] mb-4">
            BrewMellow.
          </h1>
          <p className="text-lg text-[#5C5042] uppercase tracking-[0.2em] text-sm">
            Himalayan Coffee Subscription
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-6 mt-8 grid grid-cols-1 md:grid-cols-2 gap-16">
        
        {/* Origin Selection */}
        <section>
          <h2 className="text-sm uppercase tracking-widest text-[#8A7966] font-bold mb-6">01. Select Origin</h2>
          <div className="space-y-4">
            {ORIGINS.map((origin) => (
              <label
                key={origin.id}
                className={`relative block p-6 cursor-pointer transition-all ${
                  selectedOrigin.id === origin.id 
                    ? "bg-[#2C2420] text-[#F5F2EB]" 
                    : "bg-white text-[#2C2420] hover:bg-[#EAE4D3]"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`text-xl font-serif font-bold ${selectedOrigin.id === origin.id ? "text-white" : "text-[#1A1512]"}`}>
                    {origin.name}
                  </div>
                  <div className={`font-medium ${selectedOrigin.id === origin.id ? "text-[#D3C7B1]" : "text-[#8A7966]"}`}>
                    Rs. {origin.price}
                  </div>
                </div>
                <div className={`text-sm ${selectedOrigin.id === origin.id ? "text-[#A89F91]" : "text-[#5C5042]"}`}>
                  {origin.desc}
                </div>
                
                {selectedOrigin.id === origin.id && (
                  <div className="absolute top-6 right-6">
                    <Check size={18} className="text-[#F5F2EB]" />
                  </div>
                )}
                
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
        <div className="flex flex-col gap-12">
          
          {/* Weight Selection */}
          <section>
            <h2 className="text-sm uppercase tracking-widest text-[#8A7966] font-bold mb-6">02. Select Weight</h2>
            <div className="grid grid-cols-2 gap-4">
              {[0.5, 1, 2, 5].map((weight) => (
                <label
                  key={weight}
                  className={`text-center py-4 cursor-pointer transition-all ${
                    selectedWeight === weight 
                      ? "bg-[#2C2420] text-[#F5F2EB] font-bold" 
                      : "bg-white text-[#5C5042] hover:bg-[#EAE4D3]"
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
            <h2 className="text-sm uppercase tracking-widest text-[#8A7966] font-bold mb-6">03. Delivery Plan</h2>
            <div className="space-y-4">
              {PLANS.map((plan) => {
                const discountedPrice = selectedOrigin.price * selectedWeight * (1 - plan.discount / 100);
                return (
                  <label
                    key={plan.id}
                    className={`block p-6 cursor-pointer transition-all ${
                      selectedPlan.id === plan.id 
                        ? "bg-[#2C2420] text-[#F5F2EB]" 
                        : "bg-white text-[#2C2420] hover:bg-[#EAE4D3]"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className={`text-lg font-serif font-bold ${selectedPlan.id === plan.id ? "text-white" : "text-[#1A1512]"}`}>
                          {plan.name}
                        </div>
                        {plan.discount > 0 && (
                          <div className={`text-xs mt-1 uppercase tracking-wider ${selectedPlan.id === plan.id ? "text-[#D3C7B1]" : "text-[#8A7966]"}`}>
                            Saves {plan.discount}%
                          </div>
                        )}
                      </div>
                      <div className="text-xl font-medium">
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

      {/* Elegant Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#F5F2EB] border-t border-[#E6DEC8] p-6 z-50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex justify-between w-full md:w-auto md:gap-8 items-center">
            <span className="text-[#8A7966] uppercase tracking-widest text-xs font-bold">Total per delivery</span>
            <span className="text-3xl font-serif text-[#1A1512]">
              Rs. {selectedOrigin.price * selectedWeight * (1 - selectedPlan.discount / 100)}
            </span>
          </div>
          <Link 
            href="/checkout"
            className="w-full md:w-auto px-12 py-4 bg-[#A3432A] hover:bg-[#8A3722] text-white text-center uppercase tracking-widest text-sm font-bold transition-colors"
          >
            Review Order
          </Link>
        </div>
      </div>
    </div>
  );
}
