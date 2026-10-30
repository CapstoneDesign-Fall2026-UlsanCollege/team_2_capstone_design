"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Info, Minus, Plus, RefreshCw, X } from "lucide-react";
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

export function ProductDetailSheet({
  product,
  sellingPlans = [],
  open,
  onOpenChange,
  onAddToCart,
}: ProductDetailSheetProps) {
  if (!product) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-sf-ink/40 backdrop-blur-xs transition-opacity duration-200" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto z-50 w-full sm:max-w-md border-t sm:border-t-0 sm:border-l border-sf-line bg-sf-surface text-sf-ink p-5 sm:p-6 shadow-2xl flex flex-col justify-between max-h-[90dvh] sm:max-h-dvh overflow-y-auto outline-none rounded-t-sf sm:rounded-none animate-in slide-in-from-bottom sm:slide-in-from-right duration-200">
          <ProductPurchaseForm
            key={product.id}
            product={product}
            sellingPlans={sellingPlans}
            onClose={() => onOpenChange(false)}
            onAddToCart={onAddToCart}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ProductPurchaseForm({
  product,
  sellingPlans,
  onClose,
  onAddToCart,
}: {
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
  const [purchaseType, setPurchaseType] = useState<"one_time" | "subscription">("one_time");
  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState<boolean>(false);

  // Active variant
  const selectedVariant: ProductVariant | null =
    variants.find((v) => v.id === selectedVariantId) || defaultVariant;

  // Subscription configuration
  const allowSubscription = Boolean(
    product.allow_subscription && selectedVariant?.allow_subscription
  );

  // Filter valid active selling plans
  const activePlans = sellingPlans.filter((p) => p.is_active);
  // Default to prepaid plan with highest discount or 3-cycle plan
  const defaultPrepaidPlan =
    activePlans.find((p) => p.is_prepaid && p.commitment_cycles === 3) ||
    activePlans.find((p) => p.is_prepaid) ||
    activePlans[0] ||
    null;

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(
    defaultPrepaidPlan ? defaultPrepaidPlan.id : null
  );

  const selectedPlan: SellingPlanItem | null =
    activePlans.find((p) => p.id === selectedPlanId) || defaultPrepaidPlan;

  // Maximum discount percentage for badge
  const maxDiscountPct = activePlans.length > 0
    ? Math.max(...activePlans.map((p) => p.discount_pct))
    : 10;

  // Price calculations
  const basePriceMinor = selectedVariant ? selectedVariant.price_minor : 0;
  const isSubscription = purchaseType === "subscription" && allowSubscription;

  let unitPriceMinor = basePriceMinor;
  let totalPriceMinor = basePriceMinor * quantity;

  if (isSubscription && selectedPlan) {
    const discountMultiplier = (100 - selectedPlan.discount_pct) / 100;
    unitPriceMinor = Math.round(basePriceMinor * discountMultiplier);
    if (selectedPlan.is_prepaid) {
      totalPriceMinor = unitPriceMinor * selectedPlan.commitment_cycles * quantity;
    } else {
      totalPriceMinor = unitPriceMinor * quantity;
    }
  }

  const isInStock = selectedVariant ? selectedVariant.in_stock : true;

  const handleAddToCart = () => {
    if (!selectedVariant || !isInStock) return;

    const cartPayload: SelectedCartItem = {
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productImageUrl: product.image_url,
      variantId: selectedVariant.id,
      variantLabel: selectedVariant.label,
      unitPriceMinor,
      quantity,
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
    };

    if (onAddToCart) {
      onAddToCart(cartPayload);
    }

    setJustAdded(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="flex flex-col h-full justify-between gap-6">
      {/* Header and Details */}
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Dialog.Title className="font-sf-display text-lg sm:text-xl font-bold tracking-tight text-sf-ink">
              {product.name}
            </Dialog.Title>
            <Dialog.Description className="text-xs text-sf-muted line-clamp-2">
              {product.description || "Artisanal specialty item crafted and curated in Nepal."}
            </Dialog.Description>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-sf border border-sf-line text-sf-muted hover:text-sf-ink hover:bg-sf-canvas transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Product Attributes (Altitude, Process, Tasting notes) */}
        {product.attributes && Object.keys(product.attributes).length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {product.attributes.district && (
              <span className="px-2 py-0.5 rounded-sf bg-sf-canvas border border-sf-line text-[11px] font-sf-mono text-sf-muted">
                Origin: {String(product.attributes.district)}
              </span>
            )}
            {product.attributes.process && (
              <span className="px-2 py-0.5 rounded-sf bg-sf-canvas border border-sf-line text-[11px] font-sf-mono text-sf-muted">
                {String(product.attributes.process)}
              </span>
            )}
            {product.attributes.roast_level && (
              <span className="px-2 py-0.5 rounded-sf bg-sf-canvas border border-sf-line text-[11px] font-sf-mono text-sf-muted">
                {String(product.attributes.roast_level)}
              </span>
            )}
            {product.attributes.altitude_masl && (
              <span className="px-2 py-0.5 rounded-sf bg-sf-canvas border border-sf-line text-[11px] font-sf-mono text-sf-muted tabular-nums">
                {String(product.attributes.altitude_masl)}m
              </span>
            )}
          </div>
        )}

        {/* Variant Selection Chips */}
        {variants.length > 1 && (
          <div className="space-y-2">
            <label className="text-xs font-sf-mono font-medium text-sf-ink">
              Select Size / Variant
            </label>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => {
                const isSelected = v.id === selectedVariantId;
                const isAvailable = v.in_stock && v.is_active;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    disabled={!isAvailable}
                    className={`px-3 py-1.5 rounded-sf text-xs font-sf-mono transition-all cursor-pointer ${
                      isSelected
                        ? "bg-sf-cta text-sf-cta-ink border border-sf-cta font-bold shadow-xs"
                        : isAvailable
                        ? "bg-sf-canvas text-sf-ink border border-sf-line hover:border-sf-ink/40"
                        : "bg-sf-canvas text-sf-muted border border-sf-line/50 line-through opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <span>{v.label}</span>
                    <span className="ml-1.5 opacity-80 tabular-nums">
                      {formatNpr(v.price_minor)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Purchase Mode Segmented Control (One-Time vs Subscribe & Save) */}
        {allowSubscription && (
          <div className="space-y-3 pt-2">
            <div className="text-xs font-sf-mono font-medium text-sf-ink flex items-center justify-between">
              <span>Purchase Option</span>
              {selectedPlan && selectedPlan.discount_pct > 0 && (
                <span className="text-[11px] text-sf-accent font-bold">
                  Save {selectedPlan.discount_pct}%
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 p-1 rounded-sf bg-sf-canvas border border-sf-line">
              <button
                type="button"
                onClick={() => setPurchaseType("one_time")}
                className={`py-2 px-3 rounded-sf text-xs font-sf-mono font-medium text-center transition-all cursor-pointer ${
                  purchaseType === "one_time"
                    ? "bg-sf-surface text-sf-ink shadow-xs border border-sf-line"
                    : "text-sf-muted hover:text-sf-ink"
                }`}
              >
                One-time purchase
              </button>

              <button
                type="button"
                onClick={() => setPurchaseType("subscription")}
                className={`py-2 px-3 rounded-sf text-xs font-sf-mono font-medium text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  purchaseType === "subscription"
                    ? "bg-sf-surface text-sf-ink shadow-xs border border-sf-line"
                    : "text-sf-muted hover:text-sf-ink"
                }`}
              >
                <RefreshCw className="w-3 h-3 text-sf-accent" aria-hidden="true" />
                <span>Subscribe · Save {maxDiscountPct}%</span>
              </button>
            </div>

            {/* Subscription Expanded Configuration (DESIGN.md §5: inline expand 180ms) */}
            {isSubscription && (
              <div className="p-3.5 rounded-sf bg-sf-canvas border border-sf-line space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-sf-mono">
                  <span className="text-sf-muted">Delivery Plan</span>
                  <span className="text-sf-ink font-bold tabular-nums">
                    {formatNpr(unitPriceMinor)} / bag
                  </span>
                </div>

                {/* Plan chips: 3 · 6 · 12 or active plans */}
                <div className="grid grid-cols-3 gap-2">
                  {activePlans.map((plan) => {
                    const isPlanSelected = plan.id === selectedPlanId;
                    const planPerBagPrice = Math.round(
                      basePriceMinor * ((100 - plan.discount_pct) / 100)
                    );
                    const planTotalPrice = plan.is_prepaid
                      ? planPerBagPrice * plan.commitment_cycles
                      : planPerBagPrice;

                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`p-2 rounded-sf border text-center transition-all cursor-pointer ${
                          isPlanSelected
                            ? "bg-sf-surface border-sf-cta text-sf-ink shadow-xs"
                            : "bg-sf-canvas border-sf-line text-sf-muted hover:border-sf-ink/30"
                        }`}
                      >
                        <div className="font-sf-mono text-xs font-bold text-sf-ink">
                          {plan.commitment_cycles === 1
                            ? "Pay-as-you-go"
                            : `${plan.commitment_cycles} Deliveries`}
                        </div>
                        <div className="text-[10px] font-sf-mono text-sf-muted tabular-nums mt-0.5">
                          {plan.is_prepaid ? formatNpr(planTotalPrice) : "Per bag"}
                        </div>
                        {plan.discount_pct > 0 && (
                          <div className="text-[9px] font-sf-mono text-sf-accent font-bold mt-0.5">
                            {plan.discount_pct}% OFF
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Reassurance note per DESIGN.md §5 */}
                <div className="flex items-start gap-1.5 pt-1 text-[11px] font-sf-mono text-sf-muted leading-relaxed">
                  <Info className="w-3.5 h-3.5 text-sf-accent shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    No auto-charge. Ever. We send a payment reminder link before each delivery.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quantity Stepper */}
        <div className="flex items-center justify-between pt-1">
          <label className="text-xs font-sf-mono font-medium text-sf-ink">
            Quantity
          </label>
          <div className="inline-flex items-center rounded-sf border border-sf-line bg-sf-canvas">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1 || !isInStock}
              aria-label="Decrease quantity"
              className="p-1.5 text-sf-muted hover:text-sf-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <span className="w-8 text-center font-sf-mono text-xs font-bold text-sf-ink tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              disabled={quantity >= 10 || !isInStock}
              aria-label="Increase quantity"
              className="p-1.5 text-sf-muted hover:text-sf-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="pt-4 border-t border-sf-line space-y-2">
        <div className="flex items-center justify-between text-xs font-sf-mono">
          <span className="text-sf-muted">Total Price</span>
          <span className="font-sf-mono text-base font-bold text-sf-ink tabular-nums">
            {formatNpr(totalPriceMinor)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!isInStock || justAdded}
          className={`w-full py-3 px-4 rounded-sf font-sf-mono text-xs sm:text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
            justAdded
              ? "bg-sf-surface border border-sf-line text-sf-ink"
              : isInStock
              ? "bg-sf-cta text-sf-cta-ink hover:opacity-90 active:scale-[0.99] shadow-xs"
              : "bg-sf-canvas text-sf-muted border border-sf-line cursor-not-allowed"
          }`}
        >
          {justAdded ? (
            <>
              <Check className="w-4 h-4 text-sf-accent" aria-hidden="true" />
              <span>Added to Cart ✓</span>
            </>
          ) : !isInStock ? (
            <span>Out of Stock</span>
          ) : isSubscription ? (
            <span>
              Subscribe · {formatNpr(totalPriceMinor)}
            </span>
          ) : (
            <span>
              Add to cart · {formatNpr(totalPriceMinor)}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
