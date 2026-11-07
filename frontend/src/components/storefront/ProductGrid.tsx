"use client";

import React from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { formatNpr, ProductItem } from "@/lib/api";
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

function isPlaceholderText(text?: string | null): boolean {
  if (!text) return true;
  const trimmed = text.trim().toLowerCase();
  return (
    trimmed === "" ||
    trimmed === "general" ||
    trimmed === "aaa" ||
    trimmed === "placeholder" ||
    trimmed === "online storefront · nepal"
  );
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
    if (onQuickAdd) {
      onQuickAdd(product);
    } else {
      onSelectProduct(product);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
      {products.map((product) => {
        const variants = product.variants || [];
        const inStockVariants = variants.filter((v) => v.in_stock && v.is_active);
        const hasStock = variants.length === 0 || inStockVariants.length > 0;
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

        const productSlugOrId = product.slug || String(product.id);
        const productHref = storeSlug
          ? `/s/${encodeURIComponent(storeSlug)}/products/${encodeURIComponent(productSlugOrId)}`
          : null;

        const CardContent = (
          <div className="flex flex-col h-full bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden transition-colors hover:border-[var(--ink)]">
            {/* 1. Product Image Frame (12px rounded container, 1px border, no overlay text) */}
            <div className="relative aspect-square sm:aspect-[4/5] w-full bg-[var(--canvas)] border-b border-[var(--border)] overflow-hidden flex items-center justify-center">
              <StoreImage
                src={product.image_url || ""}
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

              {/* Clean out-of-stock overlay only when actually sold out */}
              {!hasStock && variants.length > 0 && (
                <div className="absolute inset-0 bg-[var(--surface)]/85 flex items-center justify-center z-10">
                  <span className="px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-[var(--ink)] text-[var(--surface)]">
                    Sold Out
                  </span>
                </div>
              )}
            </div>

            {/* 2. Product Metadata & Direct Quick Add */}
            <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-3 text-left">
              <div className="space-y-1">
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
                    {minPrice > 0
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
                  disabled={!hasStock}
                  className="h-8 px-3 text-xs font-semibold shrink-0"
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
