import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@radix-ui/react-dialog", () => ({
  Root: ({ open, children }: { open?: boolean; children?: React.ReactNode }) =>
    open ? React.createElement("div", { "data-dialog-root": "true" }, children) : null,
  Portal: ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  Overlay: () => React.createElement("div"),
  Content: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", null, children),
  Title: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("h2", null, children),
  Description: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("p", null, children),
  Close: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", null, children),
}));

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
  storeSlug: "edge-store",
  items: [],
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

vi.mock("@/components/storefront/AccountContext", () => ({
  useAccount: () => ({
    openAccount: vi.fn(),
    closeAccount: vi.fn(),
    isAccountOpen: false,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/s/edge-store",
  useSearchParams: () => new URLSearchParams(),
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

import {
  formatNpr,
  type MerchantStoreSettings,
  type OrderDetail,
  type ProductItem,
  type ProductVariant,
  type StorePublicMetadata,
} from "./api";
import {
  createLatestTabRefresher,
  orderTerminalActionView,
  paymentView,
  resolveDiscountStatusLabel,
  resolveKhaltiSettingsBanner,
  resolveProductImagePickerVisible,
  type OrdersQueueTab,
} from "./merchant-status";
import {
  resolveShopperOrderListStatus,
  resolveShopperOrderReceiptView,
} from "./storefront-order-status";
import {
  formatShippingRateLabel,
  resolveShippingRateMinor,
} from "./storefront-helpers";
import { OrderQueueTable } from "@/components/merchant/OrderQueueTable";
import { OrderDetailSheet } from "@/components/merchant/OrderDetailSheet";
import { ProductSheet } from "@/components/merchant/ProductSheet";
import { SettingsForm } from "@/components/merchant/SettingsForm";
import { VariantGridEditor } from "@/components/merchant/VariantGridEditor";
import { ProductDetailSheet } from "@/components/storefront/ProductDetailSheet";
import { ProductDetailView } from "@/components/storefront/ProductDetailView";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { StorefrontCatalogView } from "@/components/storefront/StorefrontCatalogView";

function makeStore(overrides: Partial<StorePublicMetadata> = {}): StorePublicMetadata {
  return {
    slug: "edge-store",
    name: "Edge Store",
    tagline: "Nepali Goods",
    category: "Spices",
    currency: "NPR",
    theme_preset: "editorial-warm",
    logo_url: "",
    banner_url: "",
    accent_color: "#224433",
    contact_phone: "",
    shipping_configured: true,
    has_khalti: true,
    cod_enabled: true,
    inside_valley_shipping_minor: 10000,
    outside_valley_shipping_minor: 20000,
    free_shipping_threshold_minor: null,
    ...overrides,
  };
}

function makeVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: 101,
    sku: "EDGE-101",
    label: "250g",
    weight_grams: 250,
    price_minor: 50000,
    allow_one_time: true,
    in_stock: true,
    is_active: true,
    sort_order: 0,
    ...overrides,
  };
}

function makeProduct(overrides: Partial<ProductItem> = {}): ProductItem {
  return {
    id: 1,
    slug: "edge-tea",
    name: "Edge Tea",
    description: "Single origin tea",
    image_url: "/uploads/stores/1_edge/tea.jpg",
    category: "Tea",
    attributes: {},
    allow_one_time: true,
    is_active: true,
    sort_order: 0,
    variants: [makeVariant()],
    ...overrides,
  };
}

function makeOrder(overrides: Partial<OrderDetail> = {}): OrderDetail {
  return {
    id: 1,
    order_number: "#ED-2026-0001",
    order_type: "ONE_TIME",
    status: "PAID",
    payment_method: "KHALTI",
    payment_status: "PAID",
    payment_ref: "pidx_edge",
    subtotal_minor: 50000,
    shipping_minor: 10000,
    discount_minor: 0,
    total_minor: 60000,
    currency: "NPR",
    shipping_address_snapshot: {
      recipient_name: "Asha Rai",
      phone: "9801112233",
      province: "Bagmati",
      district: "Kathmandu",
      municipality: "Kathmandu Metro",
      ward: "4",
      street_landmark: "Patan",
    },
    created_at: "2026-11-23T10:00:00Z",
    items: [
      {
        id: 1,
        product_name_snapshot: "Edge Tea",
        variant_label_snapshot: "250g",
        unit_price_minor: 50000,
        quantity: 1,
        line_total_minor: 50000,
      },
    ],
    events: [],
    customer_name: "Asha Rai",
    customer_email: "asha@example.com",
    customer_phone: "9801112233",
    ...overrides,
  };
}

function makeSettings(overrides: Partial<MerchantStoreSettings> = {}): MerchantStoreSettings {
  return {
    ...makeStore(),
    has_custom_khalti_key: false,
    khalti_mode: "TEST",
    khalti_key_masked: "",
    cod_enabled: true,
    custom_domain: "",
    member_role: "OWNER",
    ...overrides,
  };
}

describe("Bug 3 edge cases: storefront order receipt & history status precedence", () => {
  it("handles full status x payment_method x payment_status matrix, case insensitivity, unknown & Rs. 0 orders", () => {
    for (const pm of ["KHALTI", "COD", ""]) {
      for (const ps of ["PAID", "COD_PENDING", "UNPAID", "FAILED", ""]) {
        const cancelled = resolveShopperOrderReceiptView(
          { status: "CANCELLED", payment_method: pm, payment_status: ps, total_minor: 50000 },
          "Store",
          formatNpr
        );
        expect(cancelled.statusBadgeLabel).toBe("Cancelled");
        expect(cancelled.chipTone).toBe("error");
        expect(cancelled.showProgressStepper).toBe(false);
        expect(resolveShopperOrderListStatus("cancelled", ps)).toEqual({
          tone: "error",
          label: "Cancelled",
        });

        const failedByStatus = resolveShopperOrderReceiptView(
          { status: "PAYMENT_FAILED", payment_method: pm, payment_status: ps, total_minor: 50000 },
          "Store",
          formatNpr
        );
        expect(failedByStatus.statusBadgeLabel).toBe("Payment Failed");
        expect(failedByStatus.showProgressStepper).toBe(false);
        expect(failedByStatus.paymentActionMode).toBe(pm === "KHALTI" ? "failed" : null);
      }
    }

    const failedByPayStatus = resolveShopperOrderReceiptView(
      { status: "PENDING_PAYMENT", payment_method: "KHALTI", payment_status: "FAILED", total_minor: 0 },
      "Store",
      formatNpr
    );
    expect(failedByPayStatus.statusBadgeLabel).toBe("Payment Failed");
    expect(failedByPayStatus.showProgressStepper).toBe(false);

    const packedLower = resolveShopperOrderReceiptView(
      { status: "packed", payment_method: "cod", payment_status: "cod_pending", total_minor: 0 },
      "My Shop",
      formatNpr
    );
    expect(packedLower.statusBadgeLabel).toBe("Processing");
    expect(packedLower.paymentSummaryLabel).toBe("Collect Rs. 0 on arrival");
    expect(packedLower.showProgressStepper).toBe(true);

    const pendingPaidKhalti = resolveShopperOrderReceiptView(
      { status: "PENDING_PAYMENT", payment_method: "KHALTI", payment_status: "PAID", total_minor: 150000 },
      "My Shop",
      formatNpr
    );
    expect(pendingPaidKhalti.statusBadgeLabel).toBe("Khalti Verified");
    expect(pendingPaidKhalti.paymentActionMode).toBeNull();

    const pendingUnpaidKhalti = resolveShopperOrderReceiptView(
      { status: "PENDING_PAYMENT", payment_method: "KHALTI", payment_status: "UNPAID", total_minor: 0 },
      "My Shop",
      formatNpr
    );
    expect(pendingUnpaidKhalti.statusBadgeLabel).toBe("Verifying Payment");
    expect(pendingUnpaidKhalti.paymentSummaryLabel).toBe("Balance: Rs. 0");
    expect(pendingUnpaidKhalti.paymentActionMode).toBe("pending");

    const unknownState = resolveShopperOrderReceiptView(
      { status: "CUSTOM_HOLD", payment_method: "", payment_status: "", total_minor: 0 },
      "My Shop",
      formatNpr
    );
    expect(unknownState.statusBadgeLabel).toBe("CUSTOM HOLD");
    expect(unknownState.paymentSummaryLabel).toBe("Balance: Rs. 0");
    expect(resolveShopperOrderListStatus("", "")).toEqual({ tone: "warning", label: "Pending" });
  });
});

describe("Bug 4 edge cases: merchant queue & detail drawer terminal states", () => {
  it("resolves terminal action views accurately across all statuses including mixed case & empty", () => {
    expect(orderTerminalActionView({ status: "delivered", payment_method: "KHALTI", payment_status: "PAID" }).tableLabel).toBe("Done");
    expect(orderTerminalActionView({ status: "cancelled", payment_method: "COD", payment_status: "COD_PENDING" }).tableLabel).toBe("Cancelled");
    expect(orderTerminalActionView({ status: "CONFIRMED", payment_method: "KHALTI", payment_status: "FAILED" }).tableLabel).toBe("Failed");
    expect(orderTerminalActionView({ status: "PENDING_PAYMENT", payment_method: "KHALTI", payment_status: "UNPAID" }).tableLabel).toBe("Awaiting Pay");
    expect(orderTerminalActionView({ status: "CUSTOM_QUEUE", payment_method: "COD", payment_status: "UNPAID" }).tableLabel).toBe("CUSTOM QUEUE");
    expect(orderTerminalActionView({ status: "", payment_method: "", payment_status: "" }).tableLabel).toBe("Pending");
  });

  it("renders mixed batch in OrderQueueTable & covers null/closed/advanceable/terminal in OrderDetailSheet", () => {
    const orders = [
      makeOrder({ id: 1, order_number: "#Q1", status: "CONFIRMED", payment_method: "COD", payment_status: "COD_PENDING" }),
      makeOrder({ id: 2, order_number: "#Q2", status: "PROCESSING", payment_method: "KHALTI", payment_status: "PAID" }),
      makeOrder({ id: 3, order_number: "#Q3", status: "SHIPPED", payment_method: "COD", payment_status: "COD_PENDING" }),
      makeOrder({ id: 4, order_number: "#Q4", status: "DELIVERED", payment_method: "KHALTI", payment_status: "PAID" }),
      makeOrder({ id: 5, order_number: "#Q5", status: "CANCELLED", payment_method: "COD", payment_status: "COD_PENDING" }),
      makeOrder({ id: 6, order_number: "#Q6", status: "PAYMENT_FAILED", payment_method: "KHALTI", payment_status: "FAILED" }),
      makeOrder({ id: 7, order_number: "#Q7", status: "PENDING_PAYMENT", payment_method: "KHALTI", payment_status: "UNPAID" }),
    ];

    const tableHtml = renderToStaticMarkup(
      React.createElement(OrderQueueTable, {
        orders,
        onSelectOrder: () => {},
        onQuickAdvance: () => {},
      })
    );
    expect(tableHtml.match(/>Done</g)).toHaveLength(1);
    expect(tableHtml).toContain(">Cancelled<");
    expect(tableHtml).toContain(">Failed<");
    expect(tableHtml).toContain(">Awaiting Pay<");
    expect(tableHtml).toContain("Pack");
    expect(tableHtml).toContain("Ship");
    expect(tableHtml).toContain(">Deliver<");
    expect(paymentView(orders[4]).label).toBe("Cancelled");

    // Closed or null OrderDetailSheet renders empty string
    expect(
      renderToStaticMarkup(
        React.createElement(OrderDetailSheet, {
          order: null,
          open: true,
          onOpenChange: () => {},
          onAdvanceStatus: () => {},
        })
      )
    ).toBe("");
    expect(
      renderToStaticMarkup(
        React.createElement(OrderDetailSheet, {
          order: orders[0],
          open: false,
          onOpenChange: () => {},
          onAdvanceStatus: () => {},
        })
      )
    ).toBe("");

    const codShippedSheet = renderToStaticMarkup(
      React.createElement(OrderDetailSheet, {
        order: orders[2],
        open: true,
        onOpenChange: () => {},
        onAdvanceStatus: () => {},
      })
    );
    expect(codShippedSheet).toContain("Mark Delivered · Confirm Rs. 600 Cash");

    const khaltiShippedSheet = renderToStaticMarkup(
      React.createElement(OrderDetailSheet, {
        order: makeOrder({ id: 8, status: "SHIPPED", payment_method: "KHALTI", payment_status: "PAID" }),
        open: true,
        onOpenChange: () => {},
        onAdvanceStatus: () => {},
      })
    );
    expect(khaltiShippedSheet).toContain(">Mark Delivered<");
  });
});

describe("Bug 7 edge cases: ProductSheet preset picker visibility & single file input", () => {
  it("validates resolveProductImagePickerVisible and SSR rendering with/without existing images", () => {
    for (const emptyUrl of ["", "   ", "\t\n"]) {
      expect(resolveProductImagePickerVisible(emptyUrl, false)).toBe(true);
      expect(resolveProductImagePickerVisible(emptyUrl, true)).toBe(true);
    }
    for (const setUrl of ["/uploads/stores/1_a/p.jpg", "https://cdn.example.com/p.jpg"]) {
      expect(resolveProductImagePickerVisible(setUrl, false)).toBe(false);
      expect(resolveProductImagePickerVisible(setUrl, true)).toBe(true);
    }

    expect(
      renderToStaticMarkup(
        React.createElement(ProductSheet, {
          storeSlug: "edge-store",
          open: false,
          onOpenChange: () => {},
          onSaved: () => {},
        })
      )
    ).toBe("");

    const withRelativeImgHtml = renderToStaticMarkup(
      React.createElement(ProductSheet, {
        storeSlug: "edge-store",
        open: true,
        onOpenChange: () => {},
        product: makeProduct({ image_url: "/uploads/stores/1_a/img.png" }),
        onSaved: () => {},
      })
    );
    expect(withRelativeImgHtml).toContain("Current Image");
    expect(withRelativeImgHtml).toContain("Pick from Presets");
    expect(withRelativeImgHtml).not.toContain("Upload File");
    expect(withRelativeImgHtml.match(/<input[^>]*type="file"/g)).toHaveLength(1);

    const withoutImgHtml = renderToStaticMarkup(
      React.createElement(ProductSheet, {
        storeSlug: "edge-store",
        open: true,
        onOpenChange: () => {},
        product: makeProduct({ image_url: "" }),
        onSaved: () => {},
      })
    );
    expect(withoutImgHtml).not.toContain("Current Image");
    expect(withoutImgHtml).toContain("Upload File");
    expect(withoutImgHtml).toContain("Presets");
    expect(withoutImgHtml).toContain("Web Link");
    expect(withoutImgHtml.match(/<input[^>]*type="file"/g)).toHaveLength(1);
  });
});

describe("Bug 8 edge cases: Khalti settings banner states & OWNER vs STAFF views", () => {
  it("handles all resolveKhaltiSettingsBanner combinations and SettingsForm roles", () => {
    // Custom key takes priority even if hasKhalti is passed false
    const customOverride = resolveKhaltiSettingsBanner({
      hasCustomKey: true,
      hasKhalti: false,
      khaltiMode: "live",
      maskedKey: null,
    });
    expect(customOverride.title).toBe("Live Merchant Key Connected");
    expect(customOverride.badge).toBe("LIVE MODE");
    expect(customOverride.description).toContain("Configured");

    const customEmptyMode = resolveKhaltiSettingsBanner({
      hasCustomKey: true,
      hasKhalti: true,
      khaltiMode: "",
      maskedKey: "",
    });
    expect(customEmptyMode.title).toBe("Custom Test Key Connected");
    expect(customEmptyMode.badge).toBe("TEST MODE");

    const sandboxLower = resolveKhaltiSettingsBanner({
      hasCustomKey: false,
      hasKhalti: true,
      khaltiMode: "test",
    });
    expect(sandboxLower.title).toBe("Platform Sandbox Active (Ready for Test Orders)");
    expect(sandboxLower.badge).toBe("TEST MODE");

    const unconfigured = resolveKhaltiSettingsBanner({
      hasCustomKey: false,
      hasKhalti: false,
      khaltiMode: "LIVE",
    });
    expect(unconfigured.title).toBe("Khalti Not Configured");
    expect(unconfigured.badge).toBe("UNCONFIGURED");
    expect(unconfigured.dotColor).toBe("var(--st-cancelled)");

    const ownerUnconfiguredHtml = renderToStaticMarkup(
      React.createElement(SettingsForm, {
        storeSlug: "edge-store",
        section: "payments",
        initialSettings: makeSettings({
          member_role: "OWNER",
          has_custom_khalti_key: false,
          has_khalti: false,
        }),
      })
    );
    expect(ownerUnconfiguredHtml).toContain("Khalti Not Configured");
    expect(ownerUnconfiguredHtml).toContain("UNCONFIGURED");
    expect(ownerUnconfiguredHtml).not.toContain("Owner Only");

    const staffHtml = renderToStaticMarkup(
      React.createElement(SettingsForm, {
        storeSlug: "edge-store",
        section: "payments",
        initialSettings: makeSettings({
          member_role: "STAFF",
          has_custom_khalti_key: true,
          has_khalti: true,
          khalti_key_masked: "••••9999",
        }),
      })
    );
    expect(staffHtml).toContain("Owner Only");
    expect(staffHtml).not.toContain("Clear Custom Key");

    const generalHtml = renderToStaticMarkup(
      React.createElement(SettingsForm, {
        storeSlug: "edge-store",
        section: "general",
        initialSettings: makeSettings(),
      })
    );
    expect(generalHtml).not.toContain("Khalti ePayment v2 Credentials");
  });
});

describe("Bug 9 edge cases: VariantGridEditor mobile form & desktop colSpan across variant counts", () => {
  it("renders mobile add form & aligned desktop colSpan for 0, 1, and multiple mixed variants", () => {
    for (const list of [
      [],
      [makeVariant({ id: 1, label: "Single", price_minor: 0 })],
      [
        makeVariant({ id: 1, label: "Free", price_minor: 0, in_stock: true }),
        makeVariant({ id: 2, label: "S & M (Gift)", price_minor: 150000, in_stock: false }),
        makeVariant({ id: 3, label: "1kg", price_minor: 300000, in_stock: true }),
      ],
    ]) {
      const html = renderToStaticMarkup(
        React.createElement(VariantGridEditor, {
          storeSlug: "edge-store",
          productId: 5,
          initialVariants: list,
        })
      );
      const table = html.match(/<table[\s\S]*?<\/table>/);
      expect(table).not.toBeNull();
      expect(table![0]).toMatch(/colspan="5"/i);
      expect(table![0]).toMatch(/<button[^>]*disabled[^>]*>[\s\S]*?\+ Add Row/);

      const mobilePart = html.split("sm:hidden space-y-3")[1] || "";
      expect(mobilePart).toContain("Add Custom Variant");
      expect(mobilePart).toContain("+ Add size / variant...");
      expect(mobilePart).toMatch(/<button[^>]*disabled[^>]*>[\s\S]*?\+ Add Variant/);
    }
  });
});

describe("Bug 10 edge cases: Rs. 0 shipping preservation vs invalid/null fallbacks", () => {
  it("handles 0, valid small amounts, null, undefined, negative, NaN & Infinity boundaries", () => {
    expect(resolveShippingRateMinor(0, 10000)).toBe(0);
    expect(resolveShippingRateMinor(100, 10000)).toBe(100);
    expect(formatShippingRateLabel(0, 10000)).toBe("Rs. 0");
    expect(formatShippingRateLabel(0, 20000)).toBe("Rs. 0");
    expect(formatShippingRateLabel(null, 10000)).toBe("Rs. 100");
    expect(formatShippingRateLabel(undefined, 20000)).toBe("Rs. 200");
    expect(formatShippingRateLabel(-1, 10000)).toBe("Rs. 100");
    expect(formatShippingRateLabel(Number.NaN, 10000)).toBe("Rs. 100");
    expect(formatShippingRateLabel(Number.POSITIVE_INFINITY, 20000)).toBe("Rs. 200");
    expect(formatShippingRateLabel(Number.NEGATIVE_INFINITY, 20000)).toBe("Rs. 200");

    const oneFreeHtml = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore({
          shipping_configured: true,
          inside_valley_shipping_minor: 0,
          outside_valley_shipping_minor: 25000,
          free_shipping_threshold_minor: 0,
        }),
        products: [makeProduct()],
      })
    );
    expect(oneFreeHtml).toContain("Valley Rs. 0");
    expect(oneFreeHtml).toContain("Outside Rs. 250");
    expect(oneFreeHtml).not.toContain("Free over Rs. 0");

    const withThresholdHtml = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore({
          shipping_configured: true,
          inside_valley_shipping_minor: 15000,
          outside_valley_shipping_minor: 0,
          free_shipping_threshold_minor: 200000,
        }),
        products: [makeProduct()],
      })
    );
    expect(withThresholdHtml).toContain("Valley Rs. 150");
    expect(withThresholdHtml).toContain("Outside Rs. 0");
    expect(withThresholdHtml).toContain("Free over Rs. 2,000");

    const unconfiguredHtml = renderToStaticMarkup(
      React.createElement(StorefrontCatalogView, {
        store: makeStore({
          shipping_configured: false,
          inside_valley_shipping_minor: 0,
          outside_valley_shipping_minor: 0,
        }),
        products: [makeProduct()],
      })
    );
    expect(unconfiguredHtml).not.toContain("Valley Rs.");
  });
});

