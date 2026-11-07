import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Package,
  RotateCw,
  ShoppingBag,
} from "lucide-react";
import { formatNpr, OrderDetail, StorePublicMetadata } from "@/lib/api";
import { getServerApiOrigin } from "@/lib/env";
import { Chip, ChipTone } from "@/components/ui/chip";
import { OrderAccountBanner, OrderHeaderNav } from "@/components/storefront/OrderAccountBanner";

async function fetchOrderData(
  storeSlug: string,
  orderId: string,
  token?: string
): Promise<{ order: OrderDetail | null; store: StorePublicMetadata | null }> {
  const origin = getServerApiOrigin();
  try {
    const orderUrl = token
      ? `${origin}/api/stores/${encodeURIComponent(storeSlug)}/public-orders/${encodeURIComponent(orderId)}/?token=${encodeURIComponent(token)}`
      : `${origin}/api/stores/${encodeURIComponent(storeSlug)}/public-orders/${encodeURIComponent(orderId)}/`;

    let orderRes = await fetch(orderUrl, { cache: "no-store" });
    if (orderRes.status === 404) {
      // Retry with backoff to allow remote Neon DB transaction propagation immediately following checkout
      const retryDelays = [400, 800, 1400];
      for (const delay of retryDelays) {
        await new Promise((r) => setTimeout(r, delay));
        orderRes = await fetch(orderUrl, { cache: "no-store" });
        if (orderRes.ok) break;
      }
      if (orderRes.status === 404) {
        return { order: null, store: null };
      }
    }
    const storeRes = await fetch(
      `${origin}/api/stores/${encodeURIComponent(storeSlug)}/`,
      { cache: "no-store" }
    );

    if (storeRes.status === 404) {
      return { order: null, store: null };
    }

    const order: OrderDetail = orderRes.ok ? await orderRes.json() : null;
    const store: StorePublicMetadata = storeRes.ok ? await storeRes.json() : null;

    return { order, store };
  } catch {
    return { order: null, store: null };
  }
}

