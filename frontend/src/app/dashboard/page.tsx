"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, MapPin, CreditCard, MoreVertical, Download, ExternalLink, Calendar } from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans pb-24">
      
      {/* Dashboard Header */}
      <div className="bg-[#1A1512] text-[#F5F2EB] pt-16 pb-0 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold mb-1">Aditya Kumar Gupta</h1>
              <p className="text-[#A89F91] text-sm">aditya@example.com â€¢ Member since Oct 2026</p>
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
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-12">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column (Main Subscriptions) */}
            <div className="lg:col-span-2 space-y-8">
              
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-serif font-bold text-[#1A1512]">Active Subscriptions</h2>
              </div>

              <div className="bg-white border border-[#E6DEC8] rounded-sm overflow-hidden">
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-[#1A1512]">Gulmi Reserve</h3>
                      <span className="bg-[#E7F3E8] text-[#2E6B34] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>
                    <p className="text-[#5C5042] text-sm mb-6">1 kg/month • 3-Month Prepaid Plan</p>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[#7A6A58] text-xs uppercase tracking-widest mb-1">Next Billing Date</p>
                        <p className="text-[#1A1512] font-medium flex items-center gap-2">
                          <Calendar size={14} className="text-[#A3432A]"/> Oct 15, 2026
                        </p>
                      </div>
                      <div>
                        <p className="text-[#7A6A58] text-xs uppercase tracking-widest mb-1">Amount</p>
                        <p className="text-[#1A1512] font-medium">Rs. 3420</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 justify-center md:border-l md:border-[#E6DEC8] md:pl-8">
                    <button className="w-full text-center px-6 py-2 border border-[#E6DEC8] text-[#1A1512] text-xs uppercase tracking-widest font-bold hover:bg-[#F5F2EB] transition-colors">
                      Edit Plan
                    </button>
                    <button className="w-full text-center px-6 py-2 border border-[#E6DEC8] text-[#1A1512] text-xs uppercase tracking-widest font-bold hover:bg-[#F5F2EB] transition-colors">
                      Skip Delivery
                    </button>
                    <button className="w-full text-center px-6 py-2 text-[#A3432A] text-xs uppercase tracking-widest font-bold hover:bg-red-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-8">
                <h2 className="text-lg font-serif font-bold text-[#1A1512]">Recent Orders</h2>
                <Link href="#" className="text-xs uppercase tracking-widest text-[#8A7966] font-bold hover:text-[#1A1512]">
                  View All
                </Link>
              </div>

              {/* Realistic Data Table */}
              <div className="bg-white border border-[#E6DEC8] rounded-sm overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#FAF8F5] border-b border-[#E6DEC8]">
                    <tr>
                      <th className="px-6 py-4 font-bold text-[#5C5042] text-xs uppercase tracking-widest">Order</th>
                      <th className="px-6 py-4 font-bold text-[#5C5042] text-xs uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 font-bold text-[#5C5042] text-xs uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 font-bold text-[#5C5042] text-xs uppercase tracking-widest">Total</th>
                      <th className="px-6 py-4 font-bold text-[#5C5042] text-xs uppercase tracking-widest text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DEC8]">
                    {[
                      { id: "#BM-4921", date: "Jul 15, 2026", status: "Processing", color: "text-amber-600", dot: "bg-amber-500", total: "Rs. 3420" },
                      { id: "#BM-3810", date: "Apr 15, 2026", status: "Delivered", color: "text-[#2E6B34]", dot: "bg-[#2E6B34]", total: "Rs. 3420" },
                      { id: "#BM-2199", date: "Jan 15, 2026", status: "Delivered", color: "text-[#2E6B34]", dot: "bg-[#2E6B34]", total: "Rs. 3990" },
                    ].map((order) => (
                      <tr key={order.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="px-6 py-4 font-medium text-[#1A1512]">{order.id}</td>
                        <td className="px-6 py-4 text-[#5C5042]">{order.date}</td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-2 ${order.color} text-xs font-bold uppercase tracking-wider`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${order.dot}`}></span>
                            {order.status}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#1A1512]">{order.total}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-[#8A7966] hover:text-[#1A1512] transition-colors">
                            <Download size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Right Column (Account Info) */}
            <div className="space-y-8">
              <h2 className="text-lg font-serif font-bold text-[#1A1512]">Account Details</h2>
              
              <div className="bg-white border border-[#E6DEC8] rounded-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs uppercase tracking-widest text-[#5C5042] font-bold flex items-center gap-2">
                    <MapPin size={14} /> Default Address
                  </h3>
                  <button className="text-[#8A7966] hover:text-[#1A1512]"><MoreVertical size={16} /></button>
                </div>
                <p className="text-[#1A1512] font-medium mb-1">Aditya Kumar Gupta</p>
                <p className="text-[#5C5042] text-sm leading-relaxed">
                  Kathmandu University<br />
                  Dhulikhel, Kavre<br />
                  Bagmati Province, Nepal
                </p>
              </div>

              <div className="bg-white border border-[#E6DEC8] rounded-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs uppercase tracking-widest text-[#5C5042] font-bold flex items-center gap-2">
                    <CreditCard size={14} /> Payment Method
                  </h3>
                  <button className="text-[#8A7966] hover:text-[#1A1512]"><MoreVertical size={16} /></button>
                </div>
                <div className="flex items-center gap-3 bg-[#FAF8F5] p-3 border border-[#E6DEC8] rounded-sm mb-4">
                  <div className="bg-[#5C2D91] px-2 py-1 rounded text-white text-[10px] font-bold uppercase tracking-widest">
                    Khalti
                  </div>
                  <p className="text-[#1A1512] text-sm font-medium">Wallet Linked</p>
                </div>
                <Link href="#" className="inline-flex items-center gap-1 text-xs text-[#A3432A] uppercase tracking-widest font-bold hover:text-[#8A3722]">
                  Manage Billing <ExternalLink size={12} />
                </Link>
              </div>

            </div>
          </div>
        )}

        {/* Empty States for other tabs to make it feel real */}
        {activeTab !== "overview" && (
          <div className="py-20 text-center border border-dashed border-[#E6DEC8] rounded-sm bg-[#FAF8F5]">
            <Package size={32} className="mx-auto text-[#A89F91] mb-4" />
            <h2 className="text-xl font-serif font-bold text-[#1A1512] mb-2">Nothing to see here yet</h2>
            <p className="text-[#5C5042] text-sm">This section is being wired up to the backend API.</p>
          </div>
        )}
      </div>
    </div>
  );
}
