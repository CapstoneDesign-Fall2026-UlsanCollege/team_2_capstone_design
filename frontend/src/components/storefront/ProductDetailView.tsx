"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Heart,
  HelpCircle,
  Info,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import {
  formatNpr,
  ProductItem,
  ProductVariant,
  StorePublicMetadata,
} from "@/lib/api";
import { useCart } from "./CartContext";

export interface ProductDetailViewProps {
  store: StorePublicMetadata;
  product: ProductItem;
  sellingPlans?: any;
  relatedProducts: ProductItem[];
}

export function ProductDetailView({
  store,
  product,
  relatedProducts = [],
}: ProductDetailViewProps) {
  const router = useRouter();
  const { addItem, closeCart } = useCart();

  const variants = product.variants || [];
  const defaultVariant =
    variants.find((v) => v.in_stock && v.is_active) || variants[0] || null;

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    defaultVariant ? defaultVariant.id : null
  );

  // Dynamic Product Attributes (from product.attributes JSONField)
  // If product.attributes contains options e.g. { "Grind": ["Whole Bean", "Espresso"] } or { "Size": ["S", "M", "L"] }
  const dynamicAttributeOptions = useMemo(() => {
    const attrs = product.attributes || {};
    const result: Array<{ name: string; values: string[] }> = [];

    // Support options dictionary or explicit lists
    if (attrs.options && typeof attrs.options === "object" && !Array.isArray(attrs.options)) {
      for (const [key, val] of Object.entries(attrs.options)) {
        if (Array.isArray(val) && val.length > 0) {
          result.push({ name: key, values: val.map(String) });
        }
      }
    } else {
      // Check for known common list keys like sizes, colors, grind_options
      for (const [key, val] of Object.entries(attrs)) {
        if (
          Array.isArray(val) &&
          val.length > 0 &&
          typeof val[0] === "string" &&
          !key.includes("image") &&
          key !== "tasting_notes"
        ) {
          const readableName = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          result.push({ name: readableName, values: val as string[] });
        }
      }
    }
    return result;
  }, [product.attributes]);

  // Initial state for dynamic attributes
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const opt of dynamicAttributeOptions) {
      if (opt.values.length > 0) {
        initial[opt.name] = opt.values[0];
      }
    }
    return initial;
  });

  const handleSelectAttribute = (attrName: string, value: string) => {
    setSelectedAttributes((prev) => ({ ...prev, [attrName]: value }));
  };

  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState<boolean>(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Accordion states
  const [openAccordion, setOpenAccordion] = useState<"details" | "shipping" | "guarantee" | null>(
    "details"
  );

  const selectedVariant: ProductVariant | null =
    variants.find((v) => v.id === selectedVariantId) || defaultVariant;

  const basePriceMinor = selectedVariant ? selectedVariant.price_minor : 75000;
  const unitPriceMinor = basePriceMinor;
  const totalPriceMinor = basePriceMinor * quantity;

  const isInStock = selectedVariant ? selectedVariant.in_stock : true;

  // Build final variant label (e.g. "250g · Whole Bean" or "Large · Olive")
  const attributeLabels = Object.values(selectedAttributes).filter(Boolean);
  const finalVariantLabel = [
    selectedVariant?.label || "",
    ...attributeLabels,
  ]
    .filter(Boolean)
    .join(" · ") || "Standard";

  // Collect all product images
  const images = useMemo(() => {
    const list: string[] = [];
    if (product.image_url) list.push(product.image_url);
    if (product.attributes?.secondary_image && typeof product.attributes.secondary_image === "string") {
      list.push(product.attributes.secondary_image);
    }
    if (Array.isArray(product.attributes?.gallery)) {
      for (const item of product.attributes.gallery) {
        if (typeof item === "string" && !list.includes(item)) {
          list.push(item);
        }
      }
    }
    return list;
  }, [product.image_url, product.attributes]);

  const handleAddToCart = () => {
    if (!selectedVariant || !isInStock) return;

    addItem({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantId: selectedVariant.id,
      variantLabel: finalVariantLabel,
      unitPriceMinor,
      quantity,
      imageUrl: product.image_url,
    });

    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 1200);
  };

  const handleInstantBuy = () => {
    if (!selectedVariant || !isInStock) return;

    addItem(
      {
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        variantId: selectedVariant.id,
        variantLabel: finalVariantLabel,
        unitPriceMinor,
        quantity,
        imageUrl: product.image_url,
      },
      false
    );

    closeCart();
    router.push(`/s/${encodeURIComponent(store.slug)}/checkout`);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const cleanPhone = (store.contact_phone || "").replace(/\D/g, "");

  // Extract custom attribute key-values for specs table
  const specEntries = useMemo(() => {
    const ignored = new Set(["secondary_image", "gallery", "options", "image"]);
    const entries: Array<{ label: string; value: string }> = [];
    if (product.attributes && typeof product.attributes === "object") {
      for (const [key, val] of Object.entries(product.attributes)) {
        if (!ignored.has(key) && val !== null && val !== undefined) {
          const formattedKey = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          const formattedVal = Array.isArray(val) ? val.join(", ") : String(val);
          if (formattedVal.trim()) {
            entries.push({ label: formattedKey, value: formattedVal });
          }
        }
      }
    }
    return entries;
  }, [product.attributes]);

  return (
    <div className="space-y-12 text-left font-sf-body pb-16 sm:pb-0">
      {/* 1. Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-sf-mono text-sf-muted">
          <Link href={`/s/${encodeURIComponent(store.slug)}`} className="hover:text-sf-ink transition-colors">
            Catalog
          </Link>
          <span>/</span>
          <span className="capitalize">{product.category || "Products"}</span>
          <span>/</span>
          <span className="text-sf-ink font-semibold truncate max-w-[160px] sm:max-w-xs">
            {product.name}
          </span>
        </nav>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs font-sf-mono text-sf-muted hover:text-sf-ink transition-colors px-2 py-1 rounded-md border border-sf-line bg-sf-surface"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedLink ? "Link Copied!" : "Share"}</span>
        </button>
      </div>

      {/* 2. Main Product Grid (Saleor-grade PDP Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left: Gallery (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          {/* Main Large Image */}
          <div className="relative aspect-[4/5] w-full rounded-sf overflow-hidden border border-sf-line bg-sf-surface shadow-xs group">
            {images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[activeImageIndex] || images[0]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-sf-muted bg-sf-canvas">
                <Package className="w-12 h-12 mb-2 opacity-40" />
                <span className="text-xs font-sf-mono">Authentic Nepali Craft</span>
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
              {isInStock ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-sf-mono font-medium uppercase tracking-wider bg-sf-surface/95 text-sf-ink border border-sf-line shadow-xs">
                  In Stock · Dispatch in 24h
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-sf-mono font-bold uppercase tracking-wider bg-red-600 text-white shadow-xs">
                  Sold Out
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails Row */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-16 h-16 rounded-sf overflow-hidden border shrink-0 transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? "border-sf-ink ring-2 ring-sf-ink/20 shadow-xs"
                      : "border-sf-line opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Buy-Box & Customizer (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Header Info */}
          <div className="space-y-2 border-b border-sf-line pb-4">
            <div className="flex items-center gap-2 text-xs font-sf-mono text-sf-muted uppercase tracking-wider">
              <span className="font-semibold text-sf-ink capitalize">
                {product.category || store.name}
              </span>
              <span>·</span>
              <span>Direct Independent Maker</span>
            </div>

            <h1 className="font-sf-display text-2xl sm:text-3xl font-bold tracking-tight text-sf-ink">
              {product.name}
            </h1>

            {product.description && (
              <p className="text-xs sm:text-sm text-sf-muted leading-relaxed">
                {product.description}
              </p>
            )}

            <div className="pt-1 flex items-baseline gap-2">
              <span className="font-sf-mono text-2xl sm:text-3xl font-bold text-sf-ink tabular-nums">
                {formatNpr(unitPriceMinor)}
              </span>
            </div>
          </div>

          {/* 1. Dynamic Attribute Option Pickers (e.g. Size, Color, Grind, Roast) */}
          {dynamicAttributeOptions.length > 0 && (
            <div className="space-y-3">
              {dynamicAttributeOptions.map((opt) => (
                <div key={opt.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-sf-mono">
                    <label className="font-bold text-sf-ink uppercase tracking-wider text-[11px]">
                      Select {opt.name}
                    </label>
                    <span className="text-[11px] text-sf-muted font-semibold">
                      {selectedAttributes[opt.name] || opt.values[0]}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {opt.values.map((val) => {
                      const isSelected = (selectedAttributes[opt.name] || opt.values[0]) === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleSelectAttribute(opt.name, val)}
                          className={`min-h-[38px] px-3.5 py-1.5 rounded-sf border text-xs font-sf-mono transition-all cursor-pointer ${
                            isSelected
                              ? "border-sf-ink bg-sf-ink text-white font-bold shadow-xs"
                              : "border-sf-line bg-sf-surface text-sf-ink hover:border-sf-muted"
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. Variant Selector Pills (Weight, Tier, Sku) */}
          {variants.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-sf-mono">
                <label className="font-bold text-sf-ink uppercase tracking-wider text-[11px]">
                  Select Variant
                </label>
                <span className="text-[11px] text-sf-muted font-semibold">
                  {selectedVariant?.label}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {variants.map((v) => {
                  const isSelected = v.id === selectedVariantId;
                  const isAvailable = v.in_stock && v.is_active;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      disabled={!isAvailable}
                      className={`min-h-[44px] p-2.5 rounded-sf text-left transition-all cursor-pointer border ${
                        isSelected
                          ? "border-sf-ink bg-sf-surface ring-2 ring-sf-ink font-bold shadow-2xs"
                          : isAvailable
                          ? "border-sf-line bg-sf-surface hover:border-sf-muted"
                          : "border-sf-line bg-sf-canvas opacity-40 cursor-not-allowed line-through"
                      }`}
                    >
                      <div className="text-xs font-bold text-sf-ink">{v.label}</div>
                      <div className="text-[11px] font-sf-mono text-sf-muted mt-0.5">
                        {formatNpr(v.price_minor)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Quantity Stepper & Add to Bag */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-sf-ink uppercase tracking-wider text-[11px] font-sf-mono">
                Quantity
              </label>
              <div className="inline-flex items-center rounded-sf border border-sf-line bg-sf-canvas">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || !isInStock}
                  aria-label="Decrease quantity"
                  className="w-11 h-11 flex items-center justify-center text-sf-muted hover:text-sf-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <Minus className="w-4 h-4" aria-hidden="true" />
                </button>
                <span className="w-9 text-center font-sf-mono text-xs font-bold text-sf-ink tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  disabled={quantity >= 10 || !isInStock}
                  aria-label="Increase quantity"
                  className="w-11 h-11 flex items-center justify-center text-sf-muted hover:text-sf-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isInStock || justAdded}
                className={`w-full min-h-[48px] h-12 rounded-sf font-sf-body text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] ${
                  justAdded
                    ? "bg-emerald-800 text-white"
                    : isInStock
                    ? "bg-sf-cta text-sf-cta-ink hover:opacity-95"
                    : "bg-sf-line text-sf-muted cursor-not-allowed"
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4 text-white" aria-hidden="true" />
                    <span>Added to Bag ✓</span>
                  </>
                ) : !isInStock ? (
                  <span>Sold Out</span>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                    <span>Add to Bag · {formatNpr(totalPriceMinor)}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleInstantBuy}
                disabled={!isInStock}
                className="w-full min-h-[48px] h-12 rounded-sf border-2 border-sf-ink bg-sf-surface hover:bg-sf-canvas text-sf-ink font-sf-body text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <span>Instant Checkout</span>
              </button>
            </div>
          </div>

          {/* 5. Clean Structured Information Accordions (Saleor-style) */}
          <div className="pt-4 border-t border-sf-line space-y-2">
            
            {/* Accordion 1: Details & Specs */}
            <div className="rounded-sf border border-sf-line bg-sf-surface overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenAccordion((prev) => (prev === "details" ? null : "details"))}
                className="w-full p-3.5 flex items-center justify-between text-left font-sf-display text-xs font-bold text-sf-ink hover:bg-sf-canvas/50 transition-colors cursor-pointer"
              >
                <span>Product Overview &amp; Specifications</span>
                {openAccordion === "details" ? (
                  <ChevronUp className="w-4 h-4 text-sf-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-sf-muted" />
                )}
              </button>
              {openAccordion === "details" && (
                <div className="p-3.5 border-t border-sf-line bg-sf-canvas/40 text-xs font-sf-mono space-y-2 text-sf-muted">
                  <p className="font-sf-body text-xs leading-relaxed text-sf-ink">
                    {product.description || "Authentic quality product crafted with care in Nepal."}
                  </p>
                  {specEntries.length > 0 && (
                    <div className="pt-2 border-t border-sf-line space-y-1">
                      {specEntries.map((spec) => (
                        <div key={spec.label} className="flex justify-between py-0.5">
                          <span className="text-sf-muted">{spec.label}:</span>
                          <span className="font-semibold text-sf-ink">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Accordion 2: Delivery & Shipping in Nepal */}
            <div className="rounded-sf border border-sf-line bg-sf-surface overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenAccordion((prev) => (prev === "shipping" ? null : "shipping"))}
                className="w-full p-3.5 flex items-center justify-between text-left font-sf-display text-xs font-bold text-sf-ink hover:bg-sf-canvas/50 transition-colors cursor-pointer"
              >
                <span>Nepal Delivery &amp; Payment Options</span>
                {openAccordion === "shipping" ? (
                  <ChevronUp className="w-4 h-4 text-sf-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-sf-muted" />
                )}
              </button>
              {openAccordion === "shipping" && (
                <div className="p-3.5 border-t border-sf-line bg-sf-canvas/40 text-xs font-sf-mono space-y-1.5 text-sf-muted">
                  <div className="flex justify-between">
                    <span>Kathmandu Valley (24h Express):</span>
                    <span className="font-bold text-sf-ink">
                      {formatNpr(store.inside_valley_shipping_minor || 10000)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outside Valley (Nationwide Courier):</span>
                    <span className="font-bold text-sf-ink">
                      {formatNpr(store.outside_valley_shipping_minor || 20000)}
                    </span>
                  </div>
                  {store.free_shipping_threshold_minor && (
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                      ✓ Free Shipping on orders over {formatNpr(store.free_shipping_threshold_minor)}!
                    </p>
                  )}
                  <p className="text-[11px] pt-1 text-sf-muted leading-relaxed">
                    We accept instant Khalti Web Wallet and verified Cash on Delivery (COD) across Nepal.
                  </p>
                </div>
              )}
            </div>

            {/* Accordion 3: Merchant Guarantee & Direct WhatsApp */}
            <div className="rounded-sf border border-sf-line bg-sf-surface overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenAccordion((prev) => (prev === "guarantee" ? null : "guarantee"))}
                className="w-full p-3.5 flex items-center justify-between text-left font-sf-display text-xs font-bold text-sf-ink hover:bg-sf-canvas/50 transition-colors cursor-pointer"
              >
                <span>Merchant Guarantee &amp; Inquiries</span>
                {openAccordion === "guarantee" ? (
                  <ChevronUp className="w-4 h-4 text-sf-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-sf-muted" />
                )}
              </button>
              {openAccordion === "guarantee" && (
                <div className="p-3.5 border-t border-sf-line bg-sf-canvas/40 text-xs font-sf-mono space-y-2 text-sf-muted">
                  <p className="leading-relaxed">
                    Direct independent merchant trade. Every order is inspected and sealed at the workshop before dispatch.
                  </p>
                  {cleanPhone && (
                    <div className="pt-1">
                      <a
                        href={`https://wa.me/977${cleanPhone}?text=Hi%20${encodeURIComponent(store.name)}%2C%20I%20have%20a%20question%20about%20${encodeURIComponent(product.name)}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sf text-[11px] font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Ask {store.name} on WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* 3. Sticky Bottom Mobile Action Bar (Saleor-style Mobile Thumb-Zone) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-sf-surface/95 backdrop-blur-md border-t border-sf-line p-3 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {images[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[0]}
              alt={product.name}
              className="w-10 h-10 rounded-md object-cover border border-sf-line shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-sf-ink truncate">{product.name}</p>
            <p className="text-xs font-sf-mono font-bold text-sf-ink tabular-nums">
              {formatNpr(unitPriceMinor)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!isInStock || justAdded}
          className={`h-11 px-5 rounded-sf font-sf-body text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
            justAdded
              ? "bg-emerald-800 text-white"
              : isInStock
              ? "bg-sf-cta text-sf-cta-ink"
              : "bg-sf-line text-sf-muted cursor-not-allowed"
          }`}
        >
          {justAdded ? (
            <span>Added ✓</span>
          ) : !isInStock ? (
            <span>Sold Out</span>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add to Bag</span>
            </>
          )}
        </button>
      </div>

      {/* 4. Related Products Strip */}
      {relatedProducts.length > 0 && (
        <section className="pt-8 border-t border-sf-line space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sf-display text-lg font-bold text-sf-ink">
              More from {store.name}
            </h3>
            <Link
              href={`/s/${encodeURIComponent(store.slug)}`}
              className="text-xs font-sf-mono text-sf-muted hover:text-sf-ink underline"
            >
              View Full Catalog
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {relatedProducts.map((rel) => {
              const relPrice = rel.variants?.[0]?.price_minor || 75000;
              const relSlug = rel.slug || String(rel.id);
              return (
                <Link
                  key={rel.id}
                  href={`/s/${encodeURIComponent(store.slug)}/products/${encodeURIComponent(relSlug)}`}
                  className="group p-3 rounded-sf border border-sf-line bg-sf-surface hover:shadow-xs transition-shadow block"
                >
                  <div className="aspect-[4/3] rounded-sf bg-sf-canvas overflow-hidden border border-sf-line/60 mb-2">
                    {rel.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rel.image_url}
                        alt={rel.name}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sf-muted">
                        <Package className="w-6 h-6 opacity-40" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-sf-display text-xs font-bold text-sf-ink truncate group-hover:underline">
                    {rel.name}
                  </h4>
                  <span className="font-sf-mono text-xs font-bold text-sf-ink tabular-nums mt-0.5 block">
                    {formatNpr(relPrice)}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
