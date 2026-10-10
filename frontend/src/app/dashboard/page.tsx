"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Package, MapPin, CreditCard, MoreVertical, Download, ExternalLink, 
  Calendar, Loader2, CheckCircle2, Clock, Truck, Home as HomeIcon,
  X, Printer, AlertCircle, Sparkles, Check, Coffee
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState<{ name: string; email: string; address: string; memberSince: string } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive Subscription State
  const [subStatus, setSubStatus] = useState<"ACTIVE" | "SKIPPED" | "PAUSED" | "CANCELLED">("ACTIVE");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [grindType, setGrindType] = useState("Whole Bean");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  useEffect(() => {
    // 1. Get user from mock login
    const savedUser = localStorage.getItem("demo_user");
    if (!savedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(savedUser));

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

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#1A1512]" />
      </div>
    );
  }

  const activeOrder = orders.length > 0 ? orders[0] : null;

  const handleSkipDelivery = () => {
    if (subStatus === "SKIPPED") {
      setSubStatus("ACTIVE");
      showToast("Skip cancelled. Your upcoming delivery on Oct 18 is active.");
    } else {
      setSubStatus("SKIPPED");
      showToast("Upcoming delivery skipped! Your next shipment is scheduled for Nov 15, 2026.");
    }
  };

  const handlePauseSubscription = () => {
    if (subStatus === "PAUSED") {
      setSubStatus("ACTIVE");
      showToast("Subscription resumed. Monthly deliveries are active.");
    } else {
      setSubStatus("PAUSED");
      showToast("Subscription paused. You will not be billed until you resume.");
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

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans pb-24 relative">
      
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

      {/* Dashboard Header */}
      <div className="bg-[#1A1512] text-[#F5F2EB] pt-16 pb-0 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-serif font-bold">{user.name}</h1>
                <span className="bg-[#2E6B34] text-white text-[9px] uppercase tracking-widest px-2 py-0.5 font-bold rounded">
                  Verified Member
                </span>
              </div>
              <p className="text-[#A89F91] text-sm">{user.email} • Member since {user.memberSince}</p>
            </div>
            <Link 
              href="/subscribe" 
              className="inline-flex items-center justify-center px-6 py-2 bg-[#F5F2EB] text-[#1A1512] text-xs uppercase tracking-widest font-bold hover:bg-[#EAE4D3] transition-colors"
            >
              + New Subscription
            </Link>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-8 overflow-x-auto no-scrollbar">
            {["overview", "order history", "settings"].map((tab) => (
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
            <button 
              onClick={() => { localStorage.removeItem("demo_user"); router.push("/login"); }}
              className="pb-4 text-xs uppercase tracking-widest font-bold whitespace-nowrap border-b-2 border-transparent text-[#7A6A58] hover:text-[#A3432A] transition-colors ml-auto"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Main Panels) */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Active Subscription Component */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold text-[#1A1512]">Active Subscription</h2>
              <span className="text-xs uppercase tracking-widest font-bold text-[#8A7966]">
                Plan Commitment: 3 Months Prepaid
              </span>
            </div>
            
            {activeOrder ? (
              <div className="bg-white border border-[#E6DEC8] p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-serif font-bold text-[#1A1512]">{activeOrder.origin_name}</h3>
                    {subStatus === "ACTIVE" && (
                      <span className="px-2 py-1 bg-[#E7F3E8] text-[#2E6B34] text-[10px] font-bold uppercase tracking-widest rounded-sm">
                        Active
                      </span>
                    )}
                    {subStatus === "SKIPPED" && (
                      <span className="px-2 py-1 bg-[#FFF4E5] text-[#B76E00] text-[10px] font-bold uppercase tracking-widest rounded-sm">
                        Skipped (Next: Nov 15)
                      </span>
                    )}
                    {subStatus === "PAUSED" && (
                      <span className="px-2 py-1 bg-[#F5F2EB] text-[#5C5042] text-[10px] font-bold uppercase tracking-widest rounded-sm">
                        Paused
                      </span>
                    )}
                    {subStatus === "CANCELLED" && (
                      <span className="px-2 py-1 bg-[#FAF5F5] text-[#A3432A] text-[10px] font-bold uppercase tracking-widest rounded-sm">
                        Cancelled
                      </span>
                    )}
                  </div>

                  <p className="text-[#5C5042] text-sm mb-4">
                    {activeOrder.weight_kg} kg/delivery • {activeOrder.plan_name} • <span className="font-semibold text-[#1A1512]">{grindType}</span>
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#F0EAE1]">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A7966] mb-1">Next Delivery</p>
                      <p className="text-sm font-medium text-[#1A1512] flex items-center gap-2">
                        <Calendar size={14} className="text-[#A3432A]" /> 
                        {subStatus === "SKIPPED" ? "Nov 15, 2026" : subStatus === "PAUSED" ? "Paused (On Hold)" : "Oct 18, 2026"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A7966] mb-1">Prepaid Total</p>
                      <p className="text-sm font-medium text-[#1A1512]">Rs. {activeOrder.total_price_npr}</p>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-2 justify-center md:border-l md:border-[#E6DEC8] md:pl-6 min-w-[160px]">
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full py-2.5 border border-[#E6DEC8] text-xs uppercase tracking-widest font-bold text-[#1A1512] hover:bg-[#F5F2EB] transition-colors"
                  >
                    Edit Grind / Plan
                  </button>
                  <button 
                    onClick={handleSkipDelivery}
                    className="w-full py-2.5 border border-[#E6DEC8] text-xs uppercase tracking-widest font-bold text-[#1A1512] hover:bg-[#F5F2EB] transition-colors"
                  >
                    {subStatus === "SKIPPED" ? "Undo Skip" : "Skip Delivery"}
                  </button>
                  <button 
                    onClick={handlePauseSubscription}
                    className="w-full py-2.5 border border-[#E6DEC8] text-xs uppercase tracking-widest font-bold text-[#5C5042] hover:bg-[#F5F2EB] transition-colors"
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
              <div className="bg-white border border-[#E6DEC8] p-12 text-center">
                <p className="text-[#5C5042] mb-4">You don't have any active subscriptions.</p>
                <Link href="/subscribe" className="inline-block bg-[#1A1512] text-white px-6 py-3 text-sm uppercase tracking-widest font-bold hover:bg-[#2C2420]">
                  Configure Subscription
                </Link>
              </div>
            )}
          </section>

          {/* Himalayan Logistics & Roasting Tracker */}
          {activeOrder && (
            <section className="bg-white border border-[#E6DEC8] p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-6 border-b border-[#F0EAE1] gap-2">
                <div>
                  <h3 className="text-base font-serif font-bold text-[#1A1512] flex items-center gap-2">
                    <Coffee size={18} className="text-[#A3432A]" /> Himalayan Roastery & Delivery Tracker
                  </h3>
                  <p className="text-xs text-[#8A7966] mt-0.5">Tracking ID: BM-EXP-2026-NP • Carrier: Himalayan Courier</p>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#E58A1F] bg-[#FFF8EE] px-3 py-1 rounded border border-[#F3DFC1]">
                  In Progress: Roasting
                </span>
              </div>

              {/* Step Tracker */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                
                {/* Step 1: Confirmed */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-[#2E6B34] text-white flex items-center justify-center font-bold mb-2 shadow-sm">
                    <Check size={18} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1A1512]">Order Confirmed</p>
                  <p className="text-[10px] text-[#8A7966]">Payment Cleared</p>
                </div>

                {/* Step 2: Roasting */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-[#E58A1F] text-white flex items-center justify-center font-bold mb-2 shadow-sm animate-pulse">
                    <Clock size={18} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#E58A1F]">Roasting in Valley</p>
                  <p className="text-[10px] text-[#8A7966]">Fresh Batch Scheduled</p>
                </div>

                {/* Step 3: Transit */}
                <div className="flex flex-col items-center text-center opacity-40">
                  <div className="w-10 h-10 rounded-full bg-[#E6DEC8] text-[#5C5042] flex items-center justify-center font-bold mb-2">
                    <Truck size={18} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#5C5042]">In Transit</p>
                  <p className="text-[10px] text-[#8A7966]">Kathmandu Hub</p>
                </div>

                {/* Step 4: Delivered */}
                <div className="flex flex-col items-center text-center opacity-40">
                  <div className="w-10 h-10 rounded-full bg-[#E6DEC8] text-[#5C5042] flex items-center justify-center font-bold mb-2">
                    <HomeIcon size={18} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#5C5042]">Delivered</p>
                  <p className="text-[10px] text-[#8A7966]">Expected Oct 18</p>
                </div>
              </div>
            </section>
          )}

          {/* Recent Orders Table Component */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#1A1512]">Order & Delivery History</h2>
                <p className="text-xs text-[#8A7966]">Click the receipt icon to view official VAT invoice</p>
              </div>
            </div>
            
            <div className="bg-white border border-[#E6DEC8] overflow-hidden overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#FAF8F5] text-[10px] uppercase tracking-widest text-[#5C5042] font-bold border-b border-[#E6DEC8]">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Origin / Plan</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Tax Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DEC8]">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[#8A7966]">No orders found.</td>
                    </tr>
                  ) : (
                    orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="px-6 py-4 font-medium text-[#1A1512]">#{order.id.toString().padStart(4, '0')}</td>
                        <td className="px-6 py-4 text-[#5C5042] whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-[#1A1512]">{order.origin_name}</p>
                          <p className="text-xs text-[#8A7966]">{order.weight_kg}kg • {order.plan_name}</p>
                        </td>
                        <td className="px-6 py-4 font-medium text-[#1A1512]">Rs. {order.total_price_npr}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-[#E7F3E8] text-[#2E6B34] text-[10px] uppercase font-bold tracking-wider rounded">
                            {order.status || "CONFIRMED"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setSelectedReceipt(order)}
                            title="View Official Receipt"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F2EB] hover:bg-[#EAE4D3] text-[#1A1512] text-xs font-bold uppercase tracking-wider transition-colors border border-[#E6DEC8]"
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
          </section>

        </div>

        {/* Right Column (Side Widgets) */}
        <div className="space-y-8">
          
          {/* Address Widget */}
          <section>
            <h2 className="text-lg font-serif font-bold text-[#1A1512] mb-4">Delivery Profile</h2>
            <div className="bg-white border border-[#E6DEC8] p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#5C5042] flex items-center gap-2">
                  <MapPin size={14} /> Primary Shipping Address
                </p>
                <button 
                  onClick={() => showToast("Address management: Click 'Edit' to update")}
                  className="text-[#A89F91] hover:text-[#1A1512] transition-colors"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
              <div className="text-sm text-[#2C2420] leading-relaxed">
                <p className="font-bold">{user.name}</p>
                <p className="text-[#5C5042] whitespace-pre-line mt-1">{user.address}</p>
                <p className="text-[#8A7966] text-xs mt-3 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-[#2E6B34]" /> Standard Doorstep Delivery
                </p>
              </div>
            </div>
          </section>

          {/* Payment Method Widget */}
          <section>
            <div className="bg-[#FAF8F5] border border-[#E6DEC8] p-6">
              <div className="flex justify-between items-start mb-6">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#5C5042] flex items-center gap-2">
                  <CreditCard size={14} /> Digital Payment Method
                </p>
              </div>
              
              <div className="bg-white border border-[#E6DEC8] p-4 flex items-center gap-4 mb-4">
                <div className="w-12 h-8 bg-[#5C2D91] rounded-sm flex items-center justify-center text-white text-[8px] font-bold tracking-widest">
                  KHALTI
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1512]">Wallet Token Linked</p>
                  <p className="text-[10px] text-[#8A7966]">Auto-renews at commitment end</p>
                </div>
              </div>
              
              <button 
                onClick={() => showToast("Billing details: Managed securely via Khalti gateway")}
                className="text-[10px] uppercase tracking-widest font-bold text-[#A3432A] flex items-center gap-1 hover:text-[#8A3722] transition-colors"
              >
                Billing History <ExternalLink size={12} />
              </button>
            </div>
          </section>

          {/* Sourcing Guarantee Badge */}
          <section className="bg-[#1A1512] text-[#F5F2EB] p-6 border border-[#2C2420]">
            <h4 className="text-sm font-serif font-bold text-[#E58A1F] mb-2 uppercase tracking-widest">
              Direct Trade Himalayan Promise
            </h4>
            <p className="text-xs text-[#A89F91] leading-relaxed">
              Every bean delivered through your subscription pays 45% above commodity market rate directly to smallholder farming cooperatives in Nepal.
            </p>
          </section>

        </div>
      </div>

      {/* Edit Grind & Plan Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full border border-[#E6DEC8] p-8 shadow-2xl">
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
                  className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
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
                showToast(`Grind updated to: ${grindType}. Applied to next monthly delivery.`);
              }}
              className="w-full bg-[#1A1512] text-white py-3.5 text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Official Tax Invoice / Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full border border-[#E6DEC8] p-8 shadow-2xl my-8">
            
            {/* Action Bar (Top) */}
            <div className="flex justify-between items-center pb-6 mb-6 border-b border-[#E6DEC8]">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#2E6B34]">
                <CheckCircle2 size={16} /> Official Tax Invoice
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1512] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors"
                >
                  <Printer size={14} /> Print / Save PDF
                </button>
                <button onClick={() => setSelectedReceipt(null)} className="text-[#8A7966] hover:text-[#1A1512]">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Invoice Body */}
            <div className="space-y-6 text-[#1A1512]">
              
              {/* Company & Invoice Header */}
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

              {/* Billed To */}
              <div className="p-4 bg-[#FAF8F5] border border-[#E6DEC8] text-xs">
                <p className="uppercase tracking-widest font-bold text-[#8A7966] mb-1">Billed To (Subscriber)</p>
                <p className="font-bold text-[#1A1512]">{user.name}</p>
                <p className="text-[#5C5042]">{user.email}</p>
                <p className="text-[#5C5042]">{user.address}</p>
              </div>

              {/* Items Table */}
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

              {/* Breakdown */}
              <div className="pt-4 border-t border-[#E6DEC8] space-y-1.5 text-xs text-right">
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Subtotal:</span>
                  <span className="font-medium">Rs. {selectedReceipt.total_price_npr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Himalayan Shipping & Handling:</span>
                  <span className="font-medium text-[#2E6B34]">FREE (Subscription Benefit)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A7966]">Applicable VAT (13% Included):</span>
                  <span className="font-medium">Rs. {(parseFloat(selectedReceipt.total_price_npr) * 0.115).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E6DEC8] text-sm font-bold">
                  <span>Total Paid (NPR):</span>
                  <span className="text-[#A3432A]">Rs. {selectedReceipt.total_price_npr}</span>
                </div>
              </div>

              {/* Payment Method Details */}
              <div className="pt-4 border-t border-[#E6DEC8] flex justify-between items-center text-[11px] text-[#8A7966]">
                <p>Payment: <span className="font-bold text-[#1A1512]">Khalti Wallet</span> • Status: <span className="text-[#2E6B34] font-bold">PAID</span></p>
                <p>Authorized Digital Receipt</p>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
