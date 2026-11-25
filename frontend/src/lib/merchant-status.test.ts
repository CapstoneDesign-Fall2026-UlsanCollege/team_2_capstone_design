import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

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

import type { MerchantStoreSettings, OrderDetail } from "./api";
import { OrderQueueTable } from "@/components/merchant/OrderQueueTable";
import { OrderDetailSheet } from "@/components/merchant/OrderDetailSheet";
import { SettingsForm } from "@/components/merchant/SettingsForm";
import { VariantGridEditor } from "@/components/merchant/VariantGridEditor";
import {
  COD_DELIVERED_LABEL,
  codToCollectMinor,
  codWithCourierMinor,
  countsAsSales,
  createLatestTabRefresher,
  fulfillmentView,
  isCodToCollect,
  isCodWithCourier,
  isKhaltiProblem,
  needsDispatch,
  orderTerminalActionView,
  packingSlipPaymentView,
  paymentView,
  resolveDiscountStatusLabel,
  resolveKhaltiSettingsBanner,
  resolveOrdersStatusTab,
  resolveProductImagePickerVisible,
  salesMinor,
  type MoneyOrder,
  type OrdersQueueTab,
} from "./merchant-status";

const order = (
  status: string,
  payment_method: string,
  payment_status: string,
  total_minor = 100_00
): MoneyOrder => ({ status, payment_method, payment_status, total_minor });

const cod = (status: string, total_minor = 100_00) =>
  order(status, "COD", "COD_PENDING", total_minor);
const khalti = (status: string, ps: string, total_minor = 100_00) =>
  order(status, "KHALTI", ps, total_minor);

describe("COD before delivery", () => {
  it.each(["CONFIRMED", "PROCESSING", "SHIPPED"])("%s is Awaiting COD, not Sales", (s) => {
    const o = cod(s);
    expect(paymentView(o)).toEqual({ label: "Awaiting COD", tone: "warning" });
    expect(countsAsSales(o)).toBe(false);
    expect(isCodToCollect(o)).toBe(true);
    expect(isCodWithCourier(o)).toBe(false);
  });

  it("is dispatchable without waiting for money (marketplace model)", () => {
    expect(needsDispatch(cod("CONFIRMED"))).toBe(true);
    expect(fulfillmentView(cod("CONFIRMED"))).toEqual({ label: "To dispatch", tone: "warning" });
    expect(fulfillmentView(cod("SHIPPED"))).toEqual({ label: "Out for delivery", tone: "warning" });
  });
});

describe("COD after delivery", () => {
  const o = cod("DELIVERED");

  it("is labelled Delivered · COD and never 'settled' or 'collected'", () => {
    const v = paymentView(o);
    expect(v.label).toBe(COD_DELIVERED_LABEL);
    expect(v.label).toBe("Delivered · COD");
    expect(v.label.toLowerCase()).not.toMatch(/settled|received|collected/);
    expect(v.tone).toBe("warning");
  });

  it("counts toward Sales, leaves COD to collect, and is held by courier", () => {
    expect(countsAsSales(o)).toBe(true);
    expect(isCodToCollect(o)).toBe(false);
    expect(isCodWithCourier(o)).toBe(true);
    expect(fulfillmentView(o)).toEqual({ label: "Delivered", tone: "success" });
    expect(needsDispatch(o)).toBe(false);
  });
});

