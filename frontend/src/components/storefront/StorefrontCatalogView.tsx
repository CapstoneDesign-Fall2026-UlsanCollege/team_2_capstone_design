"use client";

import React, { useState } from "react";
import { formatNpr, ProductItem, SellingPlanItem, StorePublicMetadata } from "@/lib/api";
import { StorefrontHeader } from "./StorefrontHeader";
import { ProductGrid } from "./ProductGrid";
import { ProductDetailSheet, SelectedCartItem } from "./ProductDetailSheet";
import { useCart } from "./CartContext";

export interface StorefrontCatalogViewProps {
  store: StorePublicMetadata;
  products: ProductItem[];
  sellingPlans: SellingPlanItem[];
}

export function StorefrontCatalogView({
  store,
  products,
  sellingPlans,
}: StorefrontCatalogViewProps) {
  const { itemCount, openCart, addItem } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);

  const handleSelectProduct = (product: ProductItem) => {
    setSelectedProduct(product);
    setIsSheetOpen(true);
  };

  const handleAddToCart = (item: SelectedCartItem) => {
    addItem({
      productId: item.productId,
      productSlug: item.productSlug,
      productName: item.productName,
      variantId: item.variantId,
      variantLabel: item.variantLabel,
      unitPriceMinor: item.unitPriceMinor,
      quantity: item.quantity,
      imageUrl: item.productImageUrl,
      purchaseType: item.purchaseType,
      sellingPlan: item.sellingPlan,
    });
  };

  return (
    <>
      <StorefrontHeader
        storeSlug={store.slug}
        storeName={store.name}
        logoUrl={store.logo_url}
        contactPhone={store.contact_phone}
        cartCount={itemCount}
        onOpenCart={openCart}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Hero Section */}
        <section className="space-y-3.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sf bg-sf-surface border border-sf-line text-xs font-sf-mono text-sf-muted shadow-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-sf-accent" aria-hidden="true" />
            <span>Nepal D2C · Direct from Origin</span>
          </div>

          <h1 className="font-sf-display text-2xl sm:text-4xl font-bold tracking-tight text-sf-ink">
            {store.name}
          </h1>

          <p className="text-sm sm:text-base text-sf-muted max-w-xl leading-relaxed">
            {store.tagline ||
              "Artisanal specialty items roasted, cultivated, and curated across Nepal."}
          </p>

          {store.free_shipping_threshold_minor && (
            <p className="text-xs font-sf-mono text-sf-ink flex items-center gap-1.5 pt-0.5">
              <span className="text-sf-accent font-bold">✓</span>
              <span>
                Free shipping in Kathmandu Valley on orders over{" "}
                <span className="font-bold tabular-nums">
                  {formatNpr(store.free_shipping_threshold_minor)}
                </span>
              </span>
            </p>
          )}
        </section>

        {/* Catalog Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-sf-line">
            <div>
              <h2 className="font-sf-display text-base sm:text-lg font-bold text-sf-ink">
                Specialty Catalog
              </h2>
              <p className="text-xs text-sf-muted font-sf-mono">
                {products.length === 1 ? "1 item" : `${products.length} items`} available
              </p>
            </div>

            <span className="font-sf-mono text-xs px-2.5 py-1 rounded-sf border border-sf-line bg-sf-surface text-sf-ink tabular-nums">
              {store.currency || "NPR"}
            </span>
          </div>

          <ProductGrid products={products} onSelectProduct={handleSelectProduct} />
        </section>
      </main>

      <ProductDetailSheet
        storeSlug={store.slug}
        product={selectedProduct}
        sellingPlans={sellingPlans}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onAddToCart={handleAddToCart}
      />

      <footer className="border-t border-sf-line bg-sf-surface py-8 px-4 text-center text-xs text-sf-muted font-sf-mono space-y-1">
        <p className="text-sf-ink font-semibold">{store.name}</p>
        <p>Powered by ShopCraft · Kathmandu, Nepal</p>
      </footer>
    </>
  );
}
