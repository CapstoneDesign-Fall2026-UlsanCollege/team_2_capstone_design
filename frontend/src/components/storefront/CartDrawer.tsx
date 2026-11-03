"use client";

import React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowRight,
  Gift,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
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

  // Free delivery threshold calculations (default 1,500 NPR = 150000 minor)
  const thresholdMinor = freeShippingThresholdMinor || 150000;
  const isFreeDeliveryQualified = subtotalMinor >= thresholdMinor;
  const remainingForFreeDelivery = Math.max(0, thresholdMinor - subtotalMinor);
  const thresholdProgressPct = Math.min(100, Math.round((subtotalMinor / thresholdMinor) * 100));

  // Roastery Club Perk: If cart has 2 or more items, qualify for a free drip bag sample
  const qualifiesForPerk = itemCount >= 2;

  const handleProceedToCheckout = () => {
    closeCart();
    router.push(`/s/${encodeURIComponent(storeSlug)}/checkout`);
  };

  return (
    <Dialog.Root open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-sf-ink/40 backdrop-blur-xs transition-opacity duration-200" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto z-50 w-full sm:max-w-md border-t sm:border-t-0 sm:border-l border-sf-line bg-sf-surface text-sf-ink flex flex-col justify-between max-h-[92dvh] sm:max-h-dvh overflow-hidden outline-none shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-right duration-250 font-sf-body">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-sf-line flex items-center justify-between bg-sf-surface">
            <div className="flex items-center gap-2">
              <Dialog.Title className="font-sf-display text-base sm:text-lg font-bold tracking-tight text-sf-ink">
                Your Bag
              </Dialog.Title>
              {itemCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-sf-canvas border border-sf-line text-[11px] font-sf-mono font-bold text-sf-ink tabular-nums">
                  {itemCount} {itemCount === 1 ? "lot" : "lots"}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={closeCart}
              aria-label="Close cart"
              className="min-h-[44px] min-w-[44px] p-2 rounded-sf border border-sf-line text-sf-muted hover:text-sf-ink hover:bg-sf-canvas transition-colors cursor-pointer flex items-center justify-center"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <Dialog.Description className="sr-only">
            Shopping cart showing selected products, delivery progress meter, and checkout button.
          </Dialog.Description>

          {/* Delivery Threshold Progress Meter */}
          {items.length > 0 && (
            <div className="px-4 py-3 bg-sf-canvas border-b border-sf-line space-y-1.5">
              <div className="flex items-center justify-between text-xs font-sf-mono">
                <div className="flex items-center gap-1.5 text-sf-ink font-semibold">
                  <Truck className="w-3.5 h-3.5 text-sf-accent" aria-hidden="true" />
                  {isFreeDeliveryQualified ? (
                    <span className="text-emerald-800 font-bold">
                      ✓ Free Kathmandu Valley Delivery Unlocked!
                    </span>
                  ) : (
                    <span>
                      Add{" "}
                      <span className="font-bold tabular-nums text-sf-cta">
                        {formatNpr(remainingForFreeDelivery)}
                      </span>{" "}
                      for free Valley delivery
                    </span>
                  )}
                </div>
                <span className="text-sf-muted text-[11px] tabular-nums font-bold">
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

              {/* Bonus Perk Ribbon */}
              {qualifiesForPerk && (
                <div className="flex items-center gap-1.5 text-[11px] font-sf-mono text-emerald-800 pt-0.5 font-medium">
                  <Gift className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Complimentary artisan gift sample included!</span>
                </div>
              )}
            </div>
          )}

          {/* Line Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-sf-line">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-sf-canvas border border-sf-line flex items-center justify-center text-sf-muted">
                  <ShoppingBag className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-sf-display text-base font-bold text-sf-ink">
                    Your bag is empty
                  </h4>
                  <p className="text-xs text-sf-muted max-w-xs leading-relaxed">
                    Discover handcrafted products and quality collections from our catalog.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCart}
                  className="min-h-[44px] px-5 py-2.5 rounded-sf border border-sf-line bg-sf-surface hover:bg-sf-canvas text-sf-ink text-xs font-bold transition-colors cursor-pointer"
                >
                  Browse Store Catalog
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
                  <div
                    key={`${item.variantId}-${item.purchaseType}-${planId}`}
                    className="py-3.5 first:pt-0 last:pb-0 flex gap-3.5"
                  >
                    {/* Thumbnail with aspect-square */}
                    <div className="w-18 h-18 rounded-sf border border-sf-line bg-sf-canvas overflow-hidden shrink-0 flex items-center justify-center relative">
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
                      {isSubscription && (
                        <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-sf-cta text-white text-[9px] font-sf-mono font-bold uppercase">
                          -10%
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between gap-1 min-w-0 text-left">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-sf-display text-xs sm:text-sm font-bold text-sf-ink truncate">
                            {item.productName}
                          </h4>
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(item.variantId, item.purchaseType, planId)
                            }
                            aria-label={`Remove ${item.productName}`}
                            className="min-h-[36px] min-w-[36px] text-sf-muted hover:text-sf-ink p-1 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>

                        {/* Variant and Subscription Badge */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-sf-mono text-sf-muted bg-sf-canvas px-1.5 py-0.5 rounded border border-sf-line">
                            {item.variantLabel}
                          </span>
                          {isSubscription && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-sf-mono px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                              <RefreshCw className="w-2.5 h-2.5 text-emerald-700" aria-hidden="true" />
                              <span>{item.sellingPlan?.name || "Repeat Club"}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stepper and Price Row (>= 44px tap target) */}
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
                            className="w-9 h-9 flex items-center justify-center text-sf-muted hover:text-sf-ink transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <span className="w-7 text-center font-sf-mono text-xs font-bold text-sf-ink tabular-nums">
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
                            className="w-9 h-9 flex items-center justify-center text-sf-muted hover:text-sf-ink transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
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

          {/* Footer Checkout Summary (Designed for 375px thumb reach) */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-sf-line bg-sf-surface space-y-2.5 pb-safe text-left">
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-xs sm:text-sm font-sf-mono">
                  <span className="text-sf-muted">Subtotal</span>
                  <span className="font-bold text-sf-ink text-base tabular-nums">
                    {formatNpr(subtotalMinor)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-sf-muted font-sf-mono">
                  <span>Valley Delivery:</span>
                  <span className="text-sf-ink font-semibold">24h Express / Cash on Delivery</span>
                </div>
              </div>

              {/* Checkout Button (52px tap target) */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full min-h-[48px] h-12 rounded-sf bg-sf-cta text-sf-cta-ink font-sf-body text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer hover:opacity-95 active:scale-[0.99]"
              >
                <span>Proceed to Checkout</span>
                <span>·</span>
                <span className="font-sf-mono tabular-nums">{formatNpr(subtotalMinor)}</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>

              <div className="flex items-center justify-center gap-3 text-[11px] font-sf-mono text-sf-muted">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-sf-accent" />
                  <span>Khalti &amp; COD</span>
                </span>
                <span>·</span>
                <span>All 7 Provinces</span>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
