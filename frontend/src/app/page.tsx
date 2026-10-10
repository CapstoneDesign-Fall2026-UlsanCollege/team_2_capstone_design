"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Mountain, Award, ShieldCheck, Flame, ArrowRight, 
  Coffee, ChevronDown, Check, Sparkles, MapPin, Star
} from "lucide-react";

export default function Home() {
  const [activePillar, setActivePillar] = useState(0);

  const pillars = [
    {
      id: 0,
      badge: "High Altitude",
      icon: Mountain,
      title: "2,000M+ MIST-GROWN",
      metric: "1,400m - 2,000m Elevation",
      desc: "Cultivated in the extreme microclimates of Gulmi and Ilam. Freezing mountain nights slow cherry development, packing dense natural sugars and bright citrus acidity into every seed.",
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: 1,
      badge: "Specialty Grade",
      icon: Award,
      title: "84+ SCA CUP SCORE",
      metric: "Top 3% Tier Globally",
      desc: "100% Arabica Bourbon and Typica varieties with zero primary defects. Every harvest lot is cup-tested and graded by certified Q-Graders to ensure unmatched balance and complex aroma.",
      image: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: 2,
      badge: "Direct Trade",
      icon: ShieldCheck,
      title: "100% FARMER-DIRECT",
      metric: "+40% Above Market Rates",
      desc: "We cut out commodity export middlemen. We contract directly with smallholder farming cooperatives in Nepal, guaranteeing stable living wages and long-term soil regeneration.",
      image: "https://images.unsplash.com/photo-1524350876685-274059332603?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: 3,
      badge: "Guaranteed Fresh",
      icon: Flame,
      title: "48-HR ROAST-TO-DOOR",
      metric: "Small-Batch Roasted",
      desc: "Never warehouse-aged. Beans are roasted in small 5kg batches in our Kathmandu Valley roastery and dispatched immediately so they arrive at peak degassing and crema readiness.",
      image: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=1200&auto=format&fit=crop"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F2EB] text-[#2C2420]">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-36 pb-24 px-6 flex items-center justify-center min-h-[75vh] overflow-hidden bg-[#1A1512]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-35 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1512] via-[#1A1512]/60 to-transparent"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-[11px] font-bold uppercase tracking-[0.24em] mb-8">
            <Sparkles size={13} className="text-[#E58A1F]" /> Single-Origin Himalayan Specialty Coffee
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight text-white mb-6 leading-[1.05]">
            Peak Altitude.<br />Peak Flavor.
          </h1>

          <p className="text-[#F5F2EB] text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 opacity-85">
            Freshly roasted single-origin coffees from Nepal’s highest hills. Delivered to your doorstep on recurring cycles with zero guesswork.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/subscribe"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#A3432A] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#8A3722] transition-all shadow-lg hover:shadow-xl group"
            >
              Build Your Plan <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/origins"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/30 bg-white/5 text-[#F5F2EB] text-xs uppercase tracking-widest font-bold hover:bg-white/15 transition-all backdrop-blur-sm"
            >
              Explore Our Origins
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THREE BENTO ACTION GATEWAYS (Roastify Pattern) */}
      <section className="w-full -mt-1 bg-[#1A1512]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          
          {/* Bento Card 1: Single Origins */}
          <Link 
            href="/origins" 
            className="group relative block overflow-hidden min-h-[380px] bg-neutral-900 border-r border-white/10"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-70"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent transition-opacity group-hover:from-black/90"></div>
            <div className="relative h-full flex flex-col justify-end p-8 z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E58A1F] mb-1">01 • Sourcing</span>
              <h2 className="text-2xl font-serif font-bold text-white mb-2">Explore Single Origins</h2>
              <p className="text-white/80 text-xs leading-relaxed max-w-sm mb-6">
                Discover distinct micro-climates, altitude notes, and processing methods from Gulmi, Ilam, and Nuwakot.
              </p>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all group-hover:bg-white group-hover:text-black w-fit">
                View Origins <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>

          {/* Bento Card 2: Custom Subscription */}
          <Link 
            href="/subscribe" 
            className="group relative block overflow-hidden min-h-[380px] bg-neutral-900 border-r border-white/10"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-70"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=800&auto=format&fit=crop')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent transition-opacity group-hover:from-black/90"></div>
            <div className="relative h-full flex flex-col justify-end p-8 z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E58A1F] mb-1">02 • Flexibility</span>
              <h2 className="text-2xl font-serif font-bold text-white mb-2">Custom Subscriptions</h2>
              <p className="text-white/80 text-xs leading-relaxed max-w-sm mb-6">
                Select your bean, grind size, and monthly commitment. Save up to 15% with prepaid cycles and free doorstep shipping.
              </p>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all group-hover:bg-white group-hover:text-black w-fit">
                Configure Plan <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>

          {/* Bento Card 3: Bulk / Wholesale */}
          <Link 
            href="/about" 
            className="group relative block overflow-hidden min-h-[380px] bg-neutral-900"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-70"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1524350876685-274059332603?q=80&w=800&auto=format&fit=crop')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent transition-opacity group-hover:from-black/90"></div>
            <div className="relative h-full flex flex-col justify-end p-8 z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E58A1F] mb-1">03 • Heritage</span>
              <h2 className="text-2xl font-serif font-bold text-white mb-2">Our Himalayan Story</h2>
              <p className="text-white/80 text-xs leading-relaxed max-w-sm mb-6">
                Learn how we unite local mountain cooperatives with craft roasting in Lalitpur to put Nepal on the global coffee map.
              </p>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all group-hover:bg-white group-hover:text-black w-fit">
                Read Story <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>

        </div>
      </section>

      {/* 3. THE HIMALAYAN STANDARD: 4-COLUMN EXPANDING ACCORDION (Roastify Pattern) */}
      <section className="py-24 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.24em] text-[#A3432A] mb-2">
            The Quality Benchmark
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#1A1512] mb-4">
            The Himalayan Specialty Standard
          </h2>
          <p className="text-[#5C5042] text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Every batch delivered to your door adheres to strict Specialty Coffee Association guidelines, from volcanic mountain soil to our Lalitpur drum roaster.
          </p>
        </div>

        {/* Desktop Expanding Flex Columns */}
        <div className="hidden lg:flex h-[560px] gap-4 w-full">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            const isActive = activePillar === pillar.id;

            return (
              <div
                key={pillar.id}
                onClick={() => setActivePillar(pillar.id)}
                className={`relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-500 ease-in-out p-8 flex flex-col justify-between ${
                  isActive 
                    ? "border-[#A3432A] shadow-xl bg-white" 
                    : "border-[#E6DEC8] bg-[#FAF8F5] hover:border-[#C4B69E] opacity-80"
                }`}
                style={{ flex: isActive ? 3 : 1 }}
              >
                {/* Background Image for Active Column */}
                {isActive && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-multiply pointer-events-none transition-opacity duration-500"
                    style={{ backgroundImage: `url('${pillar.image}')` }}
                  />
                )}

                {/* Top Badge & Metric */}
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isActive ? "bg-[#FAF5F2] text-[#A3432A]" : "bg-[#F0EAE1] text-[#5C5042]"
                    }`}>
                      <Icon size={12} /> {pillar.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-[#1A1512] tracking-tight mb-1">
                    {pillar.title}
                  </h3>
                  <p className="text-xs font-semibold text-[#8A7966] uppercase tracking-wider">
                    {pillar.metric}
                  </p>
                </div>

                {/* Description & Action (Expanded View) */}
                <div className="relative z-10">
                  {isActive ? (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <p className="text-sm text-[#5C5042] leading-relaxed max-w-md">
                        {pillar.desc}
                      </p>
                      <Link
                        href="/origins"
                        className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#A3432A] hover:underline"
                      >
                        Learn about altitude sourcing <ArrowRight size={14} />
                      </Link>
                    </div>
                  ) : (
                    <div className="text-[10px] uppercase tracking-widest font-bold text-[#8A7966]">
                      Click to inspect
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Accordion */}
        <div className="flex flex-col gap-3 lg:hidden">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            const isOpen = activePillar === pillar.id;

            return (
              <div 
                key={pillar.id}
                className={`border rounded-xl overflow-hidden transition-colors ${
                  isOpen ? "border-[#A3432A] bg-white shadow-md" : "border-[#E6DEC8] bg-[#FAF8F5]"
                }`}
              >
                <button
                  onClick={() => setActivePillar(isOpen ? -1 : pillar.id)}
                  className="w-full p-5 text-left flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#A3432A] flex items-center gap-1">
                        <Icon size={12} /> {pillar.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-serif font-bold text-[#1A1512]">{pillar.title}</h3>
                  </div>
                  <ChevronDown size={18} className={`text-[#8A7966] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-[#F0EAE1] space-y-3">
                    <p className="text-xs text-[#5C5042] leading-relaxed">{pillar.desc}</p>
                    <p className="text-[11px] font-bold text-[#A3432A] uppercase tracking-widest">{pillar.metric}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. VERIFIED SUBSCRIBER MARQUEE (Social Proof) */}
      <section className="bg-[#EAE4D3] py-16 px-6 border-y border-[#D3C7B1]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 pb-6 border-b border-[#D3C7B1] gap-4">
            <div>
              <p className="text-[#5C5042] text-[10px] uppercase tracking-[0.24em] font-bold mb-1">Empirical Proof</p>
              <h3 className="text-2xl font-serif font-bold text-[#1A1512]">Trusted Across Nepal & Beyond</h3>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#8A7966] font-serif italic">
              <span>The Kathmandu Post</span>
              <span>•</span>
              <span>Himalayan Times</span>
              <span>•</span>
              <span>Vogue</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-[#E6DEC8] p-6 rounded-lg shadow-sm">
              <div className="flex gap-1 text-[#A3432A] mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-xs text-[#5C5042] leading-relaxed mb-4">
                "The Ilam Gold beans completely changed my morning routine. Freshly roasted, never bitter, and always delivered on schedule."
              </p>
              <div className="border-t border-[#F0EAE1] pt-3 text-[11px]">
                <p className="font-bold text-[#1A1512]">Priya Sharma</p>
                <p className="text-[#8A7966]">Lalitpur • Subscriber since 2024</p>
              </div>
            </div>

            <div className="bg-white border border-[#E6DEC8] p-6 rounded-lg shadow-sm">
              <div className="flex gap-1 text-[#A3432A] mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-xs text-[#5C5042] leading-relaxed mb-4">
                "Being able to skip or pause directly from the dashboard makes this feel like a modern international app. Truly specialty grade."
              </p>
              <div className="border-t border-[#F0EAE1] pt-3 text-[11px]">
                <p className="font-bold text-[#1A1512]">Bikash Thapa</p>
                <p className="text-[#8A7966]">Kathmandu • Whole Bean (500g)</p>
              </div>
            </div>

            <div className="bg-white border border-[#E6DEC8] p-6 rounded-lg shadow-sm">
              <div className="flex gap-1 text-[#A3432A] mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-xs text-[#5C5042] leading-relaxed mb-4">
                "Gulmi Reserve is velvety with distinct citrus notes. You can immediately taste that this was grown at high altitude."
              </p>
              <div className="border-t border-[#F0EAE1] pt-3 text-[11px]">
                <p className="font-bold text-[#1A1512]">Dr. R. Shrestha</p>
                <p className="text-[#8A7966]">Pokhara • 3-Month Prepaid</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FINAL CALL TO ACTION */}
      <section className="py-24 px-6 text-center bg-[#F5F2EB]">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1512] mb-4">
            Elevate Your Daily Ritual
          </h3>
          <p className="text-[#5C5042] text-sm mb-8 leading-relaxed">
            Experience what true Himalayan altitude coffee tastes like. Start with a flexible prepaid subscription today.
          </p>
          <Link
            href="/subscribe"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full bg-[#1A1512] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-all shadow-md hover:shadow-xl"
          >
            Start Your Subscription <ArrowRight size={14} />
          </Link>
        </div>
      </section>

    </div>
  );
}
