import Link from "next/link";
import { ArrowLeft, MapPin, Coffee, Star, Droplets, Mountain } from "lucide-react";

const origins = [
  {
    id: 1,
    name: "Gulmi Reserve",
    region: "Gulmi, Western Nepal",
    altitude: "1,400 - 1,800m",
    process: "Fully Washed",
    flavor: "Citrus • Honey • Dark Chocolate",
    roast: "Medium-Light",
    img: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=800&auto=format&fit=crop",
    description: "Hand-picked from the misty hills of the Gulmi district. The high altitude and cool climate slow down the cherry maturation, resulting in a dense bean. The fully washed process brings out a bright, sparkling citrus acidity that perfectly balances a lingering honey sweetness and a dark chocolate finish.",
  },
  {
    id: 2,
    name: "Ilam Gold",
    region: "Ilam, Eastern Nepal",
    altitude: "1,500 - 2,000m",
    process: "Natural (Sun-dried)",
    flavor: "Berry • Jasmine • Caramel",
    roast: "Light",
    img: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=800&auto=format&fit=crop",
    description: "Grown in Nepal's premier tea-and-coffee belt. Unlike washed coffees, Ilam Gold is sun-dried with the coffee cherry intact. This meticulous natural process infuses the bean with intense fruit characteristics, delivering a heavy, syrupy body with a dominant berry-forward profile and delicate floral jasmine aromatics.",
  },
  {
    id: 3,
    name: "Nuwakot Heritage",
    region: "Nuwakot, Central Nepal",
    altitude: "1,200 - 1,600m",
    process: "Honey Processed",
    flavor: "Walnut • Brown Sugar • Plum",
    roast: "Medium-Dark",
    img: "https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=800&auto=format&fit=crop",
    description: "A heritage cultivar grown in the historical foothills just north of Kathmandu. The 'honey' process removes the skin but leaves the sticky fruit mucilage on the bean while drying. This hybrid method gives Nuwakot Heritage a velvety, heavy body with deep nutty tones and a rich brown-sugar depth.",
  },
];

export default function OriginsPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EB] font-sans pb-32">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <Link href="/" className="inline-flex items-center gap-2 text-[#8A7966] hover:text-[#2C2420] transition-colors mb-8 text-sm uppercase tracking-widest font-bold">
          <ArrowLeft size={16} /> Back to Store
        </Link>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#1A1512] mb-4">Discover Our Origins</h1>
        <p className="text-[#5C5042] text-lg max-w-2xl leading-relaxed">
          Every bean we roast tells the story of the Himalayan soil it was grown in. 
          Explore the unique altitudes, processing methods, and flavor profiles of our three signature regions.
        </p>
      </div>

      {/* Origin Showcase */}
      <div className="max-w-5xl mx-auto px-6 space-y-16">
        {origins.map((origin) => (
          <div key={origin.id} className="bg-white border border-[#E6DEC8] overflow-hidden flex flex-col md:flex-row">
            
            {/* Visual block */}
            <div className="md:w-1/3 relative min-h-[300px]">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${origin.img}')` }}></div>
              <div className="absolute inset-0 bg-[#1A1512]/60 mix-blend-overlay"></div>
              <div className="absolute inset-0 p-8 flex flex-col justify-center items-center text-center text-[#F5F2EB] z-10">
                <Mountain size={48} className="mb-4 text-[#D3C7B1]" />
                <h2 className="text-3xl font-serif font-bold mb-2">{origin.name}</h2>
                <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[#D3C7B1]">
                  <MapPin size={12} /> {origin.region}
                </div>
              </div>
            </div>

            {/* Content Block */}
            <div className="md:w-2/3 p-8 md:p-10">
              <p className="text-[#5C5042] text-base leading-relaxed mb-8">{origin.description}</p>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#8A7966] font-bold mb-1 flex items-center gap-2">
                    <Droplets size={12} /> Processing
                  </div>
                  <div className="text-[#1A1512] font-medium">{origin.process}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#8A7966] font-bold mb-1 flex items-center gap-2">
                    <Mountain size={12} /> Altitude
                  </div>
                  <div className="text-[#1A1512] font-medium">{origin.altitude}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#8A7966] font-bold mb-1 flex items-center gap-2">
                    <Star size={12} /> Tasting Notes
                  </div>
                  <div className="text-[#1A1512] font-medium">{origin.flavor}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#8A7966] font-bold mb-1 flex items-center gap-2">
                    <Coffee size={12} /> Roast Level
                  </div>
                  <div className="text-[#1A1512] font-medium">{origin.roast}</div>
                </div>
              </div>

              <Link
                href={`/subscribe?origin=${origin.id}&name=${encodeURIComponent(origin.name)}`}
                className="inline-block px-8 py-3 bg-[#F5F2EB] border border-[#E6DEC8] text-[#2C2420] text-sm uppercase tracking-widest font-bold hover:bg-[#EAE4D3] transition-colors"
              >
                Shop {origin.name}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
