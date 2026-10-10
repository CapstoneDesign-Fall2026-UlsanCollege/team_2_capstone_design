"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Package, MapPin, CreditCard, MoreVertical, Download, ExternalLink, 
  Calendar, Loader2, CheckCircle2, Clock, Truck, Home as HomeIcon,
  X, Printer, AlertCircle, Sparkles, Check, Coffee, User, Settings,
  LogOut, Save, Shield
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "order history" | "settings">("overview");
  const [user, setUser] = useState<{ name: string; email: string; phone?: string; address: string; memberSince: string } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive Subscription State
  const [subStatus, setSubStatus] = useState<"ACTIVE" | "SKIPPED" | "PAUSED" | "CANCELLED">("ACTIVE");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [grindType, setGrindType] = useState("Whole Bean");

  // Editable Profile Form (Settings Tab)
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
    }, 4000);
  };

  useEffect(() => {
    // 1. Get user session
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

    // 2. Fetch real orders
    const fetchOrders = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/orders/");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
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
    showToast("Profile & delivery destination updated successfully.");
  };

  const handleSkipDelivery = () => {
    if (subStatus === "SKIPPED") {
      setSubStatus("ACTIVE");
      showToast("Skip cancelled. Upcoming delivery on Oct 18 is active.");
    } else {
      setSubStatus("SKIPPED");
      showToast("Upcoming delivery skipped! Next shipment scheduled for Nov 15, 2026.");
    }
  };

  const handlePauseSubscription = () => {
    if (subStatus === "PAUSED") {
      setSubStatus("ACTIVE");
      showToast("Subscription resumed. Monthly deliveries are active.");
    } else {
      setSubStatus("PAUSED");
      showToast("Subscription paused. Deliveries are on hold.");
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

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center font-sans">
        <Loader2 size={32} className="animate-spin text-[#1A1512]" />
      </div>
    );
  }

  const activeOrder = orders.length > 0 ? orders[0] : null;

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans pb-32 relative">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-[#1A1512] text-[#F5F2EB] px-6 py-4 rounded shadow-2xl border border-[#A3432A] flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <Sparkles size={18} className="text-[#E58A1F] flex-shrink-0" />
          <p className="text-xs uppercase tracking-widest font-bold">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="ml-3 text-[#A89F91] hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Dashboard Top Header */}
      <div className="bg-[#1A1512] text-[#F5F2EB] pt-16 pb-0 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-serif font-bold">{user.name}</h1>
                <span className="bg-[#2E6B34] text-white text-[9px] uppercase tracking-widest px-2 py-0.5 font-bold rounded">
                  Active Subscriber
                </span>
              </div>
              <p className="text-[#A89F91] text-xs">
                {user.email} • {user.phone || "+977 9801234567"} • Member since {user.memberSince}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link 
                href="/subscribe" 
                className="inline-flex items-center justify-center px-5 py-2.5 bg-[#F5F2EB] text-[#1A1512] text-xs uppercase tracking-widest font-bold hover:bg-[#EAE4D3] transition-colors rounded"
              >
                + New Subscription
              </Link>
              <button
                onClick={() => { localStorage.removeItem("demo_user"); router.push("/login"); }}
                className="p-2.5 text-[#A89F91] hover:text-[#A3432A] transition-colors"
                title="Log Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Clean Navigation Tabs */}
          <div className="flex gap-8 overflow-x-auto no-scrollbar border-b border-[#2C2420]">
            {(["overview", "order history", "settings"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-xs uppercase tracking-widest font-bold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab 
                    ? "border-[#A3432A] text-white" 
                    : "border-transparent text-[#7A6A58] hover:text-[#D3C7B1]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        
        {/* ========================================================= */}
        {/* VIEW 1: OVERVIEW TAB */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-8">
              
              {/* Active Subscription Component */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-serif font-bold text-[#1A1512]">Active Subscription</h2>
                  <span className="text-xs uppercase tracking-widest font-bold text-[#8A7966]">
                    Prepaid Commitment Active
                  </span>
                </div>

                {activeOrder ? (
                  <div className="bg-white border border-[#E6DEC8] p-6 md:p-8 shadow-sm rounded-lg flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-serif font-bold text-[#1A1512]">{activeOrder.origin_name}</h3>
                        {subStatus === "ACTIVE" && (
                          <span className="px-2.5 py-1 bg-[#E7F3E8] text-[#2E6B34] text-[10px] font-bold uppercase tracking-widest rounded">
                            Active
                          </span>
                        )}
                        {subStatus === "SKIPPED" && (
                          <span className="px-2.5 py-1 bg-[#FFF4E5] text-[#B76E00] text-[10px] font-bold uppercase tracking-widest rounded">
                            Skipped
                          </span>
                        )}
                        {subStatus === "PAUSED" && (
                          <span className="px-2.5 py-1 bg-[#F5F2EB] text-[#5C5042] text-[10px] font-bold uppercase tracking-widest rounded">
                            Paused
                          </span>
                        )}
                        {subStatus === "CANCELLED" && (
                          <span className="px-2.5 py-1 bg-[#FAF5F5] text-[#A3432A] text-[10px] font-bold uppercase tracking-widest rounded">
                            Cancelled
                          </span>
                        )}
                      </div>

                      <p className="text-[#5C5042] text-sm mb-4">
                        {activeOrder.weight_kg} kg/delivery • {activeOrder.plan_name} • <span className="font-semibold text-[#1A1512]">{grindType}</span>
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#F0EAE1]">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A7966] mb-1">Next Delivery</p>
                          <p className="text-sm font-medium text-[#1A1512] flex items-center gap-2">
                            <Calendar size={14} className="text-[#A3432A]" /> 
                            {subStatus === "SKIPPED" ? "Nov 15, 2026" : subStatus === "PAUSED" ? "Paused (On Hold)" : "Oct 18, 2026"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A7966] mb-1">Total Paid</p>
                          <p className="text-sm font-medium text-[#1A1512]">Rs. {activeOrder.total_price_npr}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 justify-center md:border-l md:border-[#E6DEC8] md:pl-6 min-w-[170px]">
                      <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="w-full py-2.5 border border-[#E6DEC8] text-xs uppercase tracking-widest font-bold text-[#1A1512] hover:bg-[#F5F2EB] transition-colors rounded"
                      >
                        Edit Grind
                      </button>
                      <button 
                        onClick={handleSkipDelivery}
                        className="w-full py-2.5 border border-[#E6DEC8] text-xs uppercase tracking-widest font-bold text-[#1A1512] hover:bg-[#F5F2EB] transition-colors rounded"
                      >
                        {subStatus === "SKIPPED" ? "Undo Skip" : "Skip Delivery"}
                      </button>
                      <button 
                        onClick={handlePauseSubscription}
                        className="w-full py-2.5 border border-[#E6DEC8] text-xs uppercase tracking-widest font-bold text-[#5C5042] hover:bg-[#F5F2EB] transition-colors rounded"
                      >
                        {subStatus === "PAUSED" ? "Resume Plan" : "Pause Plan"}
                      </button>
                      <button 
                        onClick={handleCancelSubscription}
                        className="w-full py-1.5 text-[11px] uppercase tracking-widest font-bold text-[#A3432A] hover:underline transition-colors mt-1"
                      >
                        {subStatus === "CANCELLED" ? "Reactivate Plan" : "Cancel Plan"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-[#E6DEC8] p-12 text-center rounded-lg">
                    <p className="text-[#5C5042] mb-4">You do not have any active subscriptions.</p>
                    <Link href="/subscribe" className="inline-block bg-[#1A1512] text-white px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] rounded">
                      Configure Subscription
                    </Link>
                  </div>
                )}
              </section>

              {/* Himalayan Logistics & Roasting Tracker */}
              {activeOrder && (
                <section className="bg-white border border-[#E6DEC8] p-6 md:p-8 shadow-sm rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-6 border-b border-[#F0EAE1] gap-2">
                    <div>
                      <h3 className="text-base font-serif font-bold text-[#1A1512] flex items-center gap-2">
                        <Coffee size={18} className="text-[#A3432A]" /> Himalayan Roastery & Delivery Tracker
                      </h3>
                      <p className="text-xs text-[#8A7966] mt-0.5">Tracking ID: BM-EXP-2026-NP • Carrier: Himalayan Courier</p>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#E58A1F] bg-[#FFF8EE] px-3 py-1 rounded border border-[#F3DFC1]">
                      Status: {activeOrder.status || "ROASTING"}
                    </span>
                  </div>

                  {/* 4-Step Visual Tracker */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-[#2E6B34] text-white flex items-center justify-center font-bold mb-2 shadow-sm">
                        <Check size={18} />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#1A1512]">Confirmed</p>
                      <p className="text-[10px] text-[#8A7966]">Payment Cleared</p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-[#E58A1F] text-white flex items-center justify-center font-bold mb-2 shadow-sm animate-pulse">
                        <Clock size={18} />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#E58A1F]">Roasting</p>
                      <p className="text-[10px] text-[#8A7966]">Lalitpur Drum</p>
                    </div>

                    <div className="flex flex-col items-center text-center opacity-40">
                      <div className="w-10 h-10 rounded-full bg-[#E6DEC8] text-[#5C5042] flex items-center justify-center font-bold mb-2">
                        <Truck size={18} />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#5C5042]">In Transit</p>
                      <p className="text-[10px] text-[#8A7966]">Courier Hub</p>
                    </div>

                    <div className="flex flex-col items-center text-center opacity-40">
                      <div className="w-10 h-10 rounded-full bg-[#E6DEC8] text-[#5C5042] flex items-center justify-center font-bold mb-2">
                        <HomeIcon size={18} />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#5C5042]">Delivered</p>
                      <p className="text-[10px] text-[#8A7966]">Doorstep Drop</p>
                    </div>
                  </div>
                </section>
              )}

            </div>

            {/* Side Widgets */}
            <div className="space-y-6">
              
              {/* Delivery Destination Snapshot */}
              <div className="bg-white border border-[#E6DEC8] p-6 shadow-sm rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[#5C5042] flex items-center gap-1.5">
                    <MapPin size={14} className="text-[#A3432A]" /> Shipping Destination
                  </p>
                  <button 
                    onClick={() => setActiveTab("settings")}
                    className="text-[10px] uppercase font-bold text-[#A3432A] hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="font-bold text-sm text-[#1A1512]">{user.name}</p>
                <p className="text-xs text-[#5C5042] mt-1 leading-relaxed">{user.address}</p>
                <p className="text-xs text-[#8A7966] mt-2">Phone: {user.phone || "+977 9801234567"}</p>
              </div>

              {/* Payment Method Snapshot */}
              <div className="bg-white border border-[#E6DEC8] p-6 shadow-sm rounded-lg">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#5C5042] flex items-center gap-1.5 mb-3">
                  <CreditCard size={14} className="text-[#5C2D91]" /> Primary Payment
                </p>
                <div className="flex items-center gap-3 p-3 bg-[#FAF8F5] border border-[#E6DEC8] rounded">
                  <div className="w-10 h-6 bg-[#5C2D91] rounded text-white text-[8px] font-bold flex items-center justify-center">
                    KHALTI
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-[#1A1512]">Khalti Wallet Token</p>
                    <p className="text-[#8A7966] text-[10px]">Auto-renewal enabled</p>
                  </div>
                </div>
              </div>

              {/* Sourcing Guarantee */}
              <div className="bg-[#1A1512] text-[#F5F2EB] p-6 border border-[#2C2420] rounded-lg">
                <h4 className="text-xs font-bold text-[#E58A1F] uppercase tracking-widest mb-1">
                  100% Direct-Trade Guarantee
                </h4>
                <p className="text-xs text-[#A89F91] leading-relaxed">
                  Every recurring roast supports smallholder mountain cooperatives in Western & Eastern Nepal.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: ORDER HISTORY TAB */}
        {/* ========================================================= */}
        {activeTab === "order history" && (
          <div className="bg-white border border-[#E6DEC8] shadow-sm rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#E6DEC8] flex justify-between items-center">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#1A1512]">Past Invoices & Deliveries</h2>
                <p className="text-xs text-[#8A7966]">Click the receipt button to view or print official tax invoice</p>
              </div>
              <span className="text-xs uppercase tracking-widest font-bold text-[#5C5042] bg-[#FAF8F5] px-3 py-1.5 border border-[#E6DEC8] rounded">
                {orders.length} Deliveries
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#FAF8F5] text-[10px] uppercase tracking-widest text-[#5C5042] font-bold border-b border-[#E6DEC8]">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Himalayan Roast</th>
                    <th className="px-6 py-4">Commitment</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Tax Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DEC8]">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-[#8A7966]">No orders found yet.</td>
                    </tr>
                  ) : (
                    orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="px-6 py-4 font-medium text-[#1A1512]">#{order.id.toString().padStart(4, '0')}</td>
                        <td className="px-6 py-4 text-[#5C5042] whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-[#1A1512]">
                          {order.origin_name} <span className="text-[#8A7966] font-normal text-xs">({order.weight_kg}kg)</span>
                        </td>
                        <td className="px-6 py-4 text-[#5C5042]">{order.plan_name}</td>
                        <td className="px-6 py-4 font-medium text-[#1A1512]">Rs. {order.total_price_npr}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 bg-[#E7F3E8] text-[#2E6B34] text-[10px] font-bold uppercase tracking-wider rounded">
                            {order.status || "CONFIRMED"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setSelectedReceipt(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F2EB] hover:bg-[#EAE4D3] text-[#1A1512] text-xs font-bold uppercase tracking-wider transition-colors border border-[#E6DEC8] rounded"
                          >
                            <Download size={13} /> Invoice
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: SETTINGS TAB (Profile, Address, Preferences) */}
        {/* ========================================================= */}
        {activeTab === "settings" && (
          <div className="max-w-2xl bg-white border border-[#E6DEC8] shadow-sm rounded-lg p-8 md:p-10">
            <h2 className="text-2xl font-serif font-bold text-[#1A1512] mb-1">Account & Delivery Settings</h2>
            <p className="text-xs text-[#8A7966] uppercase tracking-wider mb-8">
              Update your shipping address and contact credentials
            </p>

            <form onSubmit={handleProfileSave} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5] rounded"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5] rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                  Delivery Destination / Street Address
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5] rounded"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1A1512] hover:bg-[#2C2420] text-white text-xs uppercase tracking-widest font-bold rounded transition-colors shadow-sm"
              >
                <Save size={14} /> Save Changes
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Edit Grind Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full border border-[#E6DEC8] p-8 shadow-2xl rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-serif font-bold text-[#1A1512]">Customize Grind</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#8A7966] hover:text-[#1A1512]">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-[#5C5042] mb-6">
              Choose how you want your Himalayan beans prepared for your next recurring roast.
            </p>

            <div className="space-y-3 mb-8">
              {["Whole Bean", "Espresso (Fine)", "Pour Over / Drip (Medium)", "French Press / Cold Brew (Coarse)"].map((grind) => (
                <label 
                  key={grind}
                  onClick={() => setGrindType(grind)}
                  className={`flex items-center justify-between p-4 border rounded cursor-pointer transition-colors ${
                    grindType === grind 
                      ? "border-[#A3432A] bg-[#FAF5F2]" 
                      : "border-[#E6DEC8] hover:bg-[#FAF8F5]"
                  }`}
                >
                  <span className="text-xs uppercase tracking-widest font-bold text-[#1A1512]">{grind}</span>
                  {grindType === grind && <Check size={16} className="text-[#A3432A]" />}
                </label>
              ))}
            </div>

            <button
              onClick={() => {
                setIsEditModalOpen(false);
                showToast(`Grind updated to: ${grindType}. Applied to upcoming roast.`);
              }}
              className="w-full bg-[#1A1512] text-white py-3.5 text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors rounded"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Official Tax Invoice / Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full border border-[#E6DEC8] p-8 shadow-2xl my-8 rounded-xl">
            
            <div className="flex justify-between items-center pb-6 mb-6 border-b border-[#E6DEC8]">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#2E6B34]">
                <CheckCircle2 size={16} /> Official Tax Invoice
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1512] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors rounded"
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

              <div className="p-4 bg-[#FAF8F5] border border-[#E6DEC8] text-xs rounded">
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
                      <p className="font-bold text-[#1A1512]">{selectedReceipt.origin_name} Specialty Beans</p>
                      <p className="text-[#8A7966]">{selectedReceipt.weight_kg} kg Monthly Delivery • Whole Bean</p>
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
