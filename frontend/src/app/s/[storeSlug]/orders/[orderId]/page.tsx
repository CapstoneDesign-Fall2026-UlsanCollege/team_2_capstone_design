import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  ShoppingBag,
} from "lucide-react";
import { formatNpr, OrderDetail, StorePublicMetadata } from "@/lib/api";

async function fetchOrderData(
  storeSlug: string,
  orderId: string
): Promise<{ order: OrderDetail | null; store: StorePublicMetadata | null }> {
  const origin = process.env.DJANGO_API_ORIGIN || "http://127.0.0.1:8000";
  try {
    const [orderRes, storeRes] = await Promise.all([
      fetch(
        `${origin}/api/stores/${encodeURIComponent(storeSlug)}/public-orders/${encodeURIComponent(
          orderId
        )}/`,
        { cache: "no-store" }
      ),
      fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/`, {
        cache: "no-store",
      }),
    ]);

    if (orderRes.status === 404 || storeRes.status === 404) {
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
}: {
  params: Promise<{ storeSlug: string; orderId: string }>;
}) {
  const { storeSlug, orderId } = await params;
  const { order, store } = await fetchOrderData(storeSlug, orderId);

  if (!order || !store) {
    notFound();
  }

  // Stages calculation
  const statusUpper = order.status.toUpperCase();
  const isPaid = order.payment_status === "PAID" || order.status === "PAID";
  const isConfirmed = order.status === "CONFIRMED" || isPaid;
  const isPacked = ["PACKED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(statusUpper);
  const isShipped = ["SHIPPED", "DELIVERED"].includes(statusUpper);
  const isDelivered = statusUpper === "DELIVERED";

  const timelineSteps = [
    { label: "Order Placed", done: true, current: isConfirmed && !isPacked },
    { label: "Packed", done: isPacked, current: isPacked && !isShipped },
    { label: "Out for Delivery", done: isShipped, current: isShipped && !isDelivered },
    { label: "Delivered", done: isDelivered, current: isDelivered },
  ];

  return (
    <div className="min-h-dvh bg-sf-canvas text-sf-ink flex flex-col">
      {/* Minimal Header */}
      <header className="sticky top-0 z-30 w-full border-b border-sf-line bg-sf-surface/90 backdrop-blur-xs">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center gap-1.5 text-xs font-sf-mono text-sf-muted hover:text-sf-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Store Home</span>
          </Link>

          <span className="font-sf-display text-sm sm:text-base font-bold text-sf-ink truncate">
            {store.name}
          </span>

          <span className="font-sf-mono text-xs text-sf-muted tabular-nums">
            {order.order_number}
          </span>
        </div>
      </header>

      {/* Main Order Confirmation Screen */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Banner */}
        <div className="p-6 rounded-sf border border-sf-line bg-sf-surface text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-sf-canvas border border-sf-line text-sf-accent mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
          </div>

          <div className="space-y-1">
            <h1 className="font-sf-display text-xl sm:text-2xl font-bold tracking-tight text-sf-ink">
              {isPaid ? "Payment Verified & Confirmed!" : "Order Placed Successfully!"}
            </h1>
            <p className="text-xs text-sf-muted font-sf-mono">
              Thank you for supporting artisanal Nepali craftsmanship.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sf bg-sf-canvas border border-sf-line text-xs font-sf-mono text-sf-ink tabular-nums">
            <span>Order Reference:</span>
            <span className="font-bold text-sf-accent">{order.order_number}</span>
          </div>
        </div>

        {/* Order Lifecycle Progress Timeline */}
        <section className="p-5 rounded-sf border border-sf-line bg-sf-surface space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-sf-display text-sm font-bold text-sf-ink">Order Status</h3>
            <span className="px-2.5 py-0.5 rounded-sf border border-sf-line bg-sf-canvas text-xs font-sf-mono font-semibold text-sf-ink uppercase">
              {order.status}
            </span>
          </div>

          {/* Stepper bar */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {timelineSteps.map((step, idx) => (
              <div key={step.label} className="flex flex-col items-center text-center space-y-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-sf-mono font-bold transition-all ${
                    step.done
                      ? "bg-sf-cta text-sf-cta-ink shadow-xs"
                      : step.current
                      ? "border-2 border-sf-cta bg-sf-surface text-sf-ink"
                      : "border border-sf-line bg-sf-canvas text-sf-muted"
                  }`}
                >
                  {step.done ? "✓" : idx + 1}
                </div>
                <span className="text-[10px] sm:text-xs font-sf-mono text-sf-ink leading-tight">
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Delivery Address & Contact Details */}
        <section className="p-5 rounded-sf border border-sf-line bg-sf-surface space-y-3 shadow-xs">
          <h3 className="font-sf-display text-sm font-bold text-sf-ink flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sf-accent" aria-hidden="true" />
            <span>Delivery Destination</span>
          </h3>

          <div className="p-3.5 rounded-sf bg-sf-canvas border border-sf-line text-xs font-sf-mono space-y-1 text-sf-ink">
            <p className="font-bold">
              {order.shipping_address_snapshot?.recipient_name} ·{" "}
              <span className="tabular-nums">{order.shipping_address_snapshot?.phone}</span>
            </p>
            <p className="text-sf-muted">
              Ward {order.shipping_address_snapshot?.ward},{" "}
              {order.shipping_address_snapshot?.municipality},{" "}
              {order.shipping_address_snapshot?.district},{" "}
              {order.shipping_address_snapshot?.province}
            </p>
            {order.shipping_address_snapshot?.street_landmark && (
              <p className="text-[11px] text-sf-muted pt-0.5">
                Landmark: {order.shipping_address_snapshot.street_landmark}
              </p>
            )}
          </div>
        </section>

        {/* Order Items Breakdown */}
        <section className="p-5 rounded-sf border border-sf-line bg-sf-surface space-y-4 shadow-xs">
          <h3 className="font-sf-display text-sm font-bold text-sf-ink flex items-center gap-2">
            <Package className="w-4 h-4 text-sf-accent" aria-hidden="true" />
            <span>Items Ordered</span>
          </h3>

          <div className="divide-y divide-sf-line">
            {order.items.map((it) => (
              <div
                key={it.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs font-sf-mono"
              >
                <div className="space-y-0.5 min-w-0 pr-3">
                  <p className="font-semibold text-sf-ink truncate">
                    {it.product_name_snapshot}
                  </p>
                  <p className="text-[11px] text-sf-muted">
                    {it.variant_label_snapshot} × {it.quantity}
                  </p>
                </div>

                <span className="font-bold text-sf-ink tabular-nums whitespace-nowrap">
                  {formatNpr(it.line_total_minor)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-sf-line text-xs font-sf-mono space-y-1.5 text-sf-muted">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-sf-ink tabular-nums">{formatNpr(order.subtotal_minor)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="text-sf-ink tabular-nums">
                {order.shipping_minor === 0 ? "FREE" : formatNpr(order.shipping_minor)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-sf-line/60 font-bold text-sm text-sf-ink">
              <span>Total Amount</span>
              <span className="tabular-nums">{formatNpr(order.total_minor)}</span>
            </div>
          </div>
        </section>

        {/* Payment Summary */}
        <section className="p-5 rounded-sf border border-sf-line bg-sf-surface flex items-center justify-between text-xs font-sf-mono shadow-xs">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-sf-accent" aria-hidden="true" />
            <div>
              <p className="font-bold text-sf-ink">
                {order.payment_method === "KHALTI" ? "Khalti Sandbox" : "Cash on Delivery"}
              </p>
              <p className="text-[11px] text-sf-muted">
                {order.payment_status === "PAID"
                  ? "✓ Paid in Full"
                  : `Due: ${formatNpr(order.total_minor)} to courier`}
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-sf border font-bold text-[11px] tabular-nums ${
              order.payment_status === "PAID"
                ? "bg-sf-canvas border-sf-line text-sf-ink"
                : "bg-sf-canvas border-sf-line text-sf-muted"
            }`}
          >
            {order.payment_status}
          </span>
        </section>

        {/* Back Link */}
        <div className="pt-2 text-center">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-sf bg-sf-cta text-sf-cta-ink font-sf-mono text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </main>

      <footer className="border-t border-sf-line bg-sf-surface py-6 px-4 text-center text-xs text-sf-muted font-sf-mono">
        <p>{store.name} · Powered by ShopCraft</p>
      </footer>
    </div>
  );
}
