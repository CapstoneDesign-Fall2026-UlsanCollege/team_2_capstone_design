"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Loader2,
  X,
  Sparkles,
  Coffee,
  LogOut,
  Shield,
  Heart,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import { DashboardUser, TabType, resolveOriginDetails } from "@/components/dashboard/dashboardData";
import SubscriptionTab from "@/components/dashboard/tabs/SubscriptionTab";
import FavoritesTab from "@/components/dashboard/tabs/FavoritesTab";
import OrdersTab from "@/components/dashboard/tabs/OrdersTab";
import ReturnsTab from "@/components/dashboard/tabs/ReturnsTab";
import ConciergeTab from "@/components/dashboard/tabs/ConciergeTab";
import GrindModal from "@/components/dashboard/modals/GrindModal";
import AddressModal from "@/components/dashboard/modals/AddressModal";
import TaxInvoiceModal from "@/components/dashboard/modals/TaxInvoiceModal";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("subscription");
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Interactive Subscription Controls & Persisted Preferences
  const [subStatus, setSubStatus] = useState<"ACTIVE" | "SKIPPED" | "PAUSED" | "CANCELLED">("ACTIVE");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isGrindModalOpen, setIsGrindModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [grindType, setGrindType] = useState("Pour-Over (Medium)");

  // Wishlist / Favorites State
  const [favorites, setFavorites] = useState<{ [key: string]: { rating: number; note: string; isFavorite: boolean } }>({
    "Gulmi Reserve": { rating: 5, note: "Sublime morning cup with light acidity", isFavorite: true },
    "Ilam Gold": { rating: 5, note: "Unreal berry sweetness for afternoon brews", isFavorite: true },
    "Nuwakot Heritage": { rating: 4, note: "Deep rich mouthfeel, pairs well with whole milk", isFavorite: false },
  });

  // Returns Form State
  const [returnForm, setReturnForm] = useState({
    orderId: "",
    reason: "Packaging arrived damaged in courier transit",
    pickupAddress: "",
    customerNotes: "",
    submitted: false,
    ticketId: "",
  });

  // Support Form State
  const [supportForm, setSupportForm] = useState({
    subject: "Roast Date & Freshness Inquiry",
    message: "",
    submitted: false,
  });

  // Editable Profile Form (Inline Modal)
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("demo_user");
    if (!savedUser) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(savedUser);
    setUser(parsed);
    setProfileForm({
      name: parsed.name || "",
      email: parsed.email || "",
      phone: parsed.phone || "+977 9801234567",
      address: parsed.address || "Jhamsikhel, Lalitpur, Nepal",
    });
    setReturnForm((prev) => ({
      ...prev,
      pickupAddress: parsed.address || "Jhamsikhel, Lalitpur, Nepal",
    }));

    // Restore grind preference if saved
    const savedGrind = localStorage.getItem("brewmellow_grind_preference");
    if (savedGrind) {
      setGrindType(savedGrind);
    }

    const userEmail = (parsed.email || "").trim().toLowerCase();
    const cacheKey = `cached_orders_${userEmail}`;

    // Stale-While-Revalidate: Instant render from cached orders
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedOrders = JSON.parse(cached);
        if (Array.isArray(parsedOrders)) {
          setOrders(parsedOrders);
          if (parsedOrders.length > 0) {
            setReturnForm((prev) => ({ ...prev, orderId: `INV-${parsedOrders[0].id.toString().padStart(5, "0")}` }));
            if (parsedOrders[0].status === "SKIPPED") setSubStatus("SKIPPED");
            else if (parsedOrders[0].status === "PAUSED") setSubStatus("PAUSED");
            else if (parsedOrders[0].status === "CANCELLED") setSubStatus("CANCELLED");
          }
        }
      }
    } catch (e) {
      console.warn("Orders cache read error:", e);
    }
    setLoading(false);

    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders/");
        if (res.ok) {
          const data = await res.json();
          const userOrders = data.filter(
            (o: any) => (o.customer_email || "").trim().toLowerCase() === userEmail
          );
          const sorted = userOrders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setOrders(sorted);
          localStorage.setItem(cacheKey, JSON.stringify(sorted));
          if (sorted.length > 0) {
            setReturnForm((prev) => ({ ...prev, orderId: `INV-${sorted[0].id.toString().padStart(5, "0")}` }));
            if (sorted[0].status === "SKIPPED") setSubStatus("SKIPPED");
            else if (sorted[0].status === "PAUSED") setSubStatus("PAUSED");
            else if (sorted[0].status === "CANCELLED") setSubStatus("CANCELLED");
          }
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      }
    };

    fetchOrders();
  }, [router]);

  // Persist order updates to backend Neon / Django DB & localStorage cache
  const updateOrderOnBackend = async (orderId: number, patchPayload: Record<string, any>) => {
    if (!user) return;
    const userEmail = (user.email || "").trim().toLowerCase();
    const cacheKey = `cached_orders_${userEmail}`;

    // Optimistically update local state & cache
    const updated = orders.map((o) => (o.id === orderId ? { ...o, ...patchPayload } : o));
    setOrders(updated);
    localStorage.setItem(cacheKey, JSON.stringify(updated));

    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchPayload),
      });
    } catch (err) {
      console.warn("Backend PATCH sync deferred/failed:", err);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updated = {
      ...user,
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone,
      address: profileForm.address,
    };

    setUser(updated);
    localStorage.setItem("demo_user", JSON.stringify(updated));
    setIsAddressModalOpen(false);

    // Persist new address to active order on backend
    const activeOrder = orders[selectedOrderIndex] || orders[0];
    if (activeOrder?.id) {
      await updateOrderOnBackend(activeOrder.id, { delivery_address: profileForm.address });
    }

    showToast("Shipping destination and contact profile updated successfully.");
  };

  const handleSelectGrind = (selected: string) => {
    setGrindType(selected);
    localStorage.setItem("brewmellow_grind_preference", selected);
    setIsGrindModalOpen(false);
    showToast(`Grind profile updated to: ${selected}. Applied to upcoming shipment.`);
  };

  const handleSkipDelivery = async () => {
    const activeOrder = orders[selectedOrderIndex] || orders[0];
    if (subStatus === "SKIPPED") {
      setSubStatus("ACTIVE");
      if (activeOrder?.id) {
        await updateOrderOnBackend(activeOrder.id, { status: "CONFIRMED" });
      }
      showToast("Skip cancelled. Upcoming delivery scheduled for Oct 18 is active.");
    } else {
      setSubStatus("SKIPPED");
      if (activeOrder?.id) {
        await updateOrderOnBackend(activeOrder.id, { status: "SKIPPED" });
      }
      showToast("Next delivery skipped! Next shipment scheduled for Nov 15, 2026.");
    }
  };

  const handlePauseSubscription = async () => {
    const activeOrder = orders[selectedOrderIndex] || orders[0];
    if (subStatus === "PAUSED") {
      setSubStatus("ACTIVE");
      if (activeOrder?.id) {
        await updateOrderOnBackend(activeOrder.id, { status: "CONFIRMED" });
      }
      showToast("Subscription resumed. Monthly deliveries are active.");
    } else {
      setSubStatus("PAUSED");
      if (activeOrder?.id) {
        await updateOrderOnBackend(activeOrder.id, { status: "PAUSED" });
      }
      showToast("Subscription paused. Upcoming shipments are on hold.");
    }
  };

  const handleCancelSubscription = async () => {
    const activeOrder = orders[selectedOrderIndex] || orders[0];
    if (subStatus === "CANCELLED") {
      setSubStatus("ACTIVE");
      if (activeOrder?.id) {
        await updateOrderOnBackend(activeOrder.id, { status: "CONFIRMED" });
      }
      showToast("Subscription reactivated. Welcome back!");
    } else {
      setSubStatus("CANCELLED");
      if (activeOrder?.id) {
        await updateOrderOnBackend(activeOrder.id, { status: "CANCELLED" });
      }
      showToast("Subscription cancelled. Active prepaid balance remains valid until expiry.");
    }
  };

  const handleSwapCoffee = async (originName: string) => {
    const activeOrder = orders[selectedOrderIndex] || orders[0];
    if (!activeOrder?.id) return;

    await updateOrderOnBackend(activeOrder.id, { origin_name: originName });
    showToast(`Upcoming Box updated! You will now receive: ${originName}.`);
  };

  const handleRateCoffee = (originName: string, stars: number) => {
    setFavorites((prev) => ({
      ...prev,
      [originName]: {
        ...prev[originName],
        rating: stars,
      },
    }));
    showToast(`Saved ${stars}-star rating for ${originName}.`);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticket = `RET-${Math.floor(100000 + Math.random() * 900000)}`;
    setReturnForm((prev) => ({ ...prev, submitted: true, ticketId: ticket }));
    showToast(`Return Request #${ticket} submitted. Courier pickup scheduled.`);
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportForm.message.trim()) return;
    setSupportForm((prev) => ({ ...prev, submitted: true }));
    showToast("Concierge message dispatched to the Lalitpur Roastery team.");
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center font-sans">
        <Loader2 size={32} className="animate-spin text-[#1A1512]" />
      </div>
    );
  }

  const activeOrder = orders.length > 0 ? orders[selectedOrderIndex] || orders[0] : null;

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#1A1512] font-sans pb-32">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-[#1A1512] text-[#F5F2EB] px-6 py-4 rounded-xl shadow-2xl border border-[#A3432A] flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <Sparkles size={18} className="text-[#E58A1F] flex-shrink-0" />
          <p className="text-xs uppercase tracking-widest font-bold">{toastMessage}</p>
          <button 
            type="button"
            onClick={() => setToastMessage(null)} 
            className="ml-3 text-[#A89F91] hover:text-white cursor-pointer"
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. ARTISANAL LUXURY MEMBER HEADER */}
      <div className="border-b border-[#E6DEC8] bg-[#F5F2EB]/80 backdrop-blur-md pt-12 pb-0 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`text-[10px] uppercase tracking-widest px-3 py-1 font-bold rounded-full border ${
                    activeOrder
                      ? "bg-[#E7F3E8] text-[#2E6B34] border-[#C3E4C6]"
                      : "bg-[#F5F2EB] text-[#8A7966] border-[#E6DEC8]"
                  }`}
                >
                  {activeOrder ? "● Active Coffee Club Subscriber" : "Registered Member"}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#8A7966] font-medium">
                  Direct-Trade Member • Since {user.memberSince}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1512]">
                Hello, {user.name.split(" ")[0]}
              </h1>
              <p className="text-sm text-[#5C5042] mt-1">
                Your dedicated artisanal roastery portal, taste journal & delivery management hub.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/subscribe"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1512] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors rounded-lg shadow-sm"
              >
                + New Subscription
              </Link>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("demo_user");
                  router.push("/login");
                }}
                className="px-4 py-2.5 border border-[#E6DEC8] text-[#5C5042] hover:text-[#A3432A] hover:bg-white text-xs uppercase tracking-widest font-bold transition-colors rounded-lg flex items-center gap-2 shadow-sm cursor-pointer"
                title="Log Out"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </div>

          {/* 5 ELEVATED NAVIGATION TABS */}
          <div 
            role="tablist"
            aria-label="Member portal tabs"
            className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar border-t border-[#E6DEC8] pt-3 pb-0"
          >
            {[
              { id: "subscription", label: "My Subscription", icon: Coffee },
              { id: "favorites", label: "Favorites & Wishlist", icon: Heart },
              { id: "orders", label: "Orders & Invoices", icon: Package },
              { id: "returns", label: "Returns & Cancellation", icon: RotateCcw },
              { id: "support", label: "Roastery Concierge", icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  id={`tab-${tab.id}`}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`pb-4 px-3 sm:px-4 text-xs uppercase tracking-widest font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? "border-[#A3432A] text-[#1A1512]"
                      : "border-transparent text-[#8A7966] hover:text-[#1A1512]"
                  }`}
                >
                  <Icon size={15} className={isActive ? "text-[#A3432A]" : "text-[#8A7966]"} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-10">
        {/* Staff Operations Clearance Banner */}
        {user.is_staff && (
          <div className="mb-8 p-4 bg-[#14100E] text-[#F5F2EB] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#2C2420] shadow-md">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E58A1F] animate-pulse shrink-0"></span>
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-[#E58A1F]">
                  Staff Roastery Clearance Active
                </p>
                <p className="text-xs text-[#A89F91]">
                  Authenticated for Lalitpur Roastery order queues, inventory & VAT invoices
                </p>
              </div>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 bg-[#A3432A] hover:bg-[#8A3722] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors inline-flex items-center gap-2 shadow-sm shrink-0"
            >
              <Shield size={14} /> Open Roastery Console →
            </Link>
          </div>
        )}

        {/* TAB 1: MY SUBSCRIPTION */}
        {activeTab === "subscription" && (
          <SubscriptionTab
            orders={orders}
            selectedOrderIndex={selectedOrderIndex}
            subStatus={subStatus}
            grindType={grindType}
            user={user}
            onSelectOrderIndex={setSelectedOrderIndex}
            onOpenGrindModal={() => setIsGrindModalOpen(true)}
            onOpenAddressModal={() => setIsAddressModalOpen(true)}
            onSkipDelivery={handleSkipDelivery}
            onPauseSubscription={handlePauseSubscription}
            onGoToFavorites={() => setActiveTab("favorites")}
          />
        )}

        {/* TAB 2: FAVORITES & TASTING WISHLIST */}
        {activeTab === "favorites" && (
          <FavoritesTab
            favorites={favorites}
            activeOriginName={activeOrder?.origin_name}
            onRateCoffee={handleRateCoffee}
            onSwapCoffee={handleSwapCoffee}
          />
        )}

        {/* TAB 3: ORDERS & OFFICIAL TAX INVOICES */}
        {activeTab === "orders" && (
          <OrdersTab
            orders={orders}
            onSelectReceipt={(ord) => setSelectedReceipt(ord)}
          />
        )}

        {/* TAB 4: RETURNS & SUBSCRIPTION CANCELLATION */}
        {activeTab === "returns" && (
          <ReturnsTab
            returnForm={returnForm}
            orders={orders}
            subStatus={subStatus}
            onChangeReturnForm={(field, value) =>
              setReturnForm((prev) => ({ ...prev, [field]: value }))
            }
            onSubmitReturn={handleReturnSubmit}
            onResetReturn={() => setReturnForm((prev) => ({ ...prev, submitted: false }))}
            onSkipDelivery={handleSkipDelivery}
            onPauseSubscription={handlePauseSubscription}
            onCancelSubscription={handleCancelSubscription}
          />
        )}

        {/* TAB 5: ROASTERY CONCIERGE & CUSTOMER SERVICE */}
        {activeTab === "support" && (
          <ConciergeTab
            user={user}
            supportForm={supportForm}
            onChangeSupportForm={(field, value) =>
              setSupportForm((prev) => ({ ...prev, [field]: value }))
            }
            onSubmitSupport={handleSupportSubmit}
            onResetSupport={() =>
              setSupportForm({ subject: "Roast Date & Freshness Inquiry", message: "", submitted: false })
            }
          />
        )}
      </div>

      {/* MODAL 1: CUSTOMIZE GRIND PROFILE */}
      <GrindModal
        isOpen={isGrindModalOpen}
        grindType={grindType}
        onClose={() => setIsGrindModalOpen(false)}
        onSelectGrind={handleSelectGrind}
      />

      {/* MODAL 2: EDIT DELIVERY ADDRESS */}
      <AddressModal
        isOpen={isAddressModalOpen}
        profileForm={profileForm}
        onClose={() => setIsAddressModalOpen(false)}
        onChange={(field, value) =>
          setProfileForm((prev) => ({ ...prev, [field]: value }))
        }
        onSave={handleProfileSave}
      />

      {/* MODAL 3: OFFICIAL TAX INVOICE */}
      <TaxInvoiceModal
        order={selectedReceipt}
        user={user}
        grindType={grindType}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}
