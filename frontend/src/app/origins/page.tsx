import Link from "next/link";
import { 
  ArrowLeft, MapPin, Coffee, Star, Droplets, Mountain, 
  Award, ShieldCheck, Flame, ArrowRight, CheckCircle2, 
  Calendar, TrendingUp, Sparkles, Scale, Clock, Users, ShieldAlert
} from "lucide-react";

const origins = [
  {
    id: 1,
    name: "Gulmi Reserve",
    region: "Gulmi, Western Nepal",
    altitude: "1,400 - 1,800m",
    process: "Fully Washed",
    flavor: "Citrus • Wild Honey • Dark Chocolate",
    roast: "Medium-Light",
    harvest: "Nov - Jan",
    scaScore: "85.5",
    img: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=800&auto=format&fit=crop",
    description: "Hand-picked from the misty terraces of the Gulmi district. The high altitude and freezing mountain nights slow cherry development, forcing natural sugars and bright citrus acidity into every seed. Fully washed in glacial spring water for a sparkling, pristine cup profile.",
  },
  {
    id: 2,
    name: "Ilam Gold",
    region: "Ilam, Eastern Nepal",
    altitude: "1,500 - 2,000m",
    process: "Natural (Sun-dried)",
    flavor: "Blackberry • Jasmine • Brown Caramel",
    roast: "Light",
    harvest: "Dec - Feb",
    scaScore: "86.0",
    img: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=800&auto=format&fit=crop",
    description: "Cultivated on the high eastern ridges of Ilam neighboring Darjeeling. Sun-dried with the whole coffee fruit intact on raised bamboo drying beds. This intensive natural process concentrates rich berry esters and sweet floral aromatics with a thick, syrupy mouthfeel.",
  },
  {
    id: 3,
    name: "Nuwakot Heritage",
    region: "Nuwakot, Central Nepal",
    altitude: "1,200 - 1,600m",
    process: "Honey Processed",
    flavor: "Toasted Walnut • Plum • Raw Cane Sugar",
    roast: "Medium-Dark",
    harvest: "Oct - Dec",
    scaScore: "84.5",
    img: "https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=800&auto=format&fit=crop",
    description: "An heirloom variety grown in the historic valley foothills north of Kathmandu. The skin is pulped while leaving the sticky fruit mucilage during drying. Delivers a heavy, rounded body with caramelized brown sugar depth and zero astringent bitterness.",
  },
];

