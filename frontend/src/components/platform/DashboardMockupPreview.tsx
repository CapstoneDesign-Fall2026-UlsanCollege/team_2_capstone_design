"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  ExternalLink,
  Layers,
  LayoutDashboard,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Truck,
  Users,
} from "lucide-react";

export function DashboardMockupPreview() {
  const [activeTab, setActiveTab] = useState<"orders" | "products">("orders");

  return (
    <div className="relative w-full max-w-5xl mx-auto mt-12 sm:mt-16 group">
      {/* Outer ambient glow behind the mockup */}
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-blue-500/15 rounded-3xl blur-2xl opacity-60 pointer-events-none group-hover:opacity-85 transition-opacity" />

      {/* Main Mockup Window */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121214] shadow-2xl shadow-black/10 dark:shadow-black/90 overflow-hidden text-left text-zinc-900 dark:text-zinc-100">
        
        {/* Mockup Window Top Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#18181b]/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 pl-2 hidden sm:inline">
              app.shopcraft.com.np/merchant/dashboard
            </span>
          </div>

          {/* Search bar inside mockup */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 text-xs text-zinc-500 dark:text-zinc-400 w-72">
            <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            <span className="text-[11px]">Search products, orders, customers...</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 text-[11px] text-zinc-700 dark:text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Himalayan Coffee Roasters</span>
            </div>
            <Link
              href="/s/himalayan-roasters"
              target="_blank"
              className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <span>View Store</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Mockup Window Content (Sidebar + Main Area) */}
        <div className="grid grid-cols-12 min-h-[380px] sm:min-h-[440px]">
          
          {/* Sidebar */}
          <div className="hidden sm:block sm:col-span-3 lg:col-span-2 border-r border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-[#141416]/90 p-3 space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2 py-1 font-bold">
              Workspace
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-white/10 text-white text-xs font-semibold cursor-pointer">
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dashboard</span>
            </div>

            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 text-xs transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Orders</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">14</span>
            </div>

            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 text-xs transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5" />
                <span>Products</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">38</span>
            </div>

            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 text-xs transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Inventory</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">2 low</span>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 text-xs transition-colors cursor-pointer">
              <Users className="w-3.5 h-3.5" />
              <span>Customers</span>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 text-xs transition-colors cursor-pointer pt-6">
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </div>
          </div>

          {/* Main Dashboard Area */}
          <div className="col-span-12 sm:col-span-9 lg:col-span-10 p-4 sm:p-6 space-y-5 bg-white dark:bg-[#0f0f11]">
            
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#17171a] space-y-1">
                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 block">Today&apos;s Revenue</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg sm:text-xl font-black font-mono text-zinc-900 dark:text-white">Rs. 48,250</span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">+18.4%</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#17171a] space-y-1">
                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 block">Active Orders</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg sm:text-xl font-black font-mono text-zinc-900 dark:text-white">14 Orders</span>
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">8 Khalti · 6 COD</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#17171a] space-y-1">
                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 block">Dispatch Ready</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg sm:text-xl font-black font-mono text-zinc-900 dark:text-white">11 Slips</span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">Pathao Express</span>
                </div>
              </div>
            </div>

            {/* Recent Orders Section */}
            <div className="rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#17171a] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-800 dark:text-zinc-200">Recent Live Orders</span>
                <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Auto-Syncing</span>
                </div>
              </div>

              <div className="divide-y divide-zinc-200 dark:divide-white/5 text-xs font-mono">
                {/* Row 1 */}
                <div className="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-zinc-900 dark:text-white">#ORD-9821</span>
                    <span className="text-zinc-600 dark:text-zinc-400 hidden sm:inline">Bikesh Shrestha</span>
                    <span className="text-[11px] text-zinc-500 hidden md:inline">· Gulmi Bourbon Roast (500g)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-zinc-900 dark:text-white">Rs. 1,450</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      Khalti Paid
                    </span>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-zinc-900 dark:text-white">#ORD-9820</span>
                    <span className="text-zinc-600 dark:text-zinc-400 hidden sm:inline">Sita Sharma</span>
                    <span className="text-[11px] text-zinc-500 hidden md:inline">· Ilam First Flush Tea (250g)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-zinc-900 dark:text-white">Rs. 1,850</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Pathao Slips
                    </span>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-zinc-900 dark:text-white">#ORD-9819</span>
                    <span className="text-zinc-600 dark:text-zinc-400 hidden sm:inline">Rohit Kumar</span>
                    <span className="text-[11px] text-zinc-500 hidden md:inline">· KTM Heavyweight Tee (L)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-zinc-900 dark:text-white">Rs. 2,200</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      COD Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Quick Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono text-zinc-500">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Hosted Storefront Active: <code className="text-zinc-800 dark:text-zinc-300 font-bold">himalayan-roasters.shopcraft.com.np</code></span>
              </div>
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ 100% NPR Settlement
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
