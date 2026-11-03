"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  HelpCircle,
  Info,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  X,
} from "lucide-react";
import { formatNpr, ProductItem, SellingPlanItem, StorePublicMetadata } from "@/lib/api";
import { StorefrontHeader } from "./StorefrontHeader";
import { ProductGrid } from "./ProductGrid";
import { ProductDetailSheet, SelectedCartItem } from "./ProductDetailSheet";
import { StorefrontBottomNav } from "./StorefrontBottomNav";
import { useCart } from "./CartContext";

export interface StorefrontCatalogViewProps {
  store: StorePublicMetadata;
  products: ProductItem[];
  sellingPlans: SellingPlanItem[];
}

export function StorefrontCatalogView({
  store,
  products = [],
  sellingPlans = [],
}: StorefrontCatalogViewProps) {
  const { itemCount, openCart, addItem } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Theme-preset dynamic copy & showcase attributes
  const themeInfo = useMemo(() => {
    switch (store.theme_preset) {
      case "pahadi-sage":
        return {
          badge: "Himalayan Botanical Terroir · Direct Mountain Harvest",
          defaultTagline: "Pristine mountain teas, wild honey, and natural Himalayan harvests delivered fresh to your doorstep.",
          cardTag: "Mountain Terroir Origin",
          cardNote: "Direct ethical sourcing from high-altitude Himalayan cooperatives.",
        };
      case "ktm-bold":
        return {
          badge: "Kathmandu Urban Essentials · 24h Express Dispatch",
          defaultTagline: "Modern apparel, streetwear, and lifestyle essentials built for the streets of Nepal.",
          cardTag: "Independent Label",
          cardNote: "Contemporary craft engineered with strict local quality control.",
        };
      case "midnight-obsidian":
        return {
          badge: "Luxury Obsidian Curation · Precision Craft & Drops",
          defaultTagline: "Curated collections characterized by luxury craft, enduring materials, and refined doorstep delivery.",
          cardTag: "Obsidian Precision",
          cardNote: "Uncompromising standards for discerning collectors and connoisseurs.",
        };
      case "editorial-warm":
      default:
        return {
          badge: "Handcrafted Heritage · Nepal Artisanal Studio",
          defaultTagline: "Discover artisanal goods handcrafted with care in Nepal. Order online with instant Khalti ePayment and verified Cash on Delivery.",
          cardTag: "Official Storefront",
          cardNote: "Small-batch integrity settled 100% in Nepalese Rupees (NPR).",
        };
    }
  }, [store.theme_preset]);

  // Pure catalog from backend (no hardcoded coffee fallback)
  const fullCatalog: ProductItem[] = useMemo(() => {
    return products || [];
  }, [products]);

  // Derived category list
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    fullCatalog.forEach((p) => {
      const cat = p.category || (p.attributes as any)?.category;
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [fullCatalog]);

  // Filtered & Sorted catalog
  const filteredProducts = useMemo(() => {
    let result = [...fullCatalog];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter(
        (p) =>
          p.category === selectedCategory ||
          (p.attributes as any)?.category === selectedCategory
      );
    }

    if (inStockOnly) {
      result = result.filter((p) => {
        if (!p.variants || p.variants.length === 0) return true;
        return p.variants.some((v) => v.in_stock);
      });
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => {
        const pA = a.variants?.[0]?.price_minor || 0;
        const pB = b.variants?.[0]?.price_minor || 0;
        return pA - pB;
      });
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => {
        const pA = a.variants?.[0]?.price_minor || 0;
        const pB = b.variants?.[0]?.price_minor || 0;
        return pB - pA;
      });
    }

    return result;
  }, [fullCatalog, searchQuery, selectedCategory, inStockOnly, sortBy]);

  const handleOpenSheet = (product: ProductItem) => {
    setSelectedProduct(product);
    setIsSheetOpen(true);
  };

  const handleAddToCart = (item: SelectedCartItem) => {
    addItem({
      productId: item.productId,
      productSlug: item.productSlug,
      productName: item.productName,
      variantId: item.variantId,
      variantLabel: item.variantLabel,
      unitPriceMinor: item.unitPriceMinor,
      quantity: item.quantity,
      imageUrl: item.productImageUrl,
      purchaseType: item.purchaseType,
      sellingPlan: item.sellingPlan,
    });
  };

  const scrollToCollection = () => {
    const el = document.getElementById("collection-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNavCategorySelect = (category: string) => {
    setSelectedCategory(category);
    scrollToCollection();
  };

  // Dynamic Store FAQs
  const STORE_FAQS = [
    {
      q: "How does Cash on Delivery (COD) work?",
      a: "Select Cash on Delivery during checkout. Our delivery courier brings your package directly to your doorstep in Kathmandu or nationwide. You can inspect the package and pay the courier with cash or via mobile banking QR.",
    },
    {
      q: "What are your delivery times and shipping rates?",
      a: `Inside Kathmandu Valley orders typically arrive within 24 to 48 hours for Rs. ${formatNpr(store.inside_valley_shipping_minor || 10000)}. Outside Kathmandu Valley deliveries take 2 to 4 business days via Pathao express courier for Rs. ${formatNpr(store.outside_valley_shipping_minor || 20000)}.${store.free_shipping_threshold_minor ? ` Orders over ${formatNpr(store.free_shipping_threshold_minor)} qualify for FREE shipping!` : ""}`,
    },
    {
      q: "How do I pay with Khalti?",
      a: "Choose Khalti at checkout. You will be securely redirected to the Khalti payment gateway where you can authenticate with your mobile number and MPIN or scan the instant Fonepay/Khalti QR code. Once confirmed, you return right back to this storefront with your verified receipt.",
    },
    {
      q: "Can I subscribe for repeat deliveries?",
      a: "Yes! Items marked with 'Subscribe & Save' allow you to choose recurring prepaid delivery cycles (3, 6, or 12 cycles) or automated pay-per-delivery renewal links sent directly to your phone via WhatsApp and SMS without bank auto-debit.",
    },
  ];

  return (
    <div className="w-full min-h-dvh bg-sf-canvas text-sf-ink font-sf-body antialiased flex flex-col selection:bg-sf-cta selection:text-sf-cta-ink">
      
      {/* 1. Header with Sliding Marquee Announcement Bar */}
      <StorefrontHeader
        storeSlug={store.slug}
        storeName={store.name}
        tagline={store.tagline}
        logoUrl={store.logo_url}
        contactPhone={store.contact_phone}
        cartCount={itemCount}
        freeShippingThresholdMinor={store.free_shipping_threshold_minor}
        categories={availableCategories}
        onOpenCart={openCart}
        onOpenSearch={() => setSearchOpen((prev) => !prev)}
        onSelectCategory={handleNavCategorySelect}
        activeCategory={selectedCategory}
      />

      {/* Expandable Search Drawer */}
      {searchOpen && (
        <div className="w-full bg-sf-surface border-b border-sf-line px-4 py-3 animate-in fade-in duration-200">
          <div className="max-w-2xl mx-auto flex items-center gap-2.5">
            <Search className="w-4 h-4 text-sf-muted" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, variants, or categories..."
              className="w-full bg-transparent text-sm text-sf-ink placeholder:text-sf-muted focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 text-sf-muted hover:text-sf-ink cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="text-xs font-semibold text-sf-ink px-2 py-1 hover:underline cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 2. Pure Dynamic Masthead (Asymmetric, Niche-Agnostic) */}
      <section className="w-full border-b border-sf-line bg-sf-canvas pt-8 pb-10 sm:pt-14 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Left Column (7 cols): Editorial Typography */}
          <div className="md:col-span-7 space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-sf-surface border border-sf-line text-[11px] font-sf-mono text-sf-muted font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>{store.tagline ? "Verified Nepali Merchant" : themeInfo.badge}</span>
            </div>

            <h1 className="font-sf-display text-3xl sm:text-5xl font-bold tracking-tight text-sf-ink leading-[1.12]">
              {store.name}
            </h1>

            <p className="text-sm sm:text-base text-sf-muted leading-relaxed max-w-xl">
              {store.tagline || themeInfo.defaultTagline}
            </p>

            {/* Asymmetric Action Row */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={scrollToCollection}
                className="h-12 px-6 rounded-sf bg-sf-cta hover:opacity-95 text-sf-cta-ink text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.99] transition-all"
              >
                <span>Browse Products</span>
                <ArrowDown className="w-4 h-4" />
              </button>

              {store.contact_phone && (
                <a
                  href={`https://wa.me/977${store.contact_phone.replace(/\D/g, "")}?text=Hi%20${encodeURIComponent(store.name)}%2C%20I%20have%20an%20inquiry%20about%20your%20products.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 px-5 rounded-sf border border-sf-line bg-sf-surface hover:bg-sf-canvas text-sf-ink text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Order on WhatsApp</span>
                </a>
              )}
            </div>

            {/* Micro-Trust Strip */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-sf-mono text-sf-muted">
              <span>✓ Kathmandu Valley Delivery</span>
              <span>✓ Nationwide 7-Province Courier</span>
              <span>✓ Khalti &amp; COD Accepted</span>
            </div>
          </div>

          {/* Right Column (5 cols): Visual Badge / Accent Frame */}
          <div className="md:col-span-5 flex justify-center md:justify-end">
            <div className="w-full max-w-xs p-5 rounded-2xl border border-sf-line bg-sf-surface shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-sf-mono text-sf-muted border-b border-sf-line/60 pb-2.5">
                <span>Doorstep Dispatch</span>
                <span className="text-emerald-700 font-bold">● Active</span>
              </div>
              <div className="space-y-1.5 text-left">
                <span className="text-xs text-sf-muted uppercase font-sf-mono">{themeInfo.cardTag}</span>
                <h4 className="font-sf-display text-lg font-bold text-sf-ink">{store.name}</h4>
                <p className="text-xs text-sf-muted">
                  {themeInfo.cardNote}
                </p>
              </div>
              <div className="pt-2 text-[11px] font-sf-mono text-sf-muted flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Protected by ShopCraft Commerce</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Four-Pill Brand Trust & Guarantee Strip */}
      <section className="w-full border-b border-sf-line bg-sf-surface/50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-sf-canvas border border-sf-line flex items-center justify-center text-sf-ink shrink-0">
              <Truck className="w-4 h-4 text-sf-cta" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-sf-ink">Fast Delivery</h5>
              <p className="text-[11px] text-sf-muted leading-tight mt-0.5">24h Kathmandu &amp; 7 Provinces</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-sf-canvas border border-sf-line flex items-center justify-center text-sf-ink shrink-0">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-sf-ink">Khalti &amp; COD</h5>
              <p className="text-[11px] text-sf-muted leading-tight mt-0.5">Instant wallet or pay on delivery</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-sf-canvas border border-sf-line flex items-center justify-center text-sf-ink shrink-0">
              <Phone className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-sf-ink">Call &amp; WhatsApp</h5>
              <p className="text-[11px] text-sf-muted leading-tight mt-0.5">We confirm before dispatching</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-sf-canvas border border-sf-line flex items-center justify-center text-sf-ink shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-sf-ink">100% Nepali</h5>
              <p className="text-[11px] text-sf-muted leading-tight mt-0.5">Handcrafted authentic products</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Catalog & Products Section */}
      <section id="collection-section" className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
        
        {/* Controls Bar */}
        {availableCategories.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-sf-line">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                  selectedCategory === "all"
                    ? "bg-sf-ink text-sf-surface shadow-xs"
                    : "bg-sf-surface text-sf-muted border border-sf-line hover:text-sf-ink"
                }`}
              >
                All ({fullCatalog.length})
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                    selectedCategory === cat
                      ? "bg-sf-ink text-sf-surface shadow-xs"
                      : "bg-sf-surface text-sf-muted border border-sf-line hover:text-sf-ink"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort & Filter controls */}
            <div className="flex items-center gap-3 text-xs font-sf-mono">
              <label className="flex items-center gap-1.5 text-sf-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-sf-line accent-sf-cta"
                />
                <span>In Stock Only</span>
              </label>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-sf-surface border border-sf-line rounded px-2 py-1 text-sf-ink text-xs focus:outline-none"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        )}

        {/* Catalog Body or Pure Empty Template */}
        {fullCatalog.length === 0 ? (
          <div className="max-w-md mx-auto my-16 p-8 rounded-2xl border border-sf-line bg-sf-surface text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-sf-canvas border border-sf-line mx-auto flex items-center justify-center text-sf-muted">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-sf-display text-xl font-bold text-sf-ink">
                Catalog in Preparation
              </h3>
              <p className="text-xs text-sf-muted leading-relaxed">
                {store.name} hasn&apos;t published any items yet. We&apos;re stocking our shelves with fresh goods — please check back soon!
              </p>
            </div>

            {store.contact_phone && (
              <div className="pt-2">
                <a
                  href={`https://wa.me/977${store.contact_phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sf-ink text-sf-surface text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Inquire via WhatsApp</span>
                </a>
              </div>
            )}

            <div className="pt-4 border-t border-sf-line text-[11px] font-sf-mono text-sf-muted">
              <span>Are you the store owner? </span>
              <Link
                href={`/merchant/${encodeURIComponent(store.slug)}/products?action=new`}
                className="font-bold text-sf-cta underline hover:opacity-80"
              >
                Add your first product in the merchant console →
              </Link>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-sm font-semibold text-sf-ink">No products found matching your filter.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setInStockOnly(false);
              }}
              className="text-xs font-sf-mono text-sf-cta underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <ProductGrid
            storeSlug={store.slug}
            products={filteredProducts}
            onSelectProduct={handleOpenSheet}
          />
        )}

      </section>

      {/* 5. Brand Story & Heritage Card */}
      <section className="w-full border-t border-sf-line bg-sf-surface/40 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto rounded-3xl border border-sf-line bg-sf-surface p-6 sm:p-10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-8 text-left">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-sf-muted">
              <MapPin className="w-3.5 h-3.5 text-sf-cta" />
              <span>{store.address || "Kathmandu Valley, Nepal"}</span>
            </div>
            <h3 className="font-sf-display text-2xl font-bold text-sf-ink">
              {store.story_headline || `Crafted with Care by ${store.name}`}
            </h3>
            <p className="text-xs sm:text-sm text-sf-muted leading-relaxed font-sf-body">
              {store.about_text
                ? store.about_text.length > 220
                  ? store.about_text.slice(0, 220) + "..."
                  : store.about_text
                : (store.tagline ||
                  "Every item in our collection is carefully packaged and dispatched fresh. We believe in high standards, fair local sourcing, and seamless doorstep deliveries across Nepal.")}
            </p>
            {store.contact_phone && (
              <p className="text-xs text-sf-muted pt-1">
                Direct phone inquiries: <span className="font-mono font-bold text-sf-ink">{store.contact_phone}</span>
              </p>
            )}
          </div>

          <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <Link
              href={`/s/${encodeURIComponent(store.slug)}/about`}
              className="px-5 py-3 rounded-full border border-sf-line bg-sf-canvas hover:bg-sf-surface text-sf-ink text-xs font-semibold hover:border-sf-ink transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Our Story</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={scrollToCollection}
              className="px-6 py-3 rounded-full bg-sf-ink text-sf-surface text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Explore Products</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Customer Confidence & Reviews Strip */}
      <section className="w-full border-t border-sf-line bg-sf-canvas py-12 px-4 sm:px-6 lg:px-8 text-left">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-xs font-mono font-bold text-sf-ink ml-1.5">4.9 / 5.0</span>
              </div>
              <h4 className="font-sf-display text-lg font-bold text-sf-ink">
                Verified Shopper Experience
              </h4>
            </div>
            <span className="text-xs font-mono text-sf-muted">Based on verified orders across Nepal</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-sf-line bg-sf-surface space-y-2">
              <p className="text-xs text-sf-muted leading-relaxed">
                &quot;The checkout took less than 30 seconds with Khalti. Package arrived in Lalitpur the next afternoon!&quot;
              </p>
              <span className="text-[11px] font-mono font-bold text-sf-ink block">
                — Aarav S., Patan
              </span>
            </div>

            <div className="p-4 rounded-xl border border-sf-line bg-sf-surface space-y-2">
              <p className="text-xs text-sf-muted leading-relaxed">
                &quot;Paid cash on delivery when the Pathao rider arrived. Great packaging and verified quality.&quot;
              </p>
              <span className="text-[11px] font-mono font-bold text-sf-ink block">
                — Sushila K., Pokhara
              </span>
            </div>

            <div className="p-4 rounded-xl border border-sf-line bg-sf-surface space-y-2">
              <p className="text-xs text-sf-muted leading-relaxed">
                &quot;The recurring delivery option is super convenient. I get fresh supplies without hassle.&quot;
              </p>
              <span className="text-[11px] font-mono font-bold text-sf-ink block">
                — Bikash T., Kathmandu
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Store Delivery & FAQ Accordion */}
      <section className="w-full border-t border-sf-line bg-sf-surface py-12 px-4 sm:px-6 lg:px-8 text-left">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-sf-muted uppercase tracking-wider">Help &amp; Policies</span>
            <h4 className="font-sf-display text-xl font-bold text-sf-ink">
              Frequently Asked Questions
            </h4>
          </div>

          <div className="divide-y divide-sf-line border-t border-b border-sf-line">
            {STORE_FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-3.5">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-sf-ink hover:text-sf-cta transition-colors cursor-pointer py-1"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-sf-muted transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="text-xs text-sf-muted pt-2 pb-1 leading-relaxed font-sf-body">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Product Detail Sheet Drawer */}
      <ProductDetailSheet
        storeSlug={store.slug}
        product={selectedProduct}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        sellingPlans={sellingPlans}
        onAddToCart={handleAddToCart}
      />

      {/* 9. Mobile Bottom Navigation */}
      <StorefrontBottomNav
        storeSlug={store.slug}
        contactPhone={store.contact_phone}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* 10. Multi-Column Storefront Footer (Matching Pasalify & Dawn Standards) */}
      <footer className="w-full border-t border-sf-line bg-sf-surface pt-12 pb-16 px-4 sm:px-6 lg:px-8 text-left">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Col 1: Brand Bio (5 cols) */}
            <div className="md:col-span-5 space-y-3">
              <span className="font-sf-display text-lg font-bold text-sf-ink block">
                {store.name}
              </span>
              <p className="text-xs text-sf-muted leading-relaxed max-w-sm font-sf-body">
                {store.tagline ||
                  "Quality handcrafted and curated goods delivered directly to your doorstep across Kathmandu Valley and all 7 provinces of Nepal."}
              </p>
              {store.contact_phone && (
                <div className="pt-1">
                  <a
                    href={`https://wa.me/977${store.contact_phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sf-line text-xs font-sf-mono text-sf-muted hover:text-sf-ink hover:border-sf-ink transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp: +977 {store.contact_phone}</span>
                  </a>
                </div>
              )}
            </div>

            {/* Col 2: Navigation Links (2 cols) */}
            <div className="md:col-span-2 space-y-2.5 text-xs font-sf-mono">
              <span className="font-bold uppercase tracking-wider text-sf-ink block text-[11px]">
                Store Pages
              </span>
              <ul className="space-y-2 text-sf-muted">
                <li>
                  <button
                    type="button"
                    onClick={scrollToCollection}
                    className="hover:text-sf-ink transition-colors cursor-pointer"
                  >
                    All Products
                  </button>
                </li>
                <li>
                  <Link
                    href={`/s/${encodeURIComponent(store.slug)}/about`}
                    className="hover:text-sf-ink transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/s/${encodeURIComponent(store.slug)}/shipping`}
                    className="hover:text-sf-ink transition-colors"
                  >
                    Delivery &amp; COD
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/s/${encodeURIComponent(store.slug)}/contact`}
                    className="hover:text-sf-ink transition-colors"
                  >
                    Contact &amp; Help
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Categories (2 cols) */}
            <div className="md:col-span-2 space-y-2.5 text-xs font-sf-mono">
              <span className="font-bold uppercase tracking-wider text-sf-ink block text-[11px]">
                Collections
              </span>
              <ul className="space-y-2 text-sf-muted">
                {availableCategories.length > 0 ? (
                  availableCategories.slice(0, 4).map((cat) => (
                    <li key={cat}>
                      <button
                        type="button"
                        onClick={() => handleNavCategorySelect(cat)}
                        className="hover:text-sf-ink transition-colors cursor-pointer capitalize text-left"
                      >
                        {cat}
                      </button>
                    </li>
                  ))
                ) : (
                  <li>
                    <span className="text-sf-muted">Curated Goods</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Col 4: Trust & Payment Badges (3 cols) */}
            <div className="md:col-span-3 space-y-2.5 text-xs font-sf-mono">
              <span className="font-bold uppercase tracking-wider text-sf-ink block text-[11px]">
                Trust &amp; Payments
              </span>
              <div className="space-y-2 text-sf-muted text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>Khalti Wallet Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>Cash on Delivery (COD)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>24h Pathao Valley Courier</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>100% NPR Infrastructure</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-sf-line flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-sf-mono text-sf-muted">
            <div>
              © {new Date().getFullYear()} {store.name}. All rights reserved.
            </div>
            <div className="flex items-center gap-3">
              <span>Settled in NPR</span>
              <span>·</span>
              <span>Powered by ShopCraft</span>
              <span>·</span>
              <Link href="/" className="hover:text-sf-ink underline transition-colors">
                Launch Your Store
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
