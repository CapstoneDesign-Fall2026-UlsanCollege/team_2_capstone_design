import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductItem, StorePublicMetadata } from "./api";
import {
  buildThemePreviewDemoProducts,
  buildWhatsAppUrl,
  cleanStoreCategory,
  getStorefrontAccountBadge,
  getStorefrontPaymentAndDeliveryClaims,
  resolveStorefrontContactDetails,
  sanitizeStorefrontImageUrl,
} from "./storefront-helpers";

const mockAuthState = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null as { id: number; email: string; full_name: string } | null,
  customer: null as { id: number; full_name: string; email: string } | null,
  isLoading: false,
  refresh: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  useStorefrontAuth: () => mockAuthState,
}));

vi.mock("@/components/storefront/CartContext", () => ({
  useCart: () => ({
    storeSlug: "adi-store",
    items: [],
    itemCount: 0,
    subtotalMinor: 0,
    isCartOpen: false,
    freeShippingThresholdMinor: null,
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

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("img", {
      src: String(props.src || ""),
      alt: String(props.alt || ""),
    }),
}));

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

import { StorefrontCatalogView } from "@/components/storefront/StorefrontCatalogView";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";

function makeStore(overrides: Partial<StorePublicMetadata> = {}): StorePublicMetadata {
  return {
    slug: "adi-store",
    name: "Adi Studio",
    tagline: "",
    category: "",
    currency: "NPR",
    theme_preset: "minimal-slate",
    logo_url: "",
    banner_url: "",
    accent_color: "",
    contact_phone: "",
    shipping_configured: false,
    has_khalti: false,
    cod_enabled: false,
    inside_valley_shipping_minor: 10000,
    outside_valley_shipping_minor: 20000,
    free_shipping_threshold_minor: null,
    ...overrides,
  };
}

function makeProduct(overrides: Partial<ProductItem> = {}): ProductItem {
  return {
    id: 1,
    slug: "roti-sabji",
    name: "Roti Sabji",
    description: "Fresh homemade meal.",
    image_url: "https://res.cloudinary.com/demo/image/upload/roti.jpg",
    category: "Food",
    attributes: {},
    allow_one_time: true,
    is_active: true,
    sort_order: 0,
    variants: [
      {
        id: 11,
        sku: "ROTI-1",
        label: "Plate",
        weight_grams: null,
        price_minor: 25000,
        allow_one_time: true,
        in_stock: true,
        is_active: true,
        sort_order: 0,
      },
    ],
    ...overrides,
  };
}

describe("storefront helper behavior", () => {
  it("strips placeholder category names and placeholder asset paths", () => {
    expect(cleanStoreCategory("")).toBe("");
    expect(cleanStoreCategory("None")).toBe("");
    expect(cleanStoreCategory("Specialty Goods")).toBe("");
    expect(cleanStoreCategory("Artisan Ceramics")).toBe("Artisan Ceramics");

    expect(sanitizeStorefrontImageUrl("/images/products/placeholder.svg")).toBe("");
    expect(sanitizeStorefrontImageUrl("/images/banners/hero.jpg")).toBe("");
    expect(sanitizeStorefrontImageUrl("https://cdn.example.com/item.webp")).toBe(
      "https://cdn.example.com/item.webp"
    );
  });

  it("suppresses default/placeholder WhatsApp numbers and formats real Nepal numbers", () => {
    expect(buildWhatsAppUrl("", "Adi Studio")).toBeNull();
    expect(buildWhatsAppUrl("9801234567", "Adi Studio")).toBeNull();
    expect(buildWhatsAppUrl("9841000111", "Adi Studio")).toContain("https://wa.me/9779841000111");
  });

  it("hides account initial badge unless a storefront customer profile is present", () => {
    expect(getStorefrontAccountBadge(false, null)).toEqual({
      isStorefrontCustomer: false,
      userInitial: null,
    });
    expect(
      getStorefrontAccountBadge(true, null) // platform/merchant session visiting storefront
    ).toEqual({
      isStorefrontCustomer: false,
      userInitial: null,
    });
    expect(
      getStorefrontAccountBadge(true, { id: 42, full_name: "Sita Rai", email: "sita@example.com" })
    ).toEqual({
      isStorefrontCustomer: true,
      userInitial: "S",
    });
  });

  it("builds theme preview demo items cleanly when category is empty or None", () => {
    const items = buildThemePreviewDemoProducts(makeStore({ category: "None" }));
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.id).toBeLessThan(0);
      expect(item.category).toBeUndefined();
      expect(JSON.stringify(item)).not.toContain("None");
    }
  });
});

