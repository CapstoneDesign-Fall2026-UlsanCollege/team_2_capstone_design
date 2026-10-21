"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, MapPin, Coffee, Star, Droplets, Mountain, 
  Award, ShieldCheck, Flame, ArrowRight, CheckCircle2, 
  Calendar, TrendingUp, Scale, Clock, Users, ShieldAlert,
  Layers
} from "lucide-react";

const origins = [
  {
    id: 1,
    name: "Gulmi Reserve",
    lotCode: "LOT #GLM-26",
    region: "Gulmi, Western Nepal",
    altitude: "1,400m - 1,800m MASL",
    process: "Fully Washed (Spring Water)",
    flavor: "Citrus • Mountain Honey • Dark Chocolate",
    roast: "Medium-Light (Filter & Pour-Over)",
    harvest: "Nov - Jan (Hand-Sorted)",
    scaScore: "86.5 SCA",
    img: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=800&auto=format&fit=crop",
    description: "Hand-picked from the misty terraces of the Gulmi district. High altitude and cold Himalayan nights slow cherry development, concentrating dense natural sugars and bright citrus acidity into every seed. Fully washed in spring water for a crisp, transparent cup profile.",
  },
  {
    id: 2,
    name: "Ilam Gold",
    lotCode: "LOT #ILM-18",
    region: "Ilam, Eastern Nepal",
    altitude: "1,500m - 2,000m MASL",
    process: "Sun-Dried Natural (Bamboo Beds)",
    flavor: "Wild Berry • White Jasmine • Brown Caramel",
    roast: "Light (Terroir Expression)",
    harvest: "Dec - Feb (Peak Selective)",
    scaScore: "87.0 SCA",
    img: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=800&auto=format&fit=crop",
    description: "Cultivated on the eastern ridges of Ilam bordering Darjeeling. Whole coffee cherries are dried on raised bamboo beds under mountain sun, concentrating rich wild berry esters and sweet floral jasmine aromatics with a rounded, syrupy mouthfeel.",
  },
  {
    id: 3,
    name: "Nuwakot Heritage",
    lotCode: "LOT #NWK-09",
    region: "Nuwakot Foothills",
    altitude: "1,200m - 1,600m MASL",
    process: "Honey Processed (Mucilage Intact)",
    flavor: "Toasted Walnut • Dark Molasses • Spiced Plum",
    roast: "Medium-Dark (Espresso / Moka)",
    harvest: "Oct - Dec (Valley Slopes)",
    scaScore: "85.0 SCA",
    img: "https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=800&auto=format&fit=crop",
    description: "An heirloom lot grown in the historic valley foothills north of Kathmandu. The outer cherry skin is pulped while retaining sweet fruit mucilage during drying, delivering a heavy, velvety body with caramelized brown sugar depth and zero bitterness.",
  },
];

function OriginsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>("catalog");

  // Sync state with URL parameter or hash
  useEffect(() => {
    const sec = searchParams.get("section");
    if (sec && ["catalog", "terroir", "sca-quality", "farmer-impact", "roast-schedule", "all"].includes(sec)) {
      setActiveSection(sec);
      return;
    }

    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.replace("#", "");
      if (["origins-catalog", "catalog"].includes(hash)) setActiveSection("catalog");
      else if (["terroir", "sca-quality", "farmer-impact", "roast-schedule", "all"].includes(hash)) {
        setActiveSection(hash);
      }
    }
  }, [searchParams]);

  const selectTab = (tab: string) => {
    setActiveSection(tab);
    router.replace(`/origins?section=${tab}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] font-sans text-[#1A1512] pb-28 md:pb-16 pb-safe">
      
      {/* 1. TOP HERO HEADER (Editorial Roastery Dossier Style) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[#5C5042] hover:text-[#1A1512] transition-colors mb-6 font-mono text-xs uppercase tracking-widest font-bold"
        >
          <ArrowLeft size={15} /> Back to Storefront
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-[#1A1512]/15">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-[#A3432A] block mb-2">
              HIMALAYAN ORIGIN SPECIFICATIONS // TECHNICAL DOSSIER
            </span>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#1A1512] tracking-tight">
              Single-Origin Terroirs
            </h1>
          </div>
          <p className="text-[#5C5042] text-xs md:text-sm max-w-md leading-relaxed font-sans">
            Directly sourced micro-lots from Nepal&apos;s extreme altitude slopes. Explore cupping lab scores, diurnal terroir stress, and living wages below.
          </p>
        </div>

        {/* 2. DEDICATED SECTION SELECTOR TABS */}
        <div 
          role="tablist" 
          aria-label="Himalayan origin standards" 
          className="bg-white p-2 rounded-2xl border border-[#E6DEC8] shadow-xs flex flex-wrap gap-2 mb-10"
        >
          <button
            role="tab"
            aria-selected={activeSection === "catalog"}
            onClick={() => selectTab("catalog")}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSection === "catalog"
                ? "bg-[#1A1512] text-white shadow-sm"
                : "text-[#5C5042] hover:bg-[#FAF8F5] hover:text-[#1A1512]"
            }`}
          >
            <Coffee size={14} className={activeSection === "catalog" ? "text-[#E58A1F]" : "text-[#A3432A]"} />
            <span>3 Signature Origins</span>
          </button>

          <button
            role="tab"
            aria-selected={activeSection === "terroir"}
            onClick={() => selectTab("terroir")}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSection === "terroir"
                ? "bg-[#1A1512] text-white shadow-sm"
                : "text-[#5C5042] hover:bg-[#FAF8F5] hover:text-[#1A1512]"
            }`}
          >
            <Mountain size={14} className={activeSection === "terroir" ? "text-[#E58A1F]" : "text-[#A3432A]"} />
            <span>2,000m+ Terroir</span>
          </button>

          <button
            role="tab"
            aria-selected={activeSection === "sca-quality"}
            onClick={() => selectTab("sca-quality")}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSection === "sca-quality"
                ? "bg-[#1A1512] text-white shadow-sm"
                : "text-[#5C5042] hover:bg-[#FAF8F5] hover:text-[#1A1512]"
            }`}
          >
            <Award size={14} className={activeSection === "sca-quality" ? "text-[#E58A1F]" : "text-[#A3432A]"} />
            <span>84+ SCA Cupping Lab</span>
          </button>

          <button
            role="tab"
            aria-selected={activeSection === "farmer-impact"}
            onClick={() => selectTab("farmer-impact")}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSection === "farmer-impact"
                ? "bg-[#1A1512] text-white shadow-sm"
                : "text-[#5C5042] hover:bg-[#FAF8F5] hover:text-[#1A1512]"
            }`}
          >
            <ShieldCheck size={14} className={activeSection === "farmer-impact" ? "text-[#E58A1F]" : "text-[#2E6B34]"} />
            <span>Farmer-Direct (+40%)</span>
          </button>

          <button
            role="tab"
            aria-selected={activeSection === "roast-schedule"}
            onClick={() => selectTab("roast-schedule")}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSection === "roast-schedule"
                ? "bg-[#1A1512] text-white shadow-sm"
                : "text-[#5C5042] hover:bg-[#FAF8F5] hover:text-[#1A1512]"
            }`}
          >
            <Flame size={14} className={activeSection === "roast-schedule" ? "text-[#E58A1F]" : "text-[#A3432A]"} />
            <span>48-Hr Roast Schedule</span>
          </button>

          <button
            role="tab"
            aria-selected={activeSection === "all"}
            onClick={() => selectTab("all")}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all ml-auto cursor-pointer ${
              activeSection === "all"
                ? "bg-[#A3432A] text-white shadow-sm"
                : "text-[#5C5042] hover:bg-[#FAF8F5] hover:text-[#1A1512]"
            }`}
          >
            <Layers size={14} />
            <span>View All Standards</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* CURRENTLY VIEWING CALLOUT BANNER */}
        {activeSection !== "all" && activeSection !== "catalog" && (
          <div className="mb-6 p-4 rounded-xl bg-white border border-[#E6DEC8] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#A3432A] animate-pulse" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1A1512]">
                Focus Standard:{" "}
                <span className="text-[#A3432A]">
                  {activeSection === "terroir" && "Pillar 01 // 2,000M+ Mist-Grown Altitude Terroir"}
                  {activeSection === "sca-quality" && "Pillar 02 // 84+ SCA Cupping Lab Protocol"}
                  {activeSection === "farmer-impact" && "Pillar 03 // 100% Farmer-Direct (+40% Living Wages)"}
                  {activeSection === "roast-schedule" && "Pillar 04 // 48-Hour Roast-to-Door Degassing Window"}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => selectTab("catalog")}
              className="font-mono text-xs font-bold text-[#A3432A] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Browse Coffees <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* 3. DYNAMIC CONTENT CONTAINER */}
        <div className="space-y-16">

          {/* SECTION A: COFFEE CATALOG (Active if catalog or all) */}
          {(activeSection === "catalog" || activeSection === "all") && (
            <div id="origins-catalog" className="space-y-8">
              <div className="flex items-center justify-between border-b border-[#1A1512]/15 pb-4">
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#A3432A]">
                    HARVEST CATALOGUE // CURRENT LOT DISPATCH
                  </span>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#1A1512] mt-0.5">
                    Himalayan Micro-Lot Dossiers
                  </h2>
                </div>
                <span className="font-mono text-xs text-[#5C5042] font-semibold hidden sm:inline-block">
                  Hand-sorted 3x • 100% High-Grown Arabica
                </span>
              </div>

              <div className="space-y-8">
                {origins.map((origin) => (
                  <div 
                    key={origin.id} 
                    className="bg-white rounded-2xl border border-[#E6DEC8] overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col lg:flex-row"
                  >
                    {/* Visual Media Panel */}
                    <div className="lg:w-2/5 relative min-h-[280px] lg:min-h-full">
                      <img 
                        src={origin.img} 
                        alt={origin.name} 
                        loading="lazy" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                      
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1 rounded-md bg-[#1A1512]/90 text-white font-mono text-xs font-bold uppercase tracking-wider border border-white/20">
                          {origin.scaScore}
                        </span>
                        <span className="px-3 py-1 rounded-md bg-[#A3432A] text-white font-mono text-xs font-bold uppercase tracking-wider">
                          {origin.lotCode}
                        </span>
                      </div>

                      <div className="absolute bottom-5 left-5 right-5 text-white">
                        <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-[#E58A1F] font-bold mb-1">
                          <MapPin size={13} /> {origin.region}
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">{origin.name}</h3>
                      </div>
                    </div>

                    {/* Technical Origin Spec Dossier */}
                    <div className="lg:w-3/5 p-6 sm:p-8 flex flex-col justify-between">
                      <div>
                        <p className="text-[#5C5042] text-sm leading-relaxed mb-6 font-sans">
                          {origin.description}
                        </p>

                        {/* Roastery Spec Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 bg-[#FAF8F5] rounded-xl border border-[#E6DEC8] font-mono text-xs">
                          <div>
                            <div className="uppercase tracking-wider text-[#5C5042] font-bold mb-1 flex items-center gap-1">
                              <Droplets size={12} className="text-[#A3432A]" /> Process
                            </div>
                            <div className="text-[#1A1512] font-semibold">{origin.process}</div>
                          </div>
                          <div>
                            <div className="uppercase tracking-wider text-[#5C5042] font-bold mb-1 flex items-center gap-1">
                              <Mountain size={12} className="text-[#A3432A]" /> Elevation
                            </div>
                            <div className="text-[#1A1512] font-semibold">{origin.altitude}</div>
                          </div>
                          <div>
                            <div className="uppercase tracking-wider text-[#5C5042] font-bold mb-1 flex items-center gap-1">
                              <Star size={12} className="text-[#E58A1F]" /> Notes
                            </div>
                            <div className="text-[#1A1512] font-semibold">{origin.flavor}</div>
                          </div>
                          <div>
                            <div className="uppercase tracking-wider text-[#5C5042] font-bold mb-1 flex items-center gap-1">
                              <Coffee size={12} className="text-[#A3432A]" /> Roast
                            </div>
                            <div className="text-[#1A1512] font-semibold">{origin.roast}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#F0EAE1]">
                        <div className="font-mono text-xs text-[#5C5042]">
                          Dispatched within <strong className="text-[#1A1512]">48 hours of roast</strong>
                        </div>
                        <Link
                          href={`/subscribe?origin=${origin.id}&name=${encodeURIComponent(origin.name)}`}
                          className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A3432A] text-white font-mono text-xs uppercase tracking-widest font-bold hover:bg-[#8A3722] transition-colors shadow-xs active:scale-[0.99] cursor-pointer"
                        >
                          <span>Calibrate {origin.name}</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION B: 2,000M+ MIST TERROIR (Active if terroir or all) */}
          {(activeSection === "terroir" || activeSection === "all") && (
            <div id="terroir" className="bg-white border border-[#E6DEC8] rounded-2xl p-6 md:p-10 shadow-xs space-y-8">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FAF5EC] border border-[#E6DEC8] text-[#A3432A] font-mono text-xs font-bold uppercase tracking-wider mb-3">
                  <Mountain size={13} /> Technical Pillar 01 // Elevation Stress
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1512] mb-3">
                  2,000M+ Mist-Grown: The Extreme Altitude Terroir
                </h2>
                <p className="text-[#5C5042] text-sm md:text-base leading-relaxed">
                  Nepal sits at the northernmost rim of the global coffee belt (28°N). Combined with the extreme elevation of Gulmi, Ilam, and Nuwakot (1,400m to 2,000m), coffee plants experience dramatic climatic stress that directly enhances bean cellular density and sucrose concentration.
                </p>
              </div>

              {/* 3 Metric Pillar Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8]">
                  <div className="text-2xl font-serif font-bold text-[#A3432A] mb-1">15°C - 18°C</div>
                  <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-[#1A1512] mb-2">Diurnal Swing</h3>
                  <p className="text-xs text-[#5C5042] leading-relaxed">
                    Freezing mountain nights drop below 4°C during winter months. This slows down cherry respiration, extending harvest maturation from 6 months to 9 full months.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8]">
                  <div className="text-2xl font-serif font-bold text-[#A3432A] mb-1">Strictly Hard Bean (SHB)</div>
                  <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-[#1A1512] mb-2">Cellular Density</h3>
                  <p className="text-xs text-[#5C5042] leading-relaxed">
                    Prolonged cherry maturation forces plants to pack dense sucrose, phosphoric acid, and complex lipid structures into the seed, resulting in rich crema and aromatics.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8]">
                  <div className="text-2xl font-serif font-bold text-[#A3432A] mb-1">Glacial Mineral Runoff</div>
                  <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-[#1A1512] mb-2">Himalayan Terroir</h3>
                  <p className="text-xs text-[#5C5042] leading-relaxed">
                    Fed by snowmelt from the Annapurna and Kanchenjunga ranges. Natural drainage along steep terraced slopes prevents root waterlogging and imparts crisp mineral acidity.
                  </p>
                </div>
              </div>

              {/* Elevation Altitude Scale */}
              <div className="p-6 bg-[#1A1512] text-white rounded-xl border border-[#3E342F]">
                <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-[#E58A1F] mb-4 flex items-center gap-2">
                  <TrendingUp size={14} /> Elevation vs Flavor Profile Spectrum
                </h4>
                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Ilam High Mountain Ridges (1,800m - 2,000m)</span>
                      <span className="text-[#E58A1F]">Intense Jasmine Floral & Blackberry (SHB)</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-[#E58A1F] h-2 rounded-full w-full"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Gulmi Western Terraces (1,400m - 1,800m)</span>
                      <span className="text-[#E58A1F]">Sparkling Malic Acidity & Wild Honey</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-[#E58A1F] h-2 rounded-full w-[85%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Nuwakot Foothills (1,200m - 1,500m)</span>
                      <span className="text-white/60">Heavy Body, Warm Walnut & Molasses</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-white/40 h-2 rounded-full w-[65%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {activeSection === "terroir" && (
                <div className="pt-4 border-t border-[#F0EAE1] flex items-center justify-between font-mono text-xs">
                  <button onClick={() => selectTab("catalog")} className="font-bold text-[#5C5042] hover:text-[#1A1512] cursor-pointer">
                    ← Back to Coffee Dossiers
                  </button>
                  <button onClick={() => selectTab("sca-quality")} className="inline-flex items-center gap-1.5 font-bold text-[#A3432A] hover:underline cursor-pointer">
                    Next: View 84+ SCA Cupping Lab <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECTION C: 84+ SCA CUP SCORE (Active if sca-quality or all) */}
          {(activeSection === "sca-quality" || activeSection === "all") && (
            <div id="sca-quality" className="bg-white border border-[#E6DEC8] rounded-2xl p-6 md:p-10 shadow-xs space-y-8">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FAF5EC] border border-[#E6DEC8] text-[#A3432A] font-mono text-xs font-bold uppercase tracking-wider mb-3">
                  <Award size={13} /> Technical Pillar 02 // Sensory Protocol
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1512] mb-3">
                  84+ SCA Cup Score: Empirical Specialty Lab Protocol
                </h2>
                <p className="text-[#5C5042] text-sm md:text-base leading-relaxed">
                  In specialty coffee, grade is an empirical, calibrated cupping test governed by the Specialty Coffee Association (SCA). Only the top 3% of Arabica beans globally score 84 points or higher.
                </p>
              </div>

              {/* Official Cupping Scorecard */}
              <div className="border border-[#E6DEC8] rounded-xl overflow-hidden font-mono text-xs">
                <div className="bg-[#FAF8F5] p-5 border-b border-[#E6DEC8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[#5C5042]">Calibration Standard</span>
                    <h3 className="font-serif font-bold text-lg text-[#1A1512] mt-0.5">SCA 100-Point Sensory Cupping Breakdown</h3>
                  </div>
                  <div className="flex items-center gap-2 bg-[#1A1512] text-white px-4 py-2 rounded-lg text-xs font-bold">
                    <Award size={15} className="text-[#E58A1F]" /> Certified Lot Score: 86.5 / 100
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E6DEC8] bg-white">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold uppercase tracking-wider text-[#5C5042]">Fragrance & Aroma</span>
                      <span className="font-bold text-[#A3432A]">8.50 / 10</span>
                    </div>
                    <p className="text-xs text-[#5C5042] font-sans leading-relaxed">
                      Dry fragrance of wild jasmine blossom, bergamot, and sweet stone fruit bloom upon crust break.
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold uppercase tracking-wider text-[#5C5042]">Acidity & Brightness</span>
                      <span className="font-bold text-[#A3432A]">8.75 / 10</span>
                    </div>
                    <p className="text-xs text-[#5C5042] font-sans leading-relaxed">
                      Lively malic & crisp phosphoric acidity characteristic of high elevation. Zero harsh vinegar notes.
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold uppercase tracking-wider text-[#5C5042]">Body & Mouthfeel</span>
                      <span className="font-bold text-[#A3432A]">8.50 / 10</span>
                    </div>
                    <p className="text-xs text-[#5C5042] font-sans leading-relaxed">
                      Smooth, silky coating with rich tactile persistence. Syrupy caramel finish without chalky residue.
                    </p>
                  </div>

                  <div className="p-6 border-t border-[#E6DEC8]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold uppercase tracking-wider text-[#5C5042]">Clean Cup & Uniformity</span>
                      <span className="font-bold text-[#2E6B34]">10.0 / 10</span>
                    </div>
                    <p className="text-xs text-[#5C5042] font-sans leading-relaxed">
                      5 out of 5 cupping bowls identical. Zero phenolic taint, sour beans, or processing defects.
                    </p>
                  </div>

                  <div className="p-6 border-t border-[#E6DEC8]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold uppercase tracking-wider text-[#5C5042]">Sweetness</span>
                      <span className="font-bold text-[#2E6B34]">10.0 / 10</span>
                    </div>
                    <p className="text-xs text-[#5C5042] font-sans leading-relaxed">
                      Natural caramelized sucrose and mountain flower honey from slow cherry ripening.
                    </p>
                  </div>

                  <div className="p-6 border-t border-[#E6DEC8]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold uppercase tracking-wider text-[#5C5042]">Overall Balance</span>
                      <span className="font-bold text-[#A3432A]">8.75 / 10</span>
                    </div>
                    <p className="text-xs text-[#5C5042] font-sans leading-relaxed">
                      Harmony between sparkling fruit acidity, lingering cocoa, and velvety body. Q-Grader certified.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8] flex items-start gap-4">
                <CheckCircle2 size={22} className="text-[#2E6B34] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-[#1A1512] mb-1">
                    Zero Primary Defect Standard
                  </h4>
                  <p className="text-xs text-[#5C5042] leading-relaxed">
                    Prior to roasting, 350 grams of green beans from each batch undergo manual inspection under calibrated daylight lamps. Black beans, sour cherries, and insect damage are rejected.
                  </p>
                </div>
              </div>

              {activeSection === "sca-quality" && (
                <div className="pt-4 border-t border-[#F0EAE1] flex items-center justify-between font-mono text-xs">
                  <button onClick={() => selectTab("terroir")} className="font-bold text-[#5C5042] hover:text-[#1A1512] cursor-pointer">
                    ← Previous: 2,000m+ Terroir
                  </button>
                  <button onClick={() => selectTab("farmer-impact")} className="inline-flex items-center gap-1.5 font-bold text-[#A3432A] hover:underline cursor-pointer">
                    Next: Farmer-Direct (+40%) <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECTION D: 100% FARMER DIRECT (Active if farmer-impact or all) */}
          {(activeSection === "farmer-impact" || activeSection === "all") && (
            <div id="farmer-impact" className="bg-white border border-[#E6DEC8] rounded-2xl p-6 md:p-10 shadow-xs space-y-8">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#E7F3E8] border border-[#C3E4C6] text-[#2E6B34] font-mono text-xs font-bold uppercase tracking-wider mb-3">
                  <ShieldCheck size={13} /> Technical Pillar 03 // Economic Parity
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1512] mb-3">
                  100% Farmer-Direct: Transparent Living Wages (+40% Above Market)
                </h2>
                <p className="text-[#5C5042] text-sm md:text-base leading-relaxed">
                  In conventional coffee trading, an average of 4 middlemen siphon away profits before reaching the mountain farmer. BrewMellow contracts directly with mountain grower cooperatives in Western and Eastern Nepal.
                </p>
              </div>

              {/* Pricing Model Comparison Table */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
                <div className="p-6 rounded-xl bg-white border border-red-200">
                  <span className="uppercase tracking-widest font-bold text-red-600 block mb-1">Global C-Price Commodity</span>
                  <h3 className="text-xl font-serif font-bold text-[#1A1512] mb-2">NPR 320 - 380 / kg</h3>
                  <p className="text-xs text-[#5C5042] font-sans leading-relaxed mb-4">
                    Volatile exchange pricing. Middlemen take 65% margin; farmers cannot cover compost and labor costs.
                  </p>
                  <div className="font-semibold text-red-600 flex items-center gap-1">
                    <ShieldAlert size={14} /> Sub-Living Wage Deficit
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-white border border-[#E6DEC8]">
                  <span className="uppercase tracking-widest font-bold text-[#5C5042] block mb-1">Standard Fair Trade Floor</span>
                  <h3 className="text-xl font-serif font-bold text-[#1A1512] mb-2">NPR 450 - 520 / kg</h3>
                  <p className="text-xs text-[#5C5042] font-sans leading-relaxed mb-4">
                    Basic certifier floor price. Covers subsistence living, but lacks capital for drying domes or soil tests.
                  </p>
                  <div className="font-semibold text-[#5C5042] flex items-center gap-1">
                    <Scale size={14} /> Baseline Survival Rate
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-[#FAF8F5] border-2 border-[#2E6B34]">
                  <span className="uppercase tracking-widest font-bold text-[#2E6B34] block mb-1">BrewMellow Direct Trade</span>
                  <h3 className="text-xl font-serif font-bold text-[#2E6B34] mb-2">NPR 680 - 750 / kg</h3>
                  <p className="text-xs text-[#5C5042] font-sans leading-relaxed mb-4">
                    Paid directly into cooperative accounts with zero broker cuts. Guarantees +40% to +50% above market minimums.
                  </p>
                  <div className="font-bold text-[#2E6B34] flex items-center gap-1">
                    <CheckCircle2 size={14} /> Dignified Mountain Prosperity
                  </div>
                </div>
              </div>

              {/* Cooperative Impact Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 bg-[#FAF8F5] rounded-xl border border-[#E6DEC8]">
                <div className="flex items-start gap-3">
                  <Users size={22} className="text-[#2E6B34] shrink-0 mt-1" />
                  <div>
                    <p className="text-2xl font-serif font-bold text-[#1A1512]">180+ Families</p>
                    <p className="text-xs text-[#5C5042]">Smallholder farmers in Gulmi Coffee Producers Association</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mountain size={22} className="text-[#E58A1F] shrink-0 mt-1" />
                  <div>
                    <p className="text-2xl font-serif font-bold text-[#1A1512]">100% Shade-Grown</p>
                    <p className="text-xs text-[#5C5042]">Native alder and oak canopy preserves Himalayan songbird habitat</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <TrendingUp size={22} className="text-[#A3432A] shrink-0 mt-1" />
                  <div>
                    <p className="text-2xl font-serif font-bold text-[#1A1512]">5% Reinvestment</p>
                    <p className="text-xs text-[#5C5042]">Dedicated to building raised solar dehydration beds in Ilam & Gulmi</p>
                  </div>
                </div>
              </div>

              {activeSection === "farmer-impact" && (
                <div className="pt-4 border-t border-[#F0EAE1] flex items-center justify-between font-mono text-xs">
                  <button onClick={() => selectTab("sca-quality")} className="font-bold text-[#5C5042] hover:text-[#1A1512] cursor-pointer">
                    ← Previous: 84+ SCA Cupping Lab
                  </button>
                  <button onClick={() => selectTab("roast-schedule")} className="inline-flex items-center gap-1.5 font-bold text-[#A3432A] hover:underline cursor-pointer">
                    Next: 48-Hr Roast Schedule <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECTION E: 48-HR ROAST-TO-DOOR (Active if roast-schedule or all) */}
          {(activeSection === "roast-schedule" || activeSection === "all") && (
            <div id="roast-schedule" className="bg-[#1A1512] text-white border border-[#3E342F] rounded-2xl p-6 md:p-10 shadow-lg space-y-8">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 text-[#E58A1F] font-mono text-xs font-bold uppercase tracking-wider mb-3 border border-white/10">
                  <Flame size={13} /> Technical Pillar 04 // Peak Degassing
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">
                  48-HR Roast-to-Door: The Degassing & Freshness Curve
                </h2>
                <p className="text-[#C8BFAB] text-sm md:text-base leading-relaxed">
                  Commercial coffee bought in supermarkets is frequently roasted 3 to 9 months prior to consumption. Peak aromatics and crema are expressed between Day 3 and Day 21 post-roast.
                </p>
              </div>

              {/* Production Timeline Visual */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-mono text-xs">
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[#E58A1F] mb-2">
                    <Clock size={14} /> Day 00 • Hour 00
                  </div>
                  <h3 className="font-serif font-bold text-base text-white mb-2">Cast-Iron Roasting</h3>
                  <p className="text-xs text-[#A89F91] font-sans leading-relaxed">
                    Roasted in 5kg micro-batches on our Lalitpur drum roaster. Computer-profiled to preserve origin acidities.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[#E58A1F] mb-2">
                    <Clock size={14} /> Day 01 • Hour 24
                  </div>
                  <h3 className="font-serif font-bold text-base text-white mb-2">CO2 Stabilization</h3>
                  <p className="text-xs text-[#A89F91] font-sans leading-relaxed">
                    Beans rest in airtight valved bags. Unwanted excess CO2 vents out without letting oxygen into the package.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[#E58A1F] mb-2">
                    <Clock size={14} /> Day 02 • Hour 48
                  </div>
                  <h3 className="font-serif font-bold text-base text-white mb-2">Doorstep Dispatch</h3>
                  <p className="text-xs text-[#A89F91] font-sans leading-relaxed">
                    Hand-stamped with exact Roast Date and master roaster batch number. Dispatched immediately to your home.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-[#A3432A]/20 border border-[#A3432A]/50">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[#E58A1F] mb-2">
                    <Star size={14} /> Day 03 to 21
                  </div>
                  <h3 className="font-serif font-bold text-base text-white mb-2">Peak Flavor Window</h3>
                  <p className="text-xs text-white/90 font-sans leading-relaxed">
                    Crema richness, sweet aroma bloom, and complex fruit notes are at their maximum sensory peak.
                  </p>
                </div>
              </div>

              {/* Roasting Schedule Calendar */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-full bg-[#E58A1F]/20 text-[#E58A1F] shrink-0">
                    <Calendar size={26} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-lg text-white">Lalitpur Roastery Schedule</h4>
                    <p className="text-xs text-[#C8BFAB] font-sans mt-0.5">
                      Batches are roasted every <strong>Monday & Wednesday morning</strong>. Orders placed before 10:00 AM dispatch same-day.
                    </p>
                  </div>
                </div>

                <Link
                  href="/subscribe?plan=PAYG"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#A3432A] text-white font-mono text-xs uppercase tracking-widest font-bold hover:bg-[#8A3722] transition-colors shrink-0 shadow-md cursor-pointer"
                >
                  <span>Start Fresh Cycle</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {activeSection === "roast-schedule" && (
                <div className="pt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs text-white/70">
                  <button onClick={() => selectTab("farmer-impact")} className="font-bold hover:text-white cursor-pointer">
                    ← Previous: Farmer-Direct (+40%)
                  </button>
                  <button onClick={() => selectTab("catalog")} className="inline-flex items-center gap-1.5 font-bold text-[#E58A1F] hover:underline cursor-pointer">
                    Browse 3 Signature Coffees <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* 4. FOOTER RETURN / CALL TO ACTION */}
        <div className="mt-16 p-8 md:p-12 bg-white border border-[#E6DEC8] rounded-2xl text-center shadow-xs">
          <div className="w-10 h-10 rounded-full bg-[#FAF5EC] border border-[#E6DEC8] flex items-center justify-center text-[#A3432A] mx-auto mb-3">
            <Coffee size={20} />
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#1A1512] mb-2">Ready to Experience the Terroir?</h3>
          <p className="text-xs md:text-sm text-[#5C5042] max-w-lg mx-auto mb-6">
            Get freshly roasted single-origin coffees delivered on recurring monthly cycles with free doorstep shipping.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/subscribe?plan=PAYG"
              className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 bg-[#A3432A] text-white font-mono text-xs uppercase tracking-widest font-bold rounded-xl hover:bg-[#8A3722] transition-colors shadow-xs cursor-pointer"
            >
              <span>Build Your Subscription</span>
              <ArrowRight size={14} />
            </Link>
            <Link 
              href="/"
              className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 border border-[#E6DEC8] bg-[#FAF8F5] text-[#1A1512] font-mono text-xs uppercase tracking-widest font-bold rounded-xl hover:bg-white transition-colors cursor-pointer"
            >
              Return to Storefront
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function OriginsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center font-serif text-lg text-[#1A1512]">
        Loading Himalayan Origins...
      </div>
    }>
      <OriginsContent />
    </Suspense>
  );
}