export default function OriginsPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EB] font-sans pb-32 text-[#2C2420] scroll-smooth">
      {/* 1. HERO HEADER */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[#8A7966] hover:text-[#2C2420] transition-colors mb-8 text-sm uppercase tracking-widest font-bold"
        >
          <ArrowLeft size={16} /> Back to Store
        </Link>
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E6DEC8] text-[#A3432A] text-[11px] font-bold uppercase tracking-[0.2em] mb-4 shadow-sm">
          <Sparkles size={13} className="text-[#E58A1F]" /> Single-Origin Terroir & Quality Standards
        </div>

        <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#1A1512] mb-4 tracking-tight">
          Himalayan Coffee Terroir
        </h1>
        <p className="text-[#5C5042] text-lg max-w-3xl leading-relaxed mb-8">
          Every bean we roast is grounded in empirical origin science: extreme micro-climates, certified SCA cup scores, direct-trade living wages, and precision 48-hour roasting.
        </p>

        {/* Quick Nav Anchors Bar */}
        <div className="flex flex-wrap gap-2.5 pt-2 pb-6 border-b border-[#E6DEC8]">
          <a 
            href="#origins-catalog" 
            className="px-4 py-2 bg-white rounded-full border border-[#E6DEC8] text-xs font-bold uppercase tracking-wider text-[#1A1512] hover:border-[#A3432A] hover:text-[#A3432A] transition-all shadow-sm flex items-center gap-1.5"
          >
            <Coffee size={14} className="text-[#A3432A]" /> 3 Signature Origins
          </a>
          <a 
            href="#terroir" 
            className="px-4 py-2 bg-white rounded-full border border-[#E6DEC8] text-xs font-bold uppercase tracking-wider text-[#1A1512] hover:border-[#A3432A] hover:text-[#A3432A] transition-all shadow-sm flex items-center gap-1.5"
          >
            <Mountain size={14} className="text-[#A3432A]" /> 2,000m+ Mist Terroir
          </a>
          <a 
            href="#sca-quality" 
            className="px-4 py-2 bg-white rounded-full border border-[#E6DEC8] text-xs font-bold uppercase tracking-wider text-[#1A1512] hover:border-[#A3432A] hover:text-[#A3432A] transition-all shadow-sm flex items-center gap-1.5"
          >
            <Award size={14} className="text-[#E58A1F]" /> 84+ SCA Cupping Lab
          </a>
          <a 
            href="#farmer-impact" 
            className="px-4 py-2 bg-white rounded-full border border-[#E6DEC8] text-xs font-bold uppercase tracking-wider text-[#1A1512] hover:border-[#A3432A] hover:text-[#A3432A] transition-all shadow-sm flex items-center gap-1.5"
          >
            <ShieldCheck size={14} className="text-[#2E6B34]" /> 100% Farmer-Direct (+40%)
          </a>
          <a 
            href="#roast-schedule" 
            className="px-4 py-2 bg-white rounded-full border border-[#E6DEC8] text-xs font-bold uppercase tracking-wider text-[#1A1512] hover:border-[#A3432A] hover:text-[#A3432A] transition-all shadow-sm flex items-center gap-1.5"
          >
            <Flame size={14} className="text-[#A3432A]" /> 48-Hr Roast Schedule
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 space-y-20">

        {/* 2. THREE SIGNATURE COFFEES */}
        <section id="origins-catalog" className="scroll-mt-28 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-[#E6DEC8] pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#A3432A]">Harvest Portfolio</span>
              <h2 className="text-3xl font-serif font-bold text-[#1A1512]">Current Micro-Lot Offerings</h2>
            </div>
            <p className="text-xs text-[#8A7966] font-medium">All lots Q-graded 84+ • Hand-sorted 3 times • Single-estate sourced</p>
          </div>

          <div className="space-y-12">
            {origins.map((origin) => (
              <div 
                key={origin.id} 
                className="bg-white rounded-2xl border border-[#E6DEC8] overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row"
              >
                {/* Visual block */}
                <div className="lg:w-2/5 relative min-h-[320px]">
                  <img 
                    src={origin.img} 
                    alt={origin.name} 
                    loading="lazy" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>
                  
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white border border-white/20">
                      SCA {origin.scaScore} Score
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#A3432A]/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white">
                      {origin.harvest}
                    </span>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#E58A1F] font-bold mb-1">
                      <MapPin size={13} /> {origin.region}
                    </div>
                    <h3 className="text-3xl font-serif font-bold">{origin.name}</h3>
                  </div>
                </div>

                {/* Content Block */}
                <div className="lg:w-3/5 p-8 md:p-10 flex flex-col justify-between">
                  <div>
                    <p className="text-[#5C5042] text-sm md:text-base leading-relaxed mb-8">
                      {origin.description}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 p-4 bg-[#FAF8F5] rounded-xl border border-[#E6DEC8]">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-[#8A7966] font-bold mb-1 flex items-center gap-1.5">
                          <Droplets size={12} className="text-[#A3432A]" /> Process
                        </div>
                        <div className="text-[#1A1512] font-semibold text-xs">{origin.process}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-[#8A7966] font-bold mb-1 flex items-center gap-1.5">
                          <Mountain size={12} className="text-[#A3432A]" /> Elevation
                        </div>
                        <div className="text-[#1A1512] font-semibold text-xs">{origin.altitude}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-[#8A7966] font-bold mb-1 flex items-center gap-1.5">
                          <Star size={12} className="text-[#E58A1F]" /> Aroma Notes
                        </div>
                        <div className="text-[#1A1512] font-semibold text-xs">{origin.flavor}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-[#8A7966] font-bold mb-1 flex items-center gap-1.5">
                          <Coffee size={12} className="text-[#A3432A]" /> Roast Profile
                        </div>
                        <div className="text-[#1A1512] font-semibold text-xs">{origin.roast}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#F0EAE1]">
                    <div className="text-xs text-[#8A7966]">
                      Delivered within <strong className="text-[#1A1512]">48 hours of roast</strong>
                    </div>
                    <Link
                      href={`/subscribe?origin=${origin.id}&name=${encodeURIComponent(origin.name)}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#A3432A] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#8A3722] transition-colors shadow-sm"
                    >
                      Configure {origin.name} Plan <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. DEDICATED PILLAR 1: HIGH ALTITUDE & TERROIR */}
        <section id="terroir" className="scroll-mt-28 bg-white border border-[#E6DEC8] rounded-2xl p-8 md:p-14 shadow-sm">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF1EE] text-[#A3432A] text-[10px] font-bold uppercase tracking-widest mb-3">
              <Mountain size={13} /> Dedicated Pillar • 01
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1512] mb-4">
              2,000M+ Mist-Grown: The Extreme Elevation Terroir
            </h2>
            <p className="text-[#5C5042] text-sm md:text-base leading-relaxed mb-8">
              Why does altitude matter for specialty coffee? Nepal sits at the northernmost edge of the global coffee belt (28°N). Combined with the extreme elevation of Gulmi, Ilam, and Nuwakot (1,400m to 2,000m), coffee plants experience dramatic climatic stress that transforms bean density.
            </p>
          </div>

          {/* Terroir Comparative Metric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8]">
              <div className="text-2xl font-serif font-bold text-[#A3432A] mb-1">15°C - 18°C</div>
              <h3 className="font-semibold text-sm text-[#1A1512] mb-2">Diurnal Temperature Swing</h3>
              <p className="text-xs text-[#5C5042] leading-relaxed">
                Freezing night temperatures drop below 4°C during winter months. This slows down cherry respiration, extending harvest maturation from 6 months to 9 full months.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8]">
              <div className="text-2xl font-serif font-bold text-[#A3432A] mb-1">Strictly Hard Bean (SHB)</div>
              <h3 className="font-semibold text-sm text-[#1A1512] mb-2">High Bean Cellular Density</h3>
              <p className="text-xs text-[#5C5042] leading-relaxed">
                Prolonged cherry maturation forces plants to pack dense sucrose, phosphoric acid, and complex lipid structures into the seed, resulting in superior crema and aromatics.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8]">
              <div className="text-2xl font-serif font-bold text-[#A3432A] mb-1">Glacial Mineral Runoff</div>
              <h3 className="font-semibold text-sm text-[#1A1512] mb-2">Himalayan Mountain Soil</h3>
              <p className="text-xs text-[#5C5042] leading-relaxed">
                Fed by snowmelt from the Annapurna and Kanchenjunga ranges. Natural drainage along steep terraced slopes prevents root waterlogging and imparts sparkling mineral acidity.
              </p>
            </div>
          </div>

          {/* Elevation Altitude Scale */}
          <div className="p-6 bg-[#1A1512] text-white rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#E58A1F] mb-4 flex items-center gap-2">
              <TrendingUp size={14} /> Elevation vs Flavor Profile Spectrum
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Ilam High Mountain Ridges (1,800m - 2,000m)</span>
                  <span className="text-[#E58A1F]">Intense Jasmine Floral & Blackberry (SHB)</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5">
                  <div className="bg-[#E58A1F] h-2.5 rounded-full w-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Gulmi Western Terraces (1,400m - 1,800m)</span>
                  <span className="text-[#E58A1F]">Sparkling Citrus Malic Acidity & Wild Honey</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5">
                  <div className="bg-[#E58A1F] h-2.5 rounded-full w-[85%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Nuwakot Foothills (1,200m - 1,500m)</span>
                  <span className="text-white/60">Heavy Body, Warm Walnut & Brown Sugar</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5">
                  <div className="bg-white/40 h-2.5 rounded-full w-[65%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-white/50 mb-1">
                  <span>Commercial Lowland Coffee (&lt; 800m)</span>
                  <span>Robusta Commodity Tier / Earthy Bitterness (Not Sourced)</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5">
                  <div className="bg-red-500/40 h-2.5 rounded-full w-[30%]"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. DEDICATED PILLAR 2: 84+ SCA CUP SCORE */}
        <section id="sca-quality" className="scroll-mt-28 bg-white border border-[#E6DEC8] rounded-2xl p-8 md:p-14 shadow-sm">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF8EE] text-[#E58A1F] text-[10px] font-bold uppercase tracking-widest mb-3">
              <Award size={13} /> Dedicated Pillar • 02
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1512] mb-4">
              84+ SCA Cup Score: Certified Specialty Grade Lab Protocol
            </h2>
            <p className="text-[#5C5042] text-sm md:text-base leading-relaxed mb-8">
              In specialty coffee, "grade" isn't a marketing buzzword — it is an empirical, calibrated cupping test governed by the Specialty Coffee Association (SCA). Only the top 3% of Arabica beans globally score 84 points or higher.
            </p>
          </div>

          {/* Official Cupping Scorecard */}
          <div className="border border-[#E6DEC8] rounded-xl overflow-hidden mb-8">
            <div className="bg-[#FAF8F5] p-5 border-b border-[#E6DEC8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A7966]">Calibration Standard</span>
                <h3 className="font-serif font-bold text-lg text-[#1A1512]">SCA 100-Point Sensory Cupping Breakdown</h3>
              </div>
              <div className="flex items-center gap-2 bg-[#1A1512] text-white px-4 py-2 rounded-lg text-sm font-bold">
                <Award size={16} className="text-[#E58A1F]" /> Certified Lot Score: 85.5 / 100
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E6DEC8] bg-white">
              <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8A7966]">Fragrance & Aroma</span>
                  <span className="text-sm font-bold text-[#A3432A]">8.50 / 10</span>
                </div>
                <p className="text-xs text-[#5C5042] leading-relaxed">
                  Distinct dry fragrance of wild jasmine blossom, bergamot, and sweet stone fruit bloom upon crust break.
                </p>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8A7966]">Acidity & Brightness</span>
                  <span className="text-sm font-bold text-[#A3432A]">8.75 / 10</span>
                </div>
                <p className="text-xs text-[#5C5042] leading-relaxed">
                  Lively malic & crisp phosphoric acidity characteristic of extreme high elevation. Zero harsh vinegar notes.
                </p>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8A7966]">Body & Mouthfeel</span>
                  <span className="text-sm font-bold text-[#A3432A]">8.50 / 10</span>
                </div>
                <p className="text-xs text-[#5C5042] leading-relaxed">
                  Smooth, silky coating with rich tactile persistence. Syrupy caramel finish without chalky residue.
                </p>
              </div>

              <div className="p-6 border-t border-[#E6DEC8]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8A7966]">Clean Cup & Uniformity</span>
                  <span className="text-sm font-bold text-[#2E6B34]">10.0 / 10</span>
                </div>
                <p className="text-xs text-[#5C5042] leading-relaxed">
                  5 out of 5 cupping bowls identical. Zero phenolic taint, sour beans, fermented grains, or processing defects.
                </p>
              </div>

              <div className="p-6 border-t border-[#E6DEC8]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8A7966]">Sweetness</span>
                  <span className="text-sm font-bold text-[#2E6B34]">10.0 / 10</span>
                </div>
                <p className="text-xs text-[#5C5042] leading-relaxed">
                  Natural caramelized sucrose and mountain flower honey. Derived exclusively from slow cherry ripening.
                </p>
              </div>

              <div className="p-6 border-t border-[#E6DEC8]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8A7966]">Overall Balance</span>
                  <span className="text-sm font-bold text-[#A3432A]">8.75 / 10</span>
                </div>
                <p className="text-xs text-[#5C5042] leading-relaxed">
                  Seamless harmony between sparkling fruit acidity, lingering cocoa, and velvety body. Q-Grader signed.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8] flex items-start gap-4">
            <CheckCircle2 size={24} className="text-[#2E6B34] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-[#1A1512] mb-1">Zero Primary Defect Guarantee</h4>
              <p className="text-xs text-[#5C5042] leading-relaxed">
                Before roasting, 350 grams of green beans from each batch are hand-inspected under calibrated daylight lamps. Any black beans, sour cherries, insect damage, or fungal cherries are discarded. You receive only immaculate specialty bean tissue.
              </p>
            </div>
          </div>
        </section>

        {/* 5. DEDICATED PILLAR 3: 100% FARMER-DIRECT */}
        <section id="farmer-impact" className="scroll-mt-28 bg-white border border-[#E6DEC8] rounded-2xl p-8 md:p-14 shadow-sm">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDF7EE] text-[#2E6B34] text-[10px] font-bold uppercase tracking-widest mb-3">
              <ShieldCheck size={13} /> Dedicated Pillar • 03
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1512] mb-4">
              100% Farmer-Direct: Transparent Living Wages (+40% Above Market)
            </h2>
            <p className="text-[#5C5042] text-sm md:text-base leading-relaxed mb-8">
              In conventional coffee trading, an average of 4 middlemen (local brokers, consolidators, exporters, and international dealers) siphon away profits before reaching the farmer. BrewMellow contracts directly with mountain grower cooperatives.
            </p>
          </div>

          {/* Pricing Model Comparison Table */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="p-6 rounded-xl bg-white border border-red-200">
              <span className="text-[10px] uppercase tracking-widest font-bold text-red-600 block mb-1">Global C-Price Commodity</span>
              <h3 className="text-xl font-serif font-bold text-[#1A1512] mb-2">NPR 320 - 380 / kg</h3>
              <p className="text-xs text-[#5C5042] leading-relaxed mb-4">
                Volatile stock market pricing. Middlemen take 65% margin; farmers cannot cover cost of organic compost and harvesting labor.
              </p>
              <div className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                <ShieldAlert size={14} /> Sub-Living Wage Deficit
              </div>
            </div>

            <div className="p-6 rounded-xl bg-white border border-[#E6DEC8]">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#8A7966] block mb-1">Standard Fair Trade Floor</span>
              <h3 className="text-xl font-serif font-bold text-[#1A1512] mb-2">NPR 450 - 520 / kg</h3>
              <p className="text-xs text-[#5C5042] leading-relaxed mb-4">
                Basic certifier floor price. Helps cover subsistence living, but lacks capital for drying domes, depulping machines, or soil tests.
              </p>
              <div className="text-[11px] font-semibold text-[#8A7966] flex items-center gap-1">
                <Scale size={14} /> Baseline Survival Rate
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#FAF8F5] border-2 border-[#2E6B34]">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#2E6B34] block mb-1">BrewMellow Direct Trade</span>
              <h3 className="text-xl font-serif font-bold text-[#2E6B34] mb-2">NPR 680 - 750 / kg</h3>
              <p className="text-xs text-[#5C5042] leading-relaxed mb-4">
                Paid directly into cooperative bank accounts with zero broker cuts. Guarantees +40% to +50% above fair trade market minimums.
              </p>
              <div className="text-[11px] font-bold text-[#2E6B34] flex items-center gap-1">
                <CheckCircle2 size={14} /> Dignified Mountain Prosperity
              </div>
            </div>
          </div>

          {/* Cooperative Impact Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 bg-[#FAF8F5] rounded-xl border border-[#E6DEC8]">
            <div className="flex items-start gap-3">
              <Users size={24} className="text-[#2E6B34] shrink-0 mt-1" />
              <div>
                <p className="text-2xl font-serif font-bold text-[#1A1512]">180+ Families</p>
                <p className="text-xs text-[#5C5042]">Smallholder farmers in Gulmi Coffee Producers Association</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Sparkles size={24} className="text-[#E58A1F] shrink-0 mt-1" />
              <div>
                <p className="text-2xl font-serif font-bold text-[#1A1512]">100% Shade-Grown</p>
                <p className="text-xs text-[#5C5042]">Native alder and oak canopy preserves Himalayan songbird habitat</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <TrendingUp size={24} className="text-[#A3432A] shrink-0 mt-1" />
              <div>
                <p className="text-2xl font-serif font-bold text-[#1A1512]">5% Reinvestment</p>
                <p className="text-xs text-[#5C5042]">Dedicated to building raised solar dehydration beds in Ilam & Gulmi</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. DEDICATED PILLAR 4: 48-HR ROAST-TO-DOOR */}
        <section id="roast-schedule" className="scroll-mt-28 bg-[#1A1512] text-white border border-[#2C2420] rounded-2xl p-8 md:p-14 shadow-lg">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#E58A1F] text-[10px] font-bold uppercase tracking-widest mb-3 border border-white/10">
              <Flame size={13} /> Dedicated Pillar • 04
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
              48-HR Roast-to-Door: The Degassing & Freshness Curve
            </h2>
            <p className="text-white/80 text-sm md:text-base leading-relaxed mb-8">
              Commercial coffee bought in supermarkets is frequently roasted 3 to 9 months prior to consumption. Coffee is a fresh perishable fruit seed: peak aromatics and crema are expressed between Day 3 and Day 21 post-roast.
            </p>
          </div>

          {/* Production Timeline Visual */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E58A1F] mb-2">
                <Clock size={14} /> Day 00 • Hour 00
              </div>
              <h3 className="font-serif font-bold text-base text-white mb-2">Cast-Iron Roasting</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Roasted in 5kg micro-batches on our Lalitpur drum roaster. Computer-profiled to preserve origin acidities.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E58A1F] mb-2">
                <Clock size={14} /> Day 01 • Hour 24
              </div>
              <h3 className="font-serif font-bold text-base text-white mb-2">CO2 Stabilization</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Beans rest in airtight valved bags. Unwanted excess CO2 vents out without letting oxygen into the package.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E58A1F] mb-2">
                <Clock size={14} /> Day 02 • Hour 48
              </div>
              <h3 className="font-serif font-bold text-base text-white mb-2">Doorstep Dispatch</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Hand-stamped with exact Roast Date and master roaster batch number. Dispatched immediately to your home.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#A3432A]/20 border border-[#A3432A]/50">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E58A1F] mb-2">
                <Sparkles size={14} /> Day 03 to 21
              </div>
              <h3 className="font-serif font-bold text-base text-white mb-2">Peak Flavor Window</h3>
              <p className="text-xs text-white/80 leading-relaxed">
                Crema richness, sweet aroma bloom, and complex fruit notes are at their maximum sensory peak.
              </p>
            </div>
          </div>

          {/* Roasting Schedule Calendar */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-full bg-[#E58A1F]/20 text-[#E58A1F]">
                <Calendar size={28} />
              </div>
              <div>
                <h4 className="font-serif font-bold text-lg text-white">Lalitpur Roastery Schedule</h4>
                <p className="text-xs text-white/70">
                  Batches are roasted every <strong>Monday & Wednesday morning</strong>. Orders placed before 10:00 AM dispatch same-day.
                </p>
              </div>
            </div>

            <Link
              href="/subscribe?plan=PAYG"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#A3432A] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#8A3722] transition-colors shrink-0 shadow-md"
            >
              Start Your Fresh Cycle <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* 7. BOTTOM ACTION CARD */}
        <div className="p-10 md:p-14 bg-white border border-[#E6DEC8] rounded-2xl text-center shadow-sm">
          <Sparkles size={32} className="text-[#A3432A] mx-auto mb-3" />
          <h3 className="text-3xl font-serif font-bold text-[#1A1512] mb-3">Experience True Himalayan Craft</h3>
          <p className="text-sm text-[#5C5042] max-w-xl mx-auto mb-8 leading-relaxed">
            Choose your origin, pick your whole bean or grind size, and enjoy doorstep delivery directly from our Lalitpur roastery.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/subscribe?plan=PAYG"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#A3432A] text-white text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#8A3722] transition-colors shadow-sm"
            >
              Build Your Plan <ArrowRight size={14} />
            </Link>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-[#E6DEC8] bg-[#FAF8F5] text-[#1A1512] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-white transition-colors"
            >
              Return to Storefront
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