describe("Khalti", () => {
  it("paid is Khalti verified and counts as Sales", () => {
    const o = khalti("PAID", "PAID");
    expect(paymentView(o)).toEqual({ label: "Khalti verified", tone: "success" });
    expect(countsAsSales(o)).toBe(true);
    expect(isCodToCollect(o)).toBe(false);
    expect(isKhaltiProblem(o)).toBe(false);
    expect(needsDispatch(o)).toBe(true);
  });

  it("pending is Verifying payment, not Sales, flagged as a problem", () => {
    const o = khalti("PENDING_PAYMENT", "UNPAID");
    expect(paymentView(o)).toEqual({ label: "Verifying payment", tone: "warning" });
    expect(countsAsSales(o)).toBe(false);
    expect(isKhaltiProblem(o)).toBe(true);
    expect(needsDispatch(o)).toBe(false);
    expect(fulfillmentView(o)).toEqual({ label: "Unfulfilled", tone: "neutral" });
  });

  it("failed is Payment failed (error), not Sales, flagged as a problem", () => {
    const o = khalti("PAYMENT_FAILED", "FAILED");
    expect(paymentView(o)).toEqual({ label: "Payment failed", tone: "error" });
    expect(countsAsSales(o)).toBe(false);
    expect(isKhaltiProblem(o)).toBe(true);
  });

  it("a FAILED payment_status alone is enough to be a failure", () => {
    expect(paymentView(khalti("PENDING_PAYMENT", "FAILED")).label).toBe("Payment failed");
  });
});

describe("Cancelled", () => {
  it.each([cod("CANCELLED"), khalti("CANCELLED", "PAID"), khalti("CANCELLED", "UNPAID")])(
    "never counts anywhere (%#)",
    (o) => {
      expect(paymentView(o)).toEqual({ label: "Cancelled", tone: "error" });
      expect(fulfillmentView(o)).toEqual({ label: "Cancelled", tone: "error" });
      expect(countsAsSales(o)).toBe(false);
      expect(isCodToCollect(o)).toBe(false);
      expect(isCodWithCourier(o)).toBe(false);
      expect(needsDispatch(o)).toBe(false);
    }
  );
});

describe("Sales vs COD to collect vs held by courier (mixed)", () => {
  const orders: MoneyOrder[] = [
    khalti("PAID", "PAID", 1000_00), // sales
    khalti("DELIVERED", "PAID", 500_00), // sales
    order("DELIVERED", "COD", "COD_PENDING", 300_00), // sales + courier
    order("SHIPPED", "COD", "COD_PENDING", 200_00), // to collect
    order("CONFIRMED", "COD", "COD_PENDING", 150_00), // to collect
    order("CANCELLED", "COD", "COD_PENDING", 999_00), // nothing
    order("PAYMENT_FAILED", "KHALTI", "FAILED", 888_00), // nothing
    order("PENDING_PAYMENT", "KHALTI", "UNPAID", 777_00), // nothing
  ];

  it("Sales = Khalti paid + COD delivered", () => {
    expect(salesMinor(orders)).toBe(1000_00 + 500_00 + 300_00);
  });

  it("COD to collect = undelivered, live COD only", () => {
    expect(codToCollectMinor(orders)).toBe(200_00 + 150_00);
  });

  it("COD held by courier = delivered COD only", () => {
    expect(codWithCourierMinor(orders)).toBe(300_00);
  });

  it("no order is double counted between COD to collect and Sales", () => {
    for (const o of orders) {
      expect(countsAsSales(o) && isCodToCollect(o)).toBe(false);
    }
  });

  it("empty list is zero, and bad totals are treated as zero", () => {
    expect(salesMinor([])).toBe(0);
    expect(salesMinor([{ ...khalti("PAID", "PAID"), total_minor: NaN }])).toBe(0);
  });
});

describe("resolveOrdersStatusTab", () => {
  it("maps status query parameters cleanly to queue tabs", () => {
    expect(resolveOrdersStatusTab("to_dispatch")).toBe("new");
    expect(resolveOrdersStatusTab("new")).toBe("new");
    expect(resolveOrdersStatusTab("packed")).toBe("packed");
    expect(resolveOrdersStatusTab("shipped")).toBe("shipped");
    expect(resolveOrdersStatusTab("delivered")).toBe("delivered");
    expect(resolveOrdersStatusTab("unknown")).toBe("all");
    expect(resolveOrdersStatusTab(null)).toBe("all");
  });
});

