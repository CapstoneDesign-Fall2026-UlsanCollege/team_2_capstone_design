"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Package, MapPin, CreditCard, Download, Calendar, Loader2, CheckCircle2, 
  Clock, Truck, Home as HomeIcon, X, Printer, AlertCircle, Sparkles, 
  Check, Coffee, User, Settings, LogOut, Save, Shield, ArrowRight, 
  Flame, Mountain, Edit3, Heart, ChevronRight, SlidersHorizontal, Star,
  MessageSquare, RotateCcw, HelpCircle, Phone, Mail, Send, ExternalLink,
  RefreshCw, Undo2, Award, ChevronDown, CheckCheck
} from "lucide-react";

// Rich Origin Metadata
const ORIGIN_DETAILS: Record<string, { notes: string[]; altitude: string; process: string; region: string; img: string; roasterNote: string; idealBrew: string; ratio: string; temp: string; bloom: string }> = {
  "Gulmi Reserve": {
    notes: ["Citrus Blossom", "Wild Honey", "Dark Chocolate"],
    altitude: "1,600m",
    process: "Fully Washed",
    region: "Gulmi, Western Nepal",
    img: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=800&auto=format&fit=crop",
    roasterNote: "Micro-lot grown under Himalayan rhododendron canopy. Roasted gently to preserve crisp citrus floral aromas.",
    idealBrew: "Pour-Over (V60 / Chemex)",
    ratio: "1:16 (15g : 240ml)",
    temp: "93°C (Right off boil)",
    bloom: "45s Aroma Bloom",
  },
  "Ilam Gold": {
    notes: ["Alpine Berry", "White Jasmine", "Warm Caramel"],
    altitude: "1,800m",
    process: "Sun-Dried Natural",
    region: "Ilam, Eastern Nepal",
    img: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=800&auto=format&fit=crop",
    roasterNote: "Cherry-dried on raised bamboo beds. Rich sweetness infused with the dense high mists of the eastern tea belt.",
    idealBrew: "Aeropress / Moka Pot",
    ratio: "1:14 (17g : 240ml)",
    temp: "91°C",
    bloom: "30s Immersion",
  },
  "Nuwakot Heritage": {
    notes: ["Roasted Walnut", "Dark Molasses", "Spiced Plum"],
    altitude: "1,400m",
    process: "Honey Processed",
    region: "Nuwakot Foothills, Nepal",
    img: "https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=800&auto=format&fit=crop",
    roasterNote: "Cultivated in Kathmandu's northern alpine valley. Velvety, heavy-bodied cup with comforting nutty tones.",
    idealBrew: "French Press / Cold Brew",
    ratio: "1:15 (18g : 270ml)",
    temp: "94°C",
    bloom: "60s Full Immersion",
  },
};

