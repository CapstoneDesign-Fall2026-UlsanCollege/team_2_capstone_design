import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductItem, StorePublicMetadata } from "./api";
import { formatOrderNumber } from "./api";
import {
  buildThemePreviewDemoProducts,
  buildWhatsAppUrl,
  cleanStoreCategory,
  formatShippingRateLabel,
  getStorefrontAccountBadge,
  getStorefrontPaymentAndDeliveryClaims,
  resolveShippingRateMinor,
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

const mockCartState = vi.hoisted(() => ({
  storeSlug: "adi-store",
  items: [] as Array<{
    productId: number;
    variantId: number;
    slug: string;
    name: string;
    variantLabel: string;
    unitPriceMinor: number;
    quantity: number;
    imageUrl?: string;
    inStock: boolean;
  }>,
  itemCount: 0,
  subtotalMinor: 0,
  isCartOpen: false,
  freeShippingThresholdMinor: null as number | null,
  openCart: vi.fn(),
  closeCart: vi.fn(),
  toggleCart: vi.fn(),
  addItem: vi.fn(),
  updateQty: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}));

vi.mock("@/components/storefront/CartContext", () => ({
  useCart: () => mockCartState,
}));

vi.mock("@radix-ui/react-dialog", () => ({
  Root: ({ open, children }: { open?: boolean; children?: React.ReactNode }) =>
    open ? React.createElement("div", { "data-dialog-root": "true" }, children) : null,
  Portal: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  Overlay: () => React.createElement("div"),
  Content: ({ children }: { children?: React.ReactNode }) => React.createElement("div", null, children),
  Title: ({ children }: { children?: React.ReactNode }) => React.createElement("h2", null, children),
  Description: ({ children }: { children?: React.ReactNode }) => React.createElement("p", null, children),
  Close: ({ children }: { children?: React.ReactNode }) => React.createElement("div", null, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/s/adi-store",
  useSearchParams: () => new URLSearchParams(),
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
import { ProductDetailView } from "@/components/storefront/ProductDetailView";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { CheckoutForm } from "@/components/storefront/CheckoutForm";
import { NeedsAttentionCards } from "@/components/merchant/NeedsAttentionCards";
import { HomeKpiStrip } from "@/components/merchant/HomeKpiStrip";
import { SalesBarChart } from "@/components/merchant/SalesBarChart";

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
    mockCartState.items = [];
    mockCartState.itemCount = 0;
    mockCartState.subtotalMinor = 0;
    mockCartState.isCartOpen = false;
    mockCartState.freeShippingThresholdMinor = null;
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

  it("renders compact store-branded hero panel without product caption when products have no valid image (Case 3)", () => {
    const html = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore({
          name: "Rohit Crafts",
          logo_url: "https://res.cloudinary.com/demo/image/upload/logo.png",
        }),
        products: [
          makeProduct({
            name: "Imageless Vessel",
            image_url: "/images/products/placeholder.svg",
          }),
        ],
      })
    );

    expect(html).toContain('data-hero-mode="brand-panel"');
    expect(html).toContain("sf-hero-brand-panel");
    expect(html).toContain("sf-hero-frame-compact");
    expect(html).toContain("Rohit Crafts");
    expect(html).toContain("https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/logo.png");
    expect(html).not.toContain("/images/products/placeholder.svg");
    expect(html).not.toContain("sf-hero-caption");
    expect(html).not.toContain("sf-hero-featured-label");
  });

  it("renders banner-only hero without product caption when store.banner_url exists (Case 1), and Featured label + caption when falling back to featured product image (Case 2)", () => {
    const withBannerHtml = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore({
          name: "Banner Roasters",
          banner_url: "https://res.cloudinary.com/demo/image/upload/hero-banner.jpg",
        }),
        products: [
          makeProduct({
            name: "Single Origin Bag",
            image_url: "https://res.cloudinary.com/demo/image/upload/product-item.jpg",
          }),
        ],
      })
    );

    expect(withBannerHtml).toContain('data-hero-mode="banner"');
    expect(withBannerHtml).toContain(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/hero-banner.jpg"
    );
    expect(withBannerHtml).toContain('alt="Banner Roasters cover banner"');
    expect(withBannerHtml).not.toContain("sf-hero-caption");
    expect(withBannerHtml).not.toContain("sf-hero-featured-label");

    const fallbackToProductHtml = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore({
          name: "Product Hero Roasters",
          banner_url: "/images/banners/placeholder.jpg",
        }),
        products: [
          makeProduct({
            name: "Single Origin Bag",
            image_url: "https://res.cloudinary.com/demo/image/upload/product-item.jpg",
          }),
        ],
      })
    );

    expect(fallbackToProductHtml).toContain('data-hero-mode="featured-product"');
    expect(fallbackToProductHtml).toContain(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/product-item.jpg"
    );
    expect(fallbackToProductHtml).toContain('alt="Single Origin Bag"');
    expect(fallbackToProductHtml).toContain("sf-hero-caption");
    expect(fallbackToProductHtml).toContain("sf-hero-featured-label");
    expect(fallbackToProductHtml).toContain('sf-hero-featured-label block text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-2)]">Featured</span>');
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
    expect(configuredHtml).toContain("sf-trust-section");
    expect(configuredHtml).toContain("Delivery &amp; COD details");
    expect(configuredHtml).not.toContain("Frequently Asked Questions");
    expect(configuredHtml).not.toContain("Quick order bar");
  });

  it("hides Story section when about_text is empty, uses 'Our story' instead of repeating hero headline, and assigns 3->3 / 6->3x2 grid columns with origin badges", () => {
    const noStoryHtml = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore({
          name: "Minimal Store",
          tagline: "Short hero tagline only.",
          story_headline: "Hero Display Headline",
          about_text: "",
        }),
        products: [
          makeProduct({ id: 1, slug: "p1", attributes: { origin: "Kanyam, Ilam" } }),
          makeProduct({ id: 2, slug: "p2", attributes: { district: "Gulmi" } }),
          makeProduct({ id: 3, slug: "p3", attributes: { origin: "Solukhumbu" } }),
        ],
      })
    );
    expect(noStoryHtml).not.toContain("sf-story-section");
    expect(noStoryHtml).toContain('data-item-count="3"');
    expect(noStoryHtml).toContain('data-grid-cols="3"');
    expect(noStoryHtml).toContain("sf-origin-badge");
    expect(noStoryHtml).toContain("Kanyam, Ilam");

    const withStoryHtml = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore({
          name: "BrewMellow",
          tagline: "Header tagline that must not render in header bar.",
          story_headline: "Boutique Micro-Lot Coffee Roastery in Patan",
          about_text: "Founded in 2021 in the historic alleys of Patan.",
        }),
        products: [
          makeProduct({ id: 1, slug: "p1" }),
          makeProduct({ id: 2, slug: "p2" }),
          makeProduct({ id: 3, slug: "p3" }),
          makeProduct({ id: 4, slug: "p4" }),
          makeProduct({ id: 5, slug: "p5" }),
          makeProduct({ id: 6, slug: "p6" }),
        ],
      })
    );
    expect(withStoryHtml).toContain("sf-story-section");
    expect(withStoryHtml).toContain(">Our story</h2>");
    expect(withStoryHtml).not.toContain(">Boutique Micro-Lot Coffee Roastery in Patan</h2>");
    expect(withStoryHtml).toContain('data-item-count="6"');
    expect(withStoryHtml).toContain('data-grid-cols="3"');
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

  it("hides non-functional attribute pickers and uses neutral empty description on ProductDetailView", () => {
    const html = renderToStaticMarkup(
      React.createElement(ProductDetailView, {
        store: makeStore(),
        product: makeProduct({
          description: "",
          attributes: {
            options: { Size: ["S", "M", "L"] },
            material: "100% Cotton",
          },
        }),
        relatedProducts: [],
      })
    );

    expect(html).not.toContain("Authentic quality product crafted with care in Nepal.");
    expect(html).not.toContain(">Size<");
    expect(html).toContain("100% Cotton");
  });

  it("hides the free-delivery meter in CartDrawer unless a threshold is configured", () => {
    mockCartState.isCartOpen = true;
    mockCartState.itemCount = 1;
    mockCartState.subtotalMinor = 50000;
    mockCartState.items = [
      {
        productId: 1,
        variantId: 11,
        slug: "roti-sabji",
        name: "Roti Sabji",
        variantLabel: "Standard",
        unitPriceMinor: 50000,
        quantity: 1,
        inStock: true,
      },
    ];
    mockCartState.freeShippingThresholdMinor = null;

    const withoutThresholdHtml = renderToStaticMarkup(
      React.createElement(CartDrawer)
    );
    expect(withoutThresholdHtml).not.toContain("free delivery");
    expect(withoutThresholdHtml).not.toContain("Unlocked free delivery");

    mockCartState.freeShippingThresholdMinor = 150000;
    const withThresholdHtml = renderToStaticMarkup(
      React.createElement(CartDrawer)
    );
    expect(withThresholdHtml).toContain("for free delivery");
  });

  it("leaves municipality and ward empty by default and omits unconfigured courier promises on CheckoutForm", () => {
    mockCartState.itemCount = 1;
    mockCartState.subtotalMinor = 50000;
    mockCartState.items = [
      {
        productId: 1,
        variantId: 11,
        slug: "roti-sabji",
        name: "Roti Sabji",
        variantLabel: "Standard",
        unitPriceMinor: 50000,
        quantity: 1,
        inStock: true,
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(CheckoutForm, {
        store: makeStore({ shipping_configured: false, cod_enabled: true }),
      })
    );

    expect(html).not.toContain('value="Kathmandu Metropolitan City"');
    expect(html).not.toContain('value="3"');
    expect(html).not.toContain("Kathmandu Valley Express");
    expect(html).not.toContain("Delivered within 1");
    expect(html).toContain("Standard Delivery");
  });

  it("renders working Catalog and Search links when callbacks are absent and opens search when initialSearchOpen is true", () => {
    const headerHtml = renderToStaticMarkup(
      React.createElement(StorefrontHeader, {
        storeSlug: "adi-store",
        storeName: "Adi Studio",
        showDeliveryLink: false,
      })
    );
    expect(headerHtml).toContain('href="/s/adi-store#collection-section"');
    expect(headerHtml).toContain('href="/s/adi-store?search=1#collection-section"');
    expect(headerHtml).not.toContain("Delivery &amp; COD");

    const catalogSearchHtml = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore(),
        products: [makeProduct()],
        initialSearchOpen: true,
      })
    );
    expect(catalogSearchHtml).toContain("Search products, variants, or collections...");
  });

  it("disables Add controls for negative-id preview demo products", () => {
    const previewHtml = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore({ category: "Coffee" }),
        products: [],
        isThemePreview: true,
      })
    );
    expect(previewHtml).toContain("Preview demo item");
    expect(previewHtml).toContain("disabled");
  });

  it("removes payment-filter cards, prior-period deltas, and compare prior checkbox from merchant overview widgets", () => {
    const attentionHtml = renderToStaticMarkup(
      React.createElement(NeedsAttentionCards, {
        storeSlug: "adi-store",
        ordersToDispatchCount: 4,
      })
    );
    expect(attentionHtml).toContain("Orders to dispatch");
    expect(attentionHtml).toContain("/merchant/adi-store/orders?status=new");
    expect(attentionHtml).not.toContain("?payment=");
    expect(attentionHtml).not.toContain("Khalti issues");

    const kpiHtml = renderToStaticMarkup(
      React.createElement(HomeKpiStrip, {
        data: {
          salesPaidMinor: 150000,
          ordersCount: 3,
          aovMinor: 50000,
          codPendingMinor: 25000,
        },
      })
    );
    expect(kpiHtml).not.toContain("vs prior");

    const chartHtml = renderToStaticMarkup(
      React.createElement(SalesBarChart, {
        series: Array.from({ length: 14 }, (_, idx) => ({
          date: `2026-11-${String(idx + 1).padStart(2, "0")}`,
          label: `Nov ${idx + 1}`,
          revenue_minor: 10000,
          orders_count: 1,
        })),
        storeSlug: "adi-store",
        totalOrdersInRange: 6,
        totalSalesMinor: 150000,
        rangeLabel: "30 days",
      })
    );
    expect(chartHtml).not.toContain("Compare prior period");
    expect(chartHtml).toContain("Last 14 days");
  });

  it("normalizes order numbers without producing double hash prefixes", () => {
    expect(formatOrderNumber("#HI-2026-0003")).toBe("#HI-2026-0003");
    expect(formatOrderNumber("HI-2026-0003")).toBe("#HI-2026-0003");
    expect(formatOrderNumber(42)).toBe("#42");
    expect(formatOrderNumber("")).toBe("—");
    expect(formatOrderNumber(null)).toBe("—");
  });

  it("preserves explicit Rs. 0 shipping rates instead of falling back to defaults (Bug 10)", () => {
    expect(resolveShippingRateMinor(0, 10000)).toBe(0);
    expect(formatShippingRateLabel(0, 10000)).toBe("Rs. 0");
    expect(formatShippingRateLabel(0, 20000)).toBe("Rs. 0");
    expect(formatShippingRateLabel(null, 10000)).toBe("Rs. 100");
    expect(formatShippingRateLabel(undefined, 20000)).toBe("Rs. 200");
    expect(formatShippingRateLabel(-50, 10000)).toBe("Rs. 100");

    const catalogHtml = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore({
          shipping_configured: true,
          inside_valley_shipping_minor: 0,
          outside_valley_shipping_minor: 0,
        }),
        products: [makeProduct()],
      })
    );
    expect(catalogHtml).toContain("Valley Rs. 0");
    expect(catalogHtml).toContain("Outside Rs. 0");
    expect(catalogHtml).not.toContain("Rs. 100");
    expect(catalogHtml).not.toContain("Rs. 200");
  });

  it("treats zero-variant products as unavailable instead of in-stock Rs. 0 (Bug 11)", () => {
    const emptyVariantProduct = makeProduct({
      id: 99,
      slug: "no-variant-item",
      name: "Custom Handloom Scarf",
      variants: [],
    });

    const detailHtml = renderToStaticMarkup(
      React.createElement(ProductDetailView, {
        store: makeStore(),
        product: emptyVariantProduct,
        relatedProducts: [],
      })
    );
    expect(detailHtml).toContain("Unavailable");
    expect(detailHtml).not.toContain("Rs. 0");
    expect(detailHtml).toMatch(/<button[^>]*disabled[^>]*>[\s\S]*?Unavailable[\s\S]*?<\/button>/);

    const gridHtml = renderToStaticMarkup(
      React.createElement(ProductGrid, {
        storeSlug: "adi-store",
        products: [emptyVariantProduct],
        onSelectProduct: () => {},
      })
    );
    expect(gridHtml).toContain("Unavailable");
    expect(gridHtml).not.toContain("Rs. 0");
    expect(gridHtml).toMatch(
      /<button[^>]*disabled[^>]*aria-label="Add Custom Handloom Scarf to bag"[^>]*>/
    );
  });
});
