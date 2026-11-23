"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Package } from "lucide-react";
import { formatNpr, ProductItem } from "@/lib/api";
import { isPlaceholderText, sanitizeStorefrontImageUrl } from "@/lib/storefront-helpers";
import { Button } from "@/components/ui/button";
import { StoreImage } from "./StoreImage";

export interface ProductGridProps {
  storeSlug?: string;
  products: ProductItem[];
  onSelectProduct: (product: ProductItem) => void;
  onQuickAdd?: (product: ProductItem) => void;
  themePreset?: string;
  defaultCategory?: string;
}

export function ProductGrid({
  storeSlug,
  products,
  onSelectProduct,
  onQuickAdd,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center my-6">
        <Package className="w-10 h-10 text-[var(--ink-2)] mx-auto mb-3 opacity-60" aria-hidden="true" />
        <h3 className="font-serif text-base font-bold text-[var(--ink)] mb-1">
          No Products Found
        </h3>
        <p className="text-xs text-[var(--ink-2)] max-w-sm mx-auto leading-relaxed">
          No items match your filter criteria. Try choosing a different collection or clearing your search.
        </p>
      </div>
    );
  }

  const handleAddClick = (e: React.MouseEvent, product: ProductItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.id < 0) return;
    if (onQuickAdd) {
      onQuickAdd(product);
    } else {
      onSelectProduct(product);
    }
  };

  const count = products.length;
  const desktopCols: 1 | 2 | 3 | 4 =
    count <= 1
      ? 1
      : count === 2
      ? 2
      : count === 3 || count === 6 || (count % 3 === 0 && count % 4 !== 0)
      ? 3
      : 4;

  return (
    <div
      data-item-count={count}
      data-grid-cols={desktopCols}
      className="sf-product-grid grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5"
    >
      {products.map((product) => {
        const variants = product.variants || [];
        const inStockVariants = variants.filter((v) => v.in_stock && v.is_active);
        const hasStock = inStockVariants.length > 0;
        const validVariants = inStockVariants.length > 0 ? inStockVariants : variants;

        const prices = validVariants
          .map((v) => v.price_minor)
          .filter((p): p is number => typeof p === "number" && p > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        const hasMultiplePrices = minPrice !== maxPrice && minPrice > 0;

        // Clean category or attribute tag
        const rawCategory = product.category || (product.attributes?.category as string) || "";
        const cleanCategory = !isPlaceholderText(rawCategory) ? rawCategory.trim() : "";

        // Origin / district badge metadata (displayed on pahadi-sage product cards)
        const rawOrigin =
          (product.attributes?.origin as string) ||
          (product.attributes?.district as string) ||
          (product.attributes?.region as string) ||
          (product.attributes?.terroir as string) ||
          "";
        const cleanOrigin = !isPlaceholderText(rawOrigin) ? rawOrigin.trim() : "";

        const isDemoProduct = product.id < 0;
        const productSlugOrId = product.slug || String(product.id);
        const productHref =
          storeSlug && !isDemoProduct
            ? `/s/${encodeURIComponent(storeSlug)}/products/${encodeURIComponent(productSlugOrId)}`
            : null;

        const CardContent = (
          <div className="sf-card-radius flex flex-col h-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden transition-colors hover:border-[var(--ink)]">
            {/* 1. Product Image Frame (theme aspect ratio + theme card radius, no overlay text) */}
            <div className="sf-product-media relative w-full bg-[var(--canvas)] border-b border-[var(--border)] overflow-hidden flex items-center justify-center">
              <StoreImage
                src={sanitizeStorefrontImageUrl(product.image_url)}
                alt={product.name}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
                className="object-cover transition-transform duration-300 group-hover:scale-102"
                fallback={
                  <div
                    className="w-full h-full flex flex-col items-center justify-center p-4 text-[var(--ink-2)]"
                    aria-hidden="true"
                  >
                    <Package className="w-8 h-8 stroke-[1.25] text-[var(--ink-2)] mb-1 opacity-50" />
                    <span className="text-[11px] text-[var(--ink-2)]">No image</span>
                  </div>
                }
              />

              {/* Clean out-of-stock overlay when no purchasable variants exist */}
              {!hasStock && (
                <div className="absolute inset-0 bg-[var(--surface)]/85 flex items-center justify-center z-10">
                  <span className="px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-[var(--ink)] text-[var(--surface)]">
                    {variants.length === 0 ? "Unavailable" : "Sold Out"}
                  </span>
                </div>
              )}
            </div>

            {/* 2. Product Metadata & Direct Quick Add */}
            <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-3 text-left">
              <div className="space-y-1">
                {cleanOrigin && (
                  <span className="sf-origin-badge hidden items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-[var(--nav-active)] text-[var(--primary)] border border-[var(--border-subtle)] w-fit">
                    <MapPin className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                    <span>{cleanOrigin}</span>
                  </span>
                )}
                {cleanCategory && (
                  <p className="text-[11px] text-[var(--ink-2)] font-medium uppercase tracking-wider">
                    {cleanCategory}
                  </p>
                )}
                <h3 className="text-xs sm:text-sm font-semibold text-[var(--ink)] leading-snug line-clamp-2">
                  {product.name}
                </h3>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border)]/60">
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-semibold text-[var(--ink)] tabular-nums">
                    {variants.length === 0
                      ? "Unavailable"
                      : minPrice > 0
                      ? hasMultiplePrices
                        ? `From ${formatNpr(minPrice)}`
                        : formatNpr(minPrice)
                      : "Rs. 0"}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => handleAddClick(e, product)}
                  disabled={!hasStock || isDemoProduct}
                  title={isDemoProduct ? "Preview demo item" : undefined}
                  className="sf-control-radius h-8 px-3 text-xs font-semibold shrink-0"
                  aria-label={`Add ${product.name} to bag`}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        );

        if (productHref) {
          return (
            <Link
              key={product.id}
              href={productHref}
              className="group flex flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] rounded-xl"
            >
              {CardContent}
            </Link>
          );
        }

        return (
          <div
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
            className="group flex flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] rounded-xl cursor-pointer"
          >
            {CardContent}
          </div>
        );
      })}
    </div>
  );
}
