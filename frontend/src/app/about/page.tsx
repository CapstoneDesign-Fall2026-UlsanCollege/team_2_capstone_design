import Link from "next/link";
import { ArrowLeft, MapPin, Coffee, ShieldCheck, Scale, FileText, Sparkles } from "lucide-react";

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
          Our Story & Standards
        </h1>
        <p className="text-[#5C5042] text-lg max-w-2xl leading-relaxed">
          Sustainably sourced from Nepal's high-altitude micro-lots, drum-roasted in Lalitpur, and delivered fresh to your door.
        </p>

        {/* Quick Nav Anchors */}
        <div className="flex flex-wrap gap-3 mt-8 text-xs uppercase tracking-wider font-bold">
          <a href="#story" className="px-4 py-2 bg-white rounded-full border border-[#E6DEC8] hover:border-[#A3432A] transition-colors">
            Our Heritage
          </a>
          <a href="#brew-guide" className="px-4 py-2 bg-white rounded-full border border-[#E6DEC8] hover:border-[#A3432A] transition-colors">
            Barista Brew Guide
          </a>
          <a href="#privacy" className="px-4 py-2 bg-white rounded-full border border-[#E6DEC8] hover:border-[#A3432A] transition-colors">
            Privacy Policy
          </a>
          <a href="#terms" className="px-4 py-2 bg-white rounded-full border border-[#E6DEC8] hover:border-[#A3432A] transition-colors">
            Terms of Service
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 space-y-16">
        
        {/* Section 1: Our Story */}
        <section id="story" className="bg-white border border-[#E6DEC8] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-sm scroll-mt-24">
          <div className="md:w-1/2 relative min-h-[400px]">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524350876685-274059332603?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center"></div>
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
             <div className="absolute bottom-6 left-6 text-white">
               <span className="text-xs uppercase tracking-widest font-bold text-[#E58A1F]">Lalitpur Roastery</span>
               <h3 className="text-xl font-serif font-bold">Craft Drum Roasting</h3>
             </div>
          </div>
          <div className="md:w-1/2 p-8 md:p-14 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A3432A] mb-2">Heritage & Terroir</span>
            <h2 className="text-3xl font-serif font-bold text-[#1A1512] mb-6">From Altitude to Attitude</h2>
            <p className="text-[#5C5042] text-sm leading-relaxed mb-4">
              Nepal's extreme topography creates high-altitude microclimates (1,400m - 2,000m) ideally suited for specialty Arabica Bourbon and Typica varieties.
            </p>
            <p className="text-[#5C5042] text-sm leading-relaxed mb-6">
              BrewMellow contracts directly with smallholder farming cooperatives in Gulmi, Ilam, and Nuwakot. We pay 40% above fair trade minimums, guaranteeing direct-trade dignity to mountain farmers.
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

        {/* Section 2: Barista Brew Guide */}
        <section id="brew-guide" className="bg-white border border-[#E6DEC8] rounded-2xl p-8 md:p-12 shadow-sm scroll-mt-24">
          <div className="flex items-center gap-2 text-[#A3432A] text-xs uppercase tracking-widest font-bold mb-2">
            <Coffee size={16} /> Brewing Recommendations
          </div>
          <h2 className="text-3xl font-serif font-bold text-[#1A1512] mb-3">Himalayan Extraction Guide</h2>
          <p className="text-[#5C5042] text-sm max-w-2xl mb-8 leading-relaxed">
            Because Himalayan beans are dense due to freezing mountain nights, they perform exceptionally well when extracted at precise ratios:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8]">
              <h3 className="font-serif font-bold text-lg text-[#1A1512] mb-1">V60 Pour-Over</h3>
              <p className="text-xs text-[#A3432A] font-semibold mb-3">Ratio 1:16 • 93°C Water</p>
              <p className="text-xs text-[#5C5042] leading-relaxed">
                15g coffee to 240ml water. 45s bloom, finish in 2:45 min. Accentuates Gulmi's sparkling citrus acidity and mountain honey notes.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8]">
              <h3 className="font-serif font-bold text-lg text-[#1A1512] mb-1">French Press</h3>
              <p className="text-xs text-[#A3432A] font-semibold mb-3">Ratio 1:15 • 95°C Water</p>
              <p className="text-xs text-[#5C5042] leading-relaxed">
                30g coarse coffee to 450ml water. 4-minute steep before gentle plunge. Delivers full velvety body for Nuwakot Heritage.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8]">
              <h3 className="font-serif font-bold text-lg text-[#1A1512] mb-1">Espresso / Moka</h3>
              <p className="text-xs text-[#A3432A] font-semibold mb-3">Ratio 1:2 • 9 Bar Pressure</p>
              <p className="text-xs text-[#5C5042] leading-relaxed">
                18g fine dose in, 36g liquid espresso out in 28-30s. Thick golden crema highlighting Ilam Gold's sweet berry undertones.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Privacy Policy */}
        <section id="privacy" className="bg-white border border-[#E6DEC8] rounded-2xl p-8 md:p-12 shadow-sm scroll-mt-24">
          <div className="flex items-center gap-2 text-[#A3432A] text-xs uppercase tracking-widest font-bold mb-2">
            <Scale size={16} /> Data Governance
          </div>
          <h2 className="text-3xl font-serif font-bold text-[#1A1512] mb-3">Privacy Policy</h2>
          <p className="text-xs text-[#8A7966] mb-6">Effective Date: October 2026 • Compliant with Nepal Privacy & Electronic Transactions Guidelines</p>
          
          <div className="space-y-4 text-xs text-[#5C5042] leading-relaxed">
            <p>
              <strong>1. Data Collection:</strong> We collect customer delivery details (name, delivery address in Nepal, phone number, and email) solely to fulfill your recurring monthly coffee subscription.
            </p>
            <p>
              <strong>2. Payment Security:</strong> We do not store raw card numbers. Payments are tokenized through licensed payment gateways (eSewa, Khalti, or secure card processing) adhering to banking encryption standards.
            </p>
            <p>
              <strong>3. Third-Party Sharing:</strong> Your address and contact number are shared strictly with our courier logistics partners for doorstep dispatch. We never sell customer records to advertisers.
            </p>
          </div>
        </section>

        {/* Section 4: Terms of Service */}
        <section id="terms" className="bg-white border border-[#E6DEC8] rounded-2xl p-8 md:p-12 shadow-sm scroll-mt-24">
          <div className="flex items-center gap-2 text-[#A3432A] text-xs uppercase tracking-widest font-bold mb-2">
            <FileText size={16} /> Subscriber Agreement
          </div>
          <h2 className="text-3xl font-serif font-bold text-[#1A1512] mb-3">Terms of Service & Cancellation</h2>
          <p className="text-xs text-[#8A7966] mb-6">BrewMellow Himalayan Roasters Pvt. Ltd.</p>
          
          <div className="space-y-4 text-xs text-[#5C5042] leading-relaxed">
            <p>
              <strong>1. Freshness Guarantee & Doorstep Returns:</strong> If you receive coffee that was roasted more than 48 hours before dispatch or if packaging was damaged in transit, you are entitled to a full replacement or courier pickup within 7 days via your Subscriber Portal.
            </p>
            <p>
              <strong>2. Skip, Pause & Cancellation:</strong> Monthly Pay-As-You-Go subscriptions can be skipped, paused, or canceled at any time directly through the dashboard with zero penalty prior to your next roast cycle.
            </p>
            <p>
              <strong>3. Delivery Zones:</strong> Free doorstep courier applies to Kathmandu, Lalitpur, and Bhaktapur, with express national parcel delivery across all major Nepal hubs.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
