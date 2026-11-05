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
  MapPin,
  Package,
  Plus,
  ShoppingBag,
  Tag,
  Truck,
  X,
} from "lucide-react";
import {
  CheckoutAddressPayload,
  CheckoutQuoteResponse,
  createDeliveryAddress,
  DeliveryAddressItem,
  DeliveryAddressPayload,
  fetchCheckoutQuote,
  fetchSession,
  formatNpr,
  listDeliveryAddresses,
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

  // Authentication & Saved Addresses State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [savedAddresses, setSavedAddresses] = useState<DeliveryAddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isEnteringNewAddress, setIsEnteringNewAddress] = useState<boolean>(false);
  const [saveAddressToAccount, setSaveAddressToAccount] = useState<boolean>(true);

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

  // Payment, Promo Code & Quote State
  const [paymentMethod, setPaymentMethod] = useState<"KHALTI" | "COD">("KHALTI");
  const [promoInput, setPromoInput] = useState<string>("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState<boolean>(false);
  const [quote, setQuote] = useState<CheckoutQuoteResponse | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if cart contains prepaid subscription or merchant disabled COD
  const hasPrepaidSubscription = items.some(
    (it) => it.purchaseType === "subscription" && it.sellingPlan?.isPrepaid
  );
  const isStoreCodDisabled = store.cod_enabled === false;
  const isCodUnavailable = hasPrepaidSubscription || isStoreCodDisabled;

  // 1. Fetch Session & Saved Addresses on Mount
  useEffect(() => {
    let mounted = true;

    async function loadAccountData() {
      try {
        const session = await fetchSession();
        if (!mounted) return;

        if (session.authenticated && session.user) {
          setIsAuthenticated(true);
          if (session.user.email) {
            setEmail((prev) => prev || session.user?.email || "");
          }
          if (session.user.full_name) {
            setRecipientName((prev) => prev || session.user?.full_name || "");
          }

          const addresses = await listDeliveryAddresses();
          if (!mounted) return;

          if (addresses && addresses.length > 0) {
            setSavedAddresses(addresses);
            const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
            setSelectedAddressId(defaultAddr.id);
            setRecipientName(defaultAddr.recipient_name);
            setPhone(defaultAddr.phone);
            setProvince(defaultAddr.province);
            setDistrict(defaultAddr.district);
            setMunicipality(defaultAddr.municipality);
            setWard(String(defaultAddr.ward));
            setStreetLandmark(defaultAddr.street_landmark);
          }
        }
      } catch {
        // Guest shopper - proceed with manual form
      }
    }

    loadAccountData();

    return () => {
      mounted = false;
    };
  }, []);

  // Handle switching among saved addresses
  const handleSelectSavedAddress = (addr: DeliveryAddressItem) => {
    setSelectedAddressId(addr.id);
    setIsEnteringNewAddress(false);
    setRecipientName(addr.recipient_name);
    setPhone(addr.phone);
    setProvince(addr.province);
    setDistrict(addr.district);
    setMunicipality(addr.municipality);
    setWard(String(addr.ward));
    setStreetLandmark(addr.street_landmark);
  };

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
      discount_code: appliedPromoCode || undefined,
    })
      .then((res) => {
        setQuote(res);
      })
      .catch(() => {
        // Fallback to client estimated totals if network hiccup
      });
  }, [items, district, store.slug, appliedPromoCode]);

  // If cart contains prepaid plan or store disabled COD, automatically switch off COD
  useEffect(() => {
    if (isCodUnavailable && paymentMethod === "COD") {
      Promise.resolve().then(() => setPaymentMethod("KHALTI"));
    }
  }, [isCodUnavailable, paymentMethod]);

  const handleApplyPromo = async () => {
    const clean = promoInput.trim().toUpperCase();
    if (!clean || items.length === 0) return;

    setIsApplyingPromo(true);
    setPromoError(null);
    try {
      const res = await fetchCheckoutQuote(store.slug, {
        items: items.map((it) => ({
          variant_id: it.variantId,
          quantity: it.quantity,
          purchase_type: it.purchaseType,
          selling_plan_id: it.sellingPlan?.id ?? null,
        })),
        district,
        discount_code: clean,
      });
      setQuote(res);
      setAppliedPromoCode(res.discount_code || clean);
      setPromoInput(res.discount_code || clean);
    } catch (err: unknown) {
      setAppliedPromoCode("");
      setPromoError(
        err instanceof Error ? err.message : "Invalid or ineligible promo code."
      );
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromoCode("");
    setPromoInput("");
    setPromoError(null);
  };

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
  const computedDiscount = quote ? quote.discount_minor : 0;
  const computedTotal = quote
    ? quote.total_minor
    : Math.max(0, computedSubtotal - computedDiscount) + computedShipping;

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

      // If user typed a new address while authenticated and checked save, persist it
      if (isAuthenticated && (isEnteringNewAddress || savedAddresses.length === 0) && saveAddressToAccount) {
        const newAddressPayload: DeliveryAddressPayload = {
          label: "Home",
          recipient_name: recipientName.trim(),
          phone: cleanPhone,
          province,
          district,
          municipality: municipality.trim(),
          ward: Number(ward) || 1,
          street_landmark: streetLandmark.trim(),
          is_default: savedAddresses.length === 0,
        };
        createDeliveryAddress(newAddressPayload).catch(() => {});
      }

      const returnUrl = typeof window !== "undefined"
        ? `${window.location.origin}/s/${encodeURIComponent(store.slug)}/checkout/khalti-return/`
        : undefined;

      const response = await placeCheckoutOrder(store.slug, {
        items: payloadItems,
        shipping_address: addressPayload,
        customer_email: email.trim().toLowerCase(),
        payment_method: paymentMethod,
        discount_code: appliedPromoCode || undefined,
        return_url: returnUrl,
      });

      // Clear the tenant's cart upon successful order creation
      clear();

      if (paymentMethod === "COD") {
        router.push(`/s/${encodeURIComponent(store.slug)}/orders/${response.token || response.order_id}`);
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

  const activeSavedAddress = savedAddresses.find((a) => a.id === selectedAddressId);

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
              {computedDiscount > 0 && (
                <div className="flex justify-between text-sf-accent font-semibold">
                  <span>Promo ({appliedPromoCode})</span>
                  <span className="tabular-nums">-{formatNpr(computedDiscount)}</span>
                </div>
              )}
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

      {/* 1B. Promo Code Card */}
      <div className="p-4 rounded-sf border border-sf-line bg-sf-surface space-y-2.5 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Tag
              className="w-3.5 h-3.5 text-sf-muted absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Have a promo code? (e.g. DASHAIN15)"
              value={promoInput}
              disabled={Boolean(appliedPromoCode)}
              onChange={(e) => {
                setPromoInput(e.target.value.toUpperCase());
                if (promoError) setPromoError(null);
              }}
              className="w-full h-10 pl-8 pr-3 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-mono text-xs uppercase focus:outline-none focus:ring-1 focus:ring-sf-ink/40 disabled:opacity-70"
            />
          </div>

          {appliedPromoCode ? (
            <button
              type="button"
              onClick={handleRemovePromo}
              className="h-10 px-3.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-mono text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-sf-surface transition-colors cursor-pointer shrink-0"
            >
              <span>{appliedPromoCode} Applied</span>
              <X className="w-3.5 h-3.5 text-sf-muted" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!promoInput.trim() || isApplyingPromo}
              onClick={handleApplyPromo}
              className="h-10 px-4 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-mono text-xs font-semibold hover:border-sf-ink/40 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isApplyingPromo ? "Checking..." : "Apply Code"}
            </button>
          )}
        </div>

        {appliedPromoCode && computedDiscount > 0 && (
          <p className="text-[11px] font-sf-mono text-sf-accent">
            Saved {formatNpr(computedDiscount)} with code {appliedPromoCode}.
          </p>
        )}
        {promoError && (
          <p className="text-[11px] font-sf-mono text-sf-cta">{promoError}</p>
        )}
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-sf border border-sf-line bg-sf-surface text-sf-ink flex items-start gap-2.5 text-xs font-sf-mono">
          <AlertCircle className="w-4 h-4 text-sf-cta shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Customer Contact */}
      <section className="p-5 rounded-sf border border-sf-line bg-sf-surface space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-sf-display text-sm sm:text-base font-bold text-sf-ink">
            1. Contact Details
          </h3>
          {!isAuthenticated && (
            <Link
              href={`/login?next=${encodeURIComponent(`/s/${store.slug}/checkout`)}`}
              className="text-[11px] font-sf-mono text-sf-muted hover:text-sf-ink underline"
            >
              Sign in for saved address →
            </Link>
          )}
        </div>

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
              className="text-xs font-sf-body font-medium text-sf-ink"
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
              className="w-full px-3.5 py-2.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-body text-xs focus:outline-none focus:ring-1 focus:ring-sf-ink/40"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="checkout-recipient"
              className="text-xs font-sf-body font-medium text-sf-ink"
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
              className="w-full px-3.5 py-2.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-body text-xs focus:outline-none focus:ring-1 focus:ring-sf-ink/40"
            />
          </div>
        </div>
      </section>

      {/* 3. Delivery Address (Saved Address Card OR Cascading Selects) */}
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

        {/* CASE A: Saved Address Picker for Logged-In Shoppers */}
        {savedAddresses.length > 0 && !isEnteringNewAddress ? (
          <div className="space-y-3">
            {/* Active Selected Address Card */}
            <div className="p-4 rounded-sf border border-sf-line bg-sf-canvas/60 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-sf font-sf-mono font-medium border border-sf-line bg-sf-surface text-sf-ink">
                    {activeSavedAddress?.label || "Saved Address"}
                  </span>
                  {activeSavedAddress?.is_default && (
                    <span className="text-[10px] px-2 py-0.5 rounded-sf font-sf-mono font-semibold bg-sf-surface border border-sf-line text-sf-accent">
                      Default
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsEnteringNewAddress(true)}
                  className="text-xs font-sf-mono text-sf-muted hover:text-sf-ink underline cursor-pointer"
                >
                  + Use new address
                </button>
              </div>

              <div className="text-xs font-sf-mono space-y-0.5 text-sf-ink">
                <p className="font-semibold">{recipientName}</p>
                <p className="text-[11px] text-sf-muted">+977 {phone}</p>
                <p className="text-[11px] pt-1">
                  Ward {ward}, {streetLandmark}
                </p>
                <p className="text-[11px] text-sf-muted">
                  {municipality}, {district}, {province} Province
                </p>
              </div>
            </div>

            {/* Quick Switch Among Multiple Saved Addresses */}
            {savedAddresses.length > 1 && (
              <div className="pt-1">
                <p className="text-[11px] font-sf-mono text-sf-muted mb-2">Or select other saved location:</p>
                <div className="flex flex-wrap gap-2">
                  {savedAddresses.map((addr) => {
                    const isSelected = addr.id === selectedAddressId;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`px-3 py-1.5 rounded-sf text-xs font-sf-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-sf-surface border border-sf-cta text-sf-ink shadow-xs"
                            : "bg-sf-canvas border border-sf-line text-sf-muted hover:text-sf-ink"
                        }`}
                      >
                        <MapPin className="w-3 h-3 text-sf-accent shrink-0" />
                        <span>{addr.label || `${addr.district} (Ward ${addr.ward})`}</span>
                        {isSelected && <Check className="w-3 h-3 text-sf-accent ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* CASE B: Cascading Nepal Form (New Address or Guest) */
          <div className="space-y-4">
            {savedAddresses.length > 0 && (
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-sf-mono text-sf-muted">Entering a custom address:</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsEnteringNewAddress(false);
                    const defaultAddr = savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0];
                    handleSelectSavedAddress(defaultAddr);
                  }}
                  className="text-xs font-sf-mono text-sf-muted hover:text-sf-ink underline cursor-pointer"
                >
                  ← Back to saved address
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {/* Province */}
              <div className="space-y-1.5">
                <label
                  htmlFor="checkout-province"
                  className="text-xs font-sf-body font-medium text-sf-ink"
                >
                  Province
                </label>
                <div className="relative">
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
                    className="w-full h-10 pl-3 pr-8 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-body text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-sf-cta/30 focus:border-sf-cta transition-all cursor-pointer"
                  >
                    {NEPALI_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-sf-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* District */}
              <div className="space-y-1.5">
                <label
                  htmlFor="checkout-district"
                  className="text-xs font-sf-body font-medium text-sf-ink"
                >
                  District
                </label>
                <div className="relative">
                  <select
                    id="checkout-district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-10 pl-3 pr-8 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-body text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-sf-cta/30 focus:border-sf-cta transition-all cursor-pointer"
                  >
                    {(PROVINCE_DISTRICTS[province] || [district]).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-sf-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Ward */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label
                  htmlFor="checkout-ward"
                  className="text-xs font-sf-body font-medium text-sf-ink"
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
                  className="w-full h-10 px-3.5 py-2.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-mono text-xs focus:outline-none focus:ring-1 focus:ring-sf-ink/40 tabular-nums"
                />
              </div>

              {/* Municipality */}
              <div className="space-y-1.5 col-span-2">
                <label
                  htmlFor="checkout-municipality"
                  className="text-xs font-sf-body font-medium text-sf-ink"
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
                  className="w-full h-10 px-3.5 py-2.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-body text-xs focus:outline-none focus:ring-1 focus:ring-sf-ink/40"
                />
              </div>

              {/* Street / Landmark */}
              <div className="space-y-1.5 col-span-2 sm:col-span-3">
                <label
                  htmlFor="checkout-landmark"
                  className="text-xs font-sf-body font-medium text-sf-ink"
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
                  className="w-full h-10 px-3.5 py-2.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-body text-xs focus:outline-none focus:ring-1 focus:ring-sf-ink/40"
                />
              </div>
            </div>

            {isAuthenticated && (
              <label className="flex items-center gap-2 pt-1 text-xs font-sf-body text-sf-ink cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveAddressToAccount}
                  onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                  className="rounded border-sf-line text-sf-accent focus:ring-0"
                />
                <span>Save this address to my account for 1-tap checkout</span>
              </label>
            )}
          </div>
        )}
      </section>

      {/* 4. Payment Selection (76px tactile cards, DESIGN.md §5) */}
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
            tabIndex={isCodUnavailable ? -1 : 0}
            onClick={() => {
              if (isCodUnavailable) return;
              setPaymentMethod("COD");
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate(10);
              }
            }}
            onKeyDown={(e) => {
              if (isCodUnavailable) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setPaymentMethod("COD");
              }
            }}
            className={`h-[76px] rounded-sf border p-3.5 flex items-center justify-between transition-all ${
              isCodUnavailable
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
                  {isCodUnavailable && (
                    <span className="text-[9px] font-sf-mono px-1.5 py-0.2 rounded-sf bg-sf-surface border border-sf-line text-sf-cta">
                      Unavailable
                    </span>
                  )}
                </p>
                <p className="text-[11px] font-sf-mono text-sf-muted">
                  {hasPrepaidSubscription
                    ? "Prepaid plans need Khalti"
                    : isStoreCodDisabled
                    ? "Digital Khalti payment only"
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

export function CheckoutSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-14 rounded-sf border border-sf-line bg-sf-surface" />
      <div className="h-44 rounded-sf border border-sf-line bg-sf-surface" />
      <div className="h-64 rounded-sf border border-sf-line bg-sf-surface" />
      <div className="h-28 rounded-sf border border-sf-line bg-sf-surface" />
    </div>
  );
}
