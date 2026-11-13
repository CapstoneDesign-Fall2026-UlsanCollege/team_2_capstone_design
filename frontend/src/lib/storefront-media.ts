export interface CategoryMediaConfig {
  heroImage: string;
  badge: string;
  headline: string;
  tagline: string;
  originDistrict: string;
  productFallbacks: {
    name: string;
    image: string;
    category: string;
  }[];
}

const CATEGORY_MEDIA_MAP: Record<string, CategoryMediaConfig> = {
  honey: {
    heroImage:
      "/images/products/himalayan-honey.svg",
    badge: "Himalayan Forest Terroir · 100% Raw & Wild Harvest",
    headline: "Pristine Mountain Wildflower & Cliff Honey Harvests",
    tagline:
      "Small-batch, cold-extracted mountain honey harvested by traditional Nepalese beekeepers.",
    originDistrict: "Lamjung & Kaski, Nepal",
    productFallbacks: [
      {
        name: "Raw Himalayan Wild Cliff Honey (500g)",
        image:
          "/images/products/himalayan-honey.svg",
        category: "Raw Honey",
      },
      {
        name: "High-Altitude White Forest Honey (350g)",
        image:
          "/images/products/himalayan-honey.svg",
        category: "Wild Honey",
      },
      {
        name: "Himalayan Ginger & Tulsi Honey Infusion",
        image:
          "/images/products/himalayan-honey.svg",
        category: "Herbal Infusions",
      },
      {
        name: "Artisanal Raw Comb Honey Cut (250g)",
        image:
          "/images/products/himalayan-honey.svg",
        category: "Comb Honey",
      },
    ],
  },
  coffee: {
    heroImage:
      "/images/products/gulmi-reserve.svg",
    badge: "High-Altitude Micro-Roast · Single-Origin Nuwakot & Ilam",
    headline: "Freshly Roasted Arabica Beans & Orthodox Mountain Teas",
    tagline:
      "Direct trade single-origin beans roasted in small batches for exceptional aroma and crema.",
    originDistrict: "Nuwakot & Ilam, Nepal",
    productFallbacks: [
      {
        name: "Single-Origin Nuwakot Arabica Whole Bean (250g)",
        image:
          "/images/products/gulmi-reserve.svg",
        category: "Specialty Coffee",
      },
      {
        name: "Ilam First Flush Orthodox Black Tea (100g)",
        image:
          "/images/products/ilam-gold.svg",
        category: "Artisanal Tea",
      },
      {
        name: "Everest Dark Roast Filter Blend (500g)",
        image:
          "/images/products/nuwakot-heritage.svg",
        category: "Espresso & Roast",
      },
      {
        name: "Himalayan Herbal Lemongrass Green Tea",
        image:
          "/images/products/ilam-gold.svg",
        category: "Herbal Tea",
      },
    ],
  },
  streetwear: {
    heroImage:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80",
    badge: "Kathmandu Streetwear Cut · Heavyweight Fabric & Raw Hemp",
    headline: "Contemporary Apparel & Heavyweight Essentials",
    tagline:
      "Architectural cuts, enduring textiles, and raw Himalayan hemp designed for Kathmandu streets.",
    originDistrict: "Kathmandu, Nepal",
    productFallbacks: [
      {
        name: "Heavyweight Boxy Drop-Shoulder Tee",
        image:
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
        category: "Apparel",
      },
      {
        name: "Raw Himalayan Hemp Utility Tote",
        image:
          "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
        category: "Bags & Gear",
      },
      {
        name: "Ribbed Mountain Wool Fisherman Beanie",
        image:
          "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=800&q=80",
        category: "Headwear",
      },
      {
        name: "Minimalist Oversized Utility Jacket",
        image:
          "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80",
        category: "Outerwear",
      },
    ],
  },
  crafts: {
    heroImage:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80",
    badge: "Heritage Craft · Hand-Hammered & Loom-Woven in Patan",
    headline: "Authentic Himalayan Craftsmanship & Handloom Textiles",
    tagline:
      "Handmade metalwork, singing bowls, and pure pashmina crafted by generational masters.",
    originDistrict: "Patan & Bhaktapur, Nepal",
    productFallbacks: [
      {
        name: "Hand-Hammered 7-Metal Tibetan Singing Bowl",
        image:
          "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
        category: "Sacred Metalwork",
      },
      {
        name: "Pure Dhaka Handwoven Pashmina Stole",
        image:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        category: "Textiles",
      },
      {
        name: "Artisanal Studio Ceramic Matcha Tumbler",
        image:
          "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80",
        category: "Ceramics",
      },
      {
        name: "Handmade Daphne Lokta Journal (Hardbound)",
        image:
          "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
        category: "Paper & Stationary",
      },
    ],
  },
  bakery: {
    heroImage:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    badge: "Baked Fresh Every Morning · Pure Butter & Local Grains",
    headline: "Artisan Sourdough Loaves, Pastries & Sweet Delicacies",
    tagline:
      "Slow-fermented artisan sourdough, golden laminated croissants, and handcrafted treats.",
    originDistrict: "Jhamsikhel, Lalitpur",
    productFallbacks: [
      {
        name: "Heritage Sourdough Country Loaf",
        image:
          "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
        category: "Sourdough",
      },
      {
        name: "French Butter Almond Croissant (Box of 4)",
        image:
          "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
        category: "Viennoiserie",
      },
      {
        name: "Artisan Dark Chocolate Sea-Salt Brownies",
        image:
          "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80",
        category: "Confectionery",
      },
    ],
  },
  default: {
    heroImage: "",
    badge: "Verified Nepali Merchant · Small-Batch Craftsmanship",
    headline: "Carefully Curated Local Goods Handcrafted in Nepal",
    tagline:
      "High standards, ethical local sourcing, and reliable local support.",
    originDistrict: "Kathmandu Valley, Nepal",
    productFallbacks: [
      {
        name: "Signature Craft Small-Batch Edition",
        image: "",
        category: "Signature",
      },
      {
        name: "Artisanal Studio Edition Reserve",
        image: "",
        category: "Reserve",
      },
      {
        name: "Handcrafted Heritage Selection",
        image:
          "/images/products/himalayan-honey.svg",
        category: "Heritage",
      },
    ],
  },
};

