import { describe, expect, it } from "vitest";
import {
  COD_DELIVERED_LABEL,
  codToCollectMinor,
  codWithCourierMinor,
  countsAsSales,
  fulfillmentView,
  isCodToCollect,
  isCodWithCourier,
  isKhaltiProblem,
  needsDispatch,
  paymentView,
  resolveOrdersStatusTab,
  salesMinor,
  type MoneyOrder,
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
