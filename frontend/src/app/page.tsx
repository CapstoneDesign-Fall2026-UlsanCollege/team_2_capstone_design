"use client";

import Link from "next/link";
import { Coffee, Flame, Truck, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F2EB] text-[#2C2420]">
      
      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 flex items-center justify-center min-h-[80vh] overflow-hidden">
        {/* Full-bleed background image of a coffee farm/nature */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501747315-124a0eaca060?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-[#1A1512]/70"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-white mb-6">
            Peak Altitude.<br />Peak Flavor.
          </h1>
          <p className="text-[#F5F2EB] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 opacity-90">
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

      {/* Social Proof / Press */}
      <section className="bg-[#EAE4D3] py-12 px-6 border-b border-[#D3C7B1]">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-[#5C5042] text-[10px] uppercase tracking-widest font-bold mb-6">Recognized By</p>
          <div className="flex flex-wrap justify-center gap-12 text-[#8A7966] font-serif italic text-xl opacity-80">
            <span>The Kathmandu Post</span>
            <span>Vogue</span>
            <span>Himalayan Times</span>
            <span>GQ</span>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-white py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center gap-1 text-[#A3432A] mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ))}
          </div>
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#1A1512] mb-6 leading-relaxed">
            "The best coffee subscription in Nepal. The Ilam Gold beans completely changed my morning routine. Delivery is always on time and the packaging is stunning."
          </h3>
          <p className="text-[#5C5042] text-xs uppercase tracking-widest font-bold">— Priya S., Subscriber since 2024</p>
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

      {/* Imagery Showcase */}
      <section className="bg-[#FAF8F5] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <img 
              src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&h=600&auto=format&fit=crop" 
              alt="Pouring coffee" 
              className="w-full h-[400px] object-cover rounded-sm"
            />
            <div className="grid grid-rows-2 gap-4">
              <img 
                src="https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=800&h=190&auto=format&fit=crop" 
                alt="Coffee beans" 
                className="w-full h-[192px] object-cover rounded-sm"
              />
              <img 
                src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&h=190&auto=format&fit=crop" 
                alt="Coffee cup" 
                className="w-full h-[192px] object-cover rounded-sm"
              />
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
