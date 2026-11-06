"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowRight,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { formatNpr } from "@/lib/api";
import { useCart } from "./CartContext";

export function CartDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    storeSlug,
    themePreset,
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
  const thresholdMinor = freeShippingThresholdMinor || 150000;
  const isFreeDeliveryQualified = subtotalMinor >= thresholdMinor;
  const remainingForFreeDelivery = Math.max(0, thresholdMinor - subtotalMinor);
  const thresholdProgressPct = Math.min(100, Math.round((subtotalMinor / thresholdMinor) * 100));

  // Automatically close cart on navigation
  useEffect(() => {
    closeCart();
  }, [pathname, closeCart]);

  const isCheckoutOrOrder = Boolean(
    pathname?.includes("/checkout") || pathname?.includes("/orders/")
  );

  const handleProceedToCheckout = () => {
    closeCart();
    router.push(`/s/${encodeURIComponent(storeSlug)}/checkout`);
  };

  if (isCheckoutOrOrder) {
    return null;
  }

  return (
    <Dialog.Root open={isCartOpen && !isCheckoutOrOrder} onOpenChange={(open) => !open && closeCart()}>
      <Dialog.Portal>
        {/* Dark token-based overlay with smooth fade animation */}
        <Dialog.Overlay
          className="cart-drawer-overlay fixed inset-0 z-50 bg-black/60 transition-opacity"
        />
        <Dialog.Content
          data-store-theme={themePreset || "editorial-warm"}
          className="cart-drawer-content fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto z-50 w-full sm:max-w-md border-t sm:border-t-0 sm:border-l border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] flex flex-col justify-between max-h-[90dvh] sm:max-h-dvh overflow-hidden outline-none font-sans"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]">
            <div className="flex items-center gap-2.5">
              <Dialog.Title className="font-serif text-lg font-semibold tracking-tight text-[var(--ink)]">
                Your Bag
              </Dialog.Title>
              {itemCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[var(--canvas)] border border-[var(--border)] text-xs text-[var(--ink-2)] tabular-nums">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={closeCart}
              aria-label="Close bag"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-[var(--border)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors cursor-pointer flex items-center justify-center"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <Dialog.Description className="sr-only">
            Shopping cart showing selected products, delivery progress meter, and checkout button.
          </Dialog.Description>

          {/* Delivery Threshold Progress Meter */}
          {items.length > 0 && freeShippingThresholdMinor && (
            <div className="px-4 py-3 bg-[var(--canvas)] border-b border-[var(--border)] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[var(--ink)] font-medium">
                  <Truck className="w-3.5 h-3.5 text-[var(--ink-2)]" aria-hidden="true" />
                  {isFreeDeliveryQualified ? (
                    <span className="text-[var(--success-fg)] font-semibold">
                      Free delivery unlocked!
                    </span>
                  ) : (
                    <span>
                      Add{" "}
                      <span className="font-semibold tabular-nums text-[var(--ink)]">
                        {formatNpr(remainingForFreeDelivery)}
                      </span>{" "}
                      for free delivery
                    </span>
                  )}
                </div>
                <span className="text-[var(--ink-2)] text-xs tabular-nums font-medium">
                  {thresholdProgressPct}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-300"
                  style={{ width: `${thresholdProgressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Line Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-[var(--border)]">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[var(--canvas)] border border-[var(--border)] flex items-center justify-center text-[var(--ink-2)]">
                  <ShoppingBag className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-base font-semibold text-[var(--ink)]">
                    Your bag is empty
                  </h4>
                  <p className="text-xs text-[var(--ink-2)] max-w-xs leading-relaxed">
                    Explore our products to find items for your order.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCart}
                  className="min-h-[44px] px-5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--canvas)] text-[var(--ink)] text-xs font-medium transition-colors cursor-pointer"
                >
                  Browse Store Catalog
                </button>
              </div>
            ) : (
              items.map((item) => {
                const lineItemTotalMinor = item.unitPriceMinor * item.quantity;

                return (
                  <div
                    key={item.variantId}
                    className="py-3.5 first:pt-0 last:pb-0 flex gap-3.5"
                  >
                    {/* Thumbnail with neutral placeholder */}
                    <div className="w-16 h-16 rounded-xl border border-[var(--border)] bg-[var(--canvas)] overflow-hidden shrink-0 flex items-center justify-center relative">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.parentElement?.querySelector(".img-fallback");
                            if (fallback) fallback.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div
                        className={`img-fallback w-full h-full flex items-center justify-center bg-[var(--canvas)] text-[var(--ink-2)] ${item.imageUrl ? "hidden" : "flex"}`}
                        aria-hidden="true"
                      >
                        <Package className="w-6 h-6 stroke-[1.25] text-[var(--ink-2)] opacity-60" />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between gap-1 min-w-0 text-left">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-[var(--ink)] truncate">
                            {item.productName}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeItem(item.variantId)}
                            aria-label={`Remove ${item.productName}`}
                            className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 text-[var(--ink-2)] hover:text-[var(--ink)] p-2 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>

                        {item.variantLabel && (
                          <p className="text-xs text-[var(--ink-2)] mt-0.5">
                            {item.variantLabel}
                          </p>
                        )}
                      </div>

                      {/* Stepper and Price Row (44px tap targets, aligned to baseline) */}
                      <div className="flex items-baseline justify-between pt-1">
                        <div className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                          <button
                            type="button"
                            onClick={() => updateQty(item.variantId, item.quantity - 1)}
                            aria-label="Decrease quantity"
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold text-[var(--ink)] tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.variantId, item.quantity + 1)}
                            aria-label="Increase quantity"
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>

                        <span className="text-sm font-semibold text-[var(--ink)] tabular-nums leading-none">
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
            <div className="p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--surface)] space-y-3 text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--ink-2)]">Subtotal</span>
                <span className="font-semibold text-base text-[var(--ink)] tabular-nums">
                  {formatNpr(subtotalMinor)}
                </span>
              </div>

              {/* Checkout Button (ONE primary action, 44px tap target, 8px radius) */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full min-h-[44px] h-12 rounded-lg bg-[var(--primary)] text-[var(--surface)] hover:bg-[var(--primary-hover)] text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <span>·</span>
                <span className="tabular-nums">{formatNpr(subtotalMinor)}</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>

              <p className="text-center text-xs text-[var(--ink-2)]">
                Kathmandu Valley 1–2 days · Khalti or Cash on Delivery
              </p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
