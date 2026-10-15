import Link from "next/link";
import { ArrowLeft, MapPin, Coffee, ShieldCheck, Sparkles, Flame, ArrowRight, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EB] font-sans pb-32 text-[#2C2420]">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[#8A7966] hover:text-[#2C2420] transition-colors mb-8 text-sm uppercase tracking-widest font-bold"
        >
          <ArrowLeft size={16} /> Back to Store
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E6DEC8] rounded-full text-[#A3432A] text-[10px] font-bold uppercase tracking-widest mb-3">
          <Sparkles size={12} /> The Himalayan Coffee Collective
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#1A1512] mb-4">
          Our Roastery Story
        </h1>
        <p className="text-[#5C5042] text-lg max-w-2xl leading-relaxed">
          Sustainably sourced from Nepal's high-altitude micro-lots, small-batch roasted in Lalitpur, and delivered fresh to your door.
        </p>

        {/* Story Section Tabs */}
        <div className="flex flex-wrap gap-3 mt-8 text-xs uppercase tracking-wider font-bold">
          <a href="#story" className="px-5 py-2.5 bg-white rounded-full border border-[#E6DEC8] hover:border-[#A3432A] hover:text-[#A3432A] transition-colors shadow-sm">
            Our Heritage & Terroir
          </a>
          <a href="#roastery" className="px-5 py-2.5 bg-white rounded-full border border-[#E6DEC8] hover:border-[#A3432A] hover:text-[#A3432A] transition-colors shadow-sm">
            Lalitpur Roastery Craft
          </a>
          <a href="#brew-guide" className="px-5 py-2.5 bg-white rounded-full border border-[#E6DEC8] hover:border-[#A3432A] hover:text-[#A3432A] transition-colors shadow-sm">
            Barista Brew Guide
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 space-y-16">
        
        {/* Section 1: Our Story & Terroir */}
        <section id="story" className="bg-white border border-[#E6DEC8] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-sm scroll-mt-24">
          <div className="md:w-1/2 relative min-h-[400px]">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524350876685-274059332603?q=70&w=800&auto=format&fit=crop')] bg-cover bg-center"></div>
             <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
             <div className="absolute bottom-6 left-6 text-white">
               <span className="text-xs uppercase tracking-widest font-bold text-[#E58A1F]">Himalayan Foothills</span>
               <h3 className="text-xl font-serif font-bold">Western & Eastern Nepal Micro-lots</h3>
             </div>
          </div>
          <div className="md:w-1/2 p-8 md:p-14 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A3432A] mb-2">Heritage & Terroir</span>
            <h2 className="text-3xl font-serif font-bold text-[#1A1512] mb-6">From Altitude to Attitude</h2>
            <p className="text-[#5C5042] text-sm leading-relaxed mb-4">
              Nepal’s steep slopes and dramatic altitude (1,400m - 2,000m) foster high diurnal temperature swings. Freezing mountain nights slow coffee cherry maturation, packing dense natural sugars and sparkling citrus acidity into every seed.
            </p>
            <p className="text-[#5C5042] text-sm leading-relaxed mb-6">
              BrewMellow contracts directly with smallholder farming cooperatives in Gulmi, Ilam, and Nuwakot. By paying 40% above fair trade minimums, we guarantee dignified living wages for mountain farmers and direct-trade accountability for every bag.
            </p>
            <div className="flex flex-col gap-3 pt-4 border-t border-[#F0EAE1]">
              <div className="flex items-center gap-2 text-xs text-[#5C5042] font-semibold">
                <MapPin size={14} className="text-[#A3432A]" /> Hand-harvested above 1,600m
              </div>
              <div className="flex items-center gap-2 text-xs text-[#5C5042] font-semibold">
                <ShieldCheck size={14} className="text-[#2E6B34]" /> 100% Direct-Trade Verified
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Craft Drum Roasting in Lalitpur */}
        <section id="roastery" className="bg-[#1A1512] text-[#F5F2EB] border border-[#2C2420] rounded-2xl p-8 md:p-14 shadow-md scroll-mt-24">
          <div className="flex items-center gap-2 text-[#E58A1F] text-xs uppercase tracking-widest font-bold mb-3">
            <Flame size={16} /> Small-Batch Artisanship
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
                The Lalitpur Roastery Standard
              </h2>
              <p className="text-[#A89F91] text-sm leading-relaxed mb-4">
                We believe coffee should never sit in a warehouse. Every subscription order is roasted on a cast-iron drum roaster in Lalitpur and dispatched within 48 hours so it arrives during peak degassing and aroma expression.
              </p>
              <p className="text-[#A89F91] text-sm leading-relaxed mb-6">
                Our certified Q-Graders profile each harvest lot individually, ensuring light-to-medium roast profiles that respect the terroir rather than masking it behind dark roast bitterness.
              </p>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-2xl font-serif font-bold text-[#E58A1F]">48 Hrs</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#8A7966]">Roast-to-Door Window</p>
                </div>
                <div className="w-px h-10 bg-[#2C2420]"></div>
                <div>
                  <p className="text-2xl font-serif font-bold text-[#E58A1F]">84+ SCA</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#8A7966]">Certified Cup Score</p>
                </div>
                <div className="w-px h-10 bg-[#2C2420]"></div>
                <div>
                  <p className="text-2xl font-serif font-bold text-[#E58A1F]">5 kg</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#8A7966]">Micro-batch Drum Size</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-[#2C2420] relative h-64 md:h-80">
              <img 
                src="https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=70&w=800&auto=format&fit=crop" 
                alt="Lalitpur Roastery Drum"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-xs font-bold uppercase tracking-wider text-[#E58A1F]">
                Lalitpur Craft Drum • Batch #048
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Barista Brew Guide */}
        <section id="brew-guide" className="bg-white border border-[#E6DEC8] rounded-2xl p-8 md:p-12 shadow-sm scroll-mt-24">
          <div className="flex items-center gap-2 text-[#A3432A] text-xs uppercase tracking-widest font-bold mb-2">
            <Coffee size={16} /> Extraction Science
          </div>
          <h2 className="text-3xl font-serif font-bold text-[#1A1512] mb-3">Himalayan Extraction Guide</h2>
          <p className="text-[#5C5042] text-sm max-w-2xl mb-8 leading-relaxed">
            Dense, high-altitude beans extract best at controlled temperatures and precise brew ratios. Here is how our roasters brew at home:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8]">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#A3432A] bg-[#FAF1EE] px-2 py-0.5 rounded">
                Pour-Over
              </span>
              <h3 className="font-serif font-bold text-lg text-[#1A1512] mt-2 mb-1">V60 / Chemex</h3>
              <p className="text-xs text-[#A3432A] font-semibold mb-3">Ratio 1:16 • 93°C Water</p>
              <p className="text-xs text-[#5C5042] leading-relaxed">
                15g medium-fine coffee to 240ml water. 45-second aroma bloom, draw down by 2:45 min. Emphasizes Gulmi Reserve's citrus blossom and lingering wild honey sweetness.
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8]">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#E58A1F] bg-[#FFF8EE] px-2 py-0.5 rounded">
                Immersion
              </span>
              <h3 className="font-serif font-bold text-lg text-[#1A1512] mt-2 mb-1">French Press</h3>
              <p className="text-xs text-[#A3432A] font-semibold mb-3">Ratio 1:15 • 95°C Water</p>
              <p className="text-xs text-[#5C5042] leading-relaxed">
                30g coarse coffee to 450ml hot water. 4-minute steep before a gentle plunge. Enhances Nuwakot Heritage's heavy velvety body and warm walnut finish.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8]">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#2E6B34] bg-[#EDF7EE] px-2 py-0.5 rounded">
                Pressure
              </span>
              <h3 className="font-serif font-bold text-lg text-[#1A1512] mt-2 mb-1">Espresso / Moka</h3>
              <p className="text-xs text-[#A3432A] font-semibold mb-3">Ratio 1:2 • 9 Bar Pressure</p>
              <p className="text-xs text-[#5C5042] leading-relaxed">
                18g fine dose in, 36g liquid espresso out in 28-30s. Thick golden crema with sweet berry jam and cocoa tones from Ilam Gold.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Call to Action */}
        <div className="p-8 md:p-12 bg-[#FAF8F5] border border-[#E6DEC8] rounded-2xl text-center">
          <Heart size={28} className="text-[#A3432A] mx-auto mb-3" />
          <h3 className="text-2xl font-serif font-bold text-[#1A1512] mb-2">Taste the Himalayan Terroir</h3>
          <p className="text-xs text-[#5C5042] max-w-md mx-auto mb-6">
            Join the coffee club to get fresh small-batch roasts delivered directly from Lalitpur to your door.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/subscribe?plan=PAYG"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#A3432A] text-white text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#8A3722] transition-colors"
            >
              Build Your Plan <ArrowRight size={14} />
            </Link>
            <Link 
              href="/origins"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#E6DEC8] bg-white text-[#1A1512] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#FAF8F5] transition-colors"
            >
              Explore Mountain Terroirs
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
