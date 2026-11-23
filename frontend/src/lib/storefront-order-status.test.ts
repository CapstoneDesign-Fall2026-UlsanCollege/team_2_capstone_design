import { describe, expect, it } from "vitest";
import { formatNpr } from "./api";
import {
  resolveShopperOrderListStatus,
  resolveShopperOrderReceiptView,
} from "./storefront-order-status";

describe("resolveShopperOrderReceiptView", () => {
  it("shows Cancelled for cancelled Khalti orders even when payment_status is PAID", () => {
    const view = resolveShopperOrderReceiptView(
      {
        status: "CANCELLED",
        payment_method: "KHALTI",
        payment_status: "PAID",
        total_minor: 145000,
      },
      "BrewMellow",
      formatNpr
    );

    expect(view.chipTone).toBe("error");
    expect(view.statusBadgeLabel).toBe("Cancelled");
    expect(view.heroHeadline).toBe("Order Cancelled");
    expect(view.paymentSummaryLabel).toBe("Order Cancelled");
    expect(view.paymentActionMode).toBeNull();
    expect(view.showProgressStepper).toBe(false);
    expect(view.heroHeadline).not.toContain("Verified");
  });

  it("shows Out for Delivery for shipped Khalti orders even when payment_status is PAID", () => {
    const view = resolveShopperOrderReceiptView(
      {
        status: "SHIPPED",
        payment_method: "KHALTI",
        payment_status: "PAID",
        total_minor: 145000,
      },
      "BrewMellow",
      formatNpr
    );

    expect(view.chipTone).toBe("warning");
    expect(view.statusBadgeLabel).toBe("Out for Delivery");
    expect(view.heroHeadline).toBe("Your Order is on the Way!");
    expect(view.paymentSummaryLabel).toBe("Paid in Full");
    expect(view.showProgressStepper).toBe(true);
  });

  it("shows Processing for packed/processing Khalti and COD orders", () => {
    const khaltiPacked = resolveShopperOrderReceiptView(
      {
        status: "PROCESSING",
        payment_method: "KHALTI",
        payment_status: "PAID",
        total_minor: 95000,
      },
      "BrewMellow",
      formatNpr
    );
    expect(khaltiPacked.statusBadgeLabel).toBe("Processing");
    expect(khaltiPacked.heroHeadline).toBe("Order Being Prepared");
    expect(khaltiPacked.paymentSummaryLabel).toBe("Paid in Full");

    const codPacked = resolveShopperOrderReceiptView(
      {
        status: "PACKED",
        payment_method: "COD",
        payment_status: "COD_PENDING",
        total_minor: 95000,
      },
      "BrewMellow",
      formatNpr
    );
    expect(codPacked.statusBadgeLabel).toBe("Processing");
    expect(codPacked.paymentSummaryLabel).toBe("Collect Rs. 950 on arrival");
  });

  it("handles delivered, fresh paid Khalti, fresh COD confirmed, pending payment, and failed Khalti orders", () => {
    const delivered = resolveShopperOrderReceiptView(
      {
        status: "DELIVERED",
        payment_method: "KHALTI",
        payment_status: "PAID",
        total_minor: 120000,
      },
      "BrewMellow",
      formatNpr
    );
    expect(delivered.chipTone).toBe("success");
    expect(delivered.statusBadgeLabel).toBe("Delivered");
    expect(delivered.heroHeadline).toBe("Order Delivered!");
    expect(delivered.paymentSummaryLabel).toBe("Paid in Full");

    const freshKhalti = resolveShopperOrderReceiptView(
      {
        status: "PAID",
        payment_method: "KHALTI",
        payment_status: "PAID",
        total_minor: 120000,
      },
      "BrewMellow",
      formatNpr
    );
    expect(freshKhalti.chipTone).toBe("success");
    expect(freshKhalti.statusBadgeLabel).toBe("Khalti Verified");
    expect(freshKhalti.heroHeadline).toBe("Payment Verified & Order Confirmed!");

    const freshCod = resolveShopperOrderReceiptView(
      {
        status: "CONFIRMED",
        payment_method: "COD",
        payment_status: "COD_PENDING",
        total_minor: 80000,
      },
      "BrewMellow",
      formatNpr
    );
    expect(freshCod.chipTone).toBe("warning");
    expect(freshCod.statusBadgeLabel).toBe("Awaiting COD");
    expect(freshCod.paymentSummaryLabel).toBe("Collect Rs. 800 on arrival");

    const pendingKhalti = resolveShopperOrderReceiptView(
      {
        status: "PENDING_PAYMENT",
        payment_method: "KHALTI",
        payment_status: "UNPAID",
        total_minor: 80000,
      },
      "BrewMellow",
      formatNpr
    );
    expect(pendingKhalti.statusBadgeLabel).toBe("Verifying Payment");
    expect(pendingKhalti.paymentActionMode).toBe("pending");

    const failedKhalti = resolveShopperOrderReceiptView(
      {
        status: "PAYMENT_FAILED",
        payment_method: "KHALTI",
        payment_status: "FAILED",
        total_minor: 80000,
      },
      "BrewMellow",
      formatNpr
    );
    expect(failedKhalti.chipTone).toBe("error");
    expect(failedKhalti.statusBadgeLabel).toBe("Payment Failed");
    expect(failedKhalti.paymentSummaryLabel).toBe("Payment Failed");
    expect(failedKhalti.paymentActionMode).toBe("failed");
    expect(failedKhalti.showProgressStepper).toBe(false);
  });
});

describe("resolveShopperOrderListStatus", () => {
  it("prioritizes cancelled, failed, delivered, shipped, and processing over PAID", () => {
    expect(resolveShopperOrderListStatus("CANCELLED", "PAID")).toEqual({
      tone: "error",
      label: "Cancelled",
    });
    expect(resolveShopperOrderListStatus("PAYMENT_FAILED", "FAILED")).toEqual({
      tone: "error",
      label: "Payment Failed",
    });
    expect(resolveShopperOrderListStatus("DELIVERED", "PAID")).toEqual({
      tone: "success",
      label: "Delivered",
    });
    expect(resolveShopperOrderListStatus("SHIPPED", "PAID")).toEqual({
      tone: "warning",
      label: "Shipped",
    });
    expect(resolveShopperOrderListStatus("PROCESSING", "PAID")).toEqual({
      tone: "warning",
      label: "Processing",
    });
    expect(resolveShopperOrderListStatus("PAID", "PAID")).toEqual({
      tone: "success",
      label: "Paid",
    });
    expect(resolveShopperOrderListStatus("CONFIRMED", "COD_PENDING")).toEqual({
      tone: "neutral",
      label: "Confirmed",
    });
    expect(resolveShopperOrderListStatus("PENDING_PAYMENT", "UNPAID")).toEqual({
      tone: "warning",
      label: "Pending",
    });
  });
});
