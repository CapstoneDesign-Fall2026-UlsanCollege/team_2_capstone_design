import Link from "next/link";
import { ArrowLeft, MapPin, Coffee, ShieldCheck, Flame, ArrowRight, Scale, Clock, Droplets } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EB] font-sans text-[#1A1512] pb-28 md:pb-16 pb-safe">
      
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 md:pt-16 pb-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[#5C5042] hover:text-[#1A1512] transition-colors mb-6 font-mono text-xs uppercase tracking-widest font-bold"
        >
          <ArrowLeft size={15} /> Back to Storefront
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-[#1A1512]/15">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-[#A3432A] block mb-2">
              LALITPUR ROASTERY ARCHIVE // COFFEE HERITAGE & EXTRACTION
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold text-[#1A1512] tracking-tight">
              Our Roastery Chronicle
            </h1>
          </div>
          <p className="text-[#5C5042] text-sm md:text-base max-w-md leading-relaxed font-sans">
            Single-origin micro-lots sourced directly from Nepal&apos;s mountain terraces, roasted in Lalitpur, and dispatched fresh to your doorstep.
          </p>
        </div>

        {/* Story Section Tabs */}
        <div className="flex flex-wrap gap-2.5 font-mono text-xs uppercase tracking-wider font-bold">
          <a 
            href="#story" 
            className="min-h-[44px] inline-flex items-center px-4 py-2 bg-white rounded-xl border border-[#E6DEC8] hover:border-[#A3432A] hover:text-[#A3432A] transition-colors shadow-xs"
          >
            01 // Terroir & Heritage
          </a>
          <a 
            href="#roastery" 
            className="min-h-[44px] inline-flex items-center px-4 py-2 bg-white rounded-xl border border-[#E6DEC8] hover:border-[#A3432A] hover:text-[#A3432A] transition-colors shadow-xs"
          >
            02 // Lalitpur Roastery Craft
          </a>
          <a 
            href="#brew-guide" 
            className="min-h-[44px] inline-flex items-center px-4 py-2 bg-white rounded-xl border border-[#E6DEC8] hover:border-[#A3432A] hover:text-[#A3432A] transition-colors shadow-xs"
          >
            03 // Barista Calibration Ledger
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-16">
        
        {/* Section 1: Our Story & Terroir */}
        <section id="story" className="bg-white border border-[#E6DEC8] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-xs scroll-mt-24">
          <div className="md:w-1/2 relative min-h-[340px] md:min-h-full">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524350876685-274059332603?q=70&w=800&auto=format&fit=crop')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white font-mono">
              <span className="text-xs uppercase tracking-widest font-bold text-[#E58A1F] block mb-1">
                Himalayan Slopes (1,400m - 2,000m)
              </span>
              <h3 className="text-xl font-serif font-bold text-white">Western & Eastern Nepal Terroirs</h3>
            </div>
          </div>
          
          <div className="md:w-1/2 p-6 sm:p-10 md:p-12 flex flex-col justify-center">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#A3432A] mb-2">
              TERROIR & HIGH-ALTITUDE BOTANY
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1512] mb-4">
              Cold Nights, Concentrated Sugars
            </h2>
            <p className="text-[#5C5042] text-sm leading-relaxed mb-4 font-sans">
              Nepal sits on the northern frontier of the specialty coffee belt (28°N). At 1,400m to 2,000m, freezing mountain nights force coffee cherry respiration to slow drastically, extending harvest cycles to 9 full months and infusing dense natural sucrose and sparkling malic acidity into the seeds.
            </p>
            <p className="text-[#5C5042] text-sm leading-relaxed mb-6 font-sans">
              BrewMellow contracts directly with smallholder farming cooperatives in Gulmi, Ilam, and Nuwakot. By establishing long-term contracts at 40% above standard commodity floors, we secure dignified living wages for mountain producers while guaranteeing direct-trade accountability for every harvest lot.
            </p>
            
            <div className="flex flex-col gap-2.5 pt-4 border-t border-[#F0EAE1] font-mono text-xs text-[#5C5042]">
              <div className="flex items-center gap-2 font-semibold">
                <MapPin size={14} className="text-[#A3432A] shrink-0" /> Hand-harvested selectively above 1,600m MASL
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck size={14} className="text-[#2E6B34] shrink-0" /> 100% Direct-Trade Cooperative Verified
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Craft Drum Roasting in Lalitpur */}
        <section id="roastery" className="bg-[#1A1512] text-[#F5F2EB] border border-[#3E342F] rounded-2xl p-6 sm:p-10 md:p-12 shadow-md scroll-mt-24">
          <div className="flex items-center gap-2 text-[#E58A1F] font-mono text-xs uppercase tracking-widest font-bold mb-3">
            <Flame size={15} /> 02 // SMALL-BATCH DRUM CRAFT
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white mb-4">
                The Lalitpur Roastery Standard
              </h2>
              <p className="text-[#C8BFAB] text-sm leading-relaxed mb-4 font-sans">
                Coffee should never linger in storage warehouses. Every subscription batch is roasted on a cast-iron drum in Lalitpur and dispatched within 48 hours of roast, ensuring your parcel arrives precisely at the onset of peak degassing.
              </p>
              <p className="text-[#C8BFAB] text-sm leading-relaxed mb-6 font-sans">
                Our roasters calibrate each micro-lot individually to develop light and medium roast curves that highlight delicate mountain florals and citrus acidity, avoiding over-roasted bitterness.
              </p>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 font-mono">
                <div>
                  <p className="text-2xl font-serif font-bold text-[#E58A1F]">48h</p>
                  <p className="text-xs uppercase tracking-wider text-[#A89F91]">Roast-to-Courier</p>
                </div>
                <div>
                  <p className="text-2xl font-serif font-bold text-[#E58A1F]">84+</p>
                  <p className="text-xs uppercase tracking-wider text-[#A89F91]">SCA Cup Score</p>
                </div>
                <div>
                  <p className="text-2xl font-serif font-bold text-[#E58A1F]">5.0kg</p>
                  <p className="text-xs uppercase tracking-wider text-[#A89F91]">Drum Capacity</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl overflow-hidden border border-[#3E342F] relative h-64 md:h-80">
              <img 
                src="https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=70&w=800&auto=format&fit=crop" 
                alt="Lalitpur Roastery Drum Batch"
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 font-mono text-xs font-bold uppercase tracking-wider text-[#E58A1F]">
                Lalitpur Cast-Iron Drum • Profile Batch #048
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Barista Extraction Calibration Ledger */}
        <section id="brew-guide" className="bg-white border border-[#E6DEC8] rounded-2xl p-6 sm:p-10 md:p-12 shadow-xs scroll-mt-24">
          <div className="flex items-center gap-2 text-[#A3432A] font-mono text-xs uppercase tracking-widest font-bold mb-2">
            <Coffee size={15} /> 03 // EXTRACTION CALIBRATION LEDGER
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1512] mb-3">
            Himalayan Brew Specifications
          </h2>
          <p className="text-[#5C5042] text-sm max-w-2xl mb-8 leading-relaxed font-sans">
            Dense, high-altitude seeds extract best under regulated temperatures and precise brew ratios. Below are our roastery lab extraction protocols:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Protocol 1: Pour-Over */}
            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E6DEC8]">
                  <span className="font-mono text-xs uppercase font-bold tracking-wider text-[#A3432A]">
                    Filter / Pour-Over
                  </span>
                  <span className="font-mono text-xs text-[#5C5042] font-semibold">V60 / Chemex</span>
                </div>
                <h3 className="font-serif font-bold text-lg text-[#1A1512] mb-2">
                  Gulmi Reserve Protocol
                </h3>
                
                {/* Empirical Specs Table */}
                <div className="space-y-2 font-mono text-xs text-[#5C5042] mb-4 bg-white p-3 rounded-lg border border-[#E6DEC8]">
                  <div className="flex justify-between">
                    <span className="uppercase tracking-wider">Dose:</span>
                    <span className="font-bold text-[#1A1512]">15.0 g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="uppercase tracking-wider">Ratio:</span>
                    <span className="font-bold text-[#1A1512]">1:16 (240ml Water)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="uppercase tracking-wider">Water Temp:</span>
                    <span className="font-bold text-[#1A1512]">93°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="uppercase tracking-wider">Brew Time:</span>
                    <span className="font-bold text-[#1A1512]">2:45 min (45s Bloom)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="uppercase tracking-wider">Grind:</span>
                    <span className="font-bold text-[#1A1512]">Medium-Fine (650 µm)</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#5C5042] font-sans leading-relaxed pt-2 border-t border-[#F0EAE1]">
                Emphasizes Gulmi Reserve&apos;s sparkling citrus blossom and lingering wild honey sweetness.
              </p>
            </div>
            
            {/* Protocol 2: Immersion */}
            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E6DEC8]">
                  <span className="font-mono text-xs uppercase font-bold tracking-wider text-[#E58A1F]">
                    Immersion / Steep
                  </span>
                  <span className="font-mono text-xs text-[#5C5042] font-semibold">French Press</span>
                </div>
                <h3 className="font-serif font-bold text-lg text-[#1A1512] mb-2">
                  Nuwakot Heritage Protocol
                </h3>
                
                {/* Empirical Specs Table */}
                <div className="space-y-2 font-mono text-xs text-[#5C5042] mb-4 bg-white p-3 rounded-lg border border-[#E6DEC8]">
                  <div className="flex justify-between">
                    <span className="uppercase tracking-wider">Dose:</span>
                    <span className="font-bold text-[#1A1512]">30.0 g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="uppercase tracking-wider">Ratio:</span>
                    <span className="font-bold text-[#1A1512]">1:15 (450ml Water)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="uppercase tracking-wider">Water Temp:</span>
                    <span className="font-bold text-[#1A1512]">95°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="uppercase tracking-wider">Brew Time:</span>
                    <span className="font-bold text-[#1A1512]">4:00 min (Slow Plunge)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="uppercase tracking-wider">Grind:</span>
                    <span className="font-bold text-[#1A1512]">Coarse (950 µm)</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#5C5042] font-sans leading-relaxed pt-2 border-t border-[#F0EAE1]">
                Maximizes Nuwakot Heritage&apos;s velvety body, rich toasted walnut, and dark molasses finish.
              </p>
            </div>

            {/* Protocol 3: Pressure */}
            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E6DEC8]">
                  <span className="font-mono text-xs uppercase font-bold tracking-wider text-[#2E6B34]">
                    Pressure / Espresso
                  </span>
                  <span className="font-mono text-xs text-[#5C5042] font-semibold">9 Bar / Moka</span>
                </div>
                <h3 className="font-serif font-bold text-lg text-[#1A1512] mb-2">
                  Ilam Gold Protocol
                </h3>
                
                {/* Empirical Specs Table */}
                <div className="space-y-2 font-mono text-xs text-[#5C5042] mb-4 bg-white p-3 rounded-lg border border-[#E6DEC8]">
                  <div className="flex justify-between">
                    <span className="uppercase tracking-wider">Dose:</span>
                    <span className="font-bold text-[#1A1512]">18.0 g In</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="uppercase tracking-wider">Yield:</span>
                    <span className="font-bold text-[#1A1512]">36.0 g Out (1:2)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="uppercase tracking-wider">Water Temp:</span>
                    <span className="font-bold text-[#1A1512]">93.5°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="uppercase tracking-wider">Extraction:</span>
                    <span className="font-bold text-[#1A1512]">28 - 30 seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="uppercase tracking-wider">Grind:</span>
                    <span className="font-bold text-[#1A1512]">Fine Espresso (300 µm)</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#5C5042] font-sans leading-relaxed pt-2 border-t border-[#F0EAE1]">
                Extracts dense golden crema with sweet wild berry preserves and floral jasmine undertones.
              </p>
            </div>

          </div>
        </section>

        {/* Section 4: Call to Action */}
        <div className="p-8 md:p-12 bg-white border border-[#E6DEC8] rounded-2xl text-center shadow-xs">
          <div className="w-10 h-10 rounded-full bg-[#FAF5EC] border border-[#E6DEC8] flex items-center justify-center text-[#A3432A] mx-auto mb-3">
            <Coffee size={20} />
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#1A1512] mb-2">Experience the Mountain Harvest</h3>
          <p className="text-xs sm:text-sm text-[#5C5042] max-w-md mx-auto mb-6 font-sans">
            Join the coffee club to receive recurring single-origin micro-lots roasted fresh in Lalitpur with free doorstep delivery.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/subscribe?plan=PAYG"
              className="min-h-[48px] inline-flex items-center gap-2 px-6 py-3 bg-[#A3432A] text-white font-mono text-xs uppercase tracking-widest font-bold rounded-xl hover:bg-[#8A3722] transition-colors shadow-xs active:scale-[0.99] cursor-pointer"
            >
              <span>Build Your Plan</span>
              <ArrowRight size={14} />
            </Link>
            <Link 
              href="/origins"
              className="min-h-[48px] inline-flex items-center gap-2 px-6 py-3 border border-[#E6DEC8] bg-[#FAF8F5] text-[#1A1512] font-mono text-xs uppercase tracking-widest font-bold rounded-xl hover:bg-white transition-colors cursor-pointer"
            >
              <span>Explore Mountain Terroirs</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