describe("StorefrontCatalogView placeholder removal", () => {
  beforeEach(() => {
    mockAuthState.isAuthenticated = false;
    mockAuthState.user = null;
    mockAuthState.customer = null;
  });

  it("renders friendly empty state with fallback hero, Shop all, and zero fake prices/ShopCraft branding", () => {
    const html = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore(),
        products: [],
        isThemePreview: false,
      })
    );

    expect(html).toContain("Products coming soon");
    expect(html).toContain("Adi Studio");
    expect(html).toContain("Shop all");
    expect(html).not.toContain("Signature Offering");
    expect(html).not.toContain("SHOPCRAFT ARTISANAL");
    expect(html).not.toContain("NEPAL CRAFTED GOODS");
    expect(html).not.toContain("Powered by ShopCraft");
    expect(html).not.toContain("Launch Your Store");
    expect(html).not.toContain("Rs. 0");
    expect(html).not.toContain("Quick order bar");
    expect(html).not.toContain("None");
  });

  it("renders preview catalog only when isThemePreview is enabled without None text", () => {
    const html = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore({ category: "" }),
        products: [],
        isThemePreview: true,
      })
    );

    expect(html).toContain("Handcrafted Stoneware Vessel");
    expect(html).toContain("Shop all");
    expect(html).not.toContain("Products coming soon");
    expect(html).not.toContain("None");
  });

  it("renders neutral store-branded hero fallback even when product still references placeholder.svg", () => {
    const html = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore({
          name: "Rohit Crafts",
          logo_url: "https://res.cloudinary.com/demo/image/upload/logo.png",
        }),
        products: [
          makeProduct({
            image_url: "/images/products/placeholder.svg",
          }),
        ],
      })
    );

    expect(html).toContain("Rohit Crafts");
    expect(html).toContain("https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/logo.png");
    expect(html).not.toContain("/images/products/placeholder.svg");
  });

  it("uses merchant category label and Shop <Category> only when set", () => {
    const html = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore({ category: "Handloom Textiles" }),
        products: [makeProduct()],
      })
    );

    expect(html).toContain("Handloom Textiles");
    expect(html).toContain("Shop Handloom Textiles");
    expect(html).not.toContain("Shop all");
  });

  it("gates delivery, Khalti, COD, and WhatsApp claims strictly on merchant configuration", () => {
    const unconfiguredHtml = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore({
          shipping_configured: false,
          has_khalti: false,
          cod_enabled: false,
          contact_phone: "9801234567",
        }),
        products: [makeProduct()],
      })
    );

    expect(unconfiguredHtml).not.toContain("Kathmandu Valley 1-2 days");
    expect(unconfiguredHtml).not.toContain("Nationwide courier");
    expect(unconfiguredHtml).not.toContain("Khalti");
    expect(unconfiguredHtml).not.toContain("Cash on Delivery");
    expect(unconfiguredHtml).not.toContain("Order on WhatsApp");
    expect(unconfiguredHtml).not.toContain("Delivery &amp; Payment");

    const configuredClaims = getStorefrontPaymentAndDeliveryClaims(
      makeStore({
        shipping_configured: true,
        has_khalti: true,
        cod_enabled: false,
        contact_phone: "9841222333",
      })
    );
    expect(configuredClaims.heroPromiseLine).toBe(
      "Kathmandu Valley 1-2 days · Nationwide courier · Khalti ePayment"
    );

    const configuredHtml = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore({
          shipping_configured: true,
          has_khalti: true,
          cod_enabled: false,
          contact_phone: "9841222333",
        }),
        products: [makeProduct()],
      })
    );

    expect(configuredHtml).toContain("Kathmandu Valley 1-2 days");
    expect(configuredHtml).toContain("Nationwide courier");
    expect(configuredHtml).toContain("Khalti");
    expect(configuredHtml).not.toContain("Cash on Delivery");
    expect(configuredHtml).toContain("Order on WhatsApp");
  });

  it("renders User icon when signed out or signed in only as platform/merchant user, and initial badge only for storefront customers", () => {
    const signedOutHtml = renderToStaticMarkup(
      React.createElement(StorefrontHeader, {
        storeSlug: "adi-store",
        storeName: "Adi Studio",
        isAuthenticated: false,
        userInitial: null,
      })
    );
    expect(signedOutHtml).toContain("lucide-user");
    expect(signedOutHtml).not.toContain(">C<");

    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 1, email: "merchant@example.com", full_name: "Charu Merchant" };
    mockAuthState.customer = null;
    const merchantSessionHtml = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore(),
        products: [],
      })
    );
    expect(merchantSessionHtml).toContain("lucide-user");
    expect(merchantSessionHtml).not.toContain(">C<");

    mockAuthState.customer = { id: 9, full_name: "Maya Sherpa", email: "maya@example.com" };
    const customerSessionHtml = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore(),
        products: [],
      })
    );
    expect(customerSessionHtml).toContain(">M<");
  });

  it("resolves storefront contact details with 977 normalization, email fallback, and empty-state flags", () => {
    const withAll = resolveStorefrontContactDetails({
      name: "Rohit Store",
      contact_phone: "+977 98-4122-3344",
      support_email: "support@rohitstore.np",
      contact_email: "owner@rohitstore.np",
      address: "Itahari, Koshi Province",
    });
    expect(withAll.whatsappUrl).toBe(
      "https://wa.me/9779841223344?text=Hi%20Rohit%20Store%2C%20I%20have%20an%20inquiry%20about%20your%20products."
    );
    expect(withAll.telHref).toBe("tel:+9779841223344");
    expect(withAll.phoneDisplay).toBe("+977 9841223344");
    expect(withAll.email).toBe("support@rohitstore.np");
    expect(withAll.mailtoHref).toBe("mailto:support@rohitstore.np");
    expect(withAll.address).toBe("Itahari, Koshi Province");
    expect(withAll.hasAnyDetail).toBe(true);
    expect(withAll.hasAnyContact).toBe(true);

    const noWhatsappFallback = resolveStorefrontContactDetails({
      name: "Clean Craft",
      contact_phone: "9801234567",
      support_email: "",
      contact_email: "hello@cleancraft.np",
      address: "",
    });
    expect(noWhatsappFallback.whatsappUrl).toBeNull();
    expect(noWhatsappFallback.telHref).toBeNull();
    expect(noWhatsappFallback.email).toBe("hello@cleancraft.np");
    expect(noWhatsappFallback.mailtoHref).toBe("mailto:hello@cleancraft.np");
    expect(noWhatsappFallback.hasAnyDetail).toBe(true);
    expect(noWhatsappFallback.hasAnyContact).toBe(true);

    const completelyEmpty = resolveStorefrontContactDetails({
      name: "New Store",
      contact_phone: "",
      support_email: "",
      contact_email: "",
      address: "",
    });
    expect(completelyEmpty.whatsappUrl).toBeNull();
    expect(completelyEmpty.hasAnyDetail).toBe(false);
    expect(completelyEmpty.hasAnyContact).toBe(false);
  });
});
