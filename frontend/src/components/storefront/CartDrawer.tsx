"use client";

import React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Minus, Plus, RefreshCw, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { formatNpr } from "@/lib/api";
import { useCart } from "./CartContext";

export function CartDrawer() {
  const router = useRouter();
  const {
    storeSlug,
    items,
    itemCount,
    subtotalMinor,
    isCartOpen,
    closeCart,
    updateQty,
    removeItem,
    freeShippingThresholdMinor,
  } = useCart();

  // Free delivery threshold calculations
  const hasThreshold = Boolean(
    freeShippingThresholdMinor && freeShippingThresholdMinor > 0
  );
  const thresholdMinor = freeShippingThresholdMinor || 0;
  const isFreeDeliveryQualified = hasThreshold && subtotalMinor >= thresholdMinor;
  const remainingForFreeDelivery = hasThreshold
    ? Math.max(0, thresholdMinor - subtotalMinor)
    : 0;
  const thresholdProgressPct = hasThreshold
    ? Math.min(100, Math.round((subtotalMinor / thresholdMinor) * 100))
    : 0;

  const handleProceedToCheckout = () => {
    closeCart();
    router.push(`/s/${encodeURIComponent(storeSlug)}/checkout`);
  };

  return (
    <Dialog.Root open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-sf-ink/40 backdrop-blur-xs transition-opacity duration-200" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto z-50 w-full sm:max-w-md border-t sm:border-t-0 sm:border-l border-sf-line bg-sf-surface text-sf-ink flex flex-col justify-between max-h-[85dvh] sm:max-h-dvh overflow-hidden outline-none rounded-t-sf sm:rounded-none animate-in slide-in-from-bottom sm:slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-sf-line flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dialog.Title className="font-sf-display text-base sm:text-lg font-bold text-sf-ink">
                Shopping Cart
              </Dialog.Title>
              {itemCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-sf-canvas border border-sf-line text-[11px] font-sf-mono font-semibold text-sf-ink tabular-nums">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={closeCart}
              aria-label="Close cart"
              className="p-1.5 rounded-sf border border-sf-line text-sf-muted hover:text-sf-ink hover:bg-sf-canvas transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <Dialog.Description className="sr-only">
            Store cart with selected items, delivery threshold progress, and checkout action.
          </Dialog.Description>

          {/* Delivery Threshold Meter */}
          {hasThreshold && items.length > 0 && (
            <div className="px-4 py-3 bg-sf-canvas border-b border-sf-line space-y-1.5">
              <div className="flex items-center justify-between text-xs font-sf-mono">
                <div className="flex items-center gap-1.5 text-sf-ink font-medium">
                  <Truck className="w-3.5 h-3.5 text-sf-accent" aria-hidden="true" />
                  {isFreeDeliveryQualified ? (
                    <span className="text-sf-ink font-bold">
                      ✓ Free delivery qualified!
                    </span>
                  ) : (
                    <span>
                      Add{" "}
                      <span className="font-bold tabular-nums">
                        {formatNpr(remainingForFreeDelivery)}
                      </span>{" "}
                      for free delivery
                    </span>
                  )}
                </div>
                <span className="text-sf-muted text-[11px] tabular-nums">
                  {thresholdProgressPct}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-sf-surface border border-sf-line/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sf-accent transition-all duration-300"
                  style={{ width: `${thresholdProgressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Line Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-sf-line">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-sf-canvas border border-sf-line flex items-center justify-center text-sf-muted">
                  <ShoppingBag className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-sf-display text-sm sm:text-base font-semibold text-sf-ink">
                    Your cart is empty
                  </h4>
                  <p className="text-xs text-sf-muted max-w-xs leading-relaxed">
                    Explore artisanal coffees, teas, and specialty items from this store.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-2 px-4 py-2 rounded-sf border border-sf-line bg-sf-surface text-sf-ink font-sf-mono text-xs font-medium hover:bg-sf-canvas transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              items.map((item) => {
                const isSubscription = item.purchaseType === "subscription";
                const isPrepaid = Boolean(item.sellingPlan?.isPrepaid);
                const cycles = item.sellingPlan?.commitmentCycles || 1;

                const lineItemTotalMinor =
                  isSubscription && isPrepaid
                    ? item.unitPriceMinor * cycles * item.quantity
                    : item.unitPriceMinor * item.quantity;

                const planId = item.sellingPlan ? item.sellingPlan.id : null;

                return (
                  <div key={`${item.variantId}-${item.purchaseType}-${planId}`} className="py-3.5 first:pt-0 last:pb-0 flex gap-3.5">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-sf border border-sf-line bg-sf-canvas overflow-hidden shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-6 h-6 text-sf-muted" aria-hidden="true" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between gap-1 min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-sf-display text-xs sm:text-sm font-semibold text-sf-ink truncate">
                            {item.productName}
                          </h4>
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(item.variantId, item.purchaseType, planId)
                            }
                            aria-label={`Remove ${item.productName}`}
                            className="text-sf-muted hover:text-sf-ink p-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>

                        {/* Variant and Subscription Badge */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-sf-mono text-sf-muted">
                            {item.variantLabel}
                          </span>
                          {isSubscription && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-sf-mono px-1.5 py-0.2 rounded-sf bg-sf-canvas border border-sf-line text-sf-ink">
                              <RefreshCw className="w-2.5 h-2.5 text-sf-accent" aria-hidden="true" />
                              {isPrepaid
                                ? `↻ ${cycles} deliveries prepaid`
                                : "↻ Pay-per-delivery"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stepper and Price Row */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="inline-flex items-center rounded-sf border border-sf-line bg-sf-canvas">
                          <button
                            type="button"
                            onClick={() =>
                              updateQty(
                                item.variantId,
                                item.purchaseType,
                                planId,
                                item.quantity - 1
                              )
                            }
                            aria-label="Decrease quantity"
                            className="p-1 text-sf-muted hover:text-sf-ink transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" aria-hidden="true" />
                          </button>
                          <span className="w-6 text-center font-sf-mono text-xs font-semibold text-sf-ink tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQty(
                                item.variantId,
                                item.purchaseType,
                                planId,
                                item.quantity + 1
                              )
                            }
                            aria-label="Increase quantity"
                            className="p-1 text-sf-muted hover:text-sf-ink transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>

                        <span className="font-sf-mono text-xs sm:text-sm font-bold text-sf-ink tabular-nums">
                          {formatNpr(lineItemTotalMinor)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-sf-line bg-sf-surface space-y-3 pb-safe">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs sm:text-sm font-sf-mono">
                  <span className="text-sf-muted">Subtotal</span>
                  <span className="font-bold text-sf-ink tabular-nums">
                    {formatNpr(subtotalMinor)}
                  </span>
                </div>
                <p className="text-[11px] font-sf-mono text-sf-muted">
                  Shipping fee computed dynamically at checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full h-12 rounded-sf bg-sf-cta text-sf-cta-ink font-sf-mono text-xs sm:text-sm font-semibold tracking-wide hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <span>·</span>
                <span className="tabular-nums">{formatNpr(subtotalMinor)}</span>
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
