"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  MapPin,
  MessageCircle,
  Package,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { formatNpr, ProductItem, StorePublicMetadata } from "@/lib/api";
import {
  buildThemePreviewDemoProducts,
  cleanStoreCategory,
  getStorefrontAccountBadge,
  getStorefrontPaymentAndDeliveryClaims,
  isPlaceholderText,
  sanitizeStorefrontImageUrl,
} from "@/lib/storefront-helpers";
import { StorefrontHeader } from "./StorefrontHeader";
import { StoreImage } from "./StoreImage";
import { ProductGrid } from "./ProductGrid";
import { ProductDetailSheet, SelectedCartItem } from "./ProductDetailSheet";
import { useCart } from "./CartContext";
import { useAccount } from "./AccountContext";
import { useStorefrontAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

function StoreHeroFallback({
  storeName,
  logoUrl,
}: {
  storeName: string;
  logoUrl?: string | null;
}) {
  const safeLogoUrl = sanitizeStorefrontImageUrl(logoUrl);
  const initial = (storeName || "S").trim().charAt(0).toUpperCase();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 bg-[var(--surface)] text-center">
      {safeLogoUrl ? (
        <div className="relative w-20 h-20 rounded-xl border border-[var(--border)] bg-[var(--canvas)] overflow-hidden">
          <StoreImage
            src={safeLogoUrl}
            alt={storeName}
            sizes="80px"
            className="object-contain p-2"
            fallback={
              <div className="w-full h-full flex items-center justify-center font-serif text-2xl font-semibold text-[var(--ink)]">
                {initial}
              </div>
            }
          />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-xl border border-[var(--border)] bg-[var(--canvas)] flex items-center justify-center font-serif text-2xl font-semibold text-[var(--ink)]">
          {initial}
        </div>
      )}
      <span className="font-serif text-lg sm:text-xl font-semibold text-[var(--ink)] max-w-xs truncate">
        {storeName}
      </span>
    </div>
  );
}

export interface StorefrontCatalogViewProps {
  store: StorePublicMetadata;
  products: ProductItem[];
  isThemePreview?: boolean;
}

