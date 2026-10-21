"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Package, Users, Coffee, TrendingUp, Search, 
  ArrowUpRight, Download, RefreshCw, CheckCircle2, AlertCircle, 
  Truck, Flame, ShieldAlert, LogOut, 
  ExternalLink, Printer, X, Sparkles
} from "lucide-react";

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "customers" | "inventory" | "analytics">("orders");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders/");
      if (res.ok) {
        const data = await res.json();
        const sorted = data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setOrders(sorted);
        localStorage.setItem("cached_admin_orders", JSON.stringify(sorted));
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("demo_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        if (parsed.is_staff === true) {
          setIsAuthorized(true);

          // Stale-While-Revalidate: Instant render from cached orders
          const cached = localStorage.getItem("cached_admin_orders");
          if (cached) {
            try {
              const parsedOrders = JSON.parse(cached);
              if (Array.isArray(parsedOrders) && parsedOrders.length > 0) {
                setOrders(parsedOrders);
                setLoading(false); // Unblock view immediately!
              }
            } catch (e) {}
          }

          fetchOrders();
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    setIsAuthorized(false);
    setLoading(false);
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    showToast(`Order #${orderId} updated to: ${newStatus}`);

    try {
      await fetch(`/api/orders/${orderId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to persist status update:", err);
    }
  };

  // Filtered orders based on status & search query
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !q ||
        order.id.toString().includes(q) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(q)) ||
        (order.customer_email && order.customer_email.toLowerCase().includes(q)) ||
        (order.customer_phone && order.customer_phone.toLowerCase().includes(q)) ||
        (order.origin_name && order.origin_name.toLowerCase().includes(q)) ||
        (order.delivery_address && order.delivery_address.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  // Aggregated Customer CRM Records
  const customerDirectory = useMemo(() => {
    const map = new Map<string, any>();
    orders.forEach((o) => {
      const email = o.customer_email || `customer-${o.id}@guest.np`;
      if (!map.has(email)) {
        map.set(email, {
          email,
          name: o.customer_name || "Guest Customer",
          phone: o.customer_phone || "+977 9801234567",
          address: o.delivery_address || "Kathmandu, Nepal",
          ordersCount: 0,
          totalSpent: 0,
          lastOrderDate: o.created_at,
          favoriteOrigin: o.origin_name || "Gulmi Reserve",
        });
      }
      const record = map.get(email);
      record.ordersCount += 1;
      record.totalSpent += parseFloat(o.total_price_npr || 0);
      if (new Date(o.created_at) > new Date(record.lastOrderDate)) {
        record.lastOrderDate = o.created_at;
      }
    });
    return Array.from(map.values());
  }, [orders]);

  // CSV Export
  const handleExportCSV = () => {
    if (orders.length === 0) return;
    const headers = ["Order ID", "Date", "Customer Name", "Email", "Phone", "Origin", "Weight (kg)", "Plan", "Total NPR", "Status", "Address"];
    const rows = orders.map(o => [
      `#${o.id}`,
      new Date(o.created_at).toLocaleDateString(),
      `"${o.customer_name || 'Guest'}"`,
      `"${o.customer_email || ''}"`,
      `"${o.customer_phone || ''}"`,
      `"${o.origin_name}"`,
      o.weight_kg,
      `"${o.plan_name}"`,
      o.total_price_npr,
      o.status,
      `"${(o.delivery_address || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `brewmellow_orders_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Orders CSV exported successfully.");
  };

  // 403 Forbidden Screen
  if (!loading && !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#110E0C] flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-full max-w-md bg-[#1C1815] border border-[#2C2420] p-8 md:p-10 shadow-2xl rounded-2xl text-center">
          <div className="w-16 h-16 bg-[#2C1814] text-[#E56345] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#A3432A]/30">
            <ShieldAlert size={32} />
          </div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#E58A1F] bg-[#2C2420] px-3 py-1 rounded-full border border-white/10">
            Corporate Operations Clearance Required
          </span>
          <h1 className="text-2xl font-serif font-bold text-white mt-4 mb-2">Restricted Staff Portal</h1>
          <p className="text-xs text-[#A89F91] mb-6 leading-relaxed">
            This internal backoffice console is restricted to certified roastery operations staff. Authentication with verified administrator credentials is required.
          </p>
          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full bg-[#A3432A] text-white py-3.5 text-xs uppercase tracking-widest font-bold hover:bg-[#8A3722] transition-colors rounded-xl shadow-lg text-center"
            >
              Staff Admin Sign In
            </Link>
            <Link
              href="/"
              className="block w-full bg-[#2C2420] text-[#A89F91] py-3 text-xs uppercase tracking-widest font-bold hover:text-white transition-colors rounded-xl text-center"
            >
              Exit to Consumer Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Key Financial & Logistics Metrics
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price_npr || 0), 0);
  const activeSubs = orders.filter(o => o.status !== "CANCELLED").length;
  const inRoastingQueue = orders.filter(o => o.status === "ROASTING" || o.status === "CONFIRMED").length;
  const inCourierTransit = orders.filter(o => o.status === "DISPATCHED").length;

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#2C2420] flex font-sans antialiased">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#1A1512] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-[#A3432A] flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <Sparkles size={16} className="text-[#E58A1F] flex-shrink-0" />
          <p className="text-xs uppercase tracking-wider font-semibold">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-[#A89F91] hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* 1. CORPORATE SIDEBAR SHELL */}
      <aside className="w-64 bg-[#14100E] border-r border-[#26201B] text-[#D3C7B1] flex flex-col justify-between shrink-0 hidden md:flex select-none">
        <div>
          {/* Backoffice Header */}
          <div className="p-6 border-b border-[#26201B]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E58A1F] animate-pulse"></span>
              <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#E58A1F]">
                Operations Hub
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-white">BrewMellow.</h2>
            <p className="text-[11px] text-[#8A7966] mt-0.5">Lalitpur Roastery Enterprise</p>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "orders" 
                  ? "bg-[#A3432A] text-white shadow-md" 
                  : "text-[#A89F91] hover:bg-[#201A16] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package size={16} />
                <span>Orders & Queue</span>
              </div>
              <span className="text-xs px-1.5 py-0.5 rounded bg-black/30 text-white font-mono">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("customers")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "customers" 
                  ? "bg-[#A3432A] text-white shadow-md" 
                  : "text-[#A89F91] hover:bg-[#201A16] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users size={16} />
                <span>Customer CRM</span>
              </div>
              <span className="text-xs px-1.5 py-0.5 rounded bg-black/30 text-white font-mono">
                {customerDirectory.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "inventory" 
                  ? "bg-[#A3432A] text-white shadow-md" 
                  : "text-[#A89F91] hover:bg-[#201A16] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Coffee size={16} />
                <span>Roastery Lots</span>
              </div>
              <span className="text-xs px-1.5 py-0.5 rounded bg-[#2E6B34] text-white font-bold">
                3 Lots
              </span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "analytics" 
                  ? "bg-[#A3432A] text-white shadow-md" 
                  : "text-[#A89F91] hover:bg-[#201A16] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp size={16} />
                <span>Financials</span>
              </div>
              <span className="text-xs text-[#3A7D44] font-bold">+14%</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#26201B] space-y-3">
          <div className="p-3 bg-[#1D1714] rounded-lg border border-[#2C2420]">
            <p className="text-xs uppercase tracking-wider text-[#8A7966] font-bold">Authenticated Admin</p>
            <p className="text-xs font-bold text-white truncate">{currentUser?.name || "Operations Lead"}</p>
            <p className="text-xs text-[#A89F91] truncate">{currentUser?.email || "admin@brewmellow.com"}</p>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <Link 
              href="/" 
              className="inline-flex items-center gap-1.5 text-[#A89F91] hover:text-white transition-colors text-[11px] uppercase tracking-wider font-bold"
            >
              <ExternalLink size={13} /> Storefront
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem("demo_user");
                window.location.href = "/login";
              }}
              className="inline-flex items-center gap-1.5 text-[#E56345] hover:text-white transition-colors text-[11px] uppercase tracking-wider font-bold"
            >
              <LogOut size={13} /> Exit
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN OPERATIONS STAGE */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        
        {/* Top Corporate Command Bar */}
        <header className="h-16 bg-white border-b border-[#E6DEC8] px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7966]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders by ID, Customer, Phone, or City..."
                className="w-full bg-[#FAF8F5] border border-[#E6DEC8] rounded-lg pl-10 pr-4 py-2 text-xs text-[#2C2420] placeholder-[#8A7966] focus:outline-none focus:border-[#A3432A] transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7966]">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              className="p-2 text-[#5C5042] hover:text-[#1A1512] hover:bg-[#FAF8F5] border border-[#E6DEC8] rounded-lg transition-colors"
              title="Refresh Data from Server"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#F0EAE1] text-[#2C2420] border border-[#E6DEC8] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
            >
              <Download size={13} /> Export CSV
            </button>
            <div className="h-6 w-px bg-[#E6DEC8] mx-1 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-[#2E6B34] bg-[#E7F3E8] px-3 py-1.5 rounded-lg border border-[#C3E4C6]">
              <span className="w-2 h-2 rounded-full bg-[#2E6B34]"></span>
              <span>Django Live API</span>
            </div>
          </div>
        </header>

        {/* Content View Container */}
        <div className="p-6 md:p-8 space-y-8 flex-1">

          {/* TAB 1: ORDERS & QUEUE */}
          {activeTab === "orders" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              
              {/* 4 KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white border border-[#E6DEC8] p-5 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start mb-2 text-[#8A7966]">
                    <span className="text-xs uppercase tracking-wider font-bold">Gross Revenue</span>
                    <TrendingUp size={16} className="text-[#2E6B34]" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#1A1512]">
                    Rs. {totalRevenue.toLocaleString()}
                  </h3>
                  <p className="text-xs text-[#2E6B34] font-semibold mt-1 flex items-center gap-1">
                    <ArrowUpRight size={12} /> +14.2% MoM subscription growth
                  </p>
                </div>

                <div className="bg-white border border-[#E6DEC8] p-5 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start mb-2 text-[#8A7966]">
                    <span className="text-xs uppercase tracking-wider font-bold">Active Subscriptions</span>
                    <Users size={16} />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#1A1512]">
                    {activeSubs} Subscribers
                  </h3>
                  <p className="text-xs text-[#8A7966] font-medium mt-1">
                    94.2% monthly recurring retention
                  </p>
                </div>

                <div className="bg-white border border-[#E6DEC8] p-5 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start mb-2 text-[#8A7966]">
                    <span className="text-xs uppercase tracking-wider font-bold">Roastery Drum Queue</span>
                    <Flame size={16} className="text-[#E58A1F]" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#E58A1F]">
                    {inRoastingQueue} Batches
                  </h3>
                  <p className="text-xs text-[#8A7966] font-medium mt-1">
                    Lalitpur drum roaster allocation
                  </p>
                </div>

                <div className="bg-white border border-[#E6DEC8] p-5 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start mb-2 text-[#8A7966]">
                    <span className="text-xs uppercase tracking-wider font-bold">Courier In-Transit</span>
                    <Truck size={16} className="text-[#3366CC]" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#3366CC]">
                    {inCourierTransit} Shipments
                  </h3>
                  <p className="text-xs text-[#8A7966] font-medium mt-1">
                    Doorstep deliveries nationwide
                  </p>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  {[
                    { id: "ALL", label: "All Orders", count: orders.length },
                    { id: "CONFIRMED", label: "Confirmed", count: orders.filter(o => o.status === "CONFIRMED").length },
                    { id: "ROASTING", label: "In Roasting Drum", count: orders.filter(o => o.status === "ROASTING").length },
                    { id: "DISPATCHED", label: "With Courier", count: orders.filter(o => o.status === "DISPATCHED").length },
                    { id: "DELIVERED", label: "Fulfilled", count: orders.filter(o => o.status === "DELIVERED").length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider text-[11px] transition-all flex items-center gap-1.5 ${
                        statusFilter === tab.id
                          ? "bg-[#1A1512] text-white shadow-sm"
                          : "bg-white text-[#5C5042] border border-[#E6DEC8] hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 rounded text-xs font-mono ${statusFilter === tab.id ? "bg-white/20" : "bg-[#F0EAE1]"}`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <span className="text-xs text-[#8A7966] font-medium">
                  Showing {filteredOrders.length} of {orders.length} orders
                </span>
              </div>

              {/* Master Enterprise Orders Table */}
              <div className="bg-white rounded-xl border border-[#E6DEC8] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#FAF8F5] text-xs uppercase tracking-widest text-[#5C5042] font-bold border-b border-[#E6DEC8]">
                      <tr>
                        <th className="px-5 py-4">Order ID & Date</th>
                        <th className="px-5 py-4">Customer Account</th>
                        <th className="px-5 py-4">Destination</th>
                        <th className="px-5 py-4">Selection</th>
                        <th className="px-5 py-4">Total NPR</th>
                        <th className="px-5 py-4">Roastery Lifecycle</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EAE1]">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-[#8A7966]">
                            <p className="font-serif text-lg text-[#1A1512] mb-1">No Orders Match Filter</p>
                            <p className="text-xs">Adjust your search query or status filter above.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order: any) => {
                          const currentStatus = order.status || "CONFIRMED";

                          return (
                            <tr key={order.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                              {/* Order ID */}
                              <td className="px-5 py-4 whitespace-nowrap">
                                <span className="font-mono font-bold text-[#1A1512]">
                                  #{order.id.toString().padStart(4, "0")}
                                </span>
                                <p className="text-xs text-[#8A7966]">
                                  {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </td>

                              {/* Customer Details */}
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-[#FAF5F2] border border-[#E6DEC8] text-[#A3432A] flex items-center justify-center font-bold text-xs">
                                    {(order.customer_name || "G")[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-[#1A1512] leading-tight">
                                      {order.customer_name || "Guest Customer"}
                                    </p>
                                    <p className="text-[11px] text-[#8A7966]">{order.customer_email || "N/A"}</p>
                                    {order.customer_phone && (
                                      <p className="text-xs text-[#5C5042] font-mono">{order.customer_phone}</p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Destination */}
                              <td className="px-5 py-4 max-w-xs">
                                <p className="text-xs text-[#5C5042] line-clamp-2">
                                  {order.delivery_address || "Kathmandu, Nepal"}
                                </p>
                              </td>

                              {/* Coffee Lot */}
                              <td className="px-5 py-4">
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-[#FAF5F2] text-[#A3432A] border border-[#E6DEC8]">
                                  {order.origin_name || "Gulmi Reserve"}
                                </span>
                                <p className="text-[11px] text-[#5C5042] mt-0.5">
                                  {order.weight_kg}kg • {order.plan_name || "Monthly"}
                                </p>
                              </td>

                              {/* Total Amount */}
                              <td className="px-5 py-4 whitespace-nowrap font-bold text-[#1A1512]">
                                Rs. {Number(order.total_price_npr || 0).toLocaleString()}
                                <span className="block text-xs uppercase tracking-wider text-[#2E6B34] font-semibold">Paid</span>
                              </td>

                              {/* Status Selector */}
                              <td className="px-5 py-4 whitespace-nowrap">
                                <select
                                  value={currentStatus}
                                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                  className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border focus:outline-none transition-colors cursor-pointer ${
                                    currentStatus === "CONFIRMED"
                                      ? "bg-[#E7F3E8] text-[#2E6B34] border-[#C3E4C6]"
                                      : currentStatus === "ROASTING"
                                      ? "bg-[#FFF8EE] text-[#E58A1F] border-[#F3DFC1]"
                                      : currentStatus === "DISPATCHED"
                                      ? "bg-[#EEF4FF] text-[#3366CC] border-[#C8DCFF]"
                                      : "bg-[#F5F2EB] text-[#5C5042] border-[#E6DEC8]"
                                  }`}
                                >
                                  <option value="CONFIRMED">● CONFIRMED (Order Placed)</option>
                                  <option value="ROASTING">🔥 ROASTING (In Roastery Drum)</option>
                                  <option value="DISPATCHED">🚚 DISPATCHED (With Courier)</option>
                                  <option value="DELIVERED">✓ DELIVERED (Fulfilled)</option>
                                </select>
                              </td>

                              {/* Action: Print Invoice */}
                              <td className="px-5 py-4 text-right whitespace-nowrap">
                                <button
                                  onClick={() => setSelectedInvoiceOrder(order)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F0EAE1] text-[#2C2420] border border-[#E6DEC8] rounded-lg text-xs font-bold transition-colors"
                                  title="Generate Nepal VAT Tax Invoice"
                                >
                                  <Printer size={13} />
                                  <span>Receipt</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CUSTOMER CRM DIRECTORY */}
          {activeTab === "customers" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#1A1512]">Customer CRM Directory</h3>
                  <p className="text-xs text-[#8A7966]">Aggregated subscriber profiles across all historical roastery dispatches</p>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider bg-white px-3 py-1.5 border border-[#E6DEC8] rounded-lg">
                  {customerDirectory.length} Unique Accounts
                </span>
              </div>

              <div className="bg-white rounded-xl border border-[#E6DEC8] overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#FAF8F5] text-xs uppercase tracking-widest text-[#5C5042] font-bold border-b border-[#E6DEC8]">
                    <tr>
                      <th className="px-6 py-4">Customer Name & Contact</th>
                      <th className="px-6 py-4">Delivery Address</th>
                      <th className="px-6 py-4">Lifetime Orders</th>
                      <th className="px-6 py-4">Lifetime Spent</th>
                      <th className="px-6 py-4">Preferred Origin</th>
                      <th className="px-6 py-4">Subscription Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EAE1]">
                    {customerDirectory.map((c, i) => (
                      <tr key={i} className="hover:bg-[#FAF8F5]/80 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-[#1A1512]">{c.name}</p>
                          <p className="text-xs text-[#8A7966]">{c.email}</p>
                          <p className="text-xs text-[#5C5042] font-mono mt-0.5">{c.phone}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-[#5C5042] max-w-xs">
                          {c.address}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-[#1A1512]">
                          {c.ordersCount} Orders
                        </td>
                        <td className="px-6 py-4 font-bold text-[#1A1512]">
                          Rs. {c.totalSpent.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-[#FAF5F2] text-[#A3432A] border border-[#E6DEC8]">
                            {c.favoriteOrigin}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E7F3E8] text-[#2E6B34] border border-[#C3E4C6]">
                            Active Subscriber
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MICRO-LOT ROASTERY STOCK */}
          {activeTab === "inventory" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#1A1512]">Micro-lot Inventory & Drum Allocations</h3>
                  <p className="text-xs text-[#8A7966]">Live bean lot tracking at Lalitpur Roastery drum facility</p>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider bg-white px-3 py-1.5 border border-[#E6DEC8] rounded-lg">
                  Current Drum Cycle: 5kg Craft Batches
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    name: "Gulmi High-Altitude Reserve",
                    altitude: "1,600m",
                    score: "86.5 SCA",
                    process: "Fully Washed",
                    totalStockKg: 120,
                    roastedKg: 54,
                    reservedKg: 32,
                    coop: "Gulmi District Farmers Cooperative",
                    color: "#A3432A",
                  },
                  {
                    name: "Ilam Gold Microlot",
                    altitude: "1,800m",
                    score: "87.0 SCA",
                    process: "Sun-Dried Natural",
                    totalStockKg: 85,
                    roastedKg: 42,
                    reservedKg: 28,
                    coop: "Ilam Tea & Coffee Belt Collective",
                    color: "#E58A1F",
                  },
                  {
                    name: "Nuwakot Heritage Typica",
                    altitude: "1,400m",
                    score: "85.0 SCA",
                    process: "Honey Processed",
                    totalStockKg: 100,
                    roastedKg: 38,
                    reservedKg: 19,
                    coop: "Kathmandu Valley Northern Foothills Association",
                    color: "#5C5042",
                  },
                ].map((lot, idx) => {
                  const percentRoasted = Math.round((lot.roastedKg / lot.totalStockKg) * 100);

                  return (
                    <div key={idx} className="bg-white border border-[#E6DEC8] rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs uppercase font-bold tracking-wider text-[#A3432A]">
                            Lot #{idx + 1} • {lot.altitude}
                          </span>
                          <h4 className="font-serif font-bold text-base text-[#1A1512] mt-0.5">{lot.name}</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#FAF8F5] border border-[#E6DEC8] text-[#5C5042]">
                          {lot.score}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#8A7966]">Roasted / Allocated:</span>
                          <strong className="text-[#1A1512]">{lot.roastedKg}kg / {lot.totalStockKg}kg</strong>
                        </div>
                        <div className="w-full bg-[#F0EAE1] h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentRoasted}%`, backgroundColor: lot.color }}
                          />
                        </div>
                        <p className="text-xs text-right text-[#8A7966]">{percentRoasted}% roasted</p>
                      </div>

                      <div className="pt-3 border-t border-[#F0EAE1] space-y-1.5 text-xs text-[#5C5042]">
                        <div className="flex justify-between">
                          <span className="text-[#8A7966]">Processing:</span>
                          <strong>{lot.process}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#8A7966]">Active Reserved:</span>
                          <strong>{lot.reservedKg}kg in active cycle</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#8A7966]">Sourcing:</span>
                          <strong className="text-[11px] truncate max-w-[160px]">{lot.coop}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: FINANCIALS & ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#1A1512]">Financial Performance & Cohorts</h3>
                  <p className="text-xs text-[#8A7966]">Recurring subscription unit economics and revenue distribution</p>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider bg-white px-3 py-1.5 border border-[#E6DEC8] rounded-lg">
                  Nepal VAT Compliant
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-[#E6DEC8] p-6 rounded-xl shadow-sm">
                  <p className="text-xs uppercase tracking-wider font-bold text-[#8A7966] mb-1">Monthly Recurring Revenue (MRR)</p>
                  <h4 className="text-3xl font-serif font-bold text-[#1A1512]">
                    Rs. {Math.round(totalRevenue * 0.85).toLocaleString()}
                  </h4>
                  <p className="text-xs text-[#2E6B34] font-semibold mt-2">Active prepaid monthly runs</p>
                </div>

                <div className="bg-white border border-[#E6DEC8] p-6 rounded-xl shadow-sm">
                  <p className="text-xs uppercase tracking-wider font-bold text-[#8A7966] mb-1">Average Order Value (AOV)</p>
                  <h4 className="text-3xl font-serif font-bold text-[#1A1512]">
                    Rs. {orders.length ? Math.round(totalRevenue / orders.length).toLocaleString() : 0}
                  </h4>
                  <p className="text-xs text-[#8A7966] mt-2">Across 1kg & 500g subscription commitments</p>
                </div>

                <div className="bg-white border border-[#E6DEC8] p-6 rounded-xl shadow-sm">
                  <p className="text-xs uppercase tracking-wider font-bold text-[#8A7966] mb-1">Payment Method Mix</p>
                  <div className="space-y-2 mt-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#5C5042]">eSewa / Khalti Digital:</span>
                      <strong>68%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5C5042]">Direct Card Token:</span>
                      <strong>22%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5C5042]">Cash on Courier Delivery:</span>
                      <strong>10%</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* PRINTABLE NEPAL VAT INVOICE MODAL */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl border border-[#E6DEC8] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedInvoiceOrder(null)}
              className="absolute top-5 right-5 text-[#8A7966] hover:text-[#1A1512]"
            >
              <X size={20} />
            </button>

            {/* Invoice Print Header */}
            <div className="text-center pb-6 border-b border-[#E6DEC8] mb-6">
              <span className="text-xs uppercase tracking-widest font-bold text-[#A3432A]">
                Tax Invoice • Nepal VAT Compliant
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#1A1512] mt-1">BrewMellow Himalayan Roasters</h2>
              <p className="text-xs text-[#8A7966]">Lalitpur Industrial District, Ward 4, Nepal</p>
              <p className="text-xs text-[#8A7966] font-mono">PAN / VAT No: 609812450</p>
            </div>

            {/* Bill To Info */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-6 pb-6 border-b border-[#F0EAE1]">
              <div>
                <span className="text-[#8A7966] uppercase text-xs font-bold block mb-1">Billed To:</span>
                <p className="font-bold text-[#1A1512]">{selectedInvoiceOrder.customer_name || "Customer"}</p>
                <p className="text-[#5C5042]">{selectedInvoiceOrder.customer_email || "N/A"}</p>
                <p className="text-[#5C5042]">{selectedInvoiceOrder.customer_phone || "N/A"}</p>
                <p className="text-[#5C5042] mt-1 line-clamp-2">{selectedInvoiceOrder.delivery_address || "Kathmandu, Nepal"}</p>
              </div>
              <div className="text-right">
                <span className="text-[#8A7966] uppercase text-xs font-bold block mb-1">Invoice Details:</span>
                <p className="font-mono font-bold text-[#1A1512]">Invoice #{selectedInvoiceOrder.id.toString().padStart(5, '0')}</p>
                <p className="text-[#5C5042]">Date: {new Date(selectedInvoiceOrder.created_at).toLocaleDateString()}</p>
                <p className="text-[#2E6B34] font-bold mt-1">Payment Status: PAID</p>
              </div>
            </div>

            {/* Line Items */}
            <table className="w-full text-xs mb-6">
              <thead className="bg-[#FAF8F5] text-xs uppercase font-bold text-[#5C5042] border-b border-[#E6DEC8]">
                <tr>
                  <th className="py-2 text-left">Item Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Amount (NPR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1]">
                <tr>
                  <td className="py-3">
                    <p className="font-bold text-[#1A1512]">{selectedInvoiceOrder.origin_name || "Himalayan Single-Origin"}</p>
                    <p className="text-xs text-[#8A7966]">{selectedInvoiceOrder.weight_kg}kg • {selectedInvoiceOrder.plan_name}</p>
                  </td>
                  <td className="py-3 text-center">1</td>
                  <td className="py-3 text-right font-mono">Rs. {selectedInvoiceOrder.total_price_npr}</td>
                </tr>
                <tr>
                  <td className="py-2 text-[#5C5042]">Doorstep Courier Logistics</td>
                  <td className="py-2 text-center">1</td>
                  <td className="py-2 text-right text-[#2E6B34] font-bold">FREE</td>
                </tr>
              </tbody>
            </table>

            {/* Total Summary */}
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E6DEC8] space-y-1.5 text-xs mb-6">
              <div className="flex justify-between text-[#8A7966]">
                <span>Taxable Amount:</span>
                <span className="font-mono">Rs. {Math.round(selectedInvoiceOrder.total_price_npr / 1.13)}</span>
              </div>
              <div className="flex justify-between text-[#8A7966]">
                <span>Nepal VAT (13%):</span>
                <span className="font-mono">Rs. {Math.round(selectedInvoiceOrder.total_price_npr - (selectedInvoiceOrder.total_price_npr / 1.13))}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[#1A1512] pt-2 border-t border-[#E6DEC8]">
                <span>Grand Total:</span>
                <span className="font-mono">Rs. {selectedInvoiceOrder.total_price_npr}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-[#1A1512] hover:bg-[#2C2420] text-white text-xs uppercase tracking-widest font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Printer size={14} /> Print Official VAT Invoice
              </button>
              <button
                onClick={() => setSelectedInvoiceOrder(null)}
                className="px-5 py-3 border border-[#E6DEC8] hover:bg-[#FAF8F5] text-xs uppercase tracking-wider font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
