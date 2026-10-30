"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Banknote,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Lock,
  Package,
  ShoppingBag,
  Truck,
} from "lucide-react";
import {
  CheckoutAddressPayload,
  CheckoutQuoteResponse,
  fetchCheckoutQuote,
  formatNpr,
  placeCheckoutOrder,
  StorePublicMetadata,
} from "@/lib/api";
import { useCart } from "./CartContext";

const NEPALI_PROVINCES = [
  "Bagmati",
  "Koshi",
  "Madhesh",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
];

const PROVINCE_DISTRICTS: Record<string, string[]> = {
  Bagmati: [
    "Kathmandu",
    "Lalitpur",
    "Bhaktapur",
    "Kavrepalanchok",
    "Makwanpur",
    "Chitwan",
    "Dhading",
    "Nuwakot",
    "Sindhupalchok",
  ],
  Gandaki: ["Kaski", "Tanahun", "Gorkha", "Syangja", "Nawalpur", "Lamjung"],
  Lumbini: ["Rupandehi", "Palpa", "Gulmi", "Kapilvastu", "Dang", "Banke"],
  Koshi: ["Morang", "Sunsari", "Jhapa", "Ilam", "Dhankuta"],
  Madhesh: ["Dhanusha", "Parsa", "Bara", "Rautahat", "Siraha", "Sarlahi"],
  Karnali: ["Surkhet", "Dailekh", "Jumla"],
  Sudurpashchim: ["Kailali", "Kanchanpur", "Dadeldhura"],
};

export interface CheckoutFormProps {
  store: StorePublicMetadata;
}