export function StorefrontCatalogView({
  store,
  products = [],
  isThemePreview = false,
}: StorefrontCatalogViewProps) {
  const { itemCount, openCart, addItem } = useCart();
  const { openAccount } = useAccount();
  const { isAuthenticated, customer } = useStorefrontAuth(store.slug);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Real catalog unless theme-editor preview explicitly requests ephemeral preview items
  const fullCatalog: ProductItem[] = useMemo(() => {
    if (products && products.length > 0) {
      return products;
    }
    if (isThemePreview) {
      return buildThemePreviewDemoProducts(store);
    }
    return [];
  }, [products, isThemePreview, store]);

  // Derived category list (ignoring placeholders)
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    fullCatalog.forEach((p) => {
      const rawCat = p.category || (p.attributes as Record<string, unknown> | undefined)?.category;
      const cat = typeof rawCat === "string" ? rawCat : undefined;
      if (cat && !isPlaceholderText(cat)) {
        set.add(cat.trim());
      }
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
    setIsSheetOpen(false);
    addItem(
      {
        productId: item.productId,
        productSlug: item.productSlug,
        productName: item.productName,
        variantId: item.variantId,
        variantLabel: item.variantLabel,
        unitPriceMinor: item.unitPriceMinor,
        quantity: item.quantity,
        imageUrl: item.productImageUrl,
      },
      true
    );
  };

  // Featured product (first available product with valid image and in stock, or first product)
  const featuredProduct = useMemo(() => {
    if (!fullCatalog || fullCatalog.length === 0) return null;
    return (
      fullCatalog.find((p) => sanitizeStorefrontImageUrl(p.image_url) && p.variants?.some((v) => v.in_stock)) ||
      fullCatalog.find((p) => sanitizeStorefrontImageUrl(p.image_url)) ||
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
    return cleanStoreCategory(store.category);
  }, [store.category]);

  const shopButtonText = useMemo(() => {
    const formattedPrice = minCatalogPriceMinor > 0 ? formatNpr(minCatalogPriceMinor) : null;
    const categoryPart = cleanCategory ? `Shop ${cleanCategory}` : "Shop all";
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
    return (
      sanitizeStorefrontImageUrl(featuredProduct?.image_url) ||
      sanitizeStorefrontImageUrl(store.banner_url) ||
      null
    );
  }, [featuredProduct, store.banner_url]);

  const claims = useMemo(() => {
    return getStorefrontPaymentAndDeliveryClaims(store);
  }, [store]);

  const waUrl = claims.waUrl;
  const accountBadge = useMemo(
    () => getStorefrontAccountBadge(isAuthenticated, customer),
    [isAuthenticated, customer]
  );

  const handleQuickAddProduct = (product: ProductItem) => {
    if (product.variants && product.variants.length > 1) {
      handleOpenSheet(product);
      return;
    }
    const singleVariant = product.variants?.[0];
    if (singleVariant && singleVariant.in_stock && singleVariant.is_active) {
      handleAddToCart({
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        variantId: singleVariant.id,
        variantLabel: singleVariant.label || "Standard",
        unitPriceMinor: singleVariant.price_minor,
        quantity: 1,
        productImageUrl: product.image_url || undefined,
      });
    } else {
      handleOpenSheet(product);
    }
  };

  const handleQuickAddFeatured = () => {
    if (!featuredProduct) {
      scrollToCollection();
      return;
    }
    handleQuickAddProduct(featuredProduct);
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

  // Dynamic Store FAQs (driven strictly by configured store capabilities)
  const STORE_FAQS = useMemo(() => {
    const faqs: Array<{ q: string; a: string }> = [];
    if (claims.codEnabled) {
      faqs.push({
        q: "How does Cash on Delivery (COD) work?",
        a: "Select Cash on Delivery during checkout. Pay the courier upon delivery with cash or mobile banking QR.",
      });
    }
    if (claims.shippingConfigured) {
      faqs.push({
        q: "What are your delivery times and shipping rates?",
        a: `Inside Kathmandu Valley orders typically arrive within 1 to 2 days for ${formatNpr(store.inside_valley_shipping_minor || 10000)}. Outside Kathmandu Valley deliveries take 2 to 4 business days via courier for ${formatNpr(store.outside_valley_shipping_minor || 20000)}.${store.free_shipping_threshold_minor ? ` Orders over ${formatNpr(store.free_shipping_threshold_minor)} qualify for free delivery.` : ""}`,
      });
    }
    if (claims.hasKhalti) {
      faqs.push({
        q: "How do I pay with Khalti?",
        a: "Choose Khalti at checkout to complete payment securely using your Khalti wallet, eBanking, or QR code.",
      });
    }
    faqs.push({
      q: "Can I track my order status?",
      a: "Yes. As soon as your order is placed, you receive a confirmation receipt link with live order status updates.",
    });
    return faqs;
  }, [claims, store.inside_valley_shipping_minor, store.outside_valley_shipping_minor, store.free_shipping_threshold_minor]);

  return (
    <div className={`w-full min-h-dvh bg-[var(--canvas)] text-[var(--ink)] font-sans antialiased flex flex-col ${fullCatalog.length > 0 && featuredProduct ? "pb-20 md:pb-0" : ""}`}>
      
      {/* 1. Header with Static Merchant Announcement Bar */}
      <StorefrontHeader
        storeSlug={store.slug}
        storeName={store.name}
        tagline={store.tagline}
        logoUrl={store.logo_url}
        cartCount={itemCount}
        freeShippingThresholdMinor={claims.shippingConfigured ? store.free_shipping_threshold_minor : null}
        categories={availableCategories}
        onOpenCart={openCart}
        onOpenAccount={openAccount}
        isAuthenticated={accountBadge.isStorefrontCustomer}
        userInitial={accountBadge.userInitial}
        showDeliveryLink={claims.shippingConfigured || claims.hasKhalti || claims.codEnabled}
        deliveryLinkLabel={claims.shippingConfigured ? (claims.codEnabled ? "Delivery & COD" : "Delivery") : "Payment Options"}
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
              placeholder="Search products, variants, or collections..."
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

              {claims.heroPromiseLine && (
                <p className="pt-2 text-xs lg:text-sm text-[var(--ink-2)]">
                  {claims.heroPromiseLine}
                </p>
              )}
            </div>

            {/* Right Column: Real product photo or clean store-branded hero fallback */}
            <div>
              <div className="w-full aspect-[4/3] rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)] relative">
                <StoreImage
                  src={heroImageUrl || ""}
                  alt={featuredProduct?.name || store.name}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  fallback={
                    <StoreHeroFallback storeName={store.name} logoUrl={store.logo_url} />
                  }
                />
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

            <div className="w-full aspect-[4/3] rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)] relative">
              <StoreImage
                src={heroImageUrl || ""}
                alt={featuredProduct?.name || store.name}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                fallback={
                  <StoreHeroFallback storeName={store.name} logoUrl={store.logo_url} />
                }
              />
            </div>

            {featuredProduct && (
              <div className="flex items-center justify-between text-xs px-1 text-[var(--ink)]">
                <span className="font-medium truncate max-w-[200px]">{featuredProduct.name}</span>
                <span className="font-semibold tabular-nums">{formatNpr(featuredPriceMinor)}</span>
              </div>
            )}

            {claims.heroPromiseLine && (
              <p className="text-xs text-[var(--ink-2)] pt-1">
                {claims.heroPromiseLine}
              </p>
            )}

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

      {/* 3. Catalog & Products Section */}
      <section id="collection-section" className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
        
        {/* Controls: Desktop Bar (shown when catalog has products) */}
        {fullCatalog.length > 0 && (
        <div className="hidden sm:flex sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[var(--border)]">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`h-9 px-3.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                selectedCategory === "all"
                  ? "bg-[var(--ink)] text-[var(--surface)]"
                  : "bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--border)] hover:text-[var(--ink)]"
              }`}
            >
              All ({fullCatalog.length})
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`h-9 px-3.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors capitalize ${
                  selectedCategory === cat
                    ? "bg-[var(--ink)] text-[var(--surface)]"
                    : "bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--border)] hover:text-[var(--ink)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort & In-Stock controls */}
          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-2 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border)] accent-[var(--ink)] cursor-pointer"
              />
              <span>In stock only</span>
            </label>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "featured" | "price-asc" | "price-desc")}
              className="h-9 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1 text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)] cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
        )}

        {/* Controls: Mobile 44px Filter & Sort Trigger */}
        {fullCatalog.length > 0 && (
        <div className="sm:hidden flex items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex-1 h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] text-xs font-semibold flex items-center justify-between hover:bg-[var(--canvas)] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[var(--ink-2)]" />
              <span>Filter &amp; Sort</span>
            </span>
            {(selectedCategory !== "all" || inStockOnly || sortBy !== "featured") && (
              <span className="w-2 h-2 rounded-full bg-[var(--ink)]" />
            )}
          </button>
          <span className="text-xs text-[var(--ink-2)] shrink-0">
            {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
          </span>
        </div>
        )}

        {/* Catalog Body or Empty State */}
        {fullCatalog.length === 0 ? (
          <div className="max-w-md mx-auto my-16 p-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center space-y-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--canvas)] border border-[var(--border)] mx-auto flex items-center justify-center text-[var(--ink-2)]">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-xl font-semibold text-[var(--ink)]">
                Products coming soon
              </h3>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                {store.name} hasn&apos;t added any products yet. Please check back soon.
              </p>
            </div>

            {waUrl && (
              <div className="pt-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--ink)] text-[var(--surface)] text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Inquire via WhatsApp</span>
                </a>
              </div>
            )}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-[var(--canvas)] border border-[var(--border)] text-[var(--ink-2)] mx-auto flex items-center justify-center">
              <Package className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-base font-semibold text-[var(--ink)]">
                No products found
              </h3>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                No items match your filter criteria. Try adjusting your search query or clearing active filters.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setInStockOnly(false);
                  setSortBy("featured");
                }}
                className="min-h-[44px] px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--canvas)] text-xs font-semibold text-[var(--ink)] cursor-pointer transition-colors inline-flex items-center justify-center"
              >
                Reset all filters
              </button>
            </div>
          </div>
        ) : (
          <ProductGrid
            storeSlug={store.slug}
            products={filteredProducts}
            onSelectProduct={handleOpenSheet}
            onQuickAdd={handleQuickAddProduct}
            themePreset={store.theme_preset}
            defaultCategory={store.category}
          />
        )}

      </section>

      {/* 4. Brand Story Strip (12px radius, 1px border, serif headline, plain WhatsApp link) */}
      <section className="w-full border-t border-[var(--border)] bg-[var(--canvas)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-10 text-left space-y-4">
          <div className="space-y-2 max-w-2xl">
            {store.address && (
              <div className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-2)]">
                <MapPin className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                <span>{store.address}</span>
              </div>
            )}
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[var(--ink)]">
              {store.story_headline || `About ${store.name}`}
            </h2>
            {(store.about_text || description) && (
              <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                {store.about_text || description}
              </p>
            )}
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href={`/s/${encodeURIComponent(store.slug)}/about`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)] underline underline-offset-4 hover:opacity-80 min-h-[44px]"
            >
              <span>Read our full story</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-2)] hover:text-[var(--ink)] min-h-[44px]"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Ask on WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* 5. Conditional Delivery & Payment Section */}
      {(claims.shippingConfigured || claims.hasKhalti || claims.codEnabled) && (
      <section className="w-full border-t border-[var(--border)] bg-[var(--surface)] py-12 px-4 sm:px-6 lg:px-8 text-left">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-2)]">
              Store Information
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[var(--ink)]">
              {claims.shippingConfigured ? "Delivery & Payment in Nepal" : "Payment Options"}
            </h2>
          </div>

          <div className={`grid grid-cols-1 ${claims.shippingConfigured && (claims.hasKhalti || claims.codEnabled) ? "md:grid-cols-2" : ""} gap-4 sm:gap-6`}>
            {/* Delivery Card */}
            {claims.shippingConfigured && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-5 sm:p-6 space-y-3">
              <h3 className="font-semibold text-sm text-[var(--ink)]">
                Doorstep Delivery
              </h3>
              <div className="space-y-2 text-xs text-[var(--ink-2)] leading-relaxed">
                <div className="flex justify-between py-1 border-b border-[var(--border)]/60">
                  <span>Kathmandu Valley (1–2 days)</span>
                  <span className="font-semibold text-[var(--ink)] tabular-nums">
                    {formatNpr(store.inside_valley_shipping_minor || 10000)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]/60">
                  <span>Outside Valley (2–4 business days)</span>
                  <span className="font-semibold text-[var(--ink)] tabular-nums">
                    {formatNpr(store.outside_valley_shipping_minor || 20000)}
                  </span>
                </div>
                {typeof store.free_shipping_threshold_minor === "number" &&
                  store.free_shipping_threshold_minor > 0 && (
                  <p className="text-xs font-medium text-[var(--ink)] pt-1">
                    Free delivery on orders over {formatNpr(store.free_shipping_threshold_minor)}.
                  </p>
                )}
                <p className="text-[11px] text-[var(--ink-2)] pt-1">
                  Dispatched via local couriers with phone confirmation.
                </p>
              </div>
            </div>
            )}

            {/* Payment Methods Card */}
            {(claims.hasKhalti || claims.codEnabled) && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-5 sm:p-6 space-y-3">
              <h3 className="font-semibold text-sm text-[var(--ink)]">
                Payment Options
              </h3>
              <div className="space-y-2 text-xs text-[var(--ink-2)] leading-relaxed">
                {claims.hasKhalti && (
                <div className={`py-1 ${claims.codEnabled ? "border-b border-[var(--border)]/60" : ""}`}>
                  <span className="font-semibold text-[var(--ink)] block">Khalti ePayment</span>
                  <span>Instant wallet redirect, MPIN verification, or scan Fonepay QR.</span>
                </div>
                )}
                {claims.codEnabled && (
                <div className="py-1">
                  <span className="font-semibold text-[var(--ink)] block">Cash on Delivery (COD)</span>
                  <span>Pay courier upon arrival with cash or mobile banking QR.</span>
                </div>
                )}
                <p className="text-[11px] text-[var(--ink-2)] pt-1">
                  All transactions settled securely in Nepalese Rupees (NPR).
                </p>
              </div>
            </div>
            )}
          </div>

          {/* Clean FAQ Accordion */}
          <div className="pt-4 border-t border-[var(--border)] space-y-2">
            <h3 className="font-semibold text-sm text-[var(--ink)] mb-3">
              Frequently Asked Questions
            </h3>
            <div className="divide-y divide-[var(--border)] border-t border-b border-[var(--border)]">
              {STORE_FAQS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="py-3">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-medium text-[var(--ink)] hover:text-[var(--ink-2)] transition-colors cursor-pointer min-h-[44px]"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[var(--ink-2)] transition-transform duration-200 shrink-0 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="text-xs text-[var(--ink-2)] pt-1 pb-2 leading-relaxed">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* 6. Product Detail Sheet Drawer (Mobile quick add / variant picker) */}
      <ProductDetailSheet
        storeSlug={store.slug}
        product={selectedProduct}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onAddToCart={handleAddToCart}
      />

      {/* 7. Mobile Filter Bottom Sheet (44px tap targets, 8px radius buttons) */}
      {isMobileFilterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-filter-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-[var(--surface)] rounded-t-xl border-t border-[var(--border)] p-5 space-y-5 max-h-[85dvh] overflow-y-auto animate-in slide-in-from-bottom duration-250 text-left"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 id="mobile-filter-title" className="font-serif text-lg font-semibold text-[var(--ink)]">
                Filter &amp; Sort
              </h3>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-11 h-11 -mr-2 flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-2)]">
                Collection
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`min-h-[44px] px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    selectedCategory === "all"
                      ? "bg-[var(--ink)] text-[var(--surface)]"
                      : "bg-[var(--canvas)] text-[var(--ink-2)] border border-[var(--border)]"
                  }`}
                >
                  All Products ({fullCatalog.length})
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`min-h-[44px] px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors capitalize ${
                      selectedCategory === cat
                        ? "bg-[var(--ink)] text-[var(--surface)]"
                        : "bg-[var(--canvas)] text-[var(--ink-2)] border border-[var(--border)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort options */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-2)]">
                Sort by
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "featured", label: "Featured" },
                  { id: "price-asc", label: "Price: Low to High" },
                  { id: "price-desc", label: "Price: High to Low" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSortBy(item.id as "featured" | "price-asc" | "price-desc")}
                    className={`min-h-[44px] px-4 rounded-lg text-xs font-medium text-left flex items-center justify-between border cursor-pointer transition-colors ${
                      sortBy === item.id
                        ? "border-[var(--ink)] bg-[var(--canvas)] font-semibold text-[var(--ink)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink-2)]"
                    }`}
                  >
                    <span>{item.label}</span>
                    {sortBy === item.id && <Check className="w-4 h-4 text-[var(--ink)]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* In stock toggle */}
            <div className="pt-2 border-t border-[var(--border)]">
              <label className="flex items-center justify-between min-h-[44px] cursor-pointer">
                <span className="text-xs font-semibold text-[var(--ink)]">In stock only</span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-5 h-5 rounded border-[var(--border)] accent-[var(--ink)] cursor-pointer"
                />
              </label>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[var(--border)] flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedCategory("all");
                  setInStockOnly(false);
                  setSortBy("featured");
                }}
                className="flex-1 h-11 text-xs font-semibold"
              >
                Reset
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 h-11 text-xs font-semibold"
              >
                Show ({filteredProducts.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Mobile Sticky Bottom Bar (shown only when products exist) */}
      {fullCatalog.length > 0 && featuredProduct && (
      <aside
        aria-label="Quick order bar"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--surface)] border-t border-[var(--border)] p-3 flex items-center gap-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]"
      >
        <div className="flex flex-col shrink-0 min-w-[70px]">
          <span className="text-[10px] text-[var(--ink-2)] uppercase tracking-wider font-medium">Price</span>
          <span className="text-base font-semibold text-[var(--ink)] tabular-nums leading-none">
            {formatNpr(featuredPriceMinor)}
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
      )}

      {/* 9. Multi-Column Storefront Footer */}
      <footer className="w-full border-t border-[var(--border)] bg-[var(--surface)] pt-12 pb-16 px-4 sm:px-6 lg:px-8 text-left">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Col 1: Brand Bio */}
            <div className="md:col-span-5 space-y-3">
              <span className="font-serif text-lg font-semibold text-[var(--ink)] block">
                {store.name}
              </span>
              {description && (
                <p className="text-xs text-[var(--ink-2)] leading-relaxed max-w-sm">
                  {description}
                </p>
              )}
              {waUrl && (
                <div className="pt-1">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[var(--ink)]" />
                    <span>WhatsApp Inquiries</span>
                  </a>
                </div>
              )}
            </div>

            {/* Col 2: Navigation Links */}
            <div className="md:col-span-2 space-y-2.5 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[var(--ink)] block text-[11px]">
                Store Pages
              </span>
              <ul className="space-y-2 text-[var(--ink-2)]">
                <li>
                  <button
                    type="button"
                    onClick={scrollToCollection}
                    className="hover:text-[var(--ink)] transition-colors cursor-pointer"
                  >
                    All Products
                  </button>
                </li>
                <li>
                  <Link
                    href={`/s/${encodeURIComponent(store.slug)}/about`}
                    className="hover:text-[var(--ink)] transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                {(claims.shippingConfigured || claims.hasKhalti || claims.codEnabled) && (
                <li>
                  <Link
                    href={`/s/${encodeURIComponent(store.slug)}/shipping`}
                    className="hover:text-[var(--ink)] transition-colors"
                  >
                    {claims.shippingConfigured ? (claims.codEnabled ? "Delivery & COD" : "Delivery") : "Payment Options"}
                  </Link>
                </li>
                )}
                <li>
                  <Link
                    href={`/s/${encodeURIComponent(store.slug)}/contact`}
                    className="hover:text-[var(--ink)] transition-colors"
                  >
                    Contact &amp; Help
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Categories */}
            <div className="md:col-span-2 space-y-2.5 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[var(--ink)] block text-[11px]">
                Collections
              </span>
              <ul className="space-y-2 text-[var(--ink-2)]">
                {availableCategories.length > 0 ? (
                  availableCategories.slice(0, 4).map((cat) => (
                    <li key={cat}>
                      <button
                        type="button"
                        onClick={() => handleNavCategorySelect(cat)}
                        className="hover:text-[var(--ink)] transition-colors cursor-pointer capitalize text-left"
                      >
                        {cat}
                      </button>
                    </li>
                  ))
                ) : (
                  <li>
                    <span className="text-[var(--ink-2)]">Curated Goods</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Col 4: Payments & Delivery (conditional) */}
            {(claims.shippingConfigured || claims.hasKhalti || claims.codEnabled) && (
            <div className="md:col-span-3 space-y-2.5 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[var(--ink)] block text-[11px]">
                {claims.shippingConfigured ? "Payments & Delivery" : "Payments"}
              </span>
              <div className="space-y-1.5 text-[var(--ink-2)] text-xs">
                {claims.hasKhalti && <div>Khalti ePayment (Instant redirect)</div>}
                {claims.codEnabled && <div>Cash on Delivery (COD)</div>}
                {claims.shippingConfigured && <div>Nationwide Courier Delivery</div>}
                <div>Settled in Nepalese Rupees (NPR)</div>
              </div>
            </div>
            )}

          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--ink-2)]">
            <div>
              © {new Date().getFullYear()} {store.name}. All rights reserved.
            </div>
            <div className="flex items-center gap-3">
              <span>Settled in NPR</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
