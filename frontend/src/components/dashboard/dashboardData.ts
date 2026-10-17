// Rich Origin Metadata for Dashboard & Member Experience
export const ORIGIN_DETAILS: Record<
  string,
  {
    notes: string[];
    altitude: string;
    process: string;
    region: string;
    img: string;
    roasterNote: string;
    idealBrew: string;
    ratio: string;
    temp: string;
    bloom: string;
  }
> = {
  "Gulmi Reserve": {
    notes: ["Citrus Blossom", "Wild Honey", "Dark Chocolate"],
    altitude: "1,600m",
    process: "Fully Washed",
    region: "Gulmi, Western Nepal",
    img: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=800&auto=format&fit=crop",
    roasterNote: "Micro-lot grown under Himalayan rhododendron canopy. Roasted gently to preserve crisp citrus floral aromas.",
    idealBrew: "Pour-Over (V60 / Chemex)",
    ratio: "1:16 (15g : 240ml)",
    temp: "93°C (Right off boil)",
    bloom: "45s Aroma Bloom",
  },
  "Ilam Gold": {
    notes: ["Alpine Berry", "White Jasmine", "Warm Caramel"],
    altitude: "1,800m",
    process: "Sun-Dried Natural",
    region: "Ilam, Eastern Nepal",
    img: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=800&auto=format&fit=crop",
    roasterNote: "Cherry-dried on raised bamboo beds. Rich sweetness infused with the dense high mists of the eastern tea belt.",
    idealBrew: "Aeropress / Moka Pot",
    ratio: "1:14 (17g : 240ml)",
    temp: "91°C",
    bloom: "30s Immersion",
  },
  "Nuwakot Heritage": {
    notes: ["Roasted Walnut", "Dark Molasses", "Spiced Plum"],
    altitude: "1,400m",
    process: "Honey Processed",
    region: "Nuwakot Foothills, Nepal",
    img: "https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=800&auto=format&fit=crop",
    roasterNote: "Cultivated in Kathmandu's northern alpine valley. Velvety, heavy-bodied cup with comforting nutty tones.",
    idealBrew: "French Press / Cold Brew",
    ratio: "1:15 (18g : 270ml)",
    temp: "94°C",
    bloom: "60s Full Immersion",
  },
};

export const resolveOriginDetails = (name?: string) => {
  if (!name) return ORIGIN_DETAILS["Gulmi Reserve"];
  if (ORIGIN_DETAILS[name]) return ORIGIN_DETAILS[name];
  if (name.includes("Trio")) {
    return {
      notes: ["Alpine Honey", "Wild Berry", "Roasted Walnut"],
      altitude: "1,400m - 1,800m",
      process: "Washed + Natural + Honey Trio",
      region: "Gulmi, Ilam & Nuwakot (All Regions)",
      img: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=800&auto=format&fit=crop",
      roasterNote: "Complete Himalayan 3-region discovery box featuring our master roaster's signature micro-lots across West, East, and Central Nepal.",
      idealBrew: "All Brew Methods (V60, French Press, Espresso)",
      ratio: "1:15 standard ratio",
      temp: "92°C - 94°C",
      bloom: "45s Full Bloom",
    };
  }
  if (name.includes("Duo") || name.includes("+")) {
    return {
      notes: ["Mountain Honey", "Wild Berry", "Caramel"],
      altitude: "1,600m - 1,800m",
      process: "Curated Dual Micro-lot",
      region: "Dual Himalayan Terroirs",
      img: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=800&auto=format&fit=crop",
      roasterNote: "A hand-paired duo designed for your day: morning bold roast and an afternoon bright pour-over.",
      idealBrew: "Espresso & Pour-Over",
      ratio: "1:15 standard ratio",
      temp: "92°C - 93°C",
      bloom: "40s Aroma Bloom",
    };
  }
  if (name.includes("Ilam")) return ORIGIN_DETAILS["Ilam Gold"];
  if (name.includes("Nuwakot")) return ORIGIN_DETAILS["Nuwakot Heritage"];
  return ORIGIN_DETAILS["Gulmi Reserve"];
};

export type TabType = "subscription" | "favorites" | "orders" | "returns" | "support";

export interface DashboardUser {
  name: string;
  email: string;
  phone?: string;
  address: string;
  memberSince: string;
  is_staff?: boolean;
}