export default async function StorefrontOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string; orderId: string }>;
  searchParams?: Promise<{ token?: string }>;
}) {
  const { storeSlug, orderId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const token = resolvedSearchParams?.token;
  const { order, store } = await fetchOrderData(storeSlug, orderId, token);

  if (!order || !store) {
    notFound();
  }

  const statusUpper = order.status.toUpperCase();
  const paymentStatusUpper = order.payment_status.toUpperCase();
  const isKhalti = order.payment_method === "KHALTI";
  const isCod = order.payment_method === "COD";

  // Determine Semantic Status Mapping
  let chipTone: ChipTone = "neutral";
  let statusBadgeLabel = order.status.replace(/_/g, " ");
  let heroHeadline = "Order Received";
  let heroSubtitle = `Thank you for ordering directly from ${store.name}.`;
  let canRetryPayment = false;

  if (statusUpper === "DELIVERED") {
    chipTone = "success";
    statusBadgeLabel = "Delivered";
    heroHeadline = "Order Delivered!";
    heroSubtitle = "Your package has been safely delivered.";
  } else if (paymentStatusUpper === "PAID" || statusUpper === "PAID") {
    chipTone = "success";
    statusBadgeLabel = isKhalti ? "Khalti Verified" : "Paid";
    heroHeadline = "Payment Verified & Order Confirmed!";
    heroSubtitle = `Your payment is verified. ${store.name} will prepare your order for dispatch.`;
  } else if (statusUpper === "PAYMENT_FAILED" || paymentStatusUpper === "FAILED") {
    chipTone = "error";
    statusBadgeLabel = "Payment Failed";
    heroHeadline = "Payment Not Completed";
    heroSubtitle = "Your payment transaction was not completed. Tap below to retry.";
    canRetryPayment = true;
  } else if (statusUpper === "CANCELLED") {
    chipTone = "error";
    statusBadgeLabel = "Cancelled";
    heroHeadline = "Order Cancelled";
    heroSubtitle = "This order has been cancelled.";
  } else if (statusUpper === "SHIPPED") {
    chipTone = "warning";
    statusBadgeLabel = "Out for Delivery";
    heroHeadline = "Your Order is on the Way!";
    heroSubtitle = "Courier has picked up your package for doorstep delivery.";
  } else if (isCod || paymentStatusUpper === "COD_PENDING") {
    chipTone = "warning";
    statusBadgeLabel = "Awaiting COD";
    heroHeadline = "Order Confirmed for Cash on Delivery";
    heroSubtitle = `Please have ${formatNpr(order.total_minor)} ready in cash upon arrival.`;
  } else if (statusUpper === "PENDING_PAYMENT") {
    chipTone = "warning";
    statusBadgeLabel = "Verifying Payment";
    heroHeadline = "Awaiting Payment Confirmation";
    heroSubtitle = "We are verifying your transaction. If unpaid, you can complete payment now.";
    canRetryPayment = true;
  } else if (statusUpper === "CONFIRMED" || statusUpper === "PROCESSING" || statusUpper === "PACKED") {
    chipTone = "warning";
    statusBadgeLabel = "Processing";
    heroHeadline = "Order Confirmed!";
    heroSubtitle = `${store.name} is preparing your items for courier dispatch.`;
  }

  // Stepper lifecycle calculation
  const isConfirmed = [
    "CONFIRMED",
    "PAID",
    "PROCESSING",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
  ].includes(statusUpper);
  const isPacked = ["PROCESSING", "PACKED", "SHIPPED", "DELIVERED"].includes(statusUpper);
  const isShipped = ["SHIPPED", "DELIVERED"].includes(statusUpper);
  const isDelivered = statusUpper === "DELIVERED";

  const timelineSteps = [
    { label: "Confirmed", done: isConfirmed, current: !isConfirmed },
    { label: "Packed", done: isPacked, current: isConfirmed && !isPacked },
    { label: "Out for Delivery", done: isShipped, current: isPacked && !isShipped },
    { label: "Delivered", done: isDelivered, current: isShipped && !isDelivered },
  ];

  return (
    <div className="min-h-dvh bg-[var(--canvas)] text-[var(--ink)] flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Store Home</span>
          </Link>

          <span className="font-serif text-base font-semibold text-[var(--ink)] truncate">
            {store.name}
          </span>

          <OrderHeaderNav storeSlug={store.slug} orderNumber={order.order_number} />
        </div>
      </header>

      {/* Main Order Confirmation Screen */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Status Hero Card */}
        <div className="p-6 sm:p-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center space-y-4">
          <div className="inline-flex justify-center">
            <Chip tone={chipTone}>{statusBadgeLabel}</Chip>
          </div>

          <div
            className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
              chipTone === "success"
                ? "bg-[var(--success-bg)] border border-[var(--success-bd)] text-[var(--success-fg)]"
                : chipTone === "error"
                ? "bg-[var(--error-bg)] border border-[var(--error-bd)] text-[var(--error-fg)]"
                : "bg-[var(--warning-bg)] border border-[var(--warning-bd)] text-[var(--warning-fg)]"
            }`}
          >
            {chipTone === "success" ? (
              <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
            ) : chipTone === "error" ? (
              <AlertCircle className="w-7 h-7" aria-hidden="true" />
            ) : (
              <Clock className="w-7 h-7" aria-hidden="true" />
            )}
          </div>

          <div className="space-y-1.5">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ink)]">
              {heroHeadline}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-md mx-auto leading-relaxed">
              {heroSubtitle}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[var(--canvas)] border border-[var(--border)] text-xs text-[var(--ink)] tabular-nums">
            <span className="text-[var(--ink-2)]">Order Number:</span>
            <span className="font-semibold">{order.order_number}</span>
          </div>

          {/* One-tap retry button for failed / pending payment */}
          {canRetryPayment && (
            <div className="pt-2 max-w-xs mx-auto">
              <Link
                href={`/s/${encodeURIComponent(store.slug)}/checkout`}
                className="w-full min-h-[44px] h-12 rounded-lg bg-[var(--primary)] text-[var(--surface)] hover:bg-[var(--primary-hover)] text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                <span>Retry Payment</span>
              </Link>
            </div>
          )}
        </div>

        {/* Soft Customer Account Creation Banner (for guest orders) */}
        <OrderAccountBanner storeSlug={store.slug} customerEmail={order.customer_email} />

        {/* Order Lifecycle Timeline */}
        <section className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-base font-semibold text-[var(--ink)]">
              Order Progress
            </h2>
            <span className="text-xs text-[var(--ink-2)]">
              Estimated Delivery: 1–3 Days
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2">
            {timelineSteps.map((step, idx) => (
              <div key={step.label} className="flex flex-col items-center text-center space-y-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    step.done
                      ? "bg-[var(--primary)] text-[var(--surface)]"
                      : step.current
                      ? "border-2 border-[var(--ink)] bg-[var(--surface)] text-[var(--ink)]"
                      : "border border-[var(--border)] bg-[var(--canvas)] text-[var(--ink-2)]"
                  }`}
                >
                  {step.done ? "✓" : idx + 1}
                </div>
                <span className="text-xs font-medium text-[var(--ink)] leading-tight">
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Delivery Destination */}
        <section className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
          <h2 className="font-serif text-base font-semibold text-[var(--ink)] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[var(--ink-2)]" aria-hidden="true" />
            <span>Delivery Destination</span>
          </h2>

          <div className="p-4 rounded-xl bg-[var(--canvas)] border border-[var(--border)] text-xs space-y-1 text-[var(--ink)]">
            <p className="font-semibold text-sm">
              {order.shipping_address_snapshot?.recipient_name} ·{" "}
              <span className="tabular-nums font-normal text-[var(--ink-2)]">
                +977 {order.shipping_address_snapshot?.phone}
              </span>
            </p>
            <p className="text-[var(--ink-2)]">
              Ward {order.shipping_address_snapshot?.ward},{" "}
              {order.shipping_address_snapshot?.municipality},{" "}
              {order.shipping_address_snapshot?.district},{" "}
              {order.shipping_address_snapshot?.province} Province
            </p>
            {order.shipping_address_snapshot?.street_landmark && (
              <p className="text-[var(--ink-2)] pt-0.5">
                Landmark: {order.shipping_address_snapshot.street_landmark}
              </p>
            )}
          </div>
        </section>

        {/* Items Ordered Breakdown */}
        <section className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
          <h2 className="font-serif text-base font-semibold text-[var(--ink)] flex items-center gap-2">
            <Package className="w-4 h-4 text-[var(--ink-2)]" aria-hidden="true" />
            <span>Items Ordered</span>
          </h2>

          <div className="divide-y divide-[var(--border)]">
            {order.items.map((it) => (
              <div
                key={it.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5 min-w-0 pr-3">
                  <p className="font-medium text-[var(--ink)] truncate">
                    {it.product_name_snapshot}
                  </p>
                  <p className="text-[var(--ink-2)]">
                    {it.variant_label_snapshot ? `${it.variant_label_snapshot} · ` : ""}Qty: {it.quantity}
                  </p>
                </div>

                <span className="font-semibold text-[var(--ink)] tabular-nums whitespace-nowrap">
                  {formatNpr(it.line_total_minor)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[var(--border)] text-xs space-y-1.5 text-[var(--ink-2)]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-[var(--ink)] tabular-nums">{formatNpr(order.subtotal_minor)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="text-[var(--ink)] tabular-nums">
                {order.shipping_minor === 0 ? "FREE" : formatNpr(order.shipping_minor)}
              </span>
            </div>
            {order.discount_minor > 0 && (
              <div className="flex justify-between text-[var(--success-fg)] font-medium">
                <span>Discount</span>
                <span className="tabular-nums">-{formatNpr(order.discount_minor)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-[var(--border)] font-semibold text-sm text-[var(--ink)]">
              <span>Total Amount</span>
              <span className="text-base tabular-nums">{formatNpr(order.total_minor)}</span>
            </div>
          </div>
        </section>

        {/* Payment Summary */}
        <section className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border border-[var(--border)] bg-[var(--canvas)] flex items-center justify-center text-[var(--ink-2)] shrink-0">
              <CreditCard className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[var(--ink)]">
                {isKhalti ? "Khalti ePayment" : "Cash on Delivery"}
              </p>
              <p className="text-xs text-[var(--ink-2)] tabular-nums mt-0.5">
                {paymentStatusUpper === "PAID"
                  ? "Paid in Full"
                  : paymentStatusUpper === "COD_PENDING"
                  ? `Collect ${formatNpr(order.total_minor)} on arrival`
                  : `Balance: ${formatNpr(order.total_minor)}`}
              </p>
            </div>
          </div>

          <Chip tone={chipTone}>{statusBadgeLabel}</Chip>
        </section>

        {/* Back Link */}
        <div className="pt-2 text-center">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center gap-2 min-h-[44px] px-6 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--surface)] hover:bg-[var(--primary-hover)] text-xs font-semibold transition-colors"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-6 px-4 text-center text-xs text-[var(--ink-2)]">
        <p>{store.name} · Powered by ShopCraft</p>
      </footer>
    </div>
  );
}
