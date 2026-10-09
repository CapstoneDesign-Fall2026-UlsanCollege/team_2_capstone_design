"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, MapPin, CreditCard, MoreVertical, Download, ExternalLink, Calendar, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState<{ name: string; email: string; address: string; memberSince: string } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          // Sort by newest first
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

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans pb-24">
      
      {/* Dashboard Header */}
      <div className="bg-[#1A1512] text-[#F5F2EB] pt-16 pb-0 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold mb-1">{user.name}</h1>
              <p className="text-[#A89F91] text-sm">{user.email} � Member since {user.memberSince}</p>
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
                className={pb-4 text-xs uppercase tracking-widest font-bold whitespace-nowrap border-b-2 transition-colors }
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
            <h2 className="text-xl font-serif font-bold text-[#1A1512] mb-6">Active Subscriptions</h2>
            
            {activeOrder ? (
              <div className="bg-white border border-[#E6DEC8] p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-serif font-bold text-[#1A1512]">{activeOrder.origin_name}</h3>
                    <span className="px-2 py-1 bg-[#E7F3E8] text-[#2E6B34] text-[10px] font-bold uppercase tracking-widest rounded-sm">
                      Active
                    </span>
                  </div>
                  <p className="text-[#5C5042] text-sm mb-6">
                    {activeOrder.weight_kg} kg/delivery � {activeOrder.plan_name}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A7966] mb-1">Status</p>
                      <p className="text-sm font-medium text-[#1A1512] flex items-center gap-2">
                        <Calendar size={14} className="text-[#A3432A]" /> {activeOrder.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A7966] mb-1">Amount</p>
                      <p className="text-sm font-medium text-[#1A1512]">Rs. {activeOrder.total_price_npr}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 justify-center md:border-l md:border-[#E6DEC8] md:pl-6 min-w-[160px]">
                  <button className="w-full py-2 border border-[#E6DEC8] text-xs uppercase tracking-widest font-bold text-[#1A1512] hover:bg-[#F5F2EB] transition-colors">
                    Edit Plan
                  </button>
                  <button className="w-full py-2 border border-[#E6DEC8] text-xs uppercase tracking-widest font-bold text-[#1A1512] hover:bg-[#F5F2EB] transition-colors">
                    Skip Delivery
                  </button>
                  <button className="w-full py-2 text-xs uppercase tracking-widest font-bold text-[#A3432A] hover:bg-[#FAF5F5] transition-colors mt-2">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#E6DEC8] p-12 text-center">
                <p className="text-[#5C5042] mb-4">You don't have any active subscriptions.</p>
                <Link href="/subscribe" className="inline-block bg-[#1A1512] text-white px-6 py-3 text-sm uppercase tracking-widest font-bold hover:bg-[#2C2420]">Browse Coffees</Link>
              </div>
            )}
          </section>

          {/* Recent Orders Table Component */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xl font-serif font-bold text-[#1A1512]">Recent Orders</h2>
              <button className="text-xs uppercase tracking-widest font-bold text-[#8A7966] hover:text-[#1A1512] transition-colors">
                View All
              </button>
            </div>
            
            <div className="bg-white border border-[#E6DEC8] overflow-hidden overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#FAF8F5] text-[10px] uppercase tracking-widest text-[#5C5042] font-bold border-b border-[#E6DEC8]">
                  <tr>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DEC8]">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-[#8A7966]">No orders found.</td>
                    </tr>
                  ) : (
                    orders.slice(0, 3).map((order: any) => (
                      <tr key={order.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="px-6 py-4 font-medium text-[#1A1512]">#{order.id.toString().padStart(4, '0')}</td>
                        <td className="px-6 py-4 text-[#5C5042] whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E58A1F]"></span>
                            <span className="text-[#E58A1F] text-[10px] uppercase font-bold tracking-wider">{order.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-[#1A1512]">Rs. {order.total_price_npr}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-[#8A7966] hover:text-[#1A1512] transition-colors">
                            <Download size={16} className="inline" />
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
            <h2 className="text-lg font-serif font-bold text-[#1A1512] mb-4">Account Details</h2>
            <div className="bg-white border border-[#E6DEC8] p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#5C5042] flex items-center gap-2">
                  <MapPin size={14} /> Default Address
                </p>
                <button className="text-[#A89F91] hover:text-[#1A1512] transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
              <div className="text-sm text-[#2C2420] leading-relaxed">
                <p className="font-bold">{user.name}</p>
                <p className="text-[#5C5042] whitespace-pre-line">{user.address}</p>
              </div>
            </div>
          </section>

          {/* Payment Method Widget */}
          <section>
            <div className="bg-[#FAF8F5] border border-[#E6DEC8] p-6">
              <div className="flex justify-between items-start mb-6">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#5C5042] flex items-center gap-2">
                  <CreditCard size={14} /> Payment Method
                </p>
                <button className="text-[#A89F91] hover:text-[#1A1512] transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
              
              <div className="bg-white border border-[#E6DEC8] p-4 flex items-center gap-4 mb-4">
                <div className="w-12 h-8 bg-[#5C2D91] rounded-sm flex items-center justify-center text-white text-[8px] font-bold tracking-widest">
                  KHALTI
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1512]">Wallet Linked</p>
                </div>
              </div>
              
              <button className="text-[10px] uppercase tracking-widest font-bold text-[#A3432A] flex items-center gap-1 hover:text-[#8A3722] transition-colors">
                Manage Billing <ExternalLink size={12} />
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