describe("packingSlipPaymentView (#65)", () => {
  it("marks paid Khalti orders as completed with zero cash collection", () => {
    const view = packingSlipPaymentView(khalti("PAID", "PAID"));
    expect(view.tone).toBe("success");
    expect(view.heading).toBe("ONLINE PAYMENT COMPLETED (KHALTI)");
    expect(view.shouldCollectCash).toBe(false);
    expect(view.totalLabel).toBe("Total Paid");
  });

  it("never instructs courier to collect cash as COD for unpaid/pending Khalti orders", () => {
    const view = packingSlipPaymentView(khalti("PENDING_PAYMENT", "UNPAID"));
    expect(view.tone).toBe("warning");
    expect(view.heading).toBe("ONLINE PAYMENT PENDING (KHALTI)");
    expect(view.shouldCollectCash).toBe(false);
    expect(view.instruction).toContain("DO NOT COLLECT CASH AS COD");
    expect(view.totalLabel).toBe("Total Unpaid");
  });

  it("marks failed Khalti orders as payment failed with error tone and no cash collection", () => {
    const view = packingSlipPaymentView(khalti("PAYMENT_FAILED", "FAILED"));
    expect(view.tone).toBe("error");
    expect(view.heading).toBe("PAYMENT FAILED (KHALTI)");
    expect(view.shouldCollectCash).toBe(false);
    expect(view.totalLabel).toBe("Unpaid Total");
  });

  it("requires cash collection only on active undelivered COD orders", () => {
    for (const statusVal of ["CONFIRMED", "PROCESSING", "SHIPPED"]) {
      const view = packingSlipPaymentView(cod(statusVal));
      expect(view.tone).toBe("warning");
      expect(view.heading).toBe("CASH ON DELIVERY (COD)");
      expect(view.shouldCollectCash).toBe(true);
      expect(view.totalLabel).toBe("Total Due (COD)");
    }
  });

  it("marks delivered COD orders as already collected without cash collection prompt", () => {
    const view = packingSlipPaymentView(order("DELIVERED", "COD", "PAID"));
    expect(view.tone).toBe("success");
    expect(view.heading).toBe("CASH ON DELIVERY (COLLECTED)");
    expect(view.shouldCollectCash).toBe(false);
    expect(view.totalLabel).toBe("Total Paid");
  });

  it("marks cancelled COD or Khalti orders as cancelled with no cash collection", () => {
    for (const o of [cod("CANCELLED"), khalti("CANCELLED", "UNPAID"), khalti("CANCELLED", "PAID")]) {
      const view = packingSlipPaymentView(o);
      expect(view.tone).toBe("error");
      expect(view.heading).toBe("ORDER CANCELLED");
      expect(view.shouldCollectCash).toBe(false);
    }
  });
});

function makeOrderDetail(overrides: Partial<OrderDetail> = {}): OrderDetail {
  return {
    id: 10,
    order_number: "#BM-2026-0010",
    order_type: "ONE_TIME",
    status: "DELIVERED",
    payment_method: "KHALTI",
    payment_status: "PAID",
    payment_ref: "pidx_10",
    subtotal_minor: 100000,
    shipping_minor: 10000,
    discount_minor: 0,
    total_minor: 110000,
    currency: "NPR",
    shipping_address_snapshot: {
      recipient_name: "Sita Rai",
      phone: "9801234567",
      province: "Bagmati",
      district: "Kathmandu",
      municipality: "Kathmandu Metro",
      ward: "3",
      street_landmark: "Thamel",
    },
    created_at: "2026-11-20T10:00:00Z",
    items: [
      {
        id: 1,
        product_name_snapshot: "Gulmi Reserve",
        variant_label_snapshot: "250g",
        unit_price_minor: 100000,
        quantity: 1,
        line_total_minor: 100000,
      },
    ],
    events: [],
    customer_name: "Sita Rai",
    customer_email: "sita@example.com",
    customer_phone: "9801234567",
    ...overrides,
  };
}

