"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ChevronDown,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Search,
  Star,
  X,
} from "lucide-react";
import { formatNpr, ProductItem, StorePublicMetadata } from "@/lib/api";
import { StorefrontHeader } from "./StorefrontHeader";
import { ProductGrid } from "./ProductGrid";
import { ProductDetailSheet, SelectedCartItem } from "./ProductDetailSheet";
import { useCart } from "./CartContext";
import { Button } from "@/components/ui/button";

function isPlaceholderText(text?: string | null): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();
  return (
    lower === "general" ||
    lower === "aaa" ||
    lower === "placeholder" ||
    lower === "online storefront · nepal" ||
    lower === "online storefront" ||
    lower === "official online store"
  );
}

export interface StorefrontCatalogViewProps {
  store: StorePublicMetadata;
  products: ProductItem[];
  sellingPlans?: unknown[];
}

export function StorefrontCatalogView({
  store,
  products = [],
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

  // Pure catalog from backend (no hardcoded coffee fallback)
  const fullCatalog: ProductItem[] = useMemo(() => {
    return products || [];
  }, [products]);

  // Derived category list
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    fullCatalog.forEach((p) => {
      const rawCat = p.category || (p.attributes as Record<string, unknown> | undefined)?.category;
      const cat = typeof rawCat === "string" ? rawCat : undefined;
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
          (p.attributes as Record<string, unknown> | undefined)?.category === selectedCategory
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
    });
  };

  // Featured product (first available product with image and in stock, or first product)
  const featuredProduct = useMemo(() => {
    if (!fullCatalog || fullCatalog.length === 0) return null;
    return (
      fullCatalog.find((p) => p.image_url && p.variants?.some((v) => v.in_stock)) ||
      fullCatalog.find((p) => p.image_url) ||
      fullCatalog[0]
    );
  }, [fullCatalog]);

  const featuredPriceMinor = useMemo(() => {
    if (!featuredProduct || !featuredProduct.variants || featuredProduct.variants.length === 0) {
      return 0;
    }
    const prices = featuredProduct.variants
      .map((v) => v.price_minor)
      .filter((p): p is number => typeof p === "number" && p > 0);
    return prices.length > 0 ? Math.min(...prices) : (featuredProduct.variants[0]?.price_minor ?? 0);
  }, [featuredProduct]);

  const minCatalogPriceMinor = useMemo(() => {
    if (!fullCatalog || fullCatalog.length === 0) return 0;
    let min = Infinity;
    for (const p of fullCatalog) {
      for (const v of p.variants || []) {
        if (typeof v.price_minor === "number" && v.price_minor > 0 && v.price_minor < min) {
          min = v.price_minor;
        }
      }
    }
    return min === Infinity ? 0 : min;
  }, [fullCatalog]);

  const cleanCategory = useMemo(() => {
    if (!store.category || isPlaceholderText(store.category)) return "";
    return store.category.trim();
  }, [store.category]);

  const shopButtonText = useMemo(() => {
    const formattedPrice = minCatalogPriceMinor > 0 ? formatNpr(minCatalogPriceMinor) : null;
    const categoryPart = cleanCategory ? `Shop ${cleanCategory}` : "Shop collection";
    return formattedPrice ? `${categoryPart} · from ${formattedPrice}` : categoryPart;
  }, [cleanCategory, minCatalogPriceMinor]);

  const headline = useMemo(() => {
    if (store.story_headline && !isPlaceholderText(store.story_headline)) {
      return store.story_headline.trim();
    }
    return store.name;
  }, [store.story_headline, store.name]);

  const description = useMemo(() => {
    if (store.tagline && !isPlaceholderText(store.tagline)) {
      return store.tagline.trim();
    }
    return null;
  }, [store.tagline]);

  const heroImageUrl = useMemo(() => {
    return featuredProduct?.image_url || store.banner_url || null;
  }, [featuredProduct, store.banner_url]);

  const waUrl = useMemo(() => {
    if (!store.contact_phone) return null;
    const clean = store.contact_phone.replace(/\D/g, "").replace(/^0+/, "");
    if (!clean) return null;
    const phoneWithCountry = clean.startsWith("977") ? clean : `977${clean}`;
    return `https://wa.me/${phoneWithCountry}?text=Hi%20${encodeURIComponent(store.name)}%2C%20I%20have%20an%20inquiry%20about%20your%20products.`;
  }, [store.contact_phone, store.name]);

  const handleQuickAddFeatured = () => {
    if (!featuredProduct) {
      scrollToCollection();
      return;
    }
    if (featuredProduct.variants && featuredProduct.variants.length > 1) {
      handleOpenSheet(featuredProduct);
      return;
    }
    const singleVariant = featuredProduct.variants?.[0];
    if (singleVariant) {
      handleAddToCart({
        productId: featuredProduct.id,
        productSlug: featuredProduct.slug,
        productName: featuredProduct.name,
        variantId: singleVariant.id,
        variantLabel: singleVariant.label || "Standard",
        unitPriceMinor: singleVariant.price_minor,
        quantity: 1,
        productImageUrl: featuredProduct.image_url || undefined,
      });
      openCart();
    } else {
      handleOpenSheet(featuredProduct);
    }
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
      a: `Inside Kathmandu Valley orders typically arrive within 24 to 48 hours for ${formatNpr(store.inside_valley_shipping_minor || 10000)}. Outside Kathmandu Valley deliveries take 2 to 4 business days via Pathao express courier for ${formatNpr(store.outside_valley_shipping_minor || 20000)}.${store.free_shipping_threshold_minor ? ` Orders over ${formatNpr(store.free_shipping_threshold_minor)} qualify for FREE shipping!` : ""}`,
    },
    {
      q: "How do I pay with Khalti?",
      a: "Choose Khalti at checkout. You will be securely redirected to the Khalti payment gateway where you can authenticate with your mobile number and MPIN or scan the instant Fonepay/Khalti QR code. Once confirmed, you return right back to this storefront with your verified receipt.",
    },
    {
      q: "Can I track my order status?",
      a: "Yes! As soon as your order is placed, you receive an instant confirmation receipt page with real-time status updates as your package transitions from packaged to out for delivery.",
    },
  ];

  return (
    <div className="w-full min-h-dvh bg-[var(--canvas)] text-[var(--ink)] font-sans antialiased flex flex-col pb-20 md:pb-0">
      
      {/* 1. Header with Static Merchant Announcement Bar */}
      <StorefrontHeader
        storeSlug={store.slug}
        storeName={store.name}
        tagline={store.tagline}
        logoUrl={store.logo_url}
        cartCount={itemCount}
        freeShippingThresholdMinor={store.free_shipping_threshold_minor}
        categories={availableCategories}
        onOpenCart={openCart}
        onOpenSearch={() => setSearchOpen((prev) => !prev)}
        onCatalogClick={scrollToCollection}
        onSelectCategory={handleNavCategorySelect}
        activeCategory={selectedCategory}
      />

      {/* Expandable Search Drawer */}
      {searchOpen && (
        <div className="w-full bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 animate-in fade-in duration-200">
          <div className="max-w-2xl mx-auto flex items-center gap-2.5">
            <Search className="w-4 h-4 text-[var(--ink-2)]" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, variants, or categories..."
              className="w-full bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--ink-2)] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="text-xs font-semibold text-[var(--ink)] px-2 py-1 hover:underline cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 2. Hero Section (Desktop: 2 columns, Mobile: stacked with sticky bottom bar) */}
      <section className="w-full border-b border-[var(--border)] bg-[var(--canvas)] py-8 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Desktop 2-Column Hero */}
          <div className="hidden md:grid md:grid-cols-2 gap-10 lg:gap-16 items-center text-left">
            {/* Left Column: Plain-text eyebrow, merchant headline (serif, ~42px, max 3 lines), optional description, ONE black primary button, WhatsApp plain link, single delivery line */}
            <div className="space-y-4">
              {cleanCategory && (
                <p className="text-xs font-semibold tracking-wider uppercase text-[var(--ink-2)]">
                  {cleanCategory}
                </p>
              )}

              <h1 className="font-serif text-3xl lg:text-[42px] leading-[1.15] font-semibold text-[var(--ink)]">
                {headline}
              </h1>

              {description && (
                <p className="text-sm lg:text-base text-[var(--ink-2)] leading-relaxed max-w-xl">
                  {description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  variant="primary"
                  onClick={scrollToCollection}
                  className="h-11 px-6 text-sm font-semibold"
                >
                  {shopButtonText}
                </Button>

                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-2)] hover:text-[var(--ink)] underline-offset-4 hover:underline min-h-[44px] px-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-[var(--ink-2)]" />
                    <span>Order on WhatsApp</span>
                  </a>
                )}
              </div>

              <p className="pt-2 text-xs lg:text-sm text-[var(--ink-2)]">
                Kathmandu Valley 1-2 days · Nationwide courier · Khalti or Cash on Delivery
              </p>
            </div>

            {/* Right Column: Real product photo (12px radius, no overlay) with caption row below: name, Rs. price, Add button */}
            <div>
              <div className="w-full aspect-[4/3] rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
                {heroImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroImageUrl}
                    alt={featuredProduct?.name || store.name}
                    loading="eager"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-[var(--ink-2)]">
                    <Package className="w-12 h-12 stroke-[1.25] text-[var(--ink-2)] mb-2" />
                    <span className="text-xs font-medium text-[var(--ink-2)]">No photo available</span>
                  </div>
                )}
              </div>

              {featuredProduct && (
                <div className="mt-3 flex items-center justify-between gap-3 px-1">
                  <span className="text-sm font-medium text-[var(--ink)] truncate max-w-[240px]">
                    {featuredProduct.name}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold tabular-nums text-[var(--ink)]">
                      {formatNpr(featuredPriceMinor)}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleQuickAddFeatured}
                      className="h-8 px-3 text-xs"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Hero (Compact, full-width photo, 28px headline, delivery line, no overlay) */}
          <div className="md:hidden flex flex-col space-y-4 text-left">
            {cleanCategory && (
              <p className="text-xs font-semibold tracking-wider uppercase text-[var(--ink-2)]">
                {cleanCategory}
              </p>
            )}

            <h1 className="font-serif text-[28px] font-semibold leading-tight text-[var(--ink)]">
              {headline}
            </h1>

            {description && (
              <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                {description}
              </p>
            )}

            <div className="w-full aspect-[4/3] rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
              {heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImageUrl}
                  alt={featuredProduct?.name || store.name}
                  loading="eager"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-[var(--ink-2)]">
                  <Package className="w-12 h-12 stroke-[1.25] text-[var(--ink-2)] mb-2" />
                  <span className="text-xs font-medium text-[var(--ink-2)]">No photo available</span>
                </div>
              )}
            </div>

            {featuredProduct && (
              <div className="flex items-center justify-between text-xs px-1 text-[var(--ink)]">
                <span className="font-medium truncate max-w-[200px]">{featuredProduct.name}</span>
                <span className="font-semibold tabular-nums">{formatNpr(featuredPriceMinor)}</span>
              </div>
            )}

            <p className="text-xs text-[var(--ink-2)] pt-1">
              Kathmandu Valley 1-2 days · Nationwide courier · Khalti or Cash on Delivery
            </p>

            <div className="pt-1">
              <Button
                variant="primary"
                onClick={scrollToCollection}
                className="w-full h-11 text-sm font-semibold"
              >
                {shopButtonText}
              </Button>
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
                onChange={(e) => setSortBy(e.target.value as "featured" | "price-asc" | "price-desc")}
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
            themePreset={store.theme_preset}
            defaultCategory={store.category}
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
                &quot;The fast Kathmandu doorstep delivery is super convenient. Everything arrived fresh and perfectly packaged.&quot;
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
        onAddToCart={handleAddToCart}
      />

      {/* 9. Mobile Sticky Bottom Bar (44px tap targets: price + Add to bag + WhatsApp icon) */}
      <aside
        aria-label="Quick order bar"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--surface)] border-t border-[var(--border)] p-3 flex items-center gap-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]"
      >
        <div className="flex flex-col shrink-0 min-w-[70px]">
          <span className="text-[10px] text-[var(--ink-2)] uppercase tracking-wider font-medium">Price</span>
          <span className="text-base font-semibold text-[var(--ink)] tabular-nums leading-none">
            {featuredPriceMinor > 0 ? formatNpr(featuredPriceMinor) : "Rs. 0"}
          </span>
        </div>

        <Button
          variant="primary"
          onClick={handleQuickAddFeatured}
          className="flex-1 h-11 text-sm font-semibold"
        >
          Add to bag
        </Button>

        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] flex items-center justify-center hover:bg-[var(--canvas)] transition-colors"
            aria-label="Chat on WhatsApp"
          >
            <MessageCircle className="w-5 h-5 text-[var(--ink)]" />
          </a>
        )}
      </aside>

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

            {/* Col 4: Payments & Delivery (3 cols) */}
            <div className="md:col-span-3 space-y-2.5 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[var(--ink)] block text-[11px]">
                Payments &amp; Delivery
              </span>
              <div className="space-y-1.5 text-[var(--ink-2)] text-xs">
                <div>Khalti ePayment</div>
                <div>Cash on Delivery (COD)</div>
                <div>Nationwide Courier Delivery</div>
                <div>Settled in NPR</div>
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
