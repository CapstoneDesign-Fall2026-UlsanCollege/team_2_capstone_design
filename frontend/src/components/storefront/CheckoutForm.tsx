"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Banknote,
  Check,
  ChevronDown,
  CreditCard,
  Lock,
  MapPin,
  Package,
  ShoppingBag,
  Tag,
  Truck,
  User,
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
  fetchStorefrontAccount,
  formatNpr,
  listDeliveryAddresses,
  placeCheckoutOrder,
  StorePublicMetadata,
} from "@/lib/api";
import { useCart } from "./CartContext";
import { useAccount } from "./AccountContext";

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
  const { openAccount } = useAccount();

  // Authentication & Saved Addresses State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [savedAddresses, setSavedAddresses] = useState<DeliveryAddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isEnteringNewAddress, setIsEnteringNewAddress] = useState<boolean>(false);
  const [saveAddressToAccount, setSaveAddressToAccount] = useState<boolean>(true);

  // 1. Phone number FIRST, then name, then email
  const [phone, setPhone] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  // 2. Address State
  const [province, setProvince] = useState<string>("Bagmati");
  const [district, setDistrict] = useState<string>("Kathmandu");
  const [municipality, setMunicipality] = useState<string>("Kathmandu Metropolitan City");
  const [ward, setWard] = useState<string>("3");
  const [streetLandmark, setStreetLandmark] = useState<string>("");

  // 3. Payment, Promo Code & Quote State
  const [paymentMethod, setPaymentMethod] = useState<"KHALTI" | "COD">("KHALTI");
  const [promoInput, setPromoInput] = useState<string>("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState<boolean>(false);
  const [isPromoExpanded, setIsPromoExpanded] = useState<boolean>(false);
  const [quote, setQuote] = useState<CheckoutQuoteResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if merchant disabled COD
  const isStoreCodDisabled = store.cod_enabled === false;
  const isCodUnavailable = isStoreCodDisabled;

  // 1. Fetch Session & Saved Addresses on Mount & on Auth Change
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

          try {
            const account = await fetchStorefrontAccount(store.slug);
            if (!mounted) return;
            if (account.customer?.phone) {
              setPhone((prev) => prev || account.customer.phone || "");
            }
            if (account.customer?.full_name) {
              setRecipientName((prev) => prev || account.customer.full_name || "");
            }
          } catch {
            // Customer profile not created yet or not accessible
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
        } else {
          setIsAuthenticated(false);
          setSavedAddresses([]);
          setSelectedAddressId(null);
        }
      } catch {
        // Guest shopper - proceed with manual form
      }
    }

    loadAccountData();

    const handleAuthChange = () => {
      loadAccountData();
    };
    window.addEventListener("shopcraft:auth-change", handleAuthChange);

    return () => {
      mounted = false;
      window.removeEventListener("shopcraft:auth-change", handleAuthChange);
    };
  }, [store.slug]);

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
        // Fallback to client estimated totals
      });
  }, [items, district, store.slug, appliedPromoCode]);

  // If store disabled COD, automatically switch to KHALTI
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
        err instanceof Error ? err.message : "Invalid promo code."
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
        <div className="w-16 h-16 rounded-full bg-[var(--surface)] border border-[var(--border)] mx-auto flex items-center justify-center text-[var(--ink-2)]">
          <ShoppingBag className="w-8 h-8" aria-hidden="true" />
        </div>
        <h2 className="font-serif text-xl font-semibold text-[var(--ink)]">
          Your Bag is Empty
        </h2>
        <p className="text-xs text-[var(--ink-2)] max-w-sm mx-auto leading-relaxed">
          Looks like you haven&apos;t added any items to your bag yet. Explore our catalog to place an order.
        </p>
        <div className="pt-2">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center min-h-[44px] px-5 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--surface)] hover:bg-[var(--primary-hover)] text-xs font-semibold transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const isValley =
    district.toLowerCase() === "kathmandu" ||
    district.toLowerCase() === "lalitpur" ||
    district.toLowerCase() === "bhaktapur";

  const computedSubtotal = quote ? quote.subtotal_minor : subtotalMinor;
  const computedShipping = quote
    ? quote.shipping_minor
    : isValley
    ? store.inside_valley_shipping_minor
    : store.outside_valley_shipping_minor;
  const computedDiscount = quote ? quote.discount_minor : 0;
  const computedTotal = quote
    ? quote.total_minor
    : Math.max(0, computedSubtotal - computedDiscount) + computedShipping;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validation - Nepali Phone Number FIRST
    const cleanPhone = phone.trim();
    if (!/^9[78]\d{8}$/.test(cleanPhone)) {
      setErrorMessage("Enter a valid 10-digit Nepali mobile number starting with 98 or 97.");
      return;
    }

    if (!recipientName.trim()) {
      setErrorMessage("Full name is required.");
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
        const targetId = response.token || response.order_id;
        const tokenQuery = response.token ? `?token=${encodeURIComponent(response.token)}` : "";
        router.push(`/s/${encodeURIComponent(store.slug)}/orders/${targetId}${tokenQuery}`);
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
    <form onSubmit={handlePlaceOrder} className="space-y-6 pb-28">
      {errorMessage && (
        <div className="p-4 rounded-xl border border-[var(--error-bd)] bg-[var(--error-bg)] text-[var(--error-fg)] flex items-start gap-2.5 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Optional Soft Guest Sign-In Banner */}
      {!isAuthenticated && (
        <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <User className="w-4 h-4 text-[var(--ink-2)] shrink-0" />
            <span className="text-[var(--ink-2)] truncate">
              Have an account? <span className="text-[var(--ink)] font-medium">Sign in for faster checkout</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => openAccount(email.trim() || undefined)}
            className="text-xs font-semibold text-[var(--ink)] underline hover:text-[var(--ink-2)] cursor-pointer shrink-0 min-h-[44px] inline-flex items-center"
          >
            Sign in
          </button>
        </div>
      )}

      {/* 1. CONTACT DETAILS (Phone number FIRST as required) */}
      <section className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-base sm:text-lg font-semibold text-[var(--ink)]">
            1. Contact Details
          </h2>
          {!isAuthenticated && (
            <button
              type="button"
              onClick={() => openAccount(email.trim() || undefined)}
              className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)] underline min-h-[44px] inline-flex items-center cursor-pointer"
            >
              Sign in for saved address
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Phone number FIRST */}
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="checkout-phone"
              className="text-xs font-medium text-[var(--ink)] flex items-center justify-between"
            >
              <span>Nepali Mobile Number *</span>
              <span className="text-[11px] text-[var(--ink-2)]">+977 (10 digits)</span>
            </label>
            <input
              id="checkout-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="98XXXXXXXX or 97XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 px-3.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--ink)] tabular-nums"
            />
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="checkout-recipient"
              className="text-xs font-medium text-[var(--ink)]"
            >
              Full Name *
            </label>
            <input
              id="checkout-recipient"
              type="text"
              autoComplete="name"
              required
              placeholder="e.g. Nisha Shrestha"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--ink)]"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label
              htmlFor="checkout-email"
              className="text-xs font-medium text-[var(--ink)]"
            >
              Email Address (Receipt &amp; Tracking) *
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
              className="w-full h-11 px-3.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--ink)]"
            />
          </div>
        </div>
      </section>

      {/* 2. DELIVERY ADDRESS */}
      <section className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-base sm:text-lg font-semibold text-[var(--ink)]">
            2. Delivery Address
          </h2>
          <span className="text-xs px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--canvas)] text-[var(--ink-2)] tabular-nums">
            {computedShipping === 0
              ? "Free Delivery"
              : `Delivery: ${formatNpr(computedShipping)}`}
          </span>
        </div>

        {/* Saved Address Picker for Logged-In Shoppers */}
        {savedAddresses.length > 0 && !isEnteringNewAddress ? (
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--canvas)] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]">
                  {activeSavedAddress?.label || "Saved Address"}
                </span>

                <button
                  type="button"
                  onClick={() => setIsEnteringNewAddress(true)}
                  className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)] underline min-h-[44px] inline-flex items-center cursor-pointer"
                >
                  + Use new address
                </button>
              </div>

              <div className="text-xs space-y-0.5 text-[var(--ink)]">
                <p className="font-semibold">{recipientName}</p>
                <p className="text-[var(--ink-2)] tabular-nums">+977 {phone}</p>
                <p className="pt-1">
                  Ward {ward}, {streetLandmark}
                </p>
                <p className="text-[var(--ink-2)]">
                  {municipality}, {district}, {province} Province
                </p>
              </div>
            </div>

            {savedAddresses.length > 1 && (
              <div className="pt-1">
                <p className="text-xs text-[var(--ink-2)] mb-2">Or select other saved location:</p>
                <div className="flex flex-wrap gap-2">
                  {savedAddresses.map((addr) => {
                    const isSelected = addr.id === selectedAddressId;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[var(--surface)] border-2 border-[var(--ink)] text-[var(--ink)]"
                            : "bg-[var(--canvas)] border border-[var(--border)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{addr.label || `${addr.district} (Ward ${addr.ward})`}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Cascading Nepal Form (New Address or Guest) */
          <div className="space-y-4">
            {savedAddresses.length > 0 && (
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-[var(--ink-2)]">Entering custom address</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsEnteringNewAddress(false);
                    const defaultAddr = savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0];
                    handleSelectSavedAddress(defaultAddr);
                  }}
                  className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)] underline min-h-[44px] inline-flex items-center cursor-pointer"
                >
                  ← Back to saved address
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Province */}
              <div className="space-y-1.5">
                <label
                  htmlFor="checkout-province"
                  className="text-xs font-medium text-[var(--ink)]"
                >
                  Province *
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
                    className="w-full h-11 pl-3.5 pr-8 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[var(--ink)] text-sm appearance-none focus:outline-none focus:border-[var(--ink)] cursor-pointer"
                  >
                    {NEPALI_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p} Province
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[var(--ink-2)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* District */}
              <div className="space-y-1.5">
                <label
                  htmlFor="checkout-district"
                  className="text-xs font-medium text-[var(--ink)]"
                >
                  District *
                </label>
                <div className="relative">
                  <select
                    id="checkout-district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-11 pl-3.5 pr-8 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[var(--ink)] text-sm appearance-none focus:outline-none focus:border-[var(--ink)] cursor-pointer"
                  >
                    {(PROVINCE_DISTRICTS[province] || [district]).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[var(--ink-2)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Municipality */}
              <div className="space-y-1.5">
                <label
                  htmlFor="checkout-municipality"
                  className="text-xs font-medium text-[var(--ink)]"
                >
                  Municipality / Palika *
                </label>
                <input
                  id="checkout-municipality"
                  type="text"
                  required
                  placeholder="e.g. Kathmandu Metropolitan City"
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--ink)]"
                />
              </div>

              {/* Ward */}
              <div className="space-y-1.5">
                <label
                  htmlFor="checkout-ward"
                  className="text-xs font-medium text-[var(--ink)]"
                >
                  Ward No. *
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
                  className="w-full h-11 px-3.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--ink)] tabular-nums"
                />
              </div>

              {/* Nearest Chowk / Landmark */}
              <div className="space-y-1.5 sm:col-span-2">
                <label
                  htmlFor="checkout-landmark"
                  className="text-xs font-medium text-[var(--ink)]"
                >
                  Nearest Chowk / Landmark / Tole *
                </label>
                <input
                  id="checkout-landmark"
                  type="text"
                  required
                  placeholder="e.g. Near New Road Gate, Opposite Pipalbot"
                  value={streetLandmark}
                  onChange={(e) => setStreetLandmark(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--ink)]"
                />
              </div>
            </div>

            {isAuthenticated && (
              <label className="flex items-center gap-2 pt-2 text-xs text-[var(--ink)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveAddressToAccount}
                  onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--ink)] focus:ring-0"
                />
                <span>Save this address to my account for faster checkout</span>
              </label>
            )}
          </div>
        )}
      </section>

      {/* 3. DELIVERY OPTION */}
      <section className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
        <h2 className="font-serif text-base sm:text-lg font-semibold text-[var(--ink)]">
          3. Delivery Option
        </h2>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--canvas)] flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center text-[var(--ink)] shrink-0 mt-0.5">
              <Truck className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">
                {isValley ? "Kathmandu Valley Express" : "Nationwide Courier"}
              </p>
              <p className="text-xs text-[var(--ink-2)] mt-0.5">
                {isValley
                  ? "Delivered within 1–2 business days to Kathmandu, Lalitpur, and Bhaktapur."
                  : `Delivered within 2–4 business days across ${district} and all 7 provinces.`}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-sm font-semibold text-[var(--ink)] tabular-nums">
              {computedShipping === 0 ? "FREE" : formatNpr(computedShipping)}
            </span>
          </div>
        </div>
      </section>

      {/* 4. PAYMENT CHOICE (Khalti | Cash on Delivery) */}
      <section className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
        <h2 className="font-serif text-base sm:text-lg font-semibold text-[var(--ink)]">
          4. Payment Choice
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Khalti Card */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setPaymentMethod("KHALTI")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setPaymentMethod("KHALTI");
              }
            }}
            className={`min-h-[72px] rounded-xl border p-4 flex items-center justify-between cursor-pointer transition-colors ${
              paymentMethod === "KHALTI"
                ? "border-2 border-[var(--ink)] bg-[var(--canvas)]"
                : "border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--ink)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center text-[var(--ink)] shrink-0">
                <CreditCard className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  Khalti
                </p>
                <p className="text-xs text-[var(--ink-2)]">
                  Digital Wallet · eBanking · Mobile
                </p>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                paymentMethod === "KHALTI"
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--surface)]"
                  : "border-[var(--border)] bg-[var(--surface)]"
              }`}
            >
              {paymentMethod === "KHALTI" && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* COD Card */}
          <div
            role="button"
            tabIndex={isCodUnavailable ? -1 : 0}
            onClick={() => {
              if (isCodUnavailable) return;
              setPaymentMethod("COD");
            }}
            onKeyDown={(e) => {
              if (isCodUnavailable) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setPaymentMethod("COD");
              }
            }}
            className={`min-h-[72px] rounded-xl border p-4 flex items-center justify-between transition-colors ${
              isCodUnavailable
                ? "border border-[var(--border)] bg-[var(--canvas)] opacity-50 cursor-not-allowed"
                : paymentMethod === "COD"
                ? "border-2 border-[var(--ink)] bg-[var(--canvas)] cursor-pointer"
                : "border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--ink)] cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center text-[var(--ink-2)] shrink-0">
                <Banknote className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)] flex items-center gap-1.5">
                  <span>Cash on Delivery</span>
                  {isCodUnavailable && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--ink-2)]">
                      Disabled
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--ink-2)]">
                  {isStoreCodDisabled
                    ? "Store supports Khalti payment only"
                    : `Pay ${formatNpr(computedTotal)} cash to rider`}
                </p>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                paymentMethod === "COD"
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--surface)]"
                  : "border-[var(--border)] bg-[var(--surface)]"
              }`}
            >
              {paymentMethod === "COD" && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>
      </section>

      {/* 5. ORDER SUMMARY */}
      <section className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-base sm:text-lg font-semibold text-[var(--ink)] flex items-center gap-2">
            <Package className="w-4 h-4 text-[var(--ink-2)]" aria-hidden="true" />
            <span>Order Summary ({itemCount})</span>
          </h2>
        </div>

        {/* Line Items */}
        <div className="divide-y divide-[var(--border)]">
          {items.map((it) => (
            <div
              key={it.variantId}
              className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5 min-w-0 pr-3">
                <p className="font-medium text-[var(--ink)] truncate">{it.productName}</p>
                <p className="text-[var(--ink-2)]">
                  {it.variantLabel ? `${it.variantLabel} · ` : ""}Qty: {it.quantity}
                </p>
              </div>
              <span className="font-semibold text-[var(--ink)] tabular-nums whitespace-nowrap">
                {formatNpr(it.unitPriceMinor * it.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Promo Code Accordion */}
        <div className="pt-2 border-t border-[var(--border)]">
          {!isPromoExpanded && !appliedPromoCode ? (
            <button
              type="button"
              onClick={() => setIsPromoExpanded(true)}
              className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)] inline-flex items-center gap-1.5 min-h-[44px] cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Have a promo code?</span>
            </button>
          ) : (
            <div className="space-y-2 pt-1">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={promoInput}
                    disabled={Boolean(appliedPromoCode)}
                    onChange={(e) => {
                      setPromoInput(e.target.value.toUpperCase());
                      if (promoError) setPromoError(null);
                    }}
                    className="w-full h-11 px-3.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[var(--ink)] text-xs uppercase focus:outline-none focus:border-[var(--ink)] disabled:opacity-60"
                  />
                </div>

                {appliedPromoCode ? (
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="min-h-[44px] h-11 px-3.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[var(--ink)] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[var(--surface)] transition-colors cursor-pointer shrink-0"
                  >
                    <span>{appliedPromoCode}</span>
                    <X className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!promoInput.trim() || isApplyingPromo}
                    onClick={handleApplyPromo}
                    className="min-h-[44px] h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] text-xs font-medium hover:bg-[var(--canvas)] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isApplyingPromo ? "Applying..." : "Apply"}
                  </button>
                )}
              </div>

              {appliedPromoCode && computedDiscount > 0 && (
                <p className="text-xs text-[var(--success-fg)] font-medium">
                  Promo code applied: -{formatNpr(computedDiscount)}
                </p>
              )}
              {promoError && (
                <p className="text-xs text-[var(--error-fg)] font-medium">{promoError}</p>
              )}
            </div>
          )}
        </div>

        {/* Calculations */}
        <div className="pt-3 border-t border-[var(--border)] text-xs space-y-1.5 text-[var(--ink-2)]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-[var(--ink)] tabular-nums">{formatNpr(computedSubtotal)}</span>
          </div>

          {computedDiscount > 0 && (
            <div className="flex justify-between text-[var(--success-fg)] font-medium">
              <span>Discount ({appliedPromoCode})</span>
              <span className="tabular-nums">-{formatNpr(computedDiscount)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Delivery</span>
            <span className="text-[var(--ink)] tabular-nums">
              {computedShipping === 0 ? "FREE" : formatNpr(computedShipping)}
            </span>
          </div>

          <div className="flex justify-between pt-2 border-t border-[var(--border)] text-sm font-semibold text-[var(--ink)]">
            <span>Total Amount</span>
            <span className="text-base tabular-nums">{formatNpr(computedTotal)}</span>
          </div>
        </div>
      </section>

      {/* 6. ONE PRIMARY "PLACE ORDER" ACTION (Sticky Bottom on mobile, in-flow on desktop) */}
      <div className="fixed inset-x-0 bottom-0 z-40 p-4 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-[var(--ink-2)]">Total</span>
            <span className="text-base sm:text-lg font-semibold text-[var(--ink)] tabular-nums">
              {formatNpr(computedTotal)}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 max-w-sm min-h-[44px] h-12 rounded-lg bg-[var(--primary)] text-[var(--surface)] hover:bg-[var(--primary-hover)] text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span>Processing Order...</span>
            ) : paymentMethod === "KHALTI" ? (
              <>
                <Lock className="w-4 h-4" aria-hidden="true" />
                <span>Pay with Khalti · {formatNpr(computedTotal)}</span>
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" aria-hidden="true" />
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
      <div className="h-44 rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
      <div className="h-64 rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
      <div className="h-32 rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
      <div className="h-48 rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
    </div>
  );
}