describe("orderTerminalActionView and merchant order queue/drawer terminal labels", () => {
  it("maps terminal and awaiting-payment statuses accurately", () => {
    expect(orderTerminalActionView(khalti("DELIVERED", "PAID"))).toEqual({
      kind: "delivered",
      tableLabel: "Done",
      sheetLabel: "Order Completed & Delivered",
      tone: "success",
    });
    expect(orderTerminalActionView(cod("CANCELLED"))).toEqual({
      kind: "cancelled",
      tableLabel: "Cancelled",
      sheetLabel: "Order Cancelled",
      tone: "error",
    });
    expect(orderTerminalActionView(khalti("PAYMENT_FAILED", "FAILED"))).toEqual({
      kind: "failed",
      tableLabel: "Failed",
      sheetLabel: "Payment Failed — Awaiting Retry",
      tone: "error",
    });
    expect(orderTerminalActionView(khalti("PENDING_PAYMENT", "UNPAID"))).toEqual({
      kind: "pending",
      tableLabel: "Awaiting Pay",
      sheetLabel: "Awaiting Online Payment Verification",
      tone: "warning",
    });
  });

  it("renders non-delivered terminal states accurately in OrderQueueTable and OrderDetailSheet", () => {
    const cancelledCod = makeOrderDetail({
      id: 11,
      order_number: "#BM-2026-0011",
      status: "CANCELLED",
      payment_method: "COD",
      payment_status: "COD_PENDING",
    });
    const failedKhalti = makeOrderDetail({
      id: 12,
      order_number: "#BM-2026-0012",
      status: "PAYMENT_FAILED",
      payment_method: "KHALTI",
      payment_status: "FAILED",
    });
    const pendingKhalti = makeOrderDetail({
      id: 13,
      order_number: "#BM-2026-0013",
      status: "PENDING_PAYMENT",
      payment_method: "KHALTI",
      payment_status: "UNPAID",
    });
    const deliveredOrder = makeOrderDetail({
      id: 14,
      order_number: "#BM-2026-0014",
      status: "DELIVERED",
      payment_method: "KHALTI",
      payment_status: "PAID",
    });

    for (const [ord, expectedLabel] of [
      [cancelledCod, "Order Cancelled"],
      [failedKhalti, "Payment Failed — Awaiting Retry"],
      [pendingKhalti, "Awaiting Online Payment Verification"],
    ] as const) {
      const tableHtml = renderToStaticMarkup(
        React.createElement(OrderQueueTable, {
          orders: [ord],
          onSelectOrder: () => {},
          onQuickAdvance: () => {},
        })
      );
      expect(tableHtml).not.toContain(">Done<");
      expect(tableHtml).not.toContain("COD Due");

      const sheetHtml = renderToStaticMarkup(
        React.createElement(OrderDetailSheet, {
          order: ord,
          open: true,
          onOpenChange: () => {},
          onAdvanceStatus: () => {},
        })
      );
      expect(sheetHtml).not.toContain("Order Completed &amp; Delivered");
      expect(sheetHtml).not.toContain("Order Completed & Delivered");
      expect(sheetHtml).toContain(expectedLabel);
    }

    const deliveredTableHtml = renderToStaticMarkup(
      React.createElement(OrderQueueTable, {
        orders: [deliveredOrder],
        onSelectOrder: () => {},
        onQuickAdvance: () => {},
      })
    );
    expect(deliveredTableHtml).toContain(">Done<");

    const deliveredSheetHtml = renderToStaticMarkup(
      React.createElement(OrderDetailSheet, {
        order: deliveredOrder,
        open: true,
        onOpenChange: () => {},
        onAdvanceStatus: () => {},
      })
    );
    expect(deliveredSheetHtml).toContain("Order Completed &amp; Delivered");
  });
});

