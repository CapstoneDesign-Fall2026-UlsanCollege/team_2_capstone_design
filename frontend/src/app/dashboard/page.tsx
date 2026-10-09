"use client";

import Link from "next/link";
import { Coffee, Calendar, MapPin, CreditCard, Package, Settings, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EB] font-sans pb-24">
      
      {/* Dashboard Header */}
      <div className="bg-[#1A1512] text-[#F5F2EB] pt-16 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-serif font-bold mb-2">Welcome back, Aditya</h1>
          <p className="text-[#A89F91] text-sm">Manage your Himalayan Coffee subscription and orders.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column (Active Subscription) */}
          <div className="lg:col-span-2 space-y-8">
            
            <div className="bg-white border border-[#E6DEC8] shadow-sm">
              <div className="p-6 border-b border-[#E6DEC8] flex justify-between items-center bg-[#FAF8F5]">
                <h2 className="text-sm uppercase tracking-widest text-[#5C5042] font-bold flex items-center gap-2">
                  <Coffee size={16} /> Active Subscription
                </h2>
                <span className="bg-[#E7F3E8] text-[#2E6B34] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Active
                </span>
              </div>
              
              <div className="p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-[#1A1512] mb-1">Gulmi Reserve</h3>
                    <p className="text-[#7A6A58] text-sm">1 kg • Delivery every 3 Months</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-[#5C5042] text-xs uppercase tracking-widest font-bold mb-1">Next Delivery</p>
                    <p className="text-xl font-medium text-[#1A1512] flex items-center gap-2">
                      <Calendar size={20} className="text-[#A3432A]" /> Oct 15, 2026
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="flex-1 bg-[#F5F2EB] border border-[#E6DEC8] text-[#1A1512] py-3 text-sm uppercase tracking-widest font-bold hover:bg-[#EAE4D3] transition-colors">
                    Skip Next Delivery
                  </button>
                  <button className="flex-1 bg-[#1A1512] text-white py-3 text-sm uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors flex items-center justify-center gap-2">
                    <Settings size={16} /> Manage Plan
                  </button>
                </div>
              </div>
            </div>

            {/* Order History */}
            <div className="bg-white border border-[#E6DEC8] shadow-sm">
              <div className="p-6 border-b border-[#E6DEC8] bg-[#FAF8F5]">
                <h2 className="text-sm uppercase tracking-widest text-[#5C5042] font-bold flex items-center gap-2">
                  <Package size={16} /> Recent Deliveries
                </h2>
              </div>
              <div className="divide-y divide-[#E6DEC8]">
                {[
                  { date: "Jul 15, 2026", item: "Gulmi Reserve - 1kg", status: "Delivered", price: "Rs. 3420" },
                  { date: "Apr 15, 2026", item: "Gulmi Reserve - 1kg", status: "Delivered", price: "Rs. 3420" },
                  { date: "Jan 15, 2026", item: "Ilam Gold - 1kg", status: "Delivered", price: "Rs. 3990" },
                ].map((order, i) => (
                  <div key={i} className="p-6 flex justify-between items-center hover:bg-[#F5F2EB] transition-colors cursor-pointer">
                    <div>
                      <p className="font-bold text-[#1A1512] mb-1">{order.date}</p>
                      <p className="text-[#7A6A58] text-sm">{order.item}</p>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <div className="hidden sm:block">
                        <p className="text-[#1A1512] font-medium">{order.price}</p>
                        <p className="text-[#7A6A58] text-xs">{order.status}</p>
                      </div>
                      <ChevronRight size={20} className="text-[#A89F91]" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-[#E6DEC8] text-center bg-[#FAF8F5]">
                <Link href="#" className="text-sm text-[#8A7966] uppercase tracking-widest font-bold hover:text-[#1A1512] transition-colors">
                  View All History
                </Link>
              </div>
            </div>

          </div>

          {/* Right Column (Info Cards) */}
          <div className="space-y-8">
            
            <div className="bg-white border border-[#E6DEC8] shadow-sm p-6">
              <h2 className="text-sm uppercase tracking-widest text-[#5C5042] font-bold flex items-center gap-2 mb-6">
                <MapPin size={16} /> Shipping Address
              </h2>
              <p className="text-[#1A1512] font-medium mb-1">Aditya Kumar Gupta</p>
              <p className="text-[#7A6A58] text-sm leading-relaxed mb-4">
                Kathmandu University<br />
                Dhulikhel, Kavre<br />
                Bagmati Province, Nepal
              </p>
              <Link href="#" className="text-sm text-[#A3432A] uppercase tracking-widest font-bold hover:text-[#8A3722]">
                Edit Address
              </Link>
            </div>

            <div className="bg-white border border-[#E6DEC8] shadow-sm p-6">
              <h2 className="text-sm uppercase tracking-widest text-[#5C5042] font-bold flex items-center gap-2 mb-6">
                <CreditCard size={16} /> Payment Method
              </h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#5C2D91] px-2 py-1 rounded text-white text-xs font-bold uppercase tracking-widest">
                  Khalti
                </div>
                <p className="text-[#1A1512] font-medium">Wallet linked</p>
              </div>
              <p className="text-[#7A6A58] text-sm mb-4">Next billing: Oct 15, 2026</p>
              <Link href="#" className="text-sm text-[#A3432A] uppercase tracking-widest font-bold hover:text-[#8A3722]">
                Update Payment
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