describe("Bug 11 edge cases: zero-variant, inactive, OOS, free Rs. 0 & demo storefront products", () => {
  it("disables zero-variant/inactive/OOS products while keeping valid Rs. 0 in-stock variants active", () => {
    const emptyProd = makeProduct({ id: 201, name: "No Opts", variants: [] });
    const inactiveProd = makeProduct({
      id: 202,
      name: "Archived Var",
      variants: [makeVariant({ in_stock: true, is_active: false, price_minor: 80000 })],
    });
    const oosProd = makeProduct({
      id: 203,
      name: "Out Of Stock",
      variants: [makeVariant({ in_stock: false, is_active: true, price_minor: 80000 })],
    });
    const freeValidProd = makeProduct({
      id: 204,
      name: "Free Gift",
      variants: [makeVariant({ in_stock: true, is_active: true, price_minor: 0 })],
    });
    const demoProd = makeProduct({ id: -101, name: "Demo Item" });

    // Zero-variant sheet & view
    const emptySheet = renderToStaticMarkup(
      React.createElement(ProductDetailSheet, {
        storeSlug: "edge-store",
        product: emptyProd,
        open: true,
        onOpenChange: () => {},
      })
    );
    expect(emptySheet).toContain("Unavailable");
    expect(emptySheet).not.toContain("Rs. 0");
    expect(emptySheet).toMatch(/<button[^>]*disabled[^>]*>[\s\S]*?Unavailable[\s\S]*?<\/button>/);

    // Inactive & OOS show Sold Out with disabled CTA
    for (const deadProd of [inactiveProd, oosProd]) {
      const dView = renderToStaticMarkup(
        React.createElement(ProductDetailView, {
          store: makeStore(),
          product: deadProd,
          relatedProducts: [],
        })
      );
      expect(dView).toContain("Sold Out");
      expect(dView).toMatch(/<button[^>]*disabled[^>]*>[\s\S]*?Sold Out[\s\S]*?<\/button>/);
    }

    // Valid Rs. 0 active in-stock variant IS purchasable
    const freeView = renderToStaticMarkup(
      React.createElement(ProductDetailView, {
        store: makeStore(),
        product: freeValidProd,
        relatedProducts: [],
      })
    );
    expect(freeView).toContain("Add to bag · Rs. 0");
    expect(freeView).not.toContain("Unavailable");

    const freeSheet = renderToStaticMarkup(
      React.createElement(ProductDetailSheet, {
        storeSlug: "edge-store",
        product: freeValidProd,
        open: true,
        onOpenChange: () => {},
      })
    );
    expect(freeSheet).toContain("Add to bag · Rs. 0");

    // Demo item disabled
    const demoSheet = renderToStaticMarkup(
      React.createElement(ProductDetailSheet, {
        storeSlug: "edge-store",
        product: demoProd,
        open: true,
        onOpenChange: () => {},
      })
    );
    expect(demoSheet).toContain("Demo Preview Only");

    const sheetSrc = fs.readFileSync(
      path.resolve(__dirname, "../components/storefront/ProductDetailSheet.tsx"),
      "utf-8"
    );
    expect(sheetSrc).toContain("key={product.id}");

    // Grid displays both Unavailable & Sold Out properly
    const gridHtml = renderToStaticMarkup(
      React.createElement(ProductGrid, {
        storeSlug: "edge-store",
        products: [emptyProd, oosProd, freeValidProd, demoProd],
        onSelectProduct: () => {},
      })
    );
    expect(gridHtml).toContain("Unavailable");
    expect(gridHtml).toContain("Sold Out");
  });
});

