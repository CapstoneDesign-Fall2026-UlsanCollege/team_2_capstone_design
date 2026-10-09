"use client";

import Link from "next/link";
import { Coffee, Flame, Truck, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F2EB] text-[#2C2420]">
      
      {/* Hero Section */}
      <section className="bg-[#1A1512] text-[#F5F2EB] pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Decorative background overlay */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-white mb-6">
            Peak Altitude.<br />Peak Flavor.
          </h1>
          <p className="text-[#D3C7B1] text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            A premium subscription service delivering sustainably sourced, meticulously roasted Himalayan coffee directly to your door, exactly when you need it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/subscribe"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#A3432A] text-white text-sm uppercase tracking-widest font-bold hover:bg-[#8A3722] transition-colors"
            >
              Build Your Plan <ArrowRight size={16} />
            </Link>
            <Link
              href="/origins"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#5C5042] text-[#E6DEC8] text-sm uppercase tracking-widest font-bold hover:bg-[#2C2420] hover:border-[#2C2420] transition-colors"
            >
              Explore Our Origins
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-[#EAE4D3] py-24 px-6 border-b border-[#E6DEC8]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs uppercase tracking-widest text-[#5C5042] font-bold mb-2">The Process</h2>
            <h3 className="text-3xl font-serif font-bold text-[#1A1512]">How Your Subscription Works</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-[#F5F2EB] rounded-full flex items-center justify-center mb-6 text-[#1A1512]">
                <Coffee size={28} />
              </div>
              <h4 className="text-lg font-serif font-bold text-[#1A1512] mb-3">1. Select Your Bean</h4>
              <p className="text-[#5C5042] text-sm leading-relaxed">Choose from our single-origin harvests in Gulmi, Ilam, or Nuwakot, each offering a distinct flavor profile.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-[#F5F2EB] rounded-full flex items-center justify-center mb-6 text-[#1A1512]">
                <Flame size={28} />
              </div>
              <h4 className="text-lg font-serif font-bold text-[#1A1512] mb-3">2. Roasted to Order</h4>
              <p className="text-[#5C5042] text-sm leading-relaxed">We small-batch roast your beans within 48 hours of your scheduled delivery date to guarantee peak freshness.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-[#F5F2EB] rounded-full flex items-center justify-center mb-6 text-[#1A1512]">
                <Truck size={28} />
              </div>
              <h4 className="text-lg font-serif font-bold text-[#1A1512] mb-3">3. Delivered Fresh</h4>
              <p className="text-[#5C5042] text-sm leading-relaxed">Your coffee arrives right at your door on your preferred schedule. Adjust, pause, or cancel anytime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center">
        <h3 className="text-3xl font-serif font-bold text-[#1A1512] mb-6">Ready to elevate your morning routine?</h3>
        <Link
          href="/subscribe"
          className="inline-flex items-center justify-center px-10 py-4 bg-[#1A1512] text-white text-sm uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors"
        >
          Start Your Subscription
        </Link>
      </section>

    </div>
  );
}