type TabType = "subscription" | "favorites" | "orders" | "returns" | "support";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("subscription");
  const [user, setUser] = useState<{ name: string; email: string; phone?: string; address: string; memberSince: string; is_staff?: boolean } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Interactive Subscription Controls
  const [subStatus, setSubStatus] = useState<"ACTIVE" | "SKIPPED" | "PAUSED" | "CANCELLED">("ACTIVE");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isGrindModalOpen, setIsGrindModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isBrewGuideOpen, setIsBrewGuideOpen] = useState(false);
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

  // FAQ Accordion Toggle State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
          }
        }
      }
    } catch (e) {
      console.warn("Orders cache read error:", e);
    }
    setLoading(false); // Unblock UI immediately: User profile is ready

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
          }
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      }
    };

    fetchOrders();
  }, [router]);

  const handleProfileSave = (e: React.FormEvent) => {
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
    showToast("Shipping destination and contact profile updated successfully.");
  };

  const handleSkipDelivery = () => {
    if (subStatus === "SKIPPED") {
      setSubStatus("ACTIVE");
      showToast("Skip cancelled. Upcoming delivery scheduled for Oct 18 is active.");
    } else {
      setSubStatus("SKIPPED");
      showToast("Next delivery skipped! Next shipment scheduled for Nov 15, 2026.");
    }
  };

  const handlePauseSubscription = () => {
    if (subStatus === "PAUSED") {
      setSubStatus("ACTIVE");
      showToast("Subscription resumed. Monthly deliveries are active.");
    } else {
      setSubStatus("PAUSED");
      showToast("Subscription paused. Upcoming shipments are on hold.");
    }
  };

  const handleCancelSubscription = () => {
    if (subStatus === "CANCELLED") {
      setSubStatus("ACTIVE");
      showToast("Subscription reactivated. Welcome back!");
    } else {
      setSubStatus("CANCELLED");
      showToast("Subscription cancelled. Active prepaid balance remains valid until expiry.");
    }
  };

  const handleSwapCoffee = (originName: string) => {
    if (!orders || orders.length === 0) return;
    const updated = [...orders];
    updated[0] = { ...updated[0], origin_name: originName };
    setOrders(updated);
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
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center font-sans">
        <Loader2 size={32} className="animate-spin text-[#1A1512]" />
      </div>
    );
  }

  const activeOrder = orders.length > 0 ? (orders[selectedOrderIndex] || orders[0]) : null;
  const originInfo = activeOrder && ORIGIN_DETAILS[activeOrder.origin_name] 
    ? ORIGIN_DETAILS[activeOrder.origin_name]
    : ORIGIN_DETAILS["Gulmi Reserve"];

  const currentStatus = activeOrder?.status || "ROASTING";

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1512] font-sans pb-32">
      
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-[#1A1512] text-[#F5F2EB] px-6 py-4 rounded-xl shadow-2xl border border-[#A3432A] flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <Sparkles size={18} className="text-[#E58A1F] flex-shrink-0" />
          <p className="text-xs uppercase tracking-widest font-bold">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="ml-3 text-[#A89F91] hover:text-white">
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
                <span className={`text-[10px] uppercase tracking-widest px-3 py-1 font-bold rounded-full border ${
                  activeOrder 
                    ? "bg-[#E7F3E8] text-[#2E6B34] border-[#C3E4C6]" 
                    : "bg-[#F5F2EB] text-[#8A7966] border-[#E6DEC8]"
                }`}>
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
                onClick={() => { localStorage.removeItem("demo_user"); router.push("/login"); }}
                className="px-4 py-2.5 border border-[#E6DEC8] text-[#5C5042] hover:text-[#A3432A] hover:bg-white text-xs uppercase tracking-widest font-bold transition-colors rounded-lg flex items-center gap-2 shadow-sm"
                title="Log Out"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </div>

          {/* 5 ELEVATED NAVIGATION TABS */}
          <div className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar border-t border-[#E6DEC8] pt-3 pb-0">
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
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`pb-4 px-3 sm:px-4 text-xs uppercase tracking-widest font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
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
                <p className="text-xs uppercase font-bold tracking-wider text-[#E58A1F]">Staff Roastery Clearance Active</p>
                <p className="text-xs text-[#A89F91]">Authenticated for Lalitpur Roastery order queues, inventory & VAT invoices</p>
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

                {/* ========================================================================= */}
        {/* TAB 1: MY SUBSCRIPTION (STREAMLINED LUXURY D2C EXPERIENCE)                */}
        {/* ========================================================================= */}
        {activeTab === "subscription" && (
          <div className="space-y-6">

            {/* 1. COMPACT MULTI-SUBSCRIPTION SWITCHER (If member has multiple orders) */}
            {orders.length > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E6DEC8] p-3 rounded-2xl shadow-xs">
                <div className="flex items-center gap-2 px-2">
                  <Package size={15} className="text-[#A3432A]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1A1512]">
                    Your Coffee Boxes ({orders.length}):
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {orders.map((ord: any, idx: number) => {
                    const isSelected = idx === selectedOrderIndex;
                    return (
                      <button
                        key={ord.id}
                        type="button"
                        onClick={() => setSelectedOrderIndex(idx)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? "bg-[#1A1512] text-white shadow-xs"
                            : "bg-[#FAF8F5] text-[#5C5042] border border-[#E6DEC8] hover:bg-white hover:text-[#1A1512]"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-green-500" : "bg-[#C8BFAB]"}`} />
                        <span>Box #{idx + 1}: {ord.origin_name} ({ord.weight_kg}kg)</span>
                      </button>
                    );
                  })}
                  <Link
                    href="/subscribe"
                    className="text-xs font-bold text-[#A3432A] hover:underline px-2 py-1"
                  >
                    + Add Box
                  </Link>
                </div>
              </div>
            )}
            
            {activeOrder ? (
              <div className="bg-white border border-[#E6DEC8] rounded-2xl shadow-sm overflow-hidden">
                
                {/* Clean Top Ribbon: Status + Batch */}
                <div className="bg-[#FAF8F5] border-b border-[#E6DEC8] px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-[#1A1512]">
                      {orders.length > 1 ? `Box #${selectedOrderIndex + 1} of ${orders.length}` : "Upcoming Roastery Box"}
                    </span>
                    <span className="text-[#8A7966]">•</span>
                    <span className="text-[#8A7966] font-mono">INV-{activeOrder.id.toString().padStart(5, "0")}</span>
                  </div>

                  {/* Dynamic Status Tag */}
                  <div className="flex items-center gap-2">
                    {subStatus === "ACTIVE" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E7F3E8] text-[#2E6B34] text-xs font-bold uppercase tracking-wider rounded-full border border-[#C3E4C6]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B34] animate-pulse" />
                        Roasting Scheduled: Oct 18 • Peak Freshness
                      </span>
                    )}
                    {subStatus === "SKIPPED" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF4E5] text-[#B76E00] text-xs font-bold uppercase tracking-wider rounded-full border border-[#F3DFC1]">
                        Skipped • Next Batch Nov 15
                      </span>
                    )}
                    {subStatus === "PAUSED" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5F2EB] text-[#5C5042] text-xs font-bold uppercase tracking-wider rounded-full border border-[#E6DEC8]">
                        Deliveries On Hold
                      </span>
                    )}
                  </div>
                </div>

                {/* Hero Showcase: 2-Column Balanced Unboxing */}
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  
                  {/* Left: Coffee Bag Image (4 Cols) */}
                  <div className="md:col-span-4 relative rounded-xl overflow-hidden border border-[#E6DEC8] bg-[#FAF8F5] group">
                    <div className="h-56 md:h-64 w-full relative">
                      <img 
                        src={originInfo.img} 
                        alt={activeOrder.origin_name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="bg-black/70 backdrop-blur-md text-white text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                          {originInfo.altitude}
                        </span>
                        <span className="bg-[#A3432A] text-white text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                          {originInfo.process}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-[#E58A1F]">
                          {originInfo.region}
                        </p>
                        <h3 className="text-xl font-serif font-bold leading-tight">
                          {activeOrder.origin_name}
                        </h3>
                      </div>
                    </div>

                    {/* Compact Flavor Tags */}
                    <div className="p-3 bg-white border-t border-[#E6DEC8] flex flex-wrap gap-1">
                      {originInfo.notes.map((note) => (
                        <span key={note} className="text-[10px] px-2 py-0.5 bg-[#FAF8F5] text-[#1A1512] border border-[#E6DEC8] rounded font-medium">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Plan Specs, Quick Actions & Shipping (8 Cols) */}
                  <div className="md:col-span-8 space-y-6">
                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                        <h4 className="text-2xl font-serif font-bold text-[#1A1512]">
                          {activeOrder.origin_name} • {activeOrder.weight_kg} kg
                        </h4>
                        <span className="text-lg font-serif font-bold text-[#A3432A]">
                          Rs. {activeOrder.total_price_npr} <span className="text-xs font-sans text-[#8A7966] font-normal">/ cycle</span>
                        </span>
                      </div>
                      <p className="text-xs text-[#8A7966]">
                        {activeOrder.plan_name} • ~{activeOrder.weight_kg * 60} fresh cups • Small-batch roasted in Lalitpur
                      </p>
                    </div>

                    {/* 3 Core Quick-Action Buttons */}
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => setIsGrindModalOpen(true)}
                        className="px-4 py-2.5 bg-[#FAF8F5] hover:bg-white border border-[#E6DEC8] hover:border-[#1A1512] text-xs uppercase tracking-wider font-bold text-[#1A1512] transition-colors rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <SlidersHorizontal size={14} className="text-[#A3432A]" />
                        <span>Grind: <strong className="text-[#A3432A]">{grindType.split(" ")[0]}</strong></span>
                      </button>

                      <button
                        onClick={handleSkipDelivery}
                        className="px-4 py-2.5 bg-[#FAF8F5] hover:bg-white border border-[#E6DEC8] hover:border-[#1A1512] text-xs uppercase tracking-wider font-bold text-[#1A1512] transition-colors rounded-xl shadow-xs cursor-pointer"
                      >
                        {subStatus === "SKIPPED" ? "Undo Skip" : "Skip Next Box"}
                      </button>

                      <button
                        onClick={handlePauseSubscription}
                        className="px-4 py-2.5 bg-[#FAF8F5] hover:bg-white border border-[#E6DEC8] hover:border-[#1A1512] text-xs uppercase tracking-wider font-bold text-[#5C5042] transition-colors rounded-xl shadow-xs cursor-pointer"
                      >
                        {subStatus === "PAUSED" ? "Resume Deliveries" : "Pause Plan"}
                      </button>

                      <button
                        onClick={() => setActiveTab("favorites")}
                        className="px-4 py-2.5 bg-white border border-[#E6DEC8] hover:border-[#A3432A] text-xs uppercase tracking-wider font-bold text-[#A3432A] transition-colors rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <RefreshCw size={13} /> Swap Origin
                      </button>
                    </div>

                    {/* Streamlined Shipping & Payment Strip */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6DEC8] space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#5C5042]">
                          <MapPin size={14} className="text-[#A3432A] shrink-0" />
                          <span>Delivery to: <strong className="text-[#1A1512]">{user.address || "Kathmandu Valley"}</strong></span>
                        </div>
                        <button
                          onClick={() => setIsAddressModalOpen(true)}
                          className="text-[#A3432A] font-bold hover:underline shrink-0 text-[11px]"
                        >
                          Change
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E6DEC8] text-[11px] text-[#8A7966]">
                        <span className="flex items-center gap-1.5">
                          <Truck size={13} className="text-[#2E6B34]" /> Express Courier: <strong>Free Doorstep Dispatch</strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CreditCard size={13} className="text-[#5C2D91]" /> Payment: <strong>Khalti Auto-Cleared</strong>
                        </span>
                      </div>
                    </div>

                    {/* Collapsible Barista Brewing Tip (Zero Clutter) */}
                    <div className="border border-[#E6DEC8] rounded-xl overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => setIsBrewGuideOpen(!isBrewGuideOpen)}
                        className="w-full px-4 py-2.5 text-left flex items-center justify-between text-xs font-bold text-[#1A1512] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Coffee size={14} className="text-[#A3432A]" />
                          <span>Barista Brew Recommendation for {activeOrder.origin_name}</span>
                        </span>
                        <ChevronDown size={14} className={`text-[#8A7966] transition-transform ${isBrewGuideOpen ? "rotate-180" : ""}`} />
                      </button>

                      {isBrewGuideOpen && (
                        <div className="px-4 py-3 bg-[#FAF8F5] border-t border-[#E6DEC8] grid grid-cols-3 gap-3 text-xs animate-fadeIn">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8A7966] block">Ideal Method</span>
                            <span className="font-bold text-[#1A1512]">{originInfo.idealBrew}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8A7966] block">Ratio</span>
                            <span className="font-bold text-[#A3432A]">{originInfo.ratio}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8A7966] block">Water Temp</span>
                            <span className="font-bold text-[#1A1512]">{originInfo.temp}</span>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-white border border-[#E6DEC8] rounded-2xl p-12 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#E6DEC8] flex items-center justify-center mx-auto mb-4 text-[#A3432A]">
                  <Coffee size={28} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#1A1512] mb-2">No Active Subscription Yet</h2>
                <p className="text-sm text-[#5C5042] max-w-md mx-auto mb-6 leading-relaxed">
                  Explore our single-origin coffees from Gulmi, Ilam, and Nuwakot. Customize your grind, frequency, and weight for freshly roasted monthly deliveries.
                </p>
                <Link
                  href="/subscribe"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1A1512] hover:bg-[#2C2420] text-white text-xs uppercase tracking-widest font-bold rounded-xl transition-colors shadow-sm"
                >
                  Configure Your First Subscription <ArrowRight size={14} />
                </Link>
              </div>
            )}

          </div>
        )}


        {/* ========================================================================= */}
        {/* TAB 2: FAVORITES & TASTING WISHLIST (INTERACTIVE DISCOVERY)               */}
        {/* ========================================================================= */}
        {activeTab === "favorites" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E6DEC8] p-6 rounded-2xl shadow-sm">
              <div>
                <h3 className="text-2xl font-serif font-bold text-[#1A1512]">
                  Coffee Favorites & Roastery Wishlist
                </h3>
                <p className="text-xs text-[#5C5042] mt-1">
                  Rate your favorite mountain origins and swap your upcoming monthly box with a single click.
                </p>
              </div>
              <span className="text-xs uppercase tracking-widest font-bold text-[#2E6B34] bg-[#E7F3E8] px-3.5 py-1.5 rounded-full border border-[#C3E4C6] self-start sm:self-auto">
                3 Origins Available to Swap
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(ORIGIN_DETAILS).map(([name, data]) => {
                const fav = favorites[name] || { rating: 5, note: "", isFavorite: true };
                const isCurrentActive = activeOrder?.origin_name === name;

                return (
                  <div key={name} className="bg-white border border-[#E6DEC8] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="h-48 relative overflow-hidden">
                        <img src={data.img} alt={name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <span className="absolute top-3 left-3 bg-[#1A1512]/90 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded">
                          {data.altitude}
                        </span>
                        {isCurrentActive && (
                          <span className="absolute top-3 right-3 bg-[#2E6B34] text-white text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded">
                            ✓ Currently In Upcoming Box
                          </span>
                        )}
                        <div className="absolute bottom-3 left-3 text-white">
                          <p className="text-[10px] uppercase font-bold text-[#E58A1F]">{data.region}</p>
                          <h4 className="text-xl font-serif font-bold text-white">{name}</h4>
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        <div className="flex flex-wrap gap-1">
                          {data.notes.map((n) => (
                            <span key={n} className="text-[11px] px-2 py-0.5 bg-[#FAF8F5] text-[#1A1512] border border-[#E6DEC8] rounded">
                              {n}
                            </span>
                          ))}
                        </div>

                        {/* Interactive Star Rating */}
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A7966] mb-1">
                            Your Personal Tasting Rating:
                          </p>
                          <div className="flex items-center gap-1 text-[#E58A1F]">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => handleRateCoffee(name, s)}
                                className="hover:scale-125 transition-transform"
                                title={`Rate ${s} stars`}
                              >
                                <Star 
                                  size={16} 
                                  fill={s <= fav.rating ? "#E58A1F" : "none"} 
                                  stroke="#E58A1F" 
                                />
                              </button>
                            ))}
                            <span className="text-xs text-[#5C5042] ml-2 font-bold">{fav.rating} / 5</span>
                          </div>
                        </div>

                        {/* Tasting Note */}
                        <div className="p-3 bg-[#FAF8F5] border border-[#E6DEC8] rounded-lg">
                          <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A7966] mb-0.5">Tasting Note</p>
                          <p className="text-xs text-[#5C5042] italic">"{fav.note}"</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      {isCurrentActive ? (
                        <div className="w-full py-2.5 bg-[#E7F3E8] text-[#2E6B34] text-xs uppercase tracking-widest font-bold text-center rounded-xl border border-[#C3E4C6]">
                          Active Selection
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSwapCoffee(name)}
                          className="w-full py-2.5 bg-[#1A1512] hover:bg-[#A3432A] text-white text-xs uppercase tracking-widest font-bold text-center rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={13} /> Swap Into Next Box
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ORDERS & OFFICIAL TAX INVOICES                                      */}
        {/* ========================================================================= */}
        {activeTab === "orders" && (
          <section className="bg-white border border-[#E6DEC8] rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E6DEC8] gap-2 mb-6">
              <div>
                <h3 className="text-2xl font-serif font-bold text-[#1A1512]">
                  Order History & Tax Invoices
                </h3>
                <p className="text-xs text-[#8A7966] mt-0.5">
                  Official records, courier tracking details, and printable VAT invoices.
                </p>
              </div>
              <span className="text-xs uppercase tracking-widest font-bold text-[#5C5042] bg-[#FAF8F5] px-3 py-1.5 border border-[#E6DEC8] rounded-lg self-start sm:self-auto">
                {orders.length} Invoices Available
              </span>
            </div>

            {orders.length === 0 ? (
              <p className="text-center py-12 text-sm text-[#8A7966]">
                No past deliveries on record yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#FAF8F5] text-[10px] uppercase tracking-widest text-[#5C5042] font-bold border-b border-[#E6DEC8]">
                    <tr>
                      <th className="px-4 py-3.5">Invoice ID</th>
                      <th className="px-4 py-3.5">Roast Selection</th>
                      <th className="px-4 py-3.5">Commitment</th>
                      <th className="px-4 py-3.5">Total Paid</th>
                      <th className="px-4 py-3.5">Tracking Status</th>
                      <th className="px-4 py-3.5 text-right">Official Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DEC8]">
                    {orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="px-4 py-4 font-medium text-[#1A1512] whitespace-nowrap">
                          INV-{order.id.toString().padStart(5, "0")}
                          <p className="text-[10px] text-[#8A7966]">{new Date(order.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-[#1A1512]">{order.origin_name}</p>
                          <p className="text-xs text-[#8A7966]">{order.weight_kg} kg • Specialty Roast</p>
                        </td>
                        <td className="px-4 py-4 text-xs text-[#5C5042]">
                          {order.plan_name}
                        </td>
                        <td className="px-4 py-4 font-medium text-[#1A1512] whitespace-nowrap">
                          Rs. {order.total_price_npr}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider bg-[#E7F3E8] text-[#2E6B34] rounded-full border border-[#C3E4C6]">
                            {order.status || "CONFIRMED"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedReceipt(order)}
                            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#A3432A] hover:bg-[#FAF5F2] border border-[#E6DEC8] hover:border-[#A3432A] rounded-lg transition-colors inline-flex items-center gap-1.5"
                          >
                            <Printer size={13} /> View Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: RETURNS & SUBSCRIPTION CANCELLATION                                 */}
        {/* ========================================================================= */}
        {activeTab === "returns" && (
          <div className="space-y-8">
            <div className="bg-white border border-[#E6DEC8] p-6 md:p-8 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2.5 mb-2">
                <RotateCcw size={22} className="text-[#A3432A]" />
                <h3 className="text-2xl font-serif font-bold text-[#1A1512]">
                  Returns & Doorstep Courier Pickup
                </h3>
              </div>
              <p className="text-xs text-[#5C5042] max-w-2xl leading-relaxed mb-6">
                Under BrewMellow's <strong>Traditional Return Policy</strong>, unopened and sealed bags of coffee can be returned within <strong>7 days of delivery</strong>. Our Himalayan courier partner will pick up the package directly from your doorstep and initiate your manual refund to Khalti.
              </p>

              {returnForm.submitted ? (
                <div className="p-6 bg-[#E7F3E8] border border-[#C3E4C6] rounded-xl text-center max-w-lg mx-auto">
                  <CheckCircle2 size={36} className="text-[#2E6B34] mx-auto mb-2" />
                  <h4 className="text-base font-bold text-[#1A1512]">Return Request Dispatched!</h4>
                  <p className="text-xs text-[#2E6B34] font-mono mt-1 font-bold">Ticket: {returnForm.ticketId}</p>
                  <p className="text-xs text-[#5C5042] mt-3">
                    A Himalayan Express courier will arrive at your address within 24-48 business hours. Upon inspection, your refund of the full order amount will be credited to your original payment method.
                  </p>
                  <button
                    onClick={() => setReturnForm((prev) => ({ ...prev, submitted: false }))}
                    className="mt-4 px-4 py-2 text-xs uppercase tracking-widest font-bold text-[#2E6B34] underline"
                  >
                    Submit Another Return
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReturnSubmit} className="max-w-2xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1">
                        Select Order / Batch *
                      </label>
                      <select
                        value={returnForm.orderId}
                        onChange={(e) => setReturnForm({ ...returnForm, orderId: e.target.value })}
                        className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
                      >
                        {orders.map((o) => (
                          <option key={o.id} value={`INV-${o.id.toString().padStart(5, "0")}`}>
                            INV-{o.id.toString().padStart(5, "0")} — {o.origin_name} ({o.total_price_npr} NPR)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1">
                        Return Reason *
                      </label>
                      <select
                        value={returnForm.reason}
                        onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                        className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
                      >
                        <option value="Packaging arrived damaged in courier transit">Packaging arrived damaged</option>
                        <option value="Incorrect grind size prepared">Incorrect grind size received</option>
                        <option value="Ordered incorrect origin by mistake">Accidentally ordered wrong coffee</option>
                        <option value="Unopened bag - decided not to consume">Unopened bag — changing preference</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1">
                      Doorstep Pickup Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={returnForm.pickupAddress}
                      onChange={(e) => setReturnForm({ ...returnForm, pickupAddress: e.target.value })}
                      className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1">
                      Additional Notes for Courier (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Please pick up after 2 PM"
                      value={returnForm.customerNotes}
                      onChange={(e) => setReturnForm({ ...returnForm, customerNotes: e.target.value })}
                      className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-[#A3432A] hover:bg-[#8A3722] text-white text-xs uppercase tracking-widest font-bold rounded-xl transition-colors shadow-sm inline-flex items-center gap-2"
                  >
                    <RotateCcw size={14} /> Schedule Doorstep Return Pickup
                  </button>
                </form>
              )}
            </div>

            {/* Subscription Cancellation & Pause Preferences */}
            <div className="bg-white border border-[#E6DEC8] p-6 md:p-8 rounded-2xl shadow-sm">
              <h3 className="text-xl font-serif font-bold text-[#1A1512] mb-1">
                Manage or Cancel Subscription Plan
              </h3>
              <p className="text-xs text-[#5C5042] mb-6 leading-relaxed max-w-2xl">
                Need a break from deliveries? Rather than losing your direct-trade pricing status, you can pause shipments or skip the upcoming delivery.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl">
                  <h5 className="font-bold text-xs text-[#1A1512] mb-1">Skip Next Box</h5>
                  <p className="text-[11px] text-[#5C5042] mb-3">Skip Oct 18 delivery. Resume automatically on Nov 15.</p>
                  <button
                    onClick={handleSkipDelivery}
                    className="text-xs font-bold text-[#A3432A] hover:underline"
                  >
                    {subStatus === "SKIPPED" ? "Undo Skip" : "Skip Single Box →"}
                  </button>
                </div>

                <div className="p-4 bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl">
                  <h5 className="font-bold text-xs text-[#1A1512] mb-1">Pause Indefinitely</h5>
                  <p className="text-[11px] text-[#5C5042] mb-3">Keep your pricing locked. Resume whenever you're ready.</p>
                  <button
                    onClick={handlePauseSubscription}
                    className="text-xs font-bold text-[#A3432A] hover:underline"
                  >
                    {subStatus === "PAUSED" ? "Resume Deliveries" : "Pause Subscription →"}
                  </button>
                </div>

                <div className="p-4 bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl">
                  <h5 className="font-bold text-xs text-[#A3432A] mb-1">Cancel Plan</h5>
                  <p className="text-[11px] text-[#5C5042] mb-3">Stop auto-renewal at the end of the current billing cycle.</p>
                  <button
                    onClick={handleCancelSubscription}
                    className="text-xs font-bold text-[#A3432A] hover:underline"
                  >
                    {subStatus === "CANCELLED" ? "Reactivate Subscription" : "Cancel Subscription →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: ROASTERY CONCIERGE & CUSTOMER SERVICE                               */}
        {/* ========================================================================= */}
        {activeTab === "support" && (
          <div className="space-y-8">
            
            {/* Live Roastery Status Banner */}
            <div className="bg-[#1A1512] text-[#F5F2EB] p-6 md:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2E6B34] animate-pulse"></span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#E58A1F]">
                    Lalitpur Roastery Live Operations
                  </span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-1">
                  Artisan Roasting & Concierge Support
                </h3>
                <p className="text-xs text-[#A89F91] max-w-xl leading-relaxed">
                  Our drum roasters and coffee sommeliers are on-site in Jhamsikhel, Lalitpur from 8:00 AM – 6:00 PM NPT. We're here for grind adjustments, water brewing ratios, or shipment support.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="https://wa.me/9779801234567"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-[#2E6B34] hover:bg-[#25582a] text-white text-xs uppercase tracking-widest font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
                >
                  <Phone size={14} /> WhatsApp Hotline
                </a>
                <a
                  href="mailto:concierge@brewmellow.com"
                  className="px-4 py-2.5 bg-[#FAF8F5] text-[#1A1512] hover:bg-white text-xs uppercase tracking-widest font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
                >
                  <Mail size={14} /> Email Roaster
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left: Concierge Inquiry Ticket Form (7 Cols) */}
              <div className="lg:col-span-7 bg-white border border-[#E6DEC8] p-6 md:p-8 rounded-2xl shadow-sm">
                <h4 className="text-xl font-serif font-bold text-[#1A1512] mb-1">
                  Send a Direct Message to the Roastery
                </h4>
                <p className="text-xs text-[#5C5042] mb-6">
                  Typical response time: Under 2 hours during roastery operating hours.
                </p>

                {supportForm.submitted ? (
                  <div className="p-6 bg-[#E7F3E8] border border-[#C3E4C6] rounded-xl text-center">
                    <CheckCheck size={36} className="text-[#2E6B34] mx-auto mb-2" />
                    <h5 className="font-bold text-[#1A1512] text-sm">Message Received by Roaster Team!</h5>
                    <p className="text-xs text-[#5C5042] mt-1">
                      Our head roaster in Lalitpur has received your inquiry and will respond to <strong>{user.email}</strong> shortly.
                    </p>
                    <button
                      onClick={() => setSupportForm({ subject: "Roast Date & Freshness Inquiry", message: "", submitted: false })}
                      className="mt-4 px-4 py-2 text-xs uppercase tracking-widest font-bold text-[#2E6B34] underline"
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSupportSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1">
                        Topic / Category *
                      </label>
                      <select
                        value={supportForm.subject}
                        onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                        className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
                      >
                        <option value="Roast Date & Freshness Inquiry">Roast Date & Freshness Inquiry</option>
                        <option value="Grind Calibration Assistance">Grind Calibration Assistance (V60 / Espresso)</option>
                        <option value="Urgent Delivery Address Modification">Urgent Delivery Address Modification</option>
                        <option value="Direct-Trade Farmer Cooperative Questions">Direct-Trade Farmer Cooperative Questions</option>
                        <option value="General Question">Other Support Question</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1">
                        Your Message / Question *
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Tell us what you need help with..."
                        value={supportForm.message}
                        onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                        className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-3.5 bg-[#1A1512] hover:bg-[#2C2420] text-white text-xs uppercase tracking-widest font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
                    >
                      <Send size={14} /> Send Message to Roastery
                    </button>
                  </form>
                )}
              </div>

              {/* Right: Interactive FAQ Accordion (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                <h4 className="text-xl font-serif font-bold text-[#1A1512] mb-1">
                  Subscriber Knowledge Base & FAQ
                </h4>
                <p className="text-xs text-[#5C5042] mb-4">
                  Quick answers to common coffee subscription inquiries.
                </p>

                {[
                  {
                    q: "When is my coffee roasted before dispatch?",
                    a: "Every batch is roasted to order at our Lalitpur facility within 48 hours of dispatch, ensuring peak freshness and aroma bloom when it reaches your door."
                  },
                  {
                    q: "Can I swap my coffee origin or grind profile?",
                    a: "Yes! Use the 'Favorites & Wishlist' tab to swap your origin or click 'Customize Grind' in your subscription tab at any time before your scheduled roast date."
                  },
                  {
                    q: "How does doorstep delivery work across Nepal?",
                    a: "Kathmandu Valley deliveries are completed via Himalayan Express within 24 hours of roasting. Pokhara, Chitwan, and other regions arrive within 48-72 hours."
                  },
                  {
                    q: "What is your return & refund guarantee?",
                    a: "We accept courier doorstep returns for unopened bags within 7 days of delivery. For damaged packages or grind issues, our concierge initiates an immediate replacement or Khalti refund."
                  },
                ].map((faq, idx) => (
                  <div key={idx} className="bg-white border border-[#E6DEC8] rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full p-4 text-left font-serif font-bold text-sm text-[#1A1512] flex justify-between items-center hover:bg-[#FAF8F5] transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown 
                        size={16} 
                        className={`text-[#8A7966] transition-transform ${openFaq === idx ? "rotate-180 text-[#A3432A]" : ""}`} 
                      />
                    </button>
                    {openFaq === idx && (
                      <div className="p-4 pt-0 text-xs text-[#5C5042] leading-relaxed border-t border-[#F0EAE1] bg-[#FAF8F5]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CUSTOMIZE GRIND PROFILE                                          */}
      {/* ========================================================================= */}
      {isGrindModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full border border-[#E6DEC8] p-8 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-serif font-bold text-[#1A1512]">Customize Grind Profile</h3>
              <button onClick={() => setIsGrindModalOpen(false)} className="text-[#8A7966] hover:text-[#1A1512]">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-xs text-[#5C5042] mb-6 leading-relaxed">
              Choose how you want your Himalayan beans prepared for your upcoming monthly roast:
            </p>

            <div className="space-y-3 mb-6">
              {[
                { name: "Whole Bean", desc: "For home burr grinders • Retains peak aroma longest" },
                { name: "Espresso (Fine)", desc: "Tailored for manual espresso & moka pots" },
                { name: "Pour-Over (Medium)", desc: "Optimized for V60, Chemex, and drip machines" },
                { name: "French Press (Coarse)", desc: "Coarse ground for cold brew & French press" },
              ].map((g) => (
                <label 
                  key={g.name}
                  onClick={() => setGrindType(g.name)}
                  className={`flex items-start justify-between p-3.5 border rounded-xl cursor-pointer transition-colors ${
                    grindType === g.name 
                      ? "border-[#A3432A] bg-[#FAF5F2]" 
                      : "border-[#E6DEC8] hover:bg-[#FAF8F5]"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-[#1A1512] block">{g.name}</span>
                    <span className="text-[11px] text-[#8A7966]">{g.desc}</span>
                  </div>
                  <span
                    className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center shrink-0 mt-0.5 ${
                      grindType === g.name
                        ? "bg-green-500 border-green-500 ring-2 ring-green-500/20"
                        : "border-[#C8BFAB] bg-transparent"
                    }`}
                  >
                    {grindType === g.name && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={() => {
                setIsGrindModalOpen(false);
                showToast(`Grind profile updated to: ${grindType}. Applied to upcoming shipment.`);
              }}
              className="w-full bg-[#1A1512] text-white py-3.5 text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors rounded-xl"
            >
              Save Grind Preferences
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT DELIVERY ADDRESS                                            */}
      {/* ========================================================================= */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full border border-[#E6DEC8] p-8 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-serif font-bold text-[#1A1512]">Update Shipping Destination</h3>
              <button onClick={() => setIsAddressModalOpen(false)} className="text-[#8A7966] hover:text-[#1A1512]">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1">
                  Delivery Street Address / Ward / Area *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1">
                  Mobile Phone Number (for courier SMS) *
                </label>
                <input
                  type="tel"
                  required
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1A1512] text-white py-3.5 text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors rounded-xl mt-2"
              >
                Save Shipping Address
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: OFFICIAL TAX INVOICE / RECEIPT MODAL                             */}
      {/* ========================================================================= */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full border border-[#E6DEC8] p-8 shadow-2xl my-8 rounded-2xl animate-in zoom-in-95 duration-150">
            
            <div className="flex justify-between items-center pb-6 mb-6 border-b border-[#E6DEC8]">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#2E6B34]">
                <CheckCircle2 size={16} /> Official Tax Invoice (Nepal VAT)
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1512] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors rounded-lg"
                >
                  <Printer size={14} /> Print / Save PDF
                </button>
                <button onClick={() => setSelectedReceipt(null)} className="text-[#8A7966] hover:text-[#1A1512]">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-6 text-[#1A1512]">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-2xl font-serif font-bold text-[#1A1512]">BrewMellow.</h4>
                  <p className="text-xs text-[#5C5042]">BrewMellow Himalayan Roasters Pvt. Ltd.</p>
                  <p className="text-xs text-[#8A7966]">Jhamsikhel, Lalitpur, Nepal</p>
                  <p className="text-xs text-[#8A7966]">PAN / VAT: 609812450</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest font-bold text-[#8A7966]">Invoice No.</p>
                  <p className="text-sm font-bold text-[#1A1512]">INV-{selectedReceipt.id.toString().padStart(5, '0')}</p>
                  <p className="text-xs text-[#8A7966] mt-1">Date: {new Date(selectedReceipt.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#E6DEC8] text-xs rounded-xl">
                <p className="uppercase tracking-widest font-bold text-[#8A7966] mb-1">Billed To (Subscriber)</p>
                <p className="font-bold text-[#1A1512]">{user.name}</p>
                <p className="text-[#5C5042]">{user.email}</p>
                <p className="text-[#5C5042]">{user.address}</p>
              </div>

              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E6DEC8] text-[#8A7966] uppercase tracking-wider font-bold">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">Commitment</th>
                    <th className="py-2 text-right">Amount (NPR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1]">
                  <tr>
                    <td className="py-3">
                      <p className="font-bold text-[#1A1512]">{selectedReceipt.origin_name} Specialty Lot</p>
                      <p className="text-[#8A7966]">{selectedReceipt.weight_kg} kg Monthly Delivery • {grindType}</p>
                    </td>
                    <td className="py-3 text-center text-[#5C5042]">{selectedReceipt.plan_name}</td>
                    <td className="py-3 text-right font-medium text-[#1A1512]">Rs. {selectedReceipt.total_price_npr}</td>
                  </tr>
                </tbody>
              </table>

              <div className="pt-4 border-t border-[#E6DEC8] space-y-1.5 text-xs text-right">
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Subtotal:</span>
                  <span className="font-medium">Rs. {selectedReceipt.total_price_npr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Himalayan Shipping:</span>
                  <span className="font-medium text-[#2E6B34]">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">VAT (13% Included):</span>
                  <span className="font-medium">Rs. {(parseFloat(selectedReceipt.total_price_npr) * 0.115).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E6DEC8] text-sm font-bold">
                  <span>Total Paid (NPR):</span>
                  <span className="text-[#A3432A]">Rs. {selectedReceipt.total_price_npr}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
