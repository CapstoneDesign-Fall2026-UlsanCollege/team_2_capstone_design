"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useSearchParams } from "next/navigation";

const ORIGINS = [
  { id: 1, name: "Gulmi Reserve", price: 1200, desc: "Bright acidity with citrus notes." },
  { id: 2, name: "Ilam Gold", price: 1400, desc: "Smooth body with chocolate and caramel." },
  { id: 3, name: "Nuwakot Heritage", price: 1100, desc: "Earthy and bold, perfect for espresso." },
];

const PLANS = [
  { id: "PAYG", name: "Pay-per-delivery", discount: 0, months: 1 },
  { id: "3M", name: "3 Months", discount: 5, months: 3 },
  { id: "6M", name: "6 Months", discount: 10, months: 6 },
  { id: "12M", name: "12 Months", discount: 15, months: 12 },
];

function HomeContent() {
  const searchParams = useSearchParams();
  const urlOriginId = Number(searchParams.get("origin"));
  
  // Find the origin from the URL, otherwise default to the first one
  const initialOrigin = ORIGINS.find(o => o.id === urlOriginId) || ORIGINS[0];

  const [selectedOrigin, setSelectedOrigin] = useState(initialOrigin);
  const [selectedWeight, setSelectedWeight] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);

  // Update selection if URL changes
  useEffect(() => {
    if (urlOriginId) {
      const found = ORIGINS.find(o => o.id === urlOriginId);
      if (found) setSelectedOrigin(found);
    }
  }, [urlOriginId]);

  const totalOriginalPrice = selectedOrigin.price * selectedWeight * selectedPlan.months;
  const totalDiscountedPrice = Math.round(totalOriginalPrice * (1 - selectedPlan.discount / 100));
  const totalSavings = totalOriginalPrice - totalDiscountedPrice;

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
          <Link
            href="/origins"
            className="inline-block mt-6 px-8 py-3 border border-[#2C2420] text-[#2C2420] text-sm uppercase tracking-widest font-bold hover:bg-[#2C2420] hover:text-[#F5F2EB] transition-colors"
          >
            Browse Origins
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-6 mt-8 grid grid-cols-1 md:grid-cols-2 gap-16">
        
        {/* Origin Selection */}
        <section>
          <h2 className="text-sm uppercase tracking-widest text-[#5C5042] font-bold mb-6">01. Select Origin</h2>
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
                <div className="flex justify-between items-start mb-2 pr-6">
                  <div className={`text-xl font-serif font-bold ${selectedOrigin.id === origin.id ? "text-white" : "text-[#1A1512]"}`}>
                    {origin.name}
                  </div>
                  <div className={`font-medium ${selectedOrigin.id === origin.id ? "text-[#D3C7B1]" : "text-[#5C5042]"}`}>
                    Rs. {origin.price}
                  </div>
                </div>
                <div className={`text-sm pr-6 ${selectedOrigin.id === origin.id ? "text-[#7A6A58]" : "text-[#5C5042]"}`}>
                  {origin.desc}
                </div>
                
                {selectedOrigin.id === origin.id && (
                  <div className="absolute top-1/2 -translate-y-1/2 right-4">
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
            <h2 className="text-sm uppercase tracking-widest text-[#5C5042] font-bold mb-6">02. Select Weight</h2>
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
            <h2 className="text-sm uppercase tracking-widest text-[#5C5042] font-bold mb-6">03. Delivery Plan</h2>
            <div className="space-y-4">
              {PLANS.map((plan) => {
                const originalPrice = selectedOrigin.price * selectedWeight * plan.months;
                const planDiscountedPrice = Math.round(originalPrice * (1 - plan.discount / 100));

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
                          <div className={`text-xs mt-1 uppercase tracking-wider ${selectedPlan.id === plan.id ? "text-[#D3C7B1]" : "text-[#5C5042]"}`}>
                            Saves {plan.discount}%
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {plan.discount > 0 && (
                          <div className={`text-xs line-through mb-1 ${selectedPlan.id === plan.id ? "text-[#7A6A58]" : "text-[#7A6A58]"}`}>
                            Rs. {originalPrice}
                          </div>
                        )}
                        <div className="text-xl font-medium">
                          Rs. {planDiscountedPrice}
                        </div>
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
            
            <div className="flex flex-col">
              <span className="text-[#5C5042] uppercase tracking-widest text-xs font-bold mb-1">Total upfront cost</span>
              {totalSavings > 0 && (
                <span className="text-[#3A7D44] text-xs font-bold">
                  You save Rs. {totalSavings}
                </span>
              )}
            </div>

            <div className="flex flex-col items-end">
              {totalSavings > 0 && (
                <span className="text-[#7A6A58] text-sm line-through">
                  Rs. {totalOriginalPrice}
                </span>
              )}
              <span className="text-3xl font-serif text-[#1A1512]">
                Rs. {totalDiscountedPrice}
              </span>
            </div>
            
          </div>
          <Link 
            href={`/checkout?origin=${selectedOrigin.id}&name=${encodeURIComponent(selectedOrigin.name)}&weight=${selectedWeight}&price=${totalDiscountedPrice}&plan_id=${selectedPlan.id}&plan_name=${encodeURIComponent(selectedPlan.name)}`}
            className="w-full md:w-auto px-12 py-4 bg-[#A3432A] hover:bg-[#8A3722] text-white text-center uppercase tracking-widest text-sm font-bold transition-colors"
          >
            Review Order
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F2EB]" />}>
      <HomeContent />
    </Suspense>
  );
}
