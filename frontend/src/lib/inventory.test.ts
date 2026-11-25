import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => React.createElement("a", { href, ...rest }, children),
}));

vi.mock("@/lib/auth", () => ({
  useStorefrontAuth: () => ({
    isAuthenticated: false,
    user: null,
    customer: null,
    loading: false,
    refresh: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("@/components/storefront/CartContext", () => ({
  useCart: () => ({
    storeSlug: "inv-store",
    items: [],
    itemCount: 0,
    subtotalMinor: 0,
    isCartOpen: false,
    openCart: vi.fn(),
    closeCart: vi.fn(),
    toggleCart: vi.fn(),
    addItem: vi.fn(),
    updateQty: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }),
}));

vi.mock("@/components/storefront/AccountContext", () => ({
  useAccount: () => ({
    openAccount: vi.fn(),
    closeAccount: vi.fn(),
    isAccountOpen: false,
  }),
}));

import type { ProductItem, StorePublicMetadata } from "./api";
import { NeedsAttentionCards } from "@/components/merchant/NeedsAttentionCards";
import { VariantGridEditor } from "@/components/merchant/VariantGridEditor";
import { ProductDetailView } from "@/components/storefront/ProductDetailView";

const mockStore: StorePublicMetadata = {
  slug: "inv-store",
  name: "Inventory Store",
  tagline: "Roasted fresh",
  currency: "NPR",
  theme_preset: "editorial-warm",
  logo_url: "",
  accent_color: "#18181b",
  contact_phone: "9800000001",
  inside_valley_shipping_minor: 10000,
  outside_valley_shipping_minor: 20000,
  free_shipping_threshold_minor: null,
  shipping_configured: true,
  has_khalti: false,
  cod_enabled: true,
};

describe("Inventory Management UI & Storefront Stock Controls", () => {
  it("NeedsAttentionCards displays inventory alerts card with accurate counts and links", () => {
    const htmlWithAlerts = renderToStaticMarkup(
      React.createElement(NeedsAttentionCards, {
        storeSlug: "inv-store",
        ordersToDispatchCount: 2,
        lowStockCount: 3,
        outOfStockCount: 1,
      })
    );
    expect(htmlWithAlerts).toContain("Inventory alerts");
    expect(htmlWithAlerts).toContain("1 out of stock");
    expect(htmlWithAlerts).toContain("3 low · 1 sold out");
    expect(htmlWithAlerts).toContain("/merchant/inv-store/inventory?status=low");

    const htmlOutOnly = renderToStaticMarkup(
      React.createElement(NeedsAttentionCards, {
        storeSlug: "inv-store",
        ordersToDispatchCount: 0,
        lowStockCount: 0,
        outOfStockCount: 2,
      })
    );
    expect(htmlOutOnly).toContain("/merchant/inv-store/inventory?status=out");

    const htmlHealthy = renderToStaticMarkup(
      React.createElement(NeedsAttentionCards, {
        storeSlug: "inv-store",
        ordersToDispatchCount: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
      })
    );
    expect(htmlHealthy).toContain("Stock healthy");
  });

  it("VariantGridEditor renders Track Qty toggle, numeric stock input, and ∞ for untracked SKUs", () => {
    const html = renderToStaticMarkup(
      React.createElement(VariantGridEditor, {
        storeSlug: "inv-store",
        productId: 10,
        isOwner: true,
        initialVariants: [
          {
            id: 1,
            sku: "SKU-TRACKED",
            label: "250g",
            weight_grams: 250,
            price_minor: 50000,
            allow_one_time: true,
            in_stock: true,
            track_inventory: true,
            stock_quantity: 8,
            low_stock_threshold: 3,
            is_active: true,
            sort_order: 0,
          },
          {
            id: 2,
            sku: "SKU-UNTRACKED",
            label: "Digital",
            weight_grams: null,
            price_minor: 100000,
            allow_one_time: true,
            in_stock: true,
            track_inventory: false,
            stock_quantity: 0,
            low_stock_threshold: 5,
            is_active: true,
            sort_order: 1,
          },
        ],
      })
    );

    expect(html).toContain("Track Qty");
    expect(html).toContain('aria-label="Stock quantity for 250g"');
    expect(html).toContain('value="8"');
    expect(html).toContain('aria-label="Low stock threshold for 250g"');
    expect(html).toContain(">∞<");
  });

  it("ProductDetailView shows low-stock hint and marks tracked zero-stock variant as Sold Out", () => {
    const lowStockProduct: ProductItem = {
      id: 20,
      slug: "low-stock-tea",
      name: "Low Stock Tea",
      description: "First flush tea",
      image_url: "",
      attributes: {},
      allow_one_time: true,
      is_active: true,
      sort_order: 0,
      variants: [
        {
          id: 21,
          sku: "TEA-LOW",
          label: "100g",
          weight_grams: 100,
          price_minor: 65000,
          allow_one_time: true,
          in_stock: true,
          track_inventory: true,
          stock_quantity: 3,
          low_stock_threshold: 5,
          is_active: true,
          sort_order: 0,
        },
      ],
    };

    const lowHtml = renderToStaticMarkup(
      React.createElement(ProductDetailView, {
        store: mockStore,
        product: lowStockProduct,
        relatedProducts: [],
      })
    );
    expect(lowHtml).toContain("Only 3 left in stock");
    expect(lowHtml).toContain("Add to bag");

    const soldOutProduct: ProductItem = {
      ...lowStockProduct,
      variants: [
        {
          ...lowStockProduct.variants[0],
          in_stock: true,
          track_inventory: true,
          stock_quantity: 0,
        },
      ],
    };
    const soldOutHtml = renderToStaticMarkup(
      React.createElement(ProductDetailView, {
        store: mockStore,
        product: soldOutProduct,
        relatedProducts: [],
      })
    );
    expect(soldOutHtml).toContain("Sold Out");
    expect(soldOutHtml).not.toContain("Only 0 left in stock");
  });
});
