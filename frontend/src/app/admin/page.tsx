"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, CreditCard, Package, TrendingUp, Loader2, MapPin, Phone, Mail } from "lucide-react";

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#1A1512]" />
      </div>
    );
  }

  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price_npr || 0), 0);
  const activeSubs = orders.filter(o => o.status === "CONFIRMED" || o.status === "ACTIVE" || o.status === "PAID_TEST").length;

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans pb-32">
      {/* Header */}
      <div className="bg-[#1A1512] text-[#F5F2EB] pt-16 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-[#A89F91] hover:text-[#F5F2EB] transition-colors mb-8 text-xs uppercase tracking-widest font-bold">
            <ArrowLeft size={16} /> Exit Admin Portal
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold mb-1">Business Management Portal</h1>
              <p className="text-[#A89F91] text-xs uppercase tracking-widest">Master overview of customer orders, logistics & revenue.</p>
            </div>
            <div className="bg-[#A3432A] px-4 py-2 text-xs uppercase tracking-widest font-bold rounded-sm">
              Staff Access Only
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          
          <div className="bg-white border border-[#E6DEC8] p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4 text-[#8A7966]">
              <p className="text-xs uppercase tracking-widest font-bold">Total Revenue</p>
              <CreditCard size={18} />
            </div>
            <p className="text-3xl font-serif font-bold text-[#1A1512]">Rs. {totalRevenue.toLocaleString()}</p>
          </div>

          <div className="bg-white border border-[#E6DEC8] p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4 text-[#8A7966]">
              <p className="text-xs uppercase tracking-widest font-bold">Total Orders</p>
              <Package size={18} />
            </div>
            <p className="text-3xl font-serif font-bold text-[#1A1512]">{orders.length}</p>
          </div>

          <div className="bg-white border border-[#E6DEC8] p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4 text-[#8A7966]">
              <p className="text-xs uppercase tracking-widest font-bold">Active Subscribers</p>
              <Users size={18} />
            </div>
            <p className="text-3xl font-serif font-bold text-[#1A1512]">{activeSubs}</p>
          </div>

          <div className="bg-[#F5F2EB] border border-[#E6DEC8] p-6 flex flex-col justify-center items-center text-center">
            <TrendingUp size={24} className="text-[#3A7D44] mb-2" />
            <p className="text-xs uppercase tracking-widest font-bold text-[#3A7D44]">Growth +14% Month-on-Month</p>
          </div>

        </div>

        {/* Master Data Table */}
        <div className="bg-white border border-[#E6DEC8] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#E6DEC8] flex justify-between items-center">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#1A1512]">Customer Orders & Fulfillment Schedule</h2>
              <p className="text-xs text-[#8A7966]">Live dispatch queue synced from checkout</p>
            </div>
            <span className="text-xs uppercase tracking-widest font-bold text-[#5C5042] bg-[#FAF8F5] px-3 py-1.5 border border-[#E6DEC8]">
              {orders.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#FAF8F5] text-[10px] uppercase tracking-widest text-[#5C5042] font-bold border-b border-[#E6DEC8]">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4">Shipping Destination</th>
                  <th className="px-6 py-4">Selection</th>
                  <th className="px-6 py-4">Total NPR</th>
                  <th className="px-6 py-4">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DEC8]">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[#8A7966]">No customer orders placed yet.</td>
                  </tr>
                ) : (
                  orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#1A1512] whitespace-nowrap">
                        #{order.id.toString().padStart(4, '0')}
                        <p className="text-[10px] text-[#8A7966]">{new Date(order.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#1A1512]">{order.customer_name || "Guest Customer"}</p>
                        <p className="text-xs text-[#5C5042]">{order.customer_email || "N/A"}</p>
                        {order.customer_phone && (
                          <p className="text-xs text-[#8A7966]">{order.customer_phone}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-xs text-[#5C5042] line-clamp-2">
                          {order.delivery_address || "Kathmandu Doorstep Delivery"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#1A1512]">{order.origin_name}</p>
                        <p className="text-xs text-[#8A7966]">{order.weight_kg}kg • {order.plan_name}</p>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#1A1512] whitespace-nowrap">
                        Rs. {order.total_price_npr}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-[#E7F3E8] text-[#2E6B34] text-[10px] font-bold uppercase tracking-widest rounded">
                          {order.status || "CONFIRMED"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