describe("ProductSheet preset picker visibility (Bug 7)", () => {
  it("keeps picker hidden when imageUrl is present unless showImagePicker is true", () => {
    expect(resolveProductImagePickerVisible("/uploads/a.png", false)).toBe(false);
    expect(resolveProductImagePickerVisible("/uploads/a.png", true)).toBe(true);
    expect(resolveProductImagePickerVisible("", false)).toBe(true);
    expect(resolveProductImagePickerVisible("   ", false)).toBe(true);
  });

  it("opens preset picker on Pick from Presets and mounts only one fileInputRef in ProductSheet", () => {
    const productSheetPath = path.resolve(
      __dirname,
      "../components/merchant/ProductSheet.tsx"
    );
    const source = fs.readFileSync(productSheetPath, "utf-8");

    expect(source).toContain("resolveProductImagePickerVisible");
    expect(source).toMatch(
      /setImageTab\("presets"\);\s*setShowImagePicker\(true\);[\s\S]{0,260}Pick from Presets/
    );
    expect(source).toContain("Hide picker");
    const refMatches = source.match(/ref=\{fileInputRef\}/g) || [];
    expect(refMatches).toHaveLength(1);
  });
});

function makeStoreSettings(
  overrides: Partial<MerchantStoreSettings> = {}
): MerchantStoreSettings {
  return {
    slug: "test-store",
    name: "Test Store",
    tagline: "Handcrafted in Nepal",
    currency: "NPR",
    theme_preset: "editorial-warm",
    logo_url: "",
    accent_color: "#224433",
    contact_phone: "9800000000",
    inside_valley_shipping_minor: 10000,
    outside_valley_shipping_minor: 20000,
    free_shipping_threshold_minor: null,
    has_custom_khalti_key: false,
    has_khalti: false,
    khalti_mode: "TEST",
    khalti_key_masked: "",
    cod_enabled: true,
    custom_domain: "",
    member_role: "OWNER",
    ...overrides,
  };
}

describe("Khalti settings banner (Bug 8)", () => {
  it("resolves all four Khalti credential and sandbox states accurately", () => {
    const liveCustom = resolveKhaltiSettingsBanner({
      hasCustomKey: true,
      hasKhalti: true,
      khaltiMode: "LIVE",
      maskedKey: "••••1234",
    });
    expect(liveCustom.title).toBe("Live Merchant Key Connected");
    expect(liveCustom.badge).toBe("LIVE MODE");
    expect(liveCustom.dotColor).toBe("var(--st-delivered)");
    expect(liveCustom.description).toContain("••••1234");

    const testCustom = resolveKhaltiSettingsBanner({
      hasCustomKey: true,
      hasKhalti: true,
      khaltiMode: "TEST",
      maskedKey: "••••5678",
    });
    expect(testCustom.title).toBe("Custom Test Key Connected");
    expect(testCustom.badge).toBe("TEST MODE");
    expect(testCustom.dotColor).toBe("var(--st-delivered)");

    const platformSandbox = resolveKhaltiSettingsBanner({
      hasCustomKey: false,
      hasKhalti: true,
      khaltiMode: "TEST",
    });
    expect(platformSandbox.title).toBe("Platform Sandbox Active (Ready for Test Orders)");
    expect(platformSandbox.badge).toBe("TEST MODE");
    expect(platformSandbox.dotColor).toBe("var(--st-new)");

    const unconfigured = resolveKhaltiSettingsBanner({
      hasCustomKey: false,
      hasKhalti: false,
      khaltiMode: "TEST",
    });
    expect(unconfigured.title).toBe("Khalti Not Configured");
    expect(unconfigured.badge).toBe("UNCONFIGURED");
    expect(unconfigured.dotColor).toBe("var(--st-cancelled)");
  });

  it("renders unconfigured status in SettingsForm when no store or platform key is active", () => {
    const unconfiguredHtml = renderToStaticMarkup(
      React.createElement(SettingsForm, {
        storeSlug: "test-store",
        section: "payments",
        initialSettings: makeStoreSettings({
          has_custom_khalti_key: false,
          has_khalti: false,
        }),
      })
    );
    expect(unconfiguredHtml).toContain("Khalti Not Configured");
    expect(unconfiguredHtml).toContain("UNCONFIGURED");
    expect(unconfiguredHtml).not.toContain("Platform Sandbox Active");

    const sandboxHtml = renderToStaticMarkup(
      React.createElement(SettingsForm, {
        storeSlug: "test-store",
        section: "payments",
        initialSettings: makeStoreSettings({
          has_custom_khalti_key: false,
          has_khalti: true,
        }),
      })
    );
    expect(sandboxHtml).toContain("Platform Sandbox Active (Ready for Test Orders)");
  });
});

