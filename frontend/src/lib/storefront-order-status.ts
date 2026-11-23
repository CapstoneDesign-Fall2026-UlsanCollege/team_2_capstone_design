import type { ChipTone } from "@/components/ui/chip";

export interface ShopperOrderStatusInput {
  status: string;
  payment_method: string;
  payment_status: string;
  total_minor: number;
}

export interface ShopperOrderReceiptView {
  chipTone: ChipTone;
  statusBadgeLabel: string;
  heroHeadline: string;
  heroSubtitle: string;
  paymentSummaryLabel: string;
  paymentActionMode: "failed" | "pending" | null;
  showProgressStepper: boolean;
}

function resolveDefaultPaymentSummary(
  paymentStatusUpper: string,
  isCod: boolean,
  totalMinor: number,
  formatAmount: (minor: number) => string
): string {
  if (paymentStatusUpper === "PAID") {
    return "Paid in Full";
  }
  if (isCod || paymentStatusUpper === "COD_PENDING") {
    return `Collect ${formatAmount(totalMinor)} on arrival`;
  }
  return `Balance: ${formatAmount(totalMinor)}`;
}

/**
 * Derive shopper receipt status messaging with lifecycle state taking precedence
 * over payment_status so cancelled or in-transit paid orders never show stale
 * "Payment Verified / prepare for dispatch" copy.
 */
export function resolveShopperOrderReceiptView(
  order: ShopperOrderStatusInput,
  storeName: string,
  formatAmount: (minor: number) => string
): ShopperOrderReceiptView {
  const statusUpper = (order.status || "").toUpperCase();
  const paymentStatusUpper = (order.payment_status || "").toUpperCase();
  const methodUpper = (order.payment_method || "").toUpperCase();
  const isKhalti = methodUpper === "KHALTI";
  const isCod = methodUpper === "COD";

  const defaultSummary = resolveDefaultPaymentSummary(
    paymentStatusUpper,
    isCod,
    order.total_minor,
    formatAmount
  );

  if (statusUpper === "CANCELLED") {
    return {
      chipTone: "error",
      statusBadgeLabel: "Cancelled",
      heroHeadline: "Order Cancelled",
      heroSubtitle: "This order has been cancelled.",
      paymentSummaryLabel: "Order Cancelled",
      paymentActionMode: null,
      showProgressStepper: false,
    };
  }

  if (statusUpper === "PAYMENT_FAILED" || paymentStatusUpper === "FAILED") {
    return {
      chipTone: "error",
      statusBadgeLabel: "Payment Failed",
      heroHeadline: "Payment Not Completed",
      heroSubtitle: "Your payment transaction was not completed. Tap below to retry.",
      paymentSummaryLabel: "Payment Failed",
      paymentActionMode: isKhalti ? "failed" : null,
      showProgressStepper: false,
    };
  }

  if (statusUpper === "DELIVERED") {
    return {
      chipTone: "success",
      statusBadgeLabel: "Delivered",
      heroHeadline: "Order Delivered!",
      heroSubtitle: "Your package has been safely delivered.",
      paymentSummaryLabel: defaultSummary,
      paymentActionMode: null,
      showProgressStepper: true,
    };
  }

  if (statusUpper === "SHIPPED") {
    return {
      chipTone: "warning",
      statusBadgeLabel: "Out for Delivery",
      heroHeadline: "Your Order is on the Way!",
      heroSubtitle: "Courier has picked up your package for doorstep delivery.",
      paymentSummaryLabel: defaultSummary,
      paymentActionMode: null,
      showProgressStepper: true,
    };
  }

  if (statusUpper === "PROCESSING" || statusUpper === "PACKED") {
    return {
      chipTone: "warning",
      statusBadgeLabel: "Processing",
      heroHeadline: "Order Being Prepared",
      heroSubtitle: `${storeName} is preparing your items for courier dispatch.`,
      paymentSummaryLabel: defaultSummary,
      paymentActionMode: null,
      showProgressStepper: true,
    };
  }

  if (statusUpper === "PENDING_PAYMENT" && paymentStatusUpper !== "PAID") {
    return {
      chipTone: "warning",
      statusBadgeLabel: "Verifying Payment",
      heroHeadline: "Awaiting Payment Confirmation",
      heroSubtitle:
        "We are verifying your transaction with Khalti. Tap Check again to refresh status.",
      paymentSummaryLabel: `Balance: ${formatAmount(order.total_minor)}`,
      paymentActionMode: isKhalti ? "pending" : null,
      showProgressStepper: true,
    };
  }

  if (paymentStatusUpper === "PAID" || statusUpper === "PAID") {
    return {
      chipTone: "success",
      statusBadgeLabel: isKhalti ? "Khalti Verified" : "Paid",
      heroHeadline: "Payment Verified & Order Confirmed!",
      heroSubtitle: `Your payment is verified. ${storeName} will prepare your order for dispatch.`,
      paymentSummaryLabel: "Paid in Full",
      paymentActionMode: null,
      showProgressStepper: true,
    };
  }

  if (isCod || paymentStatusUpper === "COD_PENDING") {
    return {
      chipTone: "warning",
      statusBadgeLabel: "Awaiting COD",
      heroHeadline: "Order Confirmed for Cash on Delivery",
      heroSubtitle: `Please have ${formatAmount(order.total_minor)} ready in cash upon arrival.`,
      paymentSummaryLabel: `Collect ${formatAmount(order.total_minor)} on arrival`,
      paymentActionMode: null,
      showProgressStepper: true,
    };
  }

  if (statusUpper === "CONFIRMED") {
    return {
      chipTone: "warning",
      statusBadgeLabel: "Confirmed",
      heroHeadline: "Order Confirmed!",
      heroSubtitle: `${storeName} is preparing your items for courier dispatch.`,
      paymentSummaryLabel: defaultSummary,
      paymentActionMode: null,
      showProgressStepper: true,
    };
  }

  return {
    chipTone: "neutral",
    statusBadgeLabel: statusUpper.replace(/_/g, " ") || "Order",
    heroHeadline: "Order Received",
    heroSubtitle: `Thank you for ordering directly from ${storeName}.`,
    paymentSummaryLabel: defaultSummary,
    paymentActionMode: null,
    showProgressStepper: true,
  };
}

/**
 * Derive compact order-history badge for authenticated storefront shoppers.
 */
export function resolveShopperOrderListStatus(
  status: string,
  paymentStatus?: string
): { tone: ChipTone; label: string } {
  const s = (status || "").toUpperCase();
  const p = (paymentStatus || "").toUpperCase();

  if (s === "CANCELLED") {
    return { tone: "error", label: "Cancelled" };
  }
  if (s === "PAYMENT_FAILED" || p === "FAILED") {
    return { tone: "error", label: "Payment Failed" };
  }
  if (s === "DELIVERED") {
    return { tone: "success", label: "Delivered" };
  }
  if (s === "SHIPPED") {
    return { tone: "warning", label: "Shipped" };
  }
  if (s === "PROCESSING" || s === "PACKED") {
    return { tone: "warning", label: "Processing" };
  }
  if (p === "PAID" || s === "PAID") {
    return { tone: "success", label: "Paid" };
  }
  if (s === "CONFIRMED") {
    return { tone: "neutral", label: "Confirmed" };
  }
  return { tone: "warning", label: "Pending" };
}