describe("Bug 12 edge cases: resolveDiscountStatusLabel boundary & precedence matrix", () => {
  it("handles every precedence combination cleanly", () => {
    // Paused always wins
    expect(
      resolveDiscountStatusLabel({
        is_active: false,
        is_expired: true,
        is_maxed: true,
        max_uses: 5,
        used_count: 10,
      })
    ).toBe("Paused");

    // Time-expired beats Maxed Out when both are true
    expect(
      resolveDiscountStatusLabel({
        is_active: true,
        is_expired: true,
        is_maxed: true,
        max_uses: 5,
        used_count: 5,
      })
    ).toBe("Expired");

    // Maxed Out cases: exact cap, over cap, 0 cap, is_maxed flag alone
    expect(
      resolveDiscountStatusLabel({
        is_active: true,
        is_expired: false,
        max_uses: 0,
        used_count: 0,
      })
    ).toBe("Maxed Out");
    expect(
      resolveDiscountStatusLabel({
        is_active: true,
        is_expired: false,
        max_uses: 5,
        used_count: 7,
      })
    ).toBe("Maxed Out");
    expect(
      resolveDiscountStatusLabel({
        is_active: true,
        is_expired: false,
        is_maxed: true,
        max_uses: null,
        used_count: 0,
      })
    ).toBe("Maxed Out");

    // Active cases: one below limit, and unlimited (max_uses=null)
    expect(
      resolveDiscountStatusLabel({
        is_active: true,
        is_expired: false,
        is_maxed: false,
        max_uses: 5,
        used_count: 4,
      })
    ).toBe("Active");
    expect(
      resolveDiscountStatusLabel({
        is_active: true,
        is_expired: false,
        max_uses: null,
        used_count: 999,
      })
    ).toBe("Active");
  });
});

