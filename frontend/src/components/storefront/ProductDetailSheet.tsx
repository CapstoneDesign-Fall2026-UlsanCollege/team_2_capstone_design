"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Minus, Package, Plus, X } from "lucide-react";
import { formatNpr, ProductItem, ProductVariant } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { StoreImage } from "./StoreImage";

export interface SelectedCartItem {
  productId: number;
  productSlug: string;
  productName: string;
  productImageUrl?: string;
  variantId: number;
  variantLabel: string;
  unitPriceMinor: number;
  quantity: number;
}

export interface ProductDetailSheetProps {
  storeSlug: string;
  product: ProductItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart?: (item: SelectedCartItem) => void;
}

export function ProductDetailSheet({
  storeSlug,
  product,
  open,
  onOpenChange,
  onAddToCart,
}: ProductDetailSheetProps) {
  if (!open || !product) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 animate-in fade-in duration-200"
      onClick={() => onOpenChange(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-[var(--surface)] rounded-t-xl sm:rounded-xl border border-[var(--border)] overflow-hidden max-h-[90dvh] flex flex-col animate-in slide-in-from-bottom duration-250"
      >
        <ProductDetailSheetContent
          storeSlug={storeSlug}
          product={product}
          onClose={() => onOpenChange(false)}
          onAddToCart={onAddToCart}
        />
      </div>
    </div>
  );
}

function ProductDetailSheetContent({
  storeSlug,
  product,
  onClose,
  onAddToCart,
}: {
  storeSlug: string;
  product: ProductItem;
  onClose: () => void;
  onAddToCart?: (item: SelectedCartItem) => void;
}) {
  const variants = product.variants || [];
  const defaultVariant =
    variants.find((v) => v.in_stock && v.is_active) || variants[0] || null;

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    defaultVariant ? defaultVariant.id : null
  );

  const dynamicOptions = useMemo(() => {
    const attrs = product.attributes || {};
    const res: Array<{ name: string; values: string[] }> = [];
    if (attrs.options && typeof attrs.options === "object" && !Array.isArray(attrs.options)) {
      for (const [k, v] of Object.entries(attrs.options)) {
        if (Array.isArray(v) && v.length > 0) res.push({ name: k, values: v.map(String) });
      }
    }
    return res;
  }, [product.attributes]);

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const opt of dynamicOptions) {
      if (opt.values.length > 0) init[opt.name] = opt.values[0];
    }
    return init;
  });

  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState<boolean>(false);

  const selectedVariant: ProductVariant | null =
    variants.find((v) => v.id === selectedVariantId) || defaultVariant;

  const unitPriceMinor = selectedVariant ? selectedVariant.price_minor : 0;
  const totalPriceMinor = unitPriceMinor * quantity;
  const isInStock = selectedVariant ? selectedVariant.in_stock : true;

  const attributeLabels = Object.values(selectedAttributes).filter(Boolean);
  const finalVariantLabel = [
    selectedVariant?.label || "",
    ...attributeLabels,
  ]
    .filter(Boolean)
    .join(" · ") || "Standard";

  const handleAddToCart = () => {
    if (!selectedVariant || !isInStock) return;

    if (onAddToCart) {
      onAddToCart({
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        variantId: selectedVariant.id,
        variantLabel: finalVariantLabel,
        unitPriceMinor,
        quantity,
        productImageUrl: product.image_url,
      });
    }

    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 400);
  };

  const productUrl = `/s/${encodeURIComponent(storeSlug)}/products/${encodeURIComponent(product.slug || product.id)}`;

  return (
    <div className="flex flex-col h-full overflow-hidden p-5 text-left font-sans">
      {/* Header with Title and Close Button */}
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="space-y-0.5 min-w-0">
          <h2 id="sheet-title" className="font-serif text-base sm:text-lg font-bold text-[var(--ink)] truncate">
            {product.name}
          </h2>
          <span className="text-xs text-[var(--ink-2)] block font-medium">
            Select options &amp; quantity
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="w-10 h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {/* Product Media & Price Header */}
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-xl border border-[var(--border)] bg-[var(--canvas)] overflow-hidden shrink-0 flex items-center justify-center">
            <StoreImage
              src={product.image_url || ""}
              alt={product.name}
              sizes="64px"
              fallback={<Package className="w-6 h-6 text-[var(--ink-2)] opacity-50" />}
            />
          </div>

          <div className="space-y-0.5 min-w-0 flex-1">
            <span className="text-base font-semibold text-[var(--ink)] tabular-nums">
              {formatNpr(unitPriceMinor)}
            </span>
            {product.description && (
              <p className="text-xs text-[var(--ink-2)] line-clamp-1 leading-normal">
                {product.description}
              </p>
            )}
            <Link
              href={productUrl}
              onClick={onClose}
              className="inline-flex items-center gap-1 text-xs text-[var(--ink-2)] hover:text-[var(--ink)] hover:underline pt-0.5"
            >
              <span>View full product details</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 1. Dynamic Attribute Pickers */}
        {dynamicOptions.length > 0 && (
          <div className="space-y-2">
            {dynamicOptions.map((opt) => (
              <div key={opt.name} className="space-y-1">
                <label className="font-semibold text-[var(--ink)] uppercase tracking-wider text-[11px] block">
                  Select {opt.name}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {opt.values.map((val) => {
                    const isSelected = (selectedAttributes[opt.name] || opt.values[0]) === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSelectedAttributes((p) => ({ ...p, [opt.name]: val }))}
                        className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)] font-semibold"
                            : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ink-2)]"
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

        {/* 2. Variant Selector */}
        {variants.length > 1 && (
          <div className="space-y-1.5">
            <label className="font-semibold text-[var(--ink)] uppercase tracking-wider text-[11px] block">
              Variant
            </label>
            <div className="grid grid-cols-2 gap-2">
              {variants.map((v) => {
                const isSelected = v.id === selectedVariantId;
                const isAvailable = v.in_stock && v.is_active;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    disabled={!isAvailable}
                    className={`min-h-[44px] p-2.5 rounded-lg text-left transition-all cursor-pointer border ${
                      isSelected
                        ? "border-[var(--ink)] bg-[var(--surface)] ring-1 ring-[var(--ink)] font-semibold"
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

        {/* 3. Quantity Stepper */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
          <label className="font-semibold text-[var(--ink)] uppercase tracking-wider text-[11px]">
            Quantity
          </label>
          <div className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1 || !isInStock}
              aria-label="Decrease quantity"
              className="w-11 h-11 flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-semibold text-[var(--ink)] tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              disabled={quantity >= 10 || !isInStock}
              aria-label="Increase quantity"
              className="w-11 h-11 flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] disabled:opacity-30 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Thumb-Zone Action Bar */}
      <div className="pt-3 border-t border-[var(--border)] bg-[var(--surface)] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--ink-2)]">Subtotal:</span>
          <span className="text-base font-semibold text-[var(--ink)] tabular-nums">
            {formatNpr(totalPriceMinor)}
          </span>
        </div>

        <Button
          variant="primary"
          onClick={handleAddToCart}
          disabled={!isInStock || justAdded}
          className="w-full h-11 text-sm font-semibold"
        >
          {justAdded ? (
            <>
              <Check className="w-4 h-4 text-[var(--surface)]" />
              <span>Added to Bag</span>
            </>
          ) : !isInStock ? (
            <span>Sold Out</span>
          ) : (
            <span>Add to bag · {formatNpr(totalPriceMinor)}</span>
          )}
        </Button>
      </div>
    </div>
  );
}
