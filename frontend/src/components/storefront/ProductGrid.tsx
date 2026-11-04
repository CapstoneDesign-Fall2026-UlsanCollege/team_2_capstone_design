"use client";

import React from "react";
import Link from "next/link";
import { Eye, Package } from "lucide-react";
import { formatNpr, ProductItem } from "@/lib/api";
import { getProductFallbackImage } from "@/lib/storefront-media";

export interface ProductGridProps {
  storeSlug?: string;
  products: ProductItem[];
  onSelectProduct: (product: ProductItem) => void;
  themePreset?: string;
  defaultCategory?: string;
}

export function ProductGrid({
  storeSlug,
  products,
  onSelectProduct,
  themePreset,
  defaultCategory,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-sf border border-dashed border-sf-line bg-sf-surface p-12 text-center my-6">
        <Package className="w-10 h-10 text-sf-muted mx-auto mb-3 opacity-60" aria-hidden="true" />
        <h3 className="font-sf-display text-base font-bold text-sf-ink mb-1">
          No Products Found
        </h3>
        <p className="text-xs text-sf-muted max-w-sm mx-auto leading-relaxed">
          No items match your filter selection. Try selecting &quot;All Items&quot; or clearing your search.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
      {products.map((product, index) => {
        const variants = product.variants || [];
        const inStockVariants = variants.filter((v) => v.in_stock && v.is_active);
        const hasStock = inStockVariants.length > 0;
        const validVariants = inStockVariants.length > 0 ? inStockVariants : variants;

        const prices = validVariants.map((v) => v.price_minor);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        const hasMultiplePrices = minPrice !== maxPrice;

        // Subscription discount calculation (10% standard)
        const subscriptionPriceMinor = Math.round(minPrice * 0.9);

        // Tags & attributes
        const categoryLabel = product.category || (product.attributes?.category as string) || "";
        const originDistrict =
          (product.attributes?.district as string) ||
          (product.attributes?.origin as string) ||
          "";

        // Secondary image for hover reveal if provided, with intelligent high-res category fallback
        const fallback = getProductFallbackImage(
          product.category || categoryLabel || defaultCategory,
          themePreset,
          index
        );
        const primaryImg = product.image_url || fallback.image;
        const secondaryImg = (product.attributes?.secondary_image as string) || "";

        const productSlugOrId = product.slug || String(product.id);
        const productHref = storeSlug
          ? `/s/${encodeURIComponent(storeSlug)}/products/${encodeURIComponent(productSlugOrId)}`
          : null;

        const CardContent = (
          <>
            {/* 1. Image Container with aspect-[4/5] & Secondary Image Reveal */}
            <div className="relative aspect-[4/5] w-full bg-sf-canvas rounded-sf overflow-hidden border border-sf-line/60 flex items-center justify-center">
              
              {/* Primary Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={primaryImg}
                alt={product.name}
                loading="lazy"
                className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                  secondaryImg ? "group-hover:opacity-0 transition-opacity duration-300" : ""
                }`}
              />

              {/* Secondary Image Revealed on Hover */}
              {secondaryImg && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={secondaryImg}
                  alt={`${product.name} alternate view`}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"
                />
              )}

              {/* Badges Overlay (Top Left) */}
              <div className="absolute top-2 left-2 flex flex-col items-start gap-1 pointer-events-none z-10">
                {product.allow_subscription && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-sf-mono font-bold uppercase tracking-wider bg-emerald-800 text-white shadow-xs">
                    Sub 10%
                  </span>
                )}
                {originDistrict ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-sf-mono font-medium uppercase tracking-wider bg-sf-surface/95 text-sf-ink border border-sf-line shadow-xs backdrop-blur-xs">
                    {originDistrict}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-sf-mono font-medium uppercase tracking-wider bg-sf-surface/90 text-sf-ink border border-sf-line shadow-2xs backdrop-blur-xs">
                    {categoryLabel || fallback.category}
                  </span>
                )}
              </div>

              {/* Out of Stock Overlay */}
              {!hasStock && variants.length > 0 && (
                <div className="absolute inset-0 bg-sf-surface/85 backdrop-blur-xs flex items-center justify-center z-10">
                  <span className="px-2.5 py-1 rounded text-xs font-sf-mono font-bold uppercase tracking-wider bg-sf-ink text-white">
                    Sold Out
                  </span>
                </div>
              )}

              {/* Quick-View Action Pill */}
              <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 hidden sm:block z-20">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectProduct(product);
                  }}
                  className="w-full h-8 rounded-sf bg-sf-surface/95 hover:bg-sf-surface text-sf-ink text-[11px] font-sf-body font-semibold tracking-wide border border-sf-line shadow-md flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Eye className="w-3 h-3 text-sf-muted" />
                  <span>Quick View</span>
                </button>
              </div>
            </div>

            {/* 2. Product Metadata */}
            <div className="pt-2.5 flex flex-col gap-0.5">
              
              {/* Category Hint */}
              <div className="flex items-center gap-1.5 text-[10px] font-sf-mono text-sf-muted uppercase tracking-wider">
                <span>{categoryLabel || "Direct from Maker"}</span>
              </div>

              {/* Product Title */}
              <h3 className="font-sf-display text-xs sm:text-sm font-bold text-sf-ink group-hover:underline underline-offset-2 line-clamp-1 leading-snug">
                {product.name}
              </h3>

              {/* Integer NPR Dual Price */}
              <div className="pt-1 flex items-baseline gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-sf-ink tabular-nums font-sf-mono">
                  {hasMultiplePrices ? `From ${formatNpr(minPrice)}` : formatNpr(minPrice)}
                </span>

                {product.allow_subscription && (
                  <span className="text-[10px] font-sf-mono text-emerald-800 font-semibold tabular-nums">
                    or {formatNpr(subscriptionPriceMinor)}/sub
                  </span>
                )}
              </div>
            </div>
          </>
        );

        if (productHref) {
          return (
            <Link
              key={product.id}
              href={productHref}
              className="group flex flex-col text-left cursor-pointer focus:outline-none bg-sf-surface p-3 rounded-sf border border-sf-line shadow-2xs hover:shadow-sm transition-shadow block"
            >
              {CardContent}
            </Link>
          );
        }

        return (
          <article
            key={product.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectProduct(product)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectProduct(product);
              }
            }}
            className="group flex flex-col text-left cursor-pointer focus:outline-none bg-sf-surface p-3 rounded-sf border border-sf-line shadow-2xs hover:shadow-sm transition-shadow"
          >
            {CardContent}
          </article>
        );
      })}
    </div>
  );
}
