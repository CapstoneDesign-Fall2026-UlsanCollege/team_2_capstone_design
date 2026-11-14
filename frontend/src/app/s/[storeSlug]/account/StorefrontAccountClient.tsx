"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Package,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  createDeliveryAddress,
  deleteDeliveryAddress,
  DeliveryAddressItem,
  DeliveryAddressPayload,
  fetchStorefrontOrders,
  formatNpr,
  listDeliveryAddresses,
  StorefrontOrderSummary,
  StorePublicMetadata,
  updateStorefrontAccount,
  verifyStorefrontGoogleAuth,
} from "@/lib/api";
import { emitAuthChange, useStorefrontAuth } from "@/lib/auth";
import {
  getStorefrontAccountBadge,
  getStorefrontPaymentAndDeliveryClaims,
} from "@/lib/storefront-helpers";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAccount } from "@/components/storefront/AccountContext";
import { Chip, ChipTone } from "@/components/ui/chip";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { useCart } from "@/components/storefront/CartContext";

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

export interface StorefrontAccountClientProps {
  store: StorePublicMetadata;
}

type TabType = "orders" | "profile" | "addresses";

function getOrderStatusTone(status: string, paymentStatus?: string): { tone: ChipTone; label: string } {
  const s = status.toUpperCase();
  const p = (paymentStatus || "").toUpperCase();

  if (s === "DELIVERED") {
    return { tone: "success", label: "Delivered" };
  }
  if (p === "PAID" || s === "PAID") {
    return { tone: "success", label: "Paid" };
  }
  if (s === "PAYMENT_FAILED" || p === "FAILED") {
    return { tone: "error", label: "Payment Failed" };
  }
  if (s === "CANCELLED") {
    return { tone: "error", label: "Cancelled" };
  }
  if (s === "SHIPPED") {
    return { tone: "warning", label: "Shipped" };
  }
  if (s === "CONFIRMED") {
    return { tone: "neutral", label: "Confirmed" };
  }
  return { tone: "warning", label: "Pending" };
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

export function StorefrontAccountClient({ store }: StorefrontAccountClientProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") as TabType | null;

  const { openAccount } = useAccount();
  const { itemCount, openCart } = useCart();
  const { isAuthenticated, loading: authLoading, user, customer, refresh, signOut } = useStorefrontAuth(
    store.slug
  );

  const [activeTab, setActiveTab] = useState<TabType>(
    initialTab === "addresses" || initialTab === "profile" ? initialTab : "orders"
  );

  // Orders State
  const [orders, setOrders] = useState<StorefrontOrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Profile Form State
  const [profileName, setProfileName] = useState<string>("");
  const [profilePhone, setProfilePhone] = useState<string>("");
  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Addresses State
  const [addresses, setAddresses] = useState<DeliveryAddressItem[]>([]);
  const [addressesLoading, setAddressesLoading] = useState<boolean>(true);
  const [addressesError, setAddressesError] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState<boolean>(false);
  const [addressSaving, setAddressSaving] = useState<boolean>(false);

  // New Address Form State
  const [addrLabel, setAddrLabel] = useState<string>("Home");
  const [addrRecipient, setAddrRecipient] = useState<string>("");
  const [addrPhone, setAddrPhone] = useState<string>("");
  const [addrProvince, setAddrProvince] = useState<string>("Bagmati");
  const [addrDistrict, setAddrDistrict] = useState<string>("Kathmandu");
  const [addrMunicipality, setAddrMunicipality] = useState<string>("");
  const [addrWard, setAddrWard] = useState<string>("1");
  const [addrStreet, setAddrStreet] = useState<string>("");
  const [addrIsDefault, setAddrIsDefault] = useState<boolean>(true);
  const [addrFormError, setAddrFormError] = useState<string | null>(null);

  // Unauthenticated input
  const [guestEmailInput, setGuestEmailInput] = useState<string>("");
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [googleAuthLoading, setGoogleAuthLoading] = useState<boolean>(false);

  // Sync profile fields from customer (adjust state during render, not in an effect)
  const [syncedCustomer, setSyncedCustomer] = useState(customer);
  if (customer !== syncedCustomer) {
    setSyncedCustomer(customer);
    if (customer) {
      setProfileName(customer.full_name || "");
      setProfilePhone(customer.phone || "");
    }
  }

  // Load Orders
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    fetchStorefrontOrders(store.slug)
      .then((data) => {
        if (active) {
          setOrdersError(null);
          setOrders(data);
          setOrdersLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setOrdersError(err instanceof Error ? err.message : "Failed to load orders.");
          setOrdersLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, store.slug]);

  // Load Saved Addresses
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    listDeliveryAddresses()
      .then((data) => {
        if (active) {
          setAddressesError(null);
          setAddresses(data);
          setAddressesLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setAddressesError(err instanceof Error ? err.message : "Failed to load addresses.");
          setAddressesLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // Update district options when province changes
  const handleProvinceChange = (newProvince: string) => {
    setAddrProvince(newProvince);
    const available = PROVINCE_DISTRICTS[newProvince] || [];
    setAddrDistrict(available[0] || "Kathmandu");
  };

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    const cleanPhone = profilePhone.trim();
    if (cleanPhone && !/^9[78]\d{8}$/.test(cleanPhone)) {
      setProfileErrorMsg("Please enter a valid 10-digit Nepali mobile number (starts with 98 or 97).");
      return;
    }

    setProfileSaving(true);
    try {
      await updateStorefrontAccount(store.slug, {
        full_name: profileName.trim(),
        phone: cleanPhone,
      });
      await refresh();
      setProfileSuccessMsg("Profile details saved successfully.");
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setProfileErrorMsg(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Create Address
  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddrFormError(null);

    const cleanPhone = addrPhone.trim();
    if (!/^9[78]\d{8}$/.test(cleanPhone)) {
      setAddrFormError("Please enter a valid 10-digit mobile number for delivery contact.");
      return;
    }
    const wardNum = parseInt(addrWard, 10);
    if (isNaN(wardNum) || wardNum < 1 || wardNum > 35) {
      setAddrFormError("Please enter a valid ward number (1-35).");
      return;
    }
    if (!addrRecipient.trim()) {
      setAddrFormError("Recipient name is required.");
      return;
    }
    if (!addrMunicipality.trim()) {
      setAddrFormError("Municipality or rural municipality is required.");
      return;
    }
    if (!addrStreet.trim()) {
      setAddrFormError("Street name, tole, or landmark is required.");
      return;
    }

    setAddressSaving(true);
    try {
      const payload: DeliveryAddressPayload = {
        label: addrLabel.trim() || "Address",
        recipient_name: addrRecipient.trim(),
        phone: cleanPhone,
        province: addrProvince,
        district: addrDistrict,
        municipality: addrMunicipality.trim(),
        ward: wardNum,
        street_landmark: addrStreet.trim(),
        is_default: addrIsDefault,
      };
      const created = await createDeliveryAddress(payload);
      setAddresses((prev) => {
        if (created.is_default) {
          return [created, ...prev.map((a) => ({ ...a, is_default: false }))];
        }
        return [created, ...prev];
      });
      setShowAddressForm(false);
      // Reset form
      setAddrRecipient("");
      setAddrPhone("");
      setAddrMunicipality("");
      setAddrStreet("");
    } catch (err: unknown) {
      setAddrFormError(err instanceof Error ? err.message : "Failed to save address.");
    } finally {
      setAddressSaving(false);
    }
  };

  // Handle Delete Address
  const handleDeleteAddress = async (id: number) => {
    try {
      await deleteDeliveryAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) {
      setAddressesError(err instanceof Error ? err.message : "Failed to delete address.");
    }
  };

  const { isStorefrontCustomer, userInitial } = getStorefrontAccountBadge(isAuthenticated, customer);
  const claims = getStorefrontPaymentAndDeliveryClaims(store);

  return (
    <div className="w-full min-h-dvh bg-[var(--canvas)] text-[var(--ink)] font-sans antialiased flex flex-col">
      {/* 1. Header */}
      <StorefrontHeader
        storeSlug={store.slug}
        storeName={store.name}
        tagline={store.tagline}
        logoUrl={store.logo_url}
        cartCount={itemCount}
        freeShippingThresholdMinor={store.shipping_configured ? store.free_shipping_threshold_minor : null}
        onOpenCart={openCart}
        onOpenAccount={openAccount}
        isAuthenticated={isStorefrontCustomer}
        userInitial={userInitial}
        showDeliveryLink={claims.shippingConfigured || claims.hasKhalti || claims.codEnabled}
        deliveryLinkLabel={claims.shippingConfigured ? (claims.codEnabled ? "Delivery & COD" : "Delivery") : "Payment Options"}
      />

      {/* 2. Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[var(--ink-2)] min-h-[44px]">
            <Link
              href={`/s/${encodeURIComponent(store.slug)}`}
              className="hover:text-[var(--ink)] underline-offset-4 hover:underline flex items-center gap-1.5 min-h-[44px] pr-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </Link>
            <span>/</span>
            <span className="text-[var(--ink)] font-medium">Customer Account</span>
          </nav>

          {isAuthenticated && (
            <button
              type="button"
              onClick={() => signOut()}
              className="text-xs text-[var(--ink-2)] hover:text-[var(--status-error-fg)] flex items-center gap-1.5 min-h-[44px] px-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          )}
        </div>

        {/* Loading State */}
        {authLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-[var(--ink-2)]">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--ink)]" />
            <p className="text-xs">Checking account session...</p>
          </div>
        ) : !isAuthenticated ? (
          /* ================= UNAUTHENTICATED HERO CARD ================= */
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-10 text-center max-w-lg mx-auto space-y-6">
            <div className="w-14 h-14 rounded-full bg-[var(--canvas)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--ink)]">
              <User className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                Sign in to your account
              </h1>
              <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-sm mx-auto leading-relaxed">
                Sign in with your email to view order status, saved delivery addresses, and past purchase receipts. No password required.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                openAccount(guestEmailInput.trim().toLowerCase());
              }}
              className="space-y-3 pt-2 text-left"
            >
              <label htmlFor="gate-email" className="block text-xs font-medium text-[var(--ink)]">
                Email address
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="gate-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={guestEmailInput}
                  onChange={(e) => setGuestEmailInput(e.target.value)}
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-2)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                />
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] text-xs sm:text-sm font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0"
                >
                  <span>Send login code</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {googleAuthError && (
              <div className="p-3 rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-[var(--status-error-fg)] text-xs flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{googleAuthError}</span>
              </div>
            )}

            <GoogleSignInButton
              enabled={!authLoading && !isAuthenticated}
              surface="storefront"
              disabled={googleAuthLoading}
              onCredential={async (credential) => {
                setGoogleAuthLoading(true);
                setGoogleAuthError(null);
                try {
                  await verifyStorefrontGoogleAuth(store.slug, credential);
                  emitAuthChange();
                  await refresh();
                } catch (err: unknown) {
                  setGoogleAuthError(
                    err instanceof Error
                      ? err.message
                      : "Unable to sign in with Google. Please try again or use email code."
                  );
                } finally {
                  setGoogleAuthLoading(false);
                }
              }}
              onError={(msg) => setGoogleAuthError(msg)}
            />

            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-center gap-2 text-xs text-[var(--ink-2)]">
              <ShieldCheck className="w-4 h-4 text-[var(--status-success-fg)] shrink-0" />
              <span>Accounts are optional. Guest checkout is always available.</span>
            </div>
          </div>
        ) : (
          /* ================= AUTHENTICATED PORTAL ================= */
          <div className="space-y-8">
            
            {/* Top Customer Summary Banner */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[var(--ink)] text-[var(--surface)] text-lg font-serif font-bold flex items-center justify-center shrink-0">
                  {userInitial || "S"}
                </div>
                <div className="min-w-0">
                  <h1 className="font-serif text-lg sm:text-xl font-bold text-[var(--ink)] truncate">
                    {customer?.full_name || user?.full_name || "Welcome back"}
                  </h1>
                  <p className="text-xs text-[var(--ink-2)] truncate font-mono">
                    {user?.email || customer?.email}
                  </p>
                </div>
              </div>

              {customer && (
                <div className="flex items-center gap-4 text-xs border-t sm:border-t-0 sm:border-l border-[var(--border)] pt-3 sm:pt-0 sm:pl-6 text-[var(--ink-2)]">
                  <div>
                    <span className="block text-base font-bold text-[var(--ink)] tabular-nums">
                      {customer.orders_count}
                    </span>
                    <span>Total orders</span>
                  </div>
                  <div>
                    <span className="block text-base font-bold text-[var(--ink)] tabular-nums">
                      {formatNpr(customer.total_spent_minor)}
                    </span>
                    <span>Total spent</span>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-[var(--border)] gap-2 sm:gap-6 overflow-x-auto pb-px">
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={`min-h-[44px] px-3 sm:px-1 flex items-center gap-2 text-xs sm:text-sm font-medium border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === "orders"
                    ? "border-[var(--ink)] text-[var(--ink)]"
                    : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Order History</span>
                {orders.length > 0 && (
                  <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[var(--canvas)] border border-[var(--border)] text-[var(--ink-2)] font-mono">
                    {orders.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`min-h-[44px] px-3 sm:px-1 flex items-center gap-2 text-xs sm:text-sm font-medium border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === "profile"
                    ? "border-[var(--ink)] text-[var(--ink)]"
                    : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profile Details</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("addresses")}
                className={`min-h-[44px] px-3 sm:px-1 flex items-center gap-2 text-xs sm:text-sm font-medium border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === "addresses"
                    ? "border-[var(--ink)] text-[var(--ink)]"
                    : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Saved Addresses</span>
                {addresses.length > 0 && (
                  <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[var(--canvas)] border border-[var(--border)] text-[var(--ink-2)] font-mono">
                    {addresses.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: ORDERS LIST */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                {ordersLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3 text-[var(--ink-2)]">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--ink)]" />
                    <p className="text-xs">Loading order history...</p>
                  </div>
                ) : ordersError ? (
                  <div className="p-4 rounded-xl border border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-[var(--status-error-fg)] text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{ordersError}</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center space-y-3">
                    <Package className="w-8 h-8 text-[var(--ink-2)] mx-auto opacity-60" />
                    <h3 className="font-serif text-base font-semibold text-[var(--ink)]">No orders yet</h3>
                    <p className="text-xs text-[var(--ink-2)] max-w-sm mx-auto">
                      When you purchase products from {store.name}, your verified receipts and tracking updates will appear here.
                    </p>
                    <div className="pt-2">
                      <Link
                        href={`/s/${encodeURIComponent(store.slug)}`}
                        className="inline-flex items-center gap-2 min-h-[40px] px-4 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] text-xs font-medium transition-colors"
                      >
                        <span>Explore Catalog</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((ord) => {
                      const { tone, label } = getOrderStatusTone(ord.status, ord.payment_status);
                      const trackingHref = `/s/${encodeURIComponent(store.slug)}/orders/${encodeURIComponent(
                        ord.id
                      )}?token=${encodeURIComponent(ord.token)}`;

                      return (
                        <div
                          key={ord.id}
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[var(--ink)] transition-colors"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                                #{ord.order_number || ord.id}
                              </span>
                              <span>·</span>
                              <span className="text-xs text-[var(--ink-2)]">{formatDate(ord.created_at)}</span>
                              <Chip tone={tone}>{label}</Chip>
                            </div>

                            <p className="text-xs text-[var(--ink)] font-medium truncate">
                              {ord.items_summary || "Curated item(s)"}
                            </p>

                            <div className="flex items-center gap-2 text-[11px] text-[var(--ink-2)]">
                              <span>Status: {ord.payment_status}</span>
                              <span>·</span>
                              <span className="font-bold text-[var(--ink)] tabular-nums">
                                {formatNpr(ord.total_minor)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
                            <Link
                              href={trackingHref}
                              className="w-full sm:w-auto min-h-[44px] px-4 rounded-lg border border-[var(--border)] bg-[var(--canvas)] hover:bg-[var(--surface)] text-[var(--ink)] text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
                            >
                              <span>View receipt &amp; track</span>
                              <ExternalLink className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PROFILE EDITOR */}
            {activeTab === "profile" && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7 max-w-xl">
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="font-serif text-lg font-semibold text-[var(--ink)]">
                      Customer Profile
                    </h2>
                    <p className="text-xs text-[var(--ink-2)]">
                      Manage your contact details used for delivery notifications and checkout prefill.
                    </p>
                  </div>

                  {profileSuccessMsg && (
                    <div className="p-3 rounded-lg border border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-fg)] text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{profileSuccessMsg}</span>
                    </div>
                  )}

                  {profileErrorMsg && (
                    <div className="p-3 rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-[var(--status-error-fg)] text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{profileErrorMsg}</span>
                    </div>
                  )}

                  {/* Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="account-fullname" className="block text-xs font-medium text-[var(--ink)]">
                      Full name
                    </label>
                    <input
                      id="account-fullname"
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="e.g. Aditya Sharma"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-sm text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label htmlFor="account-phone" className="block text-xs font-medium text-[var(--ink)]">
                      Delivery phone number
                    </label>
                    <input
                      id="account-phone"
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="98XXXXXXXX"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-sm text-[var(--ink)] font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                    />
                    <p className="text-[11px] text-[var(--ink-2)]">
                      10 digits, starts with 98 or 97. Used by couriers for doorstep package handoff.
                    </p>
                  </div>

                  {/* Email (Read-only) */}
                  <div className="space-y-1.5">
                    <label htmlFor="account-email-readonly" className="block text-xs font-medium text-[var(--ink)]">
                      Account email
                    </label>
                    <input
                      id="account-email-readonly"
                      type="email"
                      readOnly
                      disabled
                      value={user?.email || customer?.email || ""}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] opacity-70 text-sm text-[var(--ink-2)] font-mono cursor-not-allowed"
                    />
                    <p className="text-[11px] text-[var(--ink-2)]">
                      Contact {store.name} directly to transfer your account to a different email address.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="min-h-[44px] px-6 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] disabled:opacity-50 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      {profileSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving profile...</span>
                        </>
                      ) : (
                        <span>Save profile</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: SAVED ADDRESSES */}
            {activeTab === "addresses" && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-[var(--ink)]">
                      Saved Delivery Addresses
                    </h2>
                    <p className="text-xs text-[var(--ink-2)]">
                      Addresses are saved to your account and automatically suggested during checkout.
                    </p>
                  </div>

                  {!showAddressForm && (
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(true)}
                      className="min-h-[44px] px-4 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add new address</span>
                    </button>
                  )}
                </div>

                {/* Error Banner */}
                {addressesError && (
                  <div className="p-3 rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-[var(--status-error-fg)] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{addressesError}</span>
                  </div>
                )}

                {/* New Address Form Modal/Drawer Container */}
                {showAddressForm && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 space-y-5">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                      <h3 className="font-serif text-base font-semibold text-[var(--ink)]">
                        Add Delivery Address
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="text-[var(--ink-2)] hover:text-[var(--ink)] min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {addrFormError && (
                      <div className="p-3 rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-[var(--status-error-fg)] text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{addrFormError}</span>
                      </div>
                    )}

                    <form onSubmit={handleCreateAddress} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Label */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink)]">
                            Address label
                          </label>
                          <input
                            type="text"
                            value={addrLabel}
                            onChange={(e) => setAddrLabel(e.target.value)}
                            placeholder="Home, Office, etc."
                            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-sm text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                          />
                        </div>

                        {/* Recipient Name */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink)]">
                            Recipient name *
                          </label>
                          <input
                            type="text"
                            required
                            value={addrRecipient}
                            onChange={(e) => setAddrRecipient(e.target.value)}
                            placeholder="Recipient full name"
                            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-sm text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                          />
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="block text-xs font-medium text-[var(--ink)]">
                            Contact mobile number *
                          </label>
                          <input
                            type="tel"
                            required
                            value={addrPhone}
                            onChange={(e) => setAddrPhone(e.target.value)}
                            placeholder="98XXXXXXXX"
                            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-sm text-[var(--ink)] font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                          />
                        </div>

                        {/* Province Cascade */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink)]">
                            Province *
                          </label>
                          <select
                            value={addrProvince}
                            onChange={(e) => handleProvinceChange(e.target.value)}
                            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-sm text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)] cursor-pointer"
                          >
                            {NEPALI_PROVINCES.map((p) => (
                              <option key={p} value={p}>
                                {p} Province
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* District Cascade */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink)]">
                            District *
                          </label>
                          <select
                            value={addrDistrict}
                            onChange={(e) => setAddrDistrict(e.target.value)}
                            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-sm text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)] cursor-pointer"
                          >
                            {(PROVINCE_DISTRICTS[addrProvince] || [addrDistrict]).map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Municipality */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink)]">
                            Municipality / Nagarpalika *
                          </label>
                          <input
                            type="text"
                            required
                            value={addrMunicipality}
                            onChange={(e) => setAddrMunicipality(e.target.value)}
                            placeholder="e.g. Kathmandu Metropolitan City"
                            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-sm text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                          />
                        </div>

                        {/* Ward */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink)]">
                            Ward number (1-35) *
                          </label>
                          <input
                            type="number"
                            required
                            min={1}
                            max={35}
                            value={addrWard}
                            onChange={(e) => setAddrWard(e.target.value)}
                            placeholder="e.g. 3"
                            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-sm text-[var(--ink)] font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                          />
                        </div>

                        {/* Street & Landmark */}
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="block text-xs font-medium text-[var(--ink)]">
                            Street, Tole &amp; Landmark *
                          </label>
                          <input
                            type="text"
                            required
                            value={addrStreet}
                            onChange={(e) => setAddrStreet(e.target.value)}
                            placeholder="e.g. Jhamsikhel, near St. Mary's School"
                            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-sm text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                          />
                        </div>
                      </div>

                      {/* Default Checkbox */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          id="addr-is-default"
                          type="checkbox"
                          checked={addrIsDefault}
                          onChange={(e) => setAddrIsDefault(e.target.checked)}
                          className="w-4 h-4 rounded border-[var(--border)] text-[var(--ink)] focus:ring-[var(--ink)] cursor-pointer"
                        />
                        <label htmlFor="addr-is-default" className="text-xs text-[var(--ink)] cursor-pointer">
                          Set as my default shipping address
                        </label>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={addressSaving}
                          className="min-h-[44px] px-6 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] disabled:opacity-50 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          {addressSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Saving address...</span>
                            </>
                          ) : (
                            <span>Save address</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="min-h-[44px] px-4 rounded-lg border border-[var(--border)] text-xs text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Address Cards List */}
                {addressesLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3 text-[var(--ink-2)]">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--ink)]" />
                    <p className="text-xs">Loading saved addresses...</p>
                  </div>
                ) : addresses.length === 0 && !showAddressForm ? (
                  <div className="p-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center space-y-2">
                    <MapPin className="w-8 h-8 text-[var(--ink-2)] mx-auto opacity-60" />
                    <h3 className="font-serif text-base font-semibold text-[var(--ink)]">No saved addresses</h3>
                    <p className="text-xs text-[var(--ink-2)] max-w-sm mx-auto">
                      Save an address to breeze through checkout in one tap.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink)]">
                              {addr.label || "Address"}
                            </span>
                            {addr.is_default && (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--canvas)] border border-[var(--border)] text-[var(--ink)]">
                                Default
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-[var(--ink)] space-y-0.5">
                            <p className="font-medium">{addr.recipient_name}</p>
                            <p className="text-[var(--ink-2)] font-mono">{addr.phone}</p>
                            <p className="text-[var(--ink-2)] pt-1">
                              {addr.street_landmark}, Ward {addr.ward}
                            </p>
                            <p className="text-[var(--ink-2)]">
                              {addr.municipality}, {addr.district}, {addr.province}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                          <span className="text-[11px] text-[var(--ink-2)]">Nepal</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-xs text-[var(--ink-2)] hover:text-[var(--status-error-fg)] min-h-[36px] flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. Footer */}
      <footer className="w-full border-t border-[var(--border)] bg-[var(--surface)] mt-12 py-8 px-4 sm:px-6 text-xs text-[var(--ink-2)]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} {store.name}. All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <span>Settled in NPR</span>
            <span>·</span>
            <Link href={`/s/${encodeURIComponent(store.slug)}`} className="hover:text-[var(--ink)] underline">
              Back to Storefront
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
