import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EB] font-sans pb-32">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <Link href="/" className="inline-flex items-center gap-2 text-[#8A7966] hover:text-[#2C2420] transition-colors mb-8 text-sm uppercase tracking-widest font-bold">
          <ArrowLeft size={16} /> Back to Store
        </Link>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#1A1512] mb-4">Our Story</h1>
        <p className="text-[#5C5042] text-lg max-w-2xl leading-relaxed">
          Born in the Himalayas. Roasted to perfection. Delivered to your door.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-white border border-[#E6DEC8] overflow-hidden flex flex-col md:flex-row">
          <div className="md:w-1/2 relative min-h-[400px]">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524350876685-274059332603?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center"></div>
          </div>
          <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
            <h2 className="text-3xl font-serif font-bold text-[#1A1512] mb-6">From Altitude to Attitude</h2>
            <p className="text-[#5C5042] leading-relaxed mb-6">
              Nepal's unique topography creates micro-climates that are perfectly suited for growing specialty Arabica coffee. However, for decades, this incredible potential was largely ignored by the global market.
            </p>
            <p className="text-[#5C5042] leading-relaxed mb-8">
              BrewMellow was founded by a collective of local roasters and farmers who decided it was time to share the authentic taste of the Himalayas with the world, cutting out the middlemen and delivering directly to your cup.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-sm text-[#8A7966] uppercase tracking-widest font-bold">
                <MapPin size={16} className="text-[#A3432A]" /> Sourced from 1,200m+ altitude
              </div>
              <div className="flex items-center gap-3 text-sm text-[#8A7966] uppercase tracking-widest font-bold">
                <MapPin size={16} className="text-[#A3432A]" /> Direct Trade with local farmers
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
