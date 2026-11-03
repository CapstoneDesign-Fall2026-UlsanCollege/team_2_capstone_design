"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Info,
  Minus,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { formatNpr, ProductItem, ProductVariant, SellingPlanItem } from "@/lib/api";

export interface SelectedCartItem {
  productId: number;
  productSlug: string;
  productName: string;
  productImageUrl?: string;
  variantId: number;
  variantLabel: string;
  unitPriceMinor: number;
  quantity: number;
  purchaseType: "one_time" | "subscription";
  sellingPlan?: {
    id: number;
    code: string;
    name: string;
    commitmentCycles: number;
    discountPct: number;
    isPrepaid: boolean;
  } | null;
}

export interface ProductDetailSheetProps {
  storeSlug: string;
  product: ProductItem | null;
  sellingPlans?: SellingPlanItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart?: (item: SelectedCartItem) => void;
}

function getPlanCadenceLabel(plan: SellingPlanItem): string {
  if (plan.name) {
    const n = plan.name.toLowerCase();
    if (n.includes("weekly") && !n.includes("bi-weekly") && !n.includes("biweekly")) return "Weekly";
    if (n.includes("bi-weekly") || n.includes("biweekly") || n.includes("every 2 weeks")) return "Bi-Weekly";
    if (n.includes("monthly") || n.includes("every 4 weeks")) return "Monthly";
    if (plan.is_prepaid && plan.commitment_cycles) return `${plan.commitment_cycles}-Delivery`;
    return plan.name.replace(/^(repeat|club|subscription)\s*[-:]?\s*/i, "").trim() || plan.name;
  }
  if (plan.code.includes("weekly") && !plan.code.includes("biweekly")) return "Weekly";
  if (plan.code.includes("biweekly")) return "Bi-Weekly";
  if (plan.code.includes("3m")) return "3-Month";
  if (plan.code.includes("6m")) return "6-Month";
  if (plan.code.includes("12m")) return "12-Month";
  return plan.name || "Repeat";
}