describe("Bug 13 edge cases: createLatestTabRefresher timer & unmount lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("handles initial refresh, rapid tab/search changes, cleared search, cancellation on unmount & sequential timers", () => {
    const calls: Array<{ tab: OrdersQueueTab; search: string }> = [];
    const refresher = createLatestTabRefresher<OrdersQueueTab>("new", "tea", (tab, search) => {
      calls.push({ tab, search });
    });

    // 1. Immediate timer with no intermediate state change uses initial tab/search
    const t1 = setTimeout(() => refresher.refreshLatest(), 5000);
    vi.advanceTimersByTime(5000);
    clearTimeout(t1);
    expect(calls).toEqual([{ tab: "new", search: "tea" }]);

    // 2. Rapid switches & search clear before 5000ms elapses
    const t2 = setTimeout(() => refresher.refreshLatest(), 5000);
    vi.advanceTimersByTime(2000);
    refresher.setLatest("packed", "sita");
    vi.advanceTimersByTime(1500);
    refresher.setLatest("delivered", "");
    vi.advanceTimersByTime(1500);
    clearTimeout(t2);
    expect(calls).toEqual([
      { tab: "new", search: "tea" },
      { tab: "delivered", search: "" },
    ]);

    // 3. Clearing timer on unmount prevents stale callback execution
    const tUnmount = setTimeout(() => refresher.refreshLatest(), 5000);
    vi.advanceTimersByTime(4999);
    clearTimeout(tUnmount);
    vi.advanceTimersByTime(5000);
    expect(calls).toHaveLength(2);
  });
});
