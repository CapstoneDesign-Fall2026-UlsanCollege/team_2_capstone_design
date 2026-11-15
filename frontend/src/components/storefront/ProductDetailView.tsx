"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Share2,
} from "lucide-react";
import {
  formatNpr,
  ProductItem,
  ProductVariant,
  StorePublicMetadata,
} from "@/lib/api";
import { useCart } from "./CartContext";
import { useAccount } from "./AccountContext";
import { useStorefrontAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { StorefrontHeader } from "./StorefrontHeader";
import { StoreImage } from "./StoreImage";
import {
  buildWhatsAppUrl,
  cleanStoreCategory,
  getStorefrontAccountBadge,
  getStorefrontPaymentAndDeliveryClaims,
  sanitizeStorefrontImageUrl,
} from "@/lib/storefront-helpers";

export interface ProductDetailViewProps {
  store: StorePublicMetadata;
  product: ProductItem;
  relatedProducts: ProductItem[];
}

export function ProductDetailView({
  store,
  product,
  relatedProducts = [],
}: ProductDetailViewProps) {
  const { itemCount, openCart, addItem } = useCart();
  const { openAccount } = useAccount();
  const { isAuthenticated, customer } = useStorefrontAuth(store.slug);
  const accountBadge = getStorefrontAccountBadge(isAuthenticated, customer);
  const claims = useMemo(() => getStorefrontPaymentAndDeliveryClaims(store), [store]);

  const variants = product.variants || [];
  const defaultVariant =
    variants.find((v) => v.in_stock && v.is_active) || variants[0] || null;

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    defaultVariant ? defaultVariant.id : null
  );

  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState<boolean>(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Accordion states
  const [openDetails, setOpenDetails] = useState<boolean>(true);
  const [openDelivery, setOpenDelivery] = useState<boolean>(false);

  const selectedVariant: ProductVariant | null =
    variants.find((v) => v.id === selectedVariantId) || defaultVariant;

  const unitPriceMinor = selectedVariant ? selectedVariant.price_minor : 0;
  const totalPriceMinor = unitPriceMinor * quantity;
  const isInStock = selectedVariant ? selectedVariant.in_stock && selectedVariant.is_active : true;

  const finalVariantLabel = selectedVariant?.label || "Standard";

  // Collect all product images
  const images = useMemo(() => {
    const list: string[] = [];
    const primary = sanitizeStorefrontImageUrl(product.image_url);
    if (primary) list.push(primary);
    if (product.attributes?.secondary_image && typeof product.attributes.secondary_image === "string") {
      const secondary = sanitizeStorefrontImageUrl(product.attributes.secondary_image);
      if (secondary && !list.includes(secondary)) {
        list.push(secondary);
      }
    }
    if (Array.isArray(product.attributes?.gallery)) {
      for (const item of product.attributes.gallery) {
        if (typeof item === "string") {
          const sanitized = sanitizeStorefrontImageUrl(item);
          if (sanitized && !list.includes(sanitized)) {
            list.push(sanitized);
          }
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
    }, 1500);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const waUrl = useMemo(() => {
    const base = buildWhatsAppUrl(store.contact_phone, store.name);
    if (!base) return null;
    const baseOrigin = base.split("?")[0];
    return `${baseOrigin}?text=${encodeURIComponent(
      `Hi ${store.name}, I have an inquiry about ${product.name}.`
    )}`;
  }, [store.contact_phone, store.name, product.name]);

  // Extract custom attribute key-values for specs table
  const specEntries = useMemo(() => {
    const ignored = new Set(["secondary_image", "gallery", "options", "image", "category"]);
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

  const cleanCategory = useMemo(() => {
    return cleanStoreCategory(
      product.category || (product.attributes?.category as string) || ""
    );
  }, [product.category, product.attributes]);

  return (
    <div className="w-full min-h-dvh bg-[var(--canvas)] text-[var(--ink)] font-sans antialiased flex flex-col">
      {/* 1. Consistent Storefront Header with Live Bag Trigger */}
      <StorefrontHeader
        storeSlug={store.slug}
        storeName={store.name}
        tagline={store.tagline}
        logoUrl={store.logo_url}
        cartCount={itemCount}
        freeShippingThresholdMinor={
          claims.shippingConfigured ? store.free_shipping_threshold_minor : null
        }
        onOpenCart={openCart}
        onOpenAccount={openAccount}
        isAuthenticated={accountBadge.isStorefrontCustomer}
        userInitial={accountBadge.userInitial}
        showDeliveryLink={claims.shippingConfigured || claims.hasKhalti || claims.codEnabled}
      />

      {/* 2. Main Product Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
        
        {/* Breadcrumb Navigation & Share Button */}
        <div className="flex items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[var(--ink-2)] min-h-[44px]">
            <Link
              href={`/s/${encodeURIComponent(store.slug)}`}
              className="hover:text-[var(--ink)] underline-offset-4 hover:underline flex items-center gap-1.5 min-h-[44px] pr-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </Link>
            {cleanCategory && (
              <>
                <span>/</span>
                <span className="capitalize">{cleanCategory}</span>
              </>
            )}
            <span>/</span>
            <span className="text-[var(--ink)] font-medium truncate max-w-[160px] sm:max-w-xs">
              {product.name}
            </span>
          </nav>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)] px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--canvas)] transition-colors min-h-[36px] cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[var(--ink-2)]" />
            <span>{copiedLink ? "Link copied!" : "Share"}</span>
          </button>
        </div>

        {/* 2-Column Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start text-left">
          
          {/* Left: Gallery (6 cols) */}
          <div className="lg:col-span-6 space-y-3">
            {/* Main Large Image (12px radius, 1px border, no overlay text) */}
            <div className="relative aspect-square sm:aspect-[4/5] w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <StoreImage
                src={images[activeImageIndex] || images[0] || ""}
                alt={product.name}
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                fallback={
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-[var(--ink-2)] bg-[var(--surface)]">
                    <Package className="w-12 h-12 mb-2 stroke-[1.25] text-[var(--ink-2)] opacity-50" />
                    <span className="text-xs font-medium text-[var(--ink-2)]">No photo available</span>
                  </div>
                }
              />
            </div>

            {/* Thumbnails Row (8px radius, 1px border) */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border shrink-0 transition-colors cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-[var(--ink)] ring-1 ring-[var(--ink)]"
                        : "border-[var(--border)] opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <StoreImage src={img} alt="" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Buy Box & Details (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Header Info */}
            <div className="space-y-3 border-b border-[var(--border)] pb-5">
              <div className="flex items-center justify-between gap-3">
                {cleanCategory ? (
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-2)]">
                    {cleanCategory}
                  </span>
                ) : <span />}

                {/* Status Chip (Icon + text + tint, semantic only) */}
                <Chip tone={isInStock ? "success" : "error"}>
                  {isInStock ? "In stock" : "Sold out"}
                </Chip>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[var(--ink)] leading-snug">
                {product.name}
              </h1>

              {product.description && (
                <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                  {product.description}
                </p>
              )}

              <div className="pt-1 flex items-baseline gap-2">
                <span className="font-serif text-2xl sm:text-3xl font-semibold text-[var(--ink)] tabular-nums">
                  {unitPriceMinor > 0 ? formatNpr(unitPriceMinor) : "Rs. 0"}
                </span>
              </div>
            </div>


            {/* 2. Variant Selector (8px radius, 1px border) */}
            {variants.length > 1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-[var(--ink)]">
                    Option
                  </label>
                  <span className="text-[var(--ink-2)] font-medium">
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
                        className={`min-h-[44px] p-2.5 rounded-lg text-left transition-colors cursor-pointer border ${
                          isSelected
                            ? "border-[var(--ink)] ring-1 ring-[var(--ink)] bg-[var(--surface)] font-semibold"
                            : isAvailable
                            ? "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--ink-2)]"
                            : "border-[var(--border)] bg-[var(--canvas)] opacity-40 cursor-not-allowed line-through"
                        }`}
                      >
                        <div className="text-xs font-semibold text-[var(--ink)]">{v.label}</div>
                        <div className="text-xs text-[var(--ink-2)] tabular-nums mt-0.5">
                          {formatNpr(v.price_minor)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Quantity Stepper & ONE Primary Button (8px radius, 44px tap targets) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-xs text-[var(--ink)]">
                  Quantity
                </label>
                <div className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--canvas)]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || !isInStock}
                    aria-label="Decrease quantity"
                    className="w-11 h-11 flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <span className="w-10 text-center text-xs font-semibold text-[var(--ink)] tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    disabled={quantity >= 10 || !isInStock}
                    aria-label="Increase quantity"
                    className="w-11 h-11 flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* ONE Black Primary Button */}
              <Button
                variant="primary"
                onClick={handleAddToCart}
                disabled={!isInStock || justAdded}
                className="w-full h-12 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>Added to bag ✓</span>
                  </>
                ) : !isInStock ? (
                  <span>Sold Out</span>
                ) : (
                  <span>Add to bag · {formatNpr(totalPriceMinor)}</span>
                )}
              </Button>

              {/* Single Delivery Promise Line */}
              {claims.heroPromiseLine && (
                <p className="text-xs text-[var(--ink-2)] text-center sm:text-left pt-1 leading-relaxed">
                  {claims.heroPromiseLine}
                </p>
              )}
            </div>

            {/* 4. Structured Product Accordions (Details & Delivery) */}
            <div className="pt-4 border-t border-[var(--border)] space-y-3">
              
              {/* Accordion 1: Details & Specs */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenDetails((prev) => !prev)}
                  className="w-full p-4 flex items-center justify-between text-left text-xs font-semibold text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors cursor-pointer min-h-[44px]"
                >
                  <span>Product Overview &amp; Specifications</span>
                  {openDetails ? (
                    <ChevronUp className="w-4 h-4 text-[var(--ink-2)]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--ink-2)]" />
                  )}
                </button>
                {openDetails && (
                  <div className="p-4 border-t border-[var(--border)] bg-[var(--canvas)] text-xs space-y-3 text-[var(--ink-2)]">
                    <p className="leading-relaxed text-[var(--ink)]">
                      {product.description || "No product description provided."}
                    </p>
                    {specEntries.length > 0 && (
                      <div className="pt-2 border-t border-[var(--border)] divide-y divide-[var(--border)]/60">
                        {specEntries.map((spec) => (
                          <div key={spec.label} className="flex justify-between py-1.5">
                            <span className="text-[var(--ink-2)]">{spec.label}</span>
                            <span className="font-semibold text-[var(--ink)]">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 2: Delivery & Shipping in Nepal */}
              {(claims.shippingConfigured || claims.hasKhalti || claims.codEnabled || waUrl) && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenDelivery((prev) => !prev)}
                    className="w-full p-4 flex items-center justify-between text-left text-xs font-semibold text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors cursor-pointer min-h-[44px]"
                  >
                    <span>Delivery &amp; Payment Details</span>
                    {openDelivery ? (
                      <ChevronUp className="w-4 h-4 text-[var(--ink-2)]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[var(--ink-2)]" />
                    )}
                  </button>
                  {openDelivery && (
                    <div className="p-4 border-t border-[var(--border)] bg-[var(--canvas)] text-xs space-y-2 text-[var(--ink-2)] leading-relaxed">
                      {claims.shippingConfigured && (
                        <>
                          <div className="flex justify-between py-1 border-b border-[var(--border)]/60">
                            <span>Kathmandu Valley (1–2 days):</span>
                            <span className="font-semibold text-[var(--ink)] tabular-nums">
                              {formatNpr(store.inside_valley_shipping_minor || 10000)}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[var(--border)]/60">
                            <span>Outside Valley (Nationwide courier):</span>
                            <span className="font-semibold text-[var(--ink)] tabular-nums">
                              {formatNpr(store.outside_valley_shipping_minor || 20000)}
                            </span>
                          </div>
                          {typeof store.free_shipping_threshold_minor === "number" &&
                            store.free_shipping_threshold_minor > 0 && (
                            <p className="font-semibold text-[var(--ink)] pt-1">
                              Free delivery on orders over {formatNpr(store.free_shipping_threshold_minor)}.
                            </p>
                          )}
                        </>
                      )}
                      {(claims.hasKhalti || claims.codEnabled) && (
                        <p className="pt-1 text-[11px]">
                          {claims.hasKhalti && claims.codEnabled
                            ? "We accept verified Khalti ePayment (instant wallet redirect / Fonepay QR) and Cash on Delivery (COD)."
                            : claims.hasKhalti
                            ? "We accept verified Khalti ePayment (instant wallet redirect / Fonepay QR)."
                            : "We accept Cash on Delivery (COD)."}
                        </p>
                      )}
                      {waUrl && (
                        <div className="pt-2">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)] underline hover:opacity-80"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Have questions? Chat on WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>

        {/* 3. Related Products Strip (12px radius cards, 1px border) */}
        {relatedProducts.length > 0 && (
          <section className="pt-10 border-t border-[var(--border)] space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-[var(--ink)]">
                More from {store.name}
              </h2>
              <Link
                href={`/s/${encodeURIComponent(store.slug)}`}
                className="text-xs font-semibold text-[var(--ink)] underline underline-offset-4 hover:opacity-80"
              >
                View collection
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {relatedProducts.map((rel) => {
                const relPrice = rel.variants?.[0]?.price_minor || 0;
                const relSlug = rel.slug || String(rel.id);
                return (
                  <Link
                    key={rel.id}
                    href={`/s/${encodeURIComponent(store.slug)}/products/${encodeURIComponent(relSlug)}`}
                    className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 hover:border-[var(--ink)] transition-colors block"
                  >
                    <div className="relative aspect-[4/3] rounded-lg bg-[var(--canvas)] overflow-hidden border border-[var(--border)] mb-2.5">
                      <StoreImage
                        src={sanitizeStorefrontImageUrl(rel.image_url)}
                        alt={rel.name}
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-102"
                        fallback={
                          <div className="w-full h-full flex items-center justify-center text-[var(--ink-2)]">
                            <Package className="w-6 h-6 opacity-40" />
                          </div>
                        }
                      />
                    </div>
                    <h3 className="text-xs font-semibold text-[var(--ink)] truncate group-hover:underline">
                      {rel.name}
                    </h3>
                    {relPrice > 0 && (
                      <span className="text-xs font-semibold text-[var(--ink)] tabular-nums mt-0.5 block">
                        {formatNpr(relPrice)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* 4. Sticky Bottom Mobile Action Bar (44px tap targets: price + Add to bag + WhatsApp icon) */}
      <aside
        aria-label="Quick order bar"
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--surface)] border-t border-[var(--border)] p-3 flex items-center justify-between gap-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]"
      >
        <div className="flex flex-col shrink-0 min-w-[70px] text-left">
          <span className="text-[10px] text-[var(--ink-2)] uppercase tracking-wider font-medium">Total</span>
          <span className="text-base font-semibold text-[var(--ink)] tabular-nums leading-none">
            {totalPriceMinor > 0 ? formatNpr(totalPriceMinor) : "Rs. 0"}
          </span>
        </div>

        <Button
          variant="primary"
          onClick={handleAddToCart}
          disabled={!isInStock || justAdded}
          className="flex-1 h-11 text-xs font-semibold"
        >
          {justAdded ? "Added ✓" : !isInStock ? "Sold Out" : "Add to bag"}
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

      {/* 5. Consistent Storefront Footer */}
      <footer className="w-full border-t border-[var(--border)] bg-[var(--surface)] pt-12 pb-16 px-4 sm:px-6 lg:px-8 text-left mt-12">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            <div className="md:col-span-5 space-y-3">
              <span className="font-serif text-lg font-semibold text-[var(--ink)] block">
                {store.name}
              </span>
              {store.tagline && (
                <p className="text-xs text-[var(--ink-2)] leading-relaxed max-w-sm">
                  {store.tagline}
                </p>
              )}
            </div>

            <div className="md:col-span-3 space-y-2.5 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[var(--ink)] block text-[11px]">
                Store Pages
              </span>
              <ul className="space-y-2 text-[var(--ink-2)]">
                <li>
                  <Link href={`/s/${encodeURIComponent(store.slug)}`} className="hover:text-[var(--ink)] transition-colors">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link href={`/s/${encodeURIComponent(store.slug)}/about`} className="hover:text-[var(--ink)] transition-colors">
                    About Us
                  </Link>
                </li>
                {(claims.shippingConfigured || claims.hasKhalti || claims.codEnabled) && (
                  <li>
                    <Link href={`/s/${encodeURIComponent(store.slug)}/shipping`} className="hover:text-[var(--ink)] transition-colors">
                      Delivery &amp; COD
                    </Link>
                  </li>
                )}
                <li>
                  <Link href={`/s/${encodeURIComponent(store.slug)}/contact`} className="hover:text-[var(--ink)] transition-colors">
                    Contact &amp; Help
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-2.5 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[var(--ink)] block text-[11px]">
                Payments &amp; Delivery
              </span>
              <div className="space-y-1.5 text-[var(--ink-2)] text-xs">
                {claims.hasKhalti && <div>Khalti ePayment (Instant redirect)</div>}
                {claims.codEnabled && <div>Cash on Delivery (COD)</div>}
                {claims.shippingConfigured && <div>Nationwide Courier Delivery</div>}
                <div>Settled in Nepalese Rupees (NPR)</div>
              </div>
            </div>

          </div>

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