export function CheckoutForm({ store }: CheckoutFormProps) {
  const router = useRouter();
  const { items, itemCount, subtotalMinor, clear } = useCart();

  // Contact State
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");

  // Address State
  const [province, setProvince] = useState<string>("Bagmati");
  const [district, setDistrict] = useState<string>("Kathmandu");
  const [municipality, setMunicipality] = useState<string>("Kathmandu Metropolitan City");
  const [ward, setWard] = useState<string>("3");
  const [streetLandmark, setStreetLandmark] = useState<string>("");

  // Payment & Quote State
  const [paymentMethod, setPaymentMethod] = useState<"KHALTI" | "COD">("KHALTI");
  const [quote, setQuote] = useState<CheckoutQuoteResponse | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if cart contains prepaid subscription
  const hasPrepaidSubscription = items.some(
    (it) => it.purchaseType === "subscription" && it.sellingPlan?.isPrepaid
  );

  // Synchronize server-authoritative checkout quote
  useEffect(() => {
    if (items.length === 0) return;

    const payloadItems = items.map((it) => ({
      variant_id: it.variantId,
      quantity: it.quantity,
      purchase_type: it.purchaseType,
      selling_plan_id: it.sellingPlan?.id ?? null,
    }));

    fetchCheckoutQuote(store.slug, {
      items: payloadItems,
      district,
    })
      .then((res) => {
        setQuote(res);
      })
      .catch(() => {
        // Fallback to client estimated totals if network hiccup
      });
  }, [items, district, store.slug]);

  // If cart contains prepaid plan, automatically switch off COD
  useEffect(() => {
    if (hasPrepaidSubscription && paymentMethod === "COD") {
      Promise.resolve().then(() => setPaymentMethod("KHALTI"));
    }
  }, [hasPrepaidSubscription, paymentMethod]);

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-sf-surface border border-sf-line mx-auto flex items-center justify-center text-sf-muted">
          <ShoppingBag className="w-8 h-8" aria-hidden="true" />
        </div>
        <h2 className="font-sf-display text-lg font-bold text-sf-ink">
          Your Cart is Empty
        </h2>
        <p className="text-xs text-sf-muted max-w-sm mx-auto leading-relaxed">
          Looks like you haven&apos;t added any items to your cart yet. Explore our specialty
          catalog to place an order.
        </p>
        <div className="pt-2">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center px-4 py-2.5 rounded-sf bg-sf-cta text-sf-cta-ink font-sf-mono text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const computedSubtotal = quote ? quote.subtotal_minor : subtotalMinor;
  const computedShipping = quote
    ? quote.shipping_minor
    : district.toLowerCase() === "kathmandu" ||
      district.toLowerCase() === "lalitpur" ||
      district.toLowerCase() === "bhaktapur"
    ? store.inside_valley_shipping_minor
    : store.outside_valley_shipping_minor;
  const computedTotal = quote ? quote.total_minor : computedSubtotal + computedShipping;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const cleanPhone = phone.trim();
    if (!/^9[78]\d{8}$/.test(cleanPhone)) {
      setErrorMessage("Enter a valid 10-digit Nepali mobile number starting with 98 or 97.");
      return;
    }

    if (!recipientName.trim()) {
      setErrorMessage("Recipient full name is required.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("A valid email address is required for order receipt.");
      return;
    }

    if (!streetLandmark.trim()) {
      setErrorMessage("Nearest Chowk / Landmark address is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const addressPayload: CheckoutAddressPayload = {
        recipient_name: recipientName.trim(),
        phone: cleanPhone,
        province,
        district,
        municipality: municipality.trim(),
        ward: ward.trim() || "1",
        street_landmark: streetLandmark.trim(),
      };

      const payloadItems = items.map((it) => ({
        variant_id: it.variantId,
        quantity: it.quantity,
        purchase_type: it.purchaseType,
        selling_plan_id: it.sellingPlan?.id ?? null,
      }));

      const response = await placeCheckoutOrder(store.slug, {
        items: payloadItems,
        shipping_address: addressPayload,
        customer_email: email.trim().toLowerCase(),
        payment_method: paymentMethod,
      });

      // Clear the tenant's cart upon successful order creation
      clear();

      if (paymentMethod === "COD") {
        router.push(`/s/${encodeURIComponent(store.slug)}/orders/${response.order_id}`);
      } else if (response.payment_url) {
        if (response.is_sandbox || response.payment_url.startsWith("/")) {
          router.push(response.payment_url);
        } else {
          window.location.href = response.payment_url;
        }
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : "Failed to place order. Please try again.";
      setErrorMessage(msg);
    }
  };

  return (
    <form onSubmit={handlePlaceOrder} className="space-y-6 pb-24">
      {/* 1. Collapsible Order Summary Banner (DESIGN.md §5) */}
      <div className="rounded-sf border border-sf-line bg-sf-surface overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setIsSummaryOpen((prev) => !prev)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-sf-canvas/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-sf-accent" aria-hidden="true" />
            <span className="font-sf-display text-sm font-semibold text-sf-ink">
              {itemCount} {itemCount === 1 ? "item" : "items"} in order
            </span>
            <span className="text-xs font-sf-mono text-sf-muted">▾</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-sf-mono text-sm font-bold text-sf-ink tabular-nums">
              {formatNpr(computedTotal)}
            </span>
            {isSummaryOpen ? (
              <ChevronUp className="w-4 h-4 text-sf-muted" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 text-sf-muted" aria-hidden="true" />
            )}
          </div>
        </button>

        {isSummaryOpen && (
          <div className="p-4 border-t border-sf-line bg-sf-canvas/40 space-y-3 animate-in fade-in duration-200">
            <div className="divide-y divide-sf-line/60">
              {items.map((it) => (
                <div
                  key={`${it.variantId}-${it.purchaseType}`}
                  className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs font-sf-mono"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <p className="font-medium text-sf-ink truncate">{it.productName}</p>
                    <p className="text-[11px] text-sf-muted">
                      {it.variantLabel} × {it.quantity}
                      {it.purchaseType === "subscription" && " (Subscription)"}
                    </p>
                  </div>
                  <span className="font-semibold text-sf-ink tabular-nums whitespace-nowrap">
                    {formatNpr(it.unitPriceMinor * it.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-sf-line text-xs font-sf-mono space-y-1 text-sf-muted">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-sf-ink tabular-nums">{formatNpr(computedSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery ({district})</span>
                <span className="text-sf-ink tabular-nums">
                  {computedShipping === 0 ? "FREE" : formatNpr(computedShipping)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-sf border border-sf-line bg-sf-surface text-sf-ink flex items-start gap-2.5 text-xs font-sf-mono">
          <AlertCircle className="w-4 h-4 text-sf-cta shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Customer Contact (Phone first, email) */}
      <section className="p-5 rounded-sf border border-sf-line bg-sf-surface space-y-4 shadow-xs">
        <h3 className="font-sf-display text-sm sm:text-base font-bold text-sf-ink flex items-center gap-2">
          <span>1. Contact Details</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label
              htmlFor="checkout-phone"
              className="text-xs font-sf-mono font-medium text-sf-ink flex items-center justify-between"
            >
              <span>Nepali Mobile Number</span>
              <span className="text-[11px] text-sf-muted">+977</span>
            </label>
            <input
              id="checkout-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="98XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-mono text-xs focus:outline-none focus:ring-1 focus:ring-sf-ink/40"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="checkout-email"
              className="text-xs font-sf-mono font-medium text-sf-ink"
            >
              Email Address (Receipt &amp; Tracking)
            </label>
            <input
              id="checkout-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-mono text-xs focus:outline-none focus:ring-1 focus:ring-sf-ink/40"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="checkout-recipient"
              className="text-xs font-sf-mono font-medium text-sf-ink"
            >
              Recipient Full Name
            </label>
            <input
              id="checkout-recipient"
              type="text"
              autoComplete="name"
              required
              placeholder="e.g. Nisha Shrestha"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-mono text-xs focus:outline-none focus:ring-1 focus:ring-sf-ink/40"
            />
          </div>
        </div>
      </section>

      {/* 3. Delivery Address (Cascading Nepal Selects) */}
      <section className="p-5 rounded-sf border border-sf-line bg-sf-surface space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-sf-display text-sm sm:text-base font-bold text-sf-ink">
            2. Delivery Address
          </h3>
          <span className="text-[11px] font-sf-mono px-2 py-0.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-muted">
            {computedShipping === 0
              ? "Free Delivery Qualified"
              : `Delivery: ${formatNpr(computedShipping)}`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {/* Province */}
          <div className="space-y-1.5">
            <label
              htmlFor="checkout-province"
              className="text-xs font-sf-mono font-medium text-sf-ink"
            >
              Province
            </label>
            <select
              id="checkout-province"
              value={province}
              onChange={(e) => {
                const nextProv = e.target.value;
                setProvince(nextProv);
                const availableDistricts = PROVINCE_DISTRICTS[nextProv] || [];
                if (availableDistricts.length > 0) {
                  setDistrict(availableDistricts[0]);
                }
              }}
              className="w-full px-3 py-2.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-mono text-xs focus:outline-none focus:ring-1 focus:ring-sf-ink/40"
            >
              {NEPALI_PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div className="space-y-1.5">
            <label
              htmlFor="checkout-district"
              className="text-xs font-sf-mono font-medium text-sf-ink"
            >
              District
            </label>
            <select
              id="checkout-district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-3 py-2.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-mono text-xs focus:outline-none focus:ring-1 focus:ring-sf-ink/40"
            >
              {(PROVINCE_DISTRICTS[province] || [district]).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Ward */}
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label
              htmlFor="checkout-ward"
              className="text-xs font-sf-mono font-medium text-sf-ink"
            >
              Ward No.
            </label>
            <input
              id="checkout-ward"
              type="number"
              min={1}
              max={35}
              required
              placeholder="e.g. 3"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="w-full px-3 py-2.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-mono text-xs focus:outline-none focus:ring-1 focus:ring-sf-ink/40 tabular-nums"
            />
          </div>

          {/* Municipality */}
          <div className="space-y-1.5 col-span-2">
            <label
              htmlFor="checkout-municipality"
              className="text-xs font-sf-mono font-medium text-sf-ink"
            >
              Municipality / Palika
            </label>
            <input
              id="checkout-municipality"
              type="text"
              required
              placeholder="e.g. Kathmandu Metropolitan City"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-mono text-xs focus:outline-none focus:ring-1 focus:ring-sf-ink/40"
            />
          </div>

          {/* Street / Landmark */}
          <div className="space-y-1.5 col-span-2 sm:col-span-3">
            <label
              htmlFor="checkout-landmark"
              className="text-xs font-sf-mono font-medium text-sf-ink"
            >
              Nearest Chowk / Landmark / Tole
            </label>
            <input
              id="checkout-landmark"
              type="text"
              required
              placeholder="e.g. Near Lazimpat Chowk, Opposite Standard Chartered"
              value={streetLandmark}
              onChange={(e) => setStreetLandmark(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-mono text-xs focus:outline-none focus:ring-1 focus:ring-sf-ink/40"
            />
          </div>
        </div>
      </section>

      {/* 4. Payment Selection (72px tactile cards, DESIGN.md §5) */}
      <section className="p-5 rounded-sf border border-sf-line bg-sf-surface space-y-4 shadow-xs">
        <h3 className="font-sf-display text-sm sm:text-base font-bold text-sf-ink">
          3. Payment Method
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Khalti Card */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              setPaymentMethod("KHALTI");
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate(10);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setPaymentMethod("KHALTI");
              }
            }}
            className={`h-[76px] rounded-sf border p-3.5 flex items-center justify-between cursor-pointer transition-all ${
              paymentMethod === "KHALTI"
                ? "border-sf-cta bg-sf-canvas/80 ring-2 ring-sf-cta/20 shadow-xs"
                : "border-sf-line bg-sf-canvas hover:border-sf-ink/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sf border border-sf-line bg-sf-surface flex items-center justify-center text-sf-accent shrink-0">
                <CreditCard className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-sf-display text-xs sm:text-sm font-bold text-sf-ink flex items-center gap-1.5">
                  <span>Khalti Sandbox</span>
                  <span className="text-[10px] font-sf-mono px-1.5 py-0.2 rounded-sf bg-sf-surface border border-sf-line text-sf-muted">
                    Instant
                  </span>
                </p>
                <p className="text-[11px] font-sf-mono text-sf-muted">
                  Digital Wallet · eBanking · Mobile
                </p>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                paymentMethod === "KHALTI"
                  ? "border-sf-cta bg-sf-cta text-sf-cta-ink"
                  : "border-sf-line bg-sf-surface"
              }`}
            >
              {paymentMethod === "KHALTI" && <Check className="w-3 h-3" />}
            </div>
          </div>

          {/* COD Card */}
          <div
            role="button"
            tabIndex={hasPrepaidSubscription ? -1 : 0}
            onClick={() => {
              if (hasPrepaidSubscription) return;
              setPaymentMethod("COD");
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate(10);
              }
            }}
            onKeyDown={(e) => {
              if (hasPrepaidSubscription) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setPaymentMethod("COD");
              }
            }}
            className={`h-[76px] rounded-sf border p-3.5 flex items-center justify-between transition-all ${
              hasPrepaidSubscription
                ? "border-sf-line/60 bg-sf-canvas/40 opacity-60 cursor-not-allowed"
                : paymentMethod === "COD"
                ? "border-sf-cta bg-sf-canvas/80 ring-2 ring-sf-cta/20 shadow-xs cursor-pointer"
                : "border-sf-line bg-sf-canvas hover:border-sf-ink/30 cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sf border border-sf-line bg-sf-surface flex items-center justify-center text-sf-muted shrink-0">
                <Banknote className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-sf-display text-xs sm:text-sm font-bold text-sf-ink flex items-center gap-1.5">
                  <span>Cash on Delivery</span>
                  {hasPrepaidSubscription && (
                    <span className="text-[9px] font-sf-mono px-1.5 py-0.2 rounded-sf bg-sf-surface border border-sf-line text-sf-cta">
                      Unavailable
                    </span>
                  )}
                </p>
                <p className="text-[11px] font-sf-mono text-sf-muted">
                  {hasPrepaidSubscription
                    ? "Prepaid plans need Khalti"
                    : `Pay ${formatNpr(computedTotal)} cash to rider`}
                </p>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                paymentMethod === "COD"
                  ? "border-sf-cta bg-sf-cta text-sf-cta-ink"
                  : "border-sf-line bg-sf-surface"
              }`}
            >
              {paymentMethod === "COD" && <Check className="w-3 h-3" />}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Sticky Bottom Action Bar (Safe-Area Aware, DESIGN.md §5) */}
      <div className="fixed inset-x-0 bottom-0 z-40 p-4 border-t border-sf-line bg-sf-surface/95 backdrop-blur-xs pb-safe shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] font-sf-mono text-sf-muted">Total Amount</span>
            <span className="font-sf-mono text-base sm:text-lg font-bold text-sf-ink tabular-nums">
              {formatNpr(computedTotal)}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 max-w-xs h-12 rounded-sf bg-sf-cta text-sf-cta-ink font-sf-mono text-xs sm:text-sm font-bold tracking-wide hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span>Processing...</span>
            ) : paymentMethod === "KHALTI" ? (
              <>
                <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Pay with Khalti · {formatNpr(computedTotal)}</span>
              </>
            ) : (
              <>
                <Truck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Place Order · {formatNpr(computedTotal)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