export function ProductDetailSheet({
  storeSlug,
  product,
  sellingPlans = [],
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => onOpenChange(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-sf-surface rounded-t-2xl sm:rounded-2xl border border-sf-line shadow-2xl overflow-hidden max-h-[92dvh] sm:max-h-[88dvh] flex flex-col animate-in slide-in-from-bottom duration-300"
      >
        <ProductDetailSheetContent
          storeSlug={storeSlug}
          product={product}
          sellingPlans={sellingPlans}
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
  sellingPlans = [],
  onClose,
  onAddToCart,
}: {
  storeSlug: string;
  product: ProductItem;
  sellingPlans: SellingPlanItem[];
  onClose: () => void;
  onAddToCart?: (item: SelectedCartItem) => void;
}) {
  const variants = product.variants || [];
  const defaultVariant =
    variants.find((v) => v.in_stock && v.is_active) || variants[0] || null;

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    defaultVariant ? defaultVariant.id : null
  );

  // Dynamic Options (if any in product.attributes)
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

  const [purchaseType, setPurchaseType] = useState<"one_time" | "subscription">(
    product.allow_subscription ? "subscription" : "one_time"
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState<boolean>(false);

  // Active variant
  const selectedVariant: ProductVariant | null =
    variants.find((v) => v.id === selectedVariantId) || defaultVariant;

  // Subscription configuration
  const allowSubscription = Boolean(
    product.allow_subscription && (selectedVariant?.allow_subscription ?? true)
  );

  // Filter valid active selling plans
  const activePlans = sellingPlans.filter((p) => p.is_active);
  const defaultPlan =
    activePlans.find((p) => p.code === "hr-biweekly") ||
    activePlans.find((p) => !p.is_prepaid) ||
    activePlans[0] ||
    null;

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(
    defaultPlan ? defaultPlan.id : null
  );

  const selectedPlan: SellingPlanItem | null =
    activePlans.find((p) => p.id === selectedPlanId) || defaultPlan;

  const discountPct = selectedPlan ? selectedPlan.discount_pct : 10;

  // Price calculations
  const basePriceMinor = selectedVariant ? selectedVariant.price_minor : 75000;
  const isSubscription = purchaseType === "subscription" && allowSubscription;

  let unitPriceMinor = basePriceMinor;
  let totalPriceMinor = basePriceMinor * quantity;

  if (isSubscription && selectedPlan) {
    const discountMultiplier = (100 - discountPct) / 100;
    unitPriceMinor = Math.round(basePriceMinor * discountMultiplier);
    if (selectedPlan.is_prepaid) {
      totalPriceMinor = unitPriceMinor * selectedPlan.commitment_cycles * quantity;
    } else {
      totalPriceMinor = unitPriceMinor * quantity;
    }
  }

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
        purchaseType: isSubscription ? "subscription" : "one_time",
        sellingPlan: isSubscription && selectedPlan
          ? {
              id: selectedPlan.id,
              code: selectedPlan.code,
              name: selectedPlan.name,
              commitmentCycles: selectedPlan.commitment_cycles,
              discountPct: selectedPlan.discount_pct,
              isPrepaid: selectedPlan.is_prepaid,
            }
          : null,
      });
    }

    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 450);
  };

  const productUrl = `/s/${encodeURIComponent(storeSlug)}/products/${encodeURIComponent(product.slug || product.id)}`;

  return (
    <div className="flex flex-col h-full overflow-hidden p-5 text-left font-sf-body">
      {/* Header with Title and Close Button */}
      <div className="flex items-start justify-between gap-3 border-b border-sf-line pb-3">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-sf-mono text-sf-muted uppercase tracking-wider">
            <span>{product.category || "Authentic Craft"}</span>
            <span>·</span>
            <span>Quick View</span>
          </div>
          <h2 id="sheet-title" className="font-sf-display text-base sm:text-lg font-bold text-sf-ink truncate">
            {product.name}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="w-8 h-8 rounded-full border border-sf-line bg-sf-canvas flex items-center justify-center text-sf-muted hover:text-sf-ink transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
        
        {/* Product Media & Price Header */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-20 h-20 rounded-sf border border-sf-line bg-sf-canvas overflow-hidden shrink-0 flex items-center justify-center">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-8 h-8 text-sf-muted opacity-50" />
            )}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-sf-mono text-lg font-bold text-sf-ink tabular-nums">
                {formatNpr(unitPriceMinor)}
              </span>
              {isSubscription && (
                <span className="text-[10px] font-sf-mono text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Save 10%
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-xs text-sf-muted line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}

            <Link
              href={productUrl}
              onClick={onClose}
              className="inline-flex items-center gap-1 text-[11px] font-sf-mono text-sf-cta hover:underline pt-0.5"
            >
              <span>View Full Details &amp; Story</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 1. Dynamic Attribute Pickers */}
        {dynamicOptions.length > 0 && (
          <div className="space-y-2">
            {dynamicOptions.map((opt) => (
              <div key={opt.name} className="space-y-1">
                <label className="font-bold text-sf-ink uppercase tracking-wider text-[10px] font-sf-mono block">
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
                        className={`px-2.5 py-1 rounded text-xs font-sf-mono border transition-all cursor-pointer ${
                          isSelected
                            ? "border-sf-ink bg-sf-ink text-white font-bold"
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

        {/* 2. Variant Selector */}
        {variants.length > 1 && (
          <div className="space-y-1.5">
            <label className="font-bold text-sf-ink uppercase tracking-wider text-[10px] font-sf-mono block">
              Select Variant
            </label>
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
                    className={`p-2 rounded-sf text-left transition-all cursor-pointer border ${
                      isSelected
                        ? "border-sf-ink bg-sf-surface ring-2 ring-sf-ink font-bold shadow-2xs"
                        : isAvailable
                        ? "border-sf-line bg-sf-surface hover:border-sf-muted"
                        : "border-sf-line bg-sf-canvas opacity-40 cursor-not-allowed line-through"
                    }`}
                  >
                    <div className="text-xs font-bold text-sf-ink">{v.label}</div>
                    <div className="text-[10px] font-sf-mono text-sf-muted mt-0.5">
                      {formatNpr(v.price_minor)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Purchase Mode Toggle */}
        {allowSubscription && (
          <div className="space-y-2 pt-1 border-t border-sf-line">
            <label className="font-bold text-sf-ink uppercase tracking-wider text-[10px] font-sf-mono block">
              Purchase Option
            </label>

            {/* One-time */}
            <div
              onClick={() => setPurchaseType("one_time")}
              className={`p-2.5 rounded-sf border transition-all cursor-pointer ${
                purchaseType === "one_time"
                  ? "border-sf-ink bg-sf-surface ring-2 ring-sf-ink shadow-2xs"
                  : "border-sf-line bg-sf-canvas hover:border-sf-muted"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="sheet_purchase_option"
                    checked={purchaseType === "one_time"}
                    onChange={() => setPurchaseType("one_time")}
                    className="accent-sf-cta w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="font-bold text-sf-ink">One-time purchase</span>
                </div>
                <span className="font-sf-mono font-bold text-sf-ink text-xs tabular-nums">
                  {formatNpr(basePriceMinor)}
                </span>
              </div>
            </div>

            {/* Subscribe & Save */}
            <div
              onClick={() => setPurchaseType("subscription")}
              className={`p-2.5 rounded-sf border transition-all cursor-pointer space-y-2 ${
                purchaseType === "subscription"
                  ? "border-emerald-700 bg-emerald-50/40 ring-2 ring-emerald-700 shadow-2xs"
                  : "border-sf-line bg-sf-canvas hover:border-sf-muted"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="sheet_purchase_option"
                    checked={purchaseType === "subscription"}
                    onChange={() => setPurchaseType("subscription")}
                    className="accent-emerald-700 w-3.5 h-3.5 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sf-ink">Subscribe &amp; Save 10%</span>
                  </div>
                </div>
                <span className="font-sf-mono font-bold text-emerald-800 text-xs tabular-nums">
                  {formatNpr(Math.round(basePriceMinor * 0.9))}
                </span>
              </div>

              {purchaseType === "subscription" && (
                <div className="pt-2 border-t border-emerald-200">
                  <div className="grid grid-cols-3 gap-1.5">
                    {activePlans.map((plan) => {
                      const isPlanSelected = plan.id === selectedPlanId;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlanId(plan.id);
                          }}
                          className={`p-1.5 rounded border text-center transition-all cursor-pointer ${
                            isPlanSelected
                              ? "border-sf-ink bg-sf-ink text-white font-bold text-[10px]"
                              : "border-sf-line bg-sf-surface text-sf-ink text-[10px] hover:border-sf-muted"
                          }`}
                        >
                          <div className="truncate">{getPlanCadenceLabel(plan)}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Quantity Stepper */}
        <div className="flex items-center justify-between pt-1 border-t border-sf-line">
          <label className="font-bold text-sf-ink uppercase tracking-wider text-[10px] font-sf-mono">
            Quantity
          </label>
          <div className="inline-flex items-center rounded-sf border border-sf-line bg-sf-canvas">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1 || !isInStock}
              className="w-9 h-9 flex items-center justify-center text-sf-muted hover:text-sf-ink disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center font-sf-mono text-xs font-bold text-sf-ink tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              disabled={quantity >= 10 || !isInStock}
              className="w-9 h-9 flex items-center justify-center text-sf-muted hover:text-sf-ink disabled:opacity-30 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Sticky Bottom Thumb-Zone Action Bar */}
      <div className="pt-3 border-t border-sf-line bg-sf-surface space-y-2">
        <div className="flex items-center justify-between text-xs font-sf-mono">
          <span className="text-sf-muted">Total:</span>
          <span className="font-sf-mono text-base font-bold text-sf-ink tabular-nums">
            {formatNpr(totalPriceMinor)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!isInStock || justAdded}
          className={`w-full min-h-[46px] h-11 rounded-sf font-sf-body text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] ${
            justAdded
              ? "bg-emerald-800 text-white"
              : isInStock
              ? "bg-sf-cta text-sf-cta-ink hover:opacity-95"
              : "bg-sf-line text-sf-muted cursor-not-allowed"
          }`}
        >
          {justAdded ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Added to Bag ✓</span>
            </>
          ) : !isInStock ? (
            <span>Sold Out</span>
          ) : isSubscription ? (
            <span>Start Subscription · {formatNpr(totalPriceMinor)}</span>
          ) : (
            <span>Add to Bag · {formatNpr(totalPriceMinor)}</span>
          )}
        </button>
      </div>
    </div>
  );
}
