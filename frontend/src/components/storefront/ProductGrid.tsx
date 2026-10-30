"use client";

import React from "react";
import { Package, RefreshCw } from "lucide-react";
import { formatNpr, ProductItem } from "@/lib/api";

export interface ProductGridProps {
  products: ProductItem[];
  onSelectProduct: (product: ProductItem) => void;
}

export function ProductGrid({ products, onSelectProduct }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-sf border border-dashed border-sf-line bg-sf-surface p-12 text-center">
        <Package className="w-10 h-10 text-sf-muted mx-auto mb-3" aria-hidden="true" />
        <h3 className="font-sf-display text-base font-semibold text-sf-ink mb-1">
          No Products Available
        </h3>
        <p className="text-xs text-sf-muted max-w-sm mx-auto leading-relaxed">
          This store is currently preparing its catalog. Check back soon for freshly roasted and
          curated goods.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-6">
      {products.map((product) => {
        const variants = product.variants || [];
        const inStockVariants = variants.filter((v) => v.in_stock && v.is_active);
        const hasStock = inStockVariants.length > 0;
        const validVariants = inStockVariants.length > 0 ? inStockVariants : variants;

        const prices = validVariants.map((v) => v.price_minor);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        const hasMultiplePrices = minPrice !== maxPrice;

        // Extract tasting notes or first attribute for flavor highlight
        const rawNotes = product.attributes?.tasting_notes as unknown;
        const tastingNotes = Array.isArray(rawNotes)
          ? rawNotes.slice(0, 2).join(" · ")
          : typeof rawNotes === "string"
          ? rawNotes
          : (product.attributes?.district as string | undefined) ||
            (product.attributes?.process as string | undefined);

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
            className="group relative flex flex-col rounded-sf border border-sf-line bg-sf-surface overflow-hidden hover:border-sf-ink/40 transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-sf-ink/20"
          >
            {/* Image Container */}
            <div className="aspect-square bg-sf-canvas overflow-hidden relative flex items-center justify-center">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image_url}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <Package className="w-8 h-8 text-sf-muted mb-1" aria-hidden="true" />
                  <span className="text-[11px] font-sf-mono text-sf-muted">ShopCraft</span>
                </div>
              )}

              {/* Subscription Pill */}
              {product.allow_subscription && (
                <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-sf border border-sf-line bg-sf-surface/90 backdrop-blur-xs text-[10px] sm:text-xs font-sf-mono text-sf-ink shadow-xs">
                  <RefreshCw className="w-2.5 h-2.5 text-sf-accent" aria-hidden="true" />
                  <span>Subscribe &amp; Save</span>
                </div>
              )}

              {/* Out of Stock Overlay */}
              {!hasStock && variants.length > 0 && (
                <div className="absolute inset-0 bg-sf-canvas/80 backdrop-blur-xs flex items-center justify-center">
                  <span className="px-2.5 py-1 rounded-sf border border-sf-line bg-sf-surface text-xs font-sf-mono text-sf-muted">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Content Container */}
            <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <h3 className="font-sf-display text-sm sm:text-base font-semibold text-sf-ink line-clamp-1 group-hover:opacity-90 transition-opacity">
                  {product.name}
                </h3>

                {tastingNotes ? (
                  <p className="text-[11px] sm:text-xs text-sf-muted line-clamp-1">
                    {tastingNotes}
                  </p>
                ) : (
                  <p className="text-[11px] sm:text-xs text-sf-muted line-clamp-1">
                    {product.description || "Artisanal Nepali specialty item"}
                  </p>
                )}
              </div>

              {/* Price & Action Row */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-sf-line/60">
                <div className="flex flex-col">
                  {hasMultiplePrices && (
                    <span className="text-[10px] font-sf-mono text-sf-muted uppercase tracking-wider">
                      From
                    </span>
                  )}
                  <span className="font-sf-mono text-xs sm:text-sm font-bold text-sf-ink tabular-nums">
                    {formatNpr(minPrice)}
                  </span>
                </div>

                <span className="inline-flex items-center justify-center px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-sf bg-sf-cta text-sf-cta-ink font-sf-mono text-[11px] sm:text-xs font-semibold group-hover:opacity-90 transition-opacity whitespace-nowrap">
                  Select
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