describe("VariantGridEditor mobile custom variant form (Bug 9)", () => {
  it("renders custom variant inputs and button inside the mobile container and aligns desktop colSpan", () => {
    const html = renderToStaticMarkup(
      React.createElement(VariantGridEditor, {
        storeSlug: "test-store",
        productId: 42,
        initialVariants: [
          {
            id: 1,
            sku: "SKU-1",
            label: "250g",
            weight_grams: 250,
            price_minor: 80000,
            allow_one_time: true,
            in_stock: true,
            is_active: true,
            sort_order: 0,
          },
        ],
      })
    );

    const desktopMatch = html.match(/<table[\s\S]*?<\/table>/);
    expect(desktopMatch).not.toBeNull();
    expect(desktopMatch![0]).toMatch(/colspan="5"/i);

    const mobileSplit = html.split("sm:hidden space-y-3");
    expect(mobileSplit.length).toBeGreaterThan(1);
    const mobileSection = mobileSplit[1];
    expect(mobileSection).toContain("+ Add size / variant...");
    expect(mobileSection).toContain("+ Add Variant");
  });
});

describe("resolveDiscountStatusLabel (Bug 12)", () => {
  it("distinguishes maxed-out promo codes from time-expired codes and paused codes", () => {
    expect(
      resolveDiscountStatusLabel({
        is_active: true,
        is_expired: false,
        is_maxed: true,
        max_uses: 5,
        used_count: 5,
      })
    ).toBe("Maxed Out");

    expect(
      resolveDiscountStatusLabel({
        is_active: true,
        is_expired: false,
        max_uses: 3,
        used_count: 3,
      })
    ).toBe("Maxed Out");

    expect(
      resolveDiscountStatusLabel({
        is_active: true,
        is_expired: true,
        is_maxed: false,
        max_uses: 10,
        used_count: 2,
      })
    ).toBe("Expired");

    expect(
      resolveDiscountStatusLabel({
        is_active: false,
        is_expired: true,
        is_maxed: true,
        max_uses: 5,
        used_count: 5,
      })
    ).toBe("Paused");

    expect(
      resolveDiscountStatusLabel({
        is_active: true,
        is_expired: false,
        is_maxed: false,
        max_uses: 10,
        used_count: 2,
      })
    ).toBe("Active");
  });
});

describe("createLatestTabRefresher (Bug 13)", () => {
  it("refreshes the latest tab and search query even when the user switches tabs before the timer fires", () => {
    const loads: Array<{ tab: string; search: string }> = [];
    const refresher = createLatestTabRefresher<OrdersQueueTab>("new", "initial", (tab, search) => {
      loads.push({ tab, search });
    });

    // Simulate user switching tab & search while the 5s undo timer is pending
    refresher.setLatest("packed", "sita");
    refresher.setLatest("shipped", "9801");
    refresher.refreshLatest();

    expect(loads).toEqual([{ tab: "shipped", search: "9801" }]);
  });
});