export function resolveCategoryKey(category?: string | null, themePreset?: string | null): string {
  const norm = `${category || ""} ${themePreset || ""}`.toLowerCase();
  if (norm.includes("honey") || norm.includes("herb") || norm.includes("spice") || norm.includes("sage")) {
    return "honey";
  }
  if (norm.includes("coffee") || norm.includes("tea") || norm.includes("roast") || norm.includes("editorial")) {
    return "coffee";
  }
  if (norm.includes("streetwear") || norm.includes("fashion") || norm.includes("apparel") || norm.includes("obsidian")) {
    return "streetwear";
  }
  if (norm.includes("craft") || norm.includes("handloom") || norm.includes("handicraft") || norm.includes("pashmina")) {
    return "crafts";
  }
  if (norm.includes("bakery") || norm.includes("sweet") || norm.includes("pastry") || norm.includes("bread")) {
    return "bakery";
  }
  return "default";
}

export function getCategoryMedia(category?: string | null, themePreset?: string | null): CategoryMediaConfig {
  const key = resolveCategoryKey(category, themePreset);
  return CATEGORY_MEDIA_MAP[key] || CATEGORY_MEDIA_MAP.default;
}

export function getProductFallbackImage(
  category?: string | null,
  themePreset?: string | null,
  index = 0
): { image: string; category: string } {
  const media = getCategoryMedia(category, themePreset);
  const fallbacks = media.productFallbacks;
  const picked = fallbacks[index % fallbacks.length];
  return {
    image: picked.image,
    category: picked.category,
  };
}
