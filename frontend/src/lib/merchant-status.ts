/**
 * Presentation-only status derivation for the merchant console.
 * No backend changes: everything is derived from the existing
 * `status`, `payment_method` and `payment_status` fields.
 *
 * Cash on Delivery follows the marketplace (Flipkart-style) model:
 *  - The order is accepted immediately and shipped without waiting for money.
 *  - Cash is collected by the delivery partner at the door.
 *  - Until the order is DELIVERED the amount is "COD to collect", never "Sales".
 *  - On delivery it shows "Delivered · COD" and counts toward Sales. The cash is
 *    held by the courier until a remittance field exists, so it is never called
 *    "settled" or "received".
 *  - A refused/cancelled parcel never counts.
 */
import type { ChipTone } from "@/components/ui/chip";

export interface OrderLike {
  status: string;
  payment_method: string;
  payment_status: string;
}

export interface StatusView {
  label: string;
  tone: ChipTone;
}

export const COD_DELIVERED_LABEL = "Delivered · COD";

/** Shown wherever COD cash that a courier already holds is explained. */
export const COD_WITH_COURIER_HELP =
  "Cash collected by courier, not yet received by the merchant";

const isCod = (o: OrderLike) => o.payment_method === "COD";
const isDead = (o: OrderLike) => o.status === "CANCELLED" || o.status === "PAYMENT_FAILED";

/** Money state: Paid online, Awaiting COD, Delivered · COD (plus failure states). */
export function paymentView(o: OrderLike): StatusView {
  if (o.status === "CANCELLED") return { label: "Cancelled", tone: "error" };
  if (o.status === "PAYMENT_FAILED" || o.payment_status === "FAILED") {
    return { label: "Payment failed", tone: "error" };
  }
  if (isCod(o)) {
    // No remittance field exists yet, so we never claim the cash is settled.
    return o.status === "DELIVERED"
      ? { label: COD_DELIVERED_LABEL, tone: "warning" }
      : { label: "Awaiting COD", tone: "warning" };
  }
  if (o.payment_status === "PAID") {
    return o.payment_method === "KHALTI"
      ? { label: "Khalti verified", tone: "success" }
      : { label: "Paid", tone: "success" };
  }
  return { label: "Verifying payment", tone: "warning" };
}

export function fulfillmentView(o: OrderLike): StatusView {
  switch (o.status) {
    case "DELIVERED":
      return { label: "Delivered", tone: "success" };
    case "SHIPPED":
      return { label: "Out for delivery", tone: "warning" };
    case "CONFIRMED":
    case "PAID":
    case "PROCESSING":
      return { label: "To dispatch", tone: "warning" };
    case "CANCELLED":
      return { label: "Cancelled", tone: "error" };
    default:
      return { label: "Unfulfilled", tone: "neutral" };
  }
}

/** Sales (paid): Khalti-paid orders + COD orders whose delivery is confirmed. */
export function countsAsSales(o: OrderLike): boolean {
  if (isDead(o)) return false;
  if (isCod(o)) return o.status === "DELIVERED";
  return o.payment_status === "PAID";
}

/** COD to collect: COD orders still in the pipeline (not delivered, not dead). */
export function isCodToCollect(o: OrderLike): boolean {
  return isCod(o) && !isDead(o) && o.status !== "DELIVERED";
}

/** Orders the merchant must still hand to the courier. */
export function needsDispatch(o: OrderLike): boolean {
  return ["CONFIRMED", "PAID", "PROCESSING"].includes(o.status);
}

/** Khalti payments that failed or are stuck verifying. */
export function isKhaltiProblem(o: OrderLike): boolean {
  return (
    o.payment_method === "KHALTI" &&
    (o.status === "PAYMENT_FAILED" ||
      o.payment_status === "FAILED" ||
      (o.status === "PENDING_PAYMENT" && o.payment_status !== "PAID"))
  );
}

/** COD delivered: the courier holds the cash, the merchant has not received it. */
export function isCodWithCourier(o: OrderLike): boolean {
  return isCod(o) && o.status === "DELIVERED";
}

export interface MoneyOrder extends OrderLike {
  total_minor: number;
}

const sum = (orders: MoneyOrder[], pred: (o: OrderLike) => boolean) =>
  orders.reduce((acc, o) => (pred(o) ? acc + (o.total_minor || 0) : acc), 0);

/**
 * Single source of truth for money definitions. The KPI strip and the chart
 * must both be derived from these predicates (backend mirrors them).
 */
export const salesMinor = (orders: MoneyOrder[]) => sum(orders, countsAsSales);
export const codToCollectMinor = (orders: MoneyOrder[]) => sum(orders, isCodToCollect);
export const codWithCourierMinor = (orders: MoneyOrder[]) => sum(orders, isCodWithCourier);