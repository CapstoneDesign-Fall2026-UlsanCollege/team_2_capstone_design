"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  SlidersHorizontal,
  RefreshCw,
  MapPin,
  Truck,
  CreditCard,
  Coffee,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { DashboardUser, resolveOriginDetails } from "../dashboardData";

interface SubscriptionTabProps {
  orders: any[];
  selectedOrderIndex: number;
  subStatus: "ACTIVE" | "SKIPPED" | "PAUSED" | "CANCELLED";
  grindType: string;
  user: DashboardUser;
  onSelectOrderIndex: (index: number) => void;
  onOpenGrindModal: () => void;
  onOpenAddressModal: () => void;
  onSkipDelivery: () => void;
  onPauseSubscription: () => void;
  onGoToFavorites: () => void;
}

export default function SubscriptionTab({
  orders,
  selectedOrderIndex,
  subStatus,
  grindType,
  user,
  onSelectOrderIndex,
  onOpenGrindModal,
  onOpenAddressModal,
  onSkipDelivery,
  onPauseSubscription,
  onGoToFavorites,
}: SubscriptionTabProps) {
  const [isBrewGuideOpen, setIsBrewGuideOpen] = useState(false);

  const activeOrder = orders.length > 0 ? orders[selectedOrderIndex] || orders[0] : null;
  const originInfo = resolveOriginDetails(activeOrder?.origin_name);

  return (
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
                  onClick={() => onSelectOrderIndex(idx)}
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
              {subStatus === "CANCELLED" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF5F5] text-[#A3432A] text-xs font-bold uppercase tracking-wider rounded-full border border-[#F0DADA]">
                  Subscription Cancelled
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
                  <span className="bg-[#1A1512]/90 text-white font-mono text-xs uppercase tracking-wider font-bold px-2.5 py-0.5 rounded border border-white/20">
                    {originInfo.altitude}
                  </span>
                  <span className="bg-[#A3432A] text-white font-mono text-xs uppercase tracking-wider font-bold px-2.5 py-0.5 rounded">
                    {originInfo.process}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="font-mono text-xs uppercase tracking-wider font-bold text-[#E58A1F]">
                    {originInfo.region}
                  </p>
                  <h3 className="text-xl font-serif font-bold leading-tight">
                    {activeOrder.origin_name}
                  </h3>
                </div>
              </div>

              {/* Compact Flavor Tags */}
              <div className="p-3 bg-white border-t border-[#E6DEC8] flex flex-wrap gap-1.5 font-mono text-xs">
                {originInfo.notes.map((note) => (
                  <span
                    key={note}
                    className="px-2 py-0.5 bg-[#FAF8F5] text-[#1A1512] border border-[#E6DEC8] rounded font-medium"
                  >
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
                    Rs. {activeOrder.total_price_npr}{" "}
                    <span className="text-xs font-sans text-[#8A7966] font-normal">/ cycle</span>
                  </span>
                </div>
                <p className="text-xs text-[#8A7966]">
                  {activeOrder.plan_name} • ~{activeOrder.weight_kg * 60} fresh cups • Small-batch roasted in Lalitpur
                </p>
              </div>

              {/* 3 Core Quick-Action Buttons */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={onOpenGrindModal}
                  className="px-4 py-2.5 bg-[#FAF8F5] hover:bg-white border border-[#E6DEC8] hover:border-[#1A1512] text-xs uppercase tracking-wider font-bold text-[#1A1512] transition-colors rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <SlidersHorizontal size={14} className="text-[#A3432A]" />
                  <span>
                    Grind: <strong className="text-[#A3432A]">{grindType.split(" ")[0]}</strong>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onSkipDelivery}
                  className="px-4 py-2.5 bg-[#FAF8F5] hover:bg-white border border-[#E6DEC8] hover:border-[#1A1512] text-xs uppercase tracking-wider font-bold text-[#1A1512] transition-colors rounded-xl shadow-xs cursor-pointer"
                >
                  {subStatus === "SKIPPED" ? "Undo Skip" : "Skip Next Box"}
                </button>

                <button
                  type="button"
                  onClick={onPauseSubscription}
                  className="px-4 py-2.5 bg-[#FAF8F5] hover:bg-white border border-[#E6DEC8] hover:border-[#1A1512] text-xs uppercase tracking-wider font-bold text-[#5C5042] transition-colors rounded-xl shadow-xs cursor-pointer"
                >
                  {subStatus === "PAUSED" ? "Resume Deliveries" : "Pause Plan"}
                </button>

                <button
                  type="button"
                  onClick={onGoToFavorites}
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
                    <span>
                      Delivery to: <strong className="text-[#1A1512]">{user.address || "Kathmandu Valley"}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenAddressModal}
                    className="text-[#A3432A] font-mono text-xs font-bold hover:underline shrink-0 cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E6DEC8] font-mono text-xs text-[#5C5042]">
                  <span className="flex items-center gap-1.5">
                    <Truck size={13} className="text-[#2E6B34]" /> Express Courier:{" "}
                    <strong className="text-[#1A1512]">Free Doorstep Dispatch</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CreditCard size={13} className="text-[#5C2D91]" /> Payment:{" "}
                    <strong className="text-[#1A1512]">Khalti Auto-Cleared</strong>
                  </span>
                </div>
              </div>

              {/* Collapsible Barista Brewing Tip */}
              <div className="border border-[#E6DEC8] rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setIsBrewGuideOpen(!isBrewGuideOpen)}
                  className="w-full min-h-[44px] px-4 py-2.5 text-left flex items-center justify-between font-mono text-xs font-bold text-[#1A1512] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Coffee size={14} className="text-[#A3432A]" />
                    <span>Barista Brew Recommendation for {activeOrder.origin_name}</span>
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-[#8A7966] transition-transform ${isBrewGuideOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isBrewGuideOpen && (
                  <div className="px-4 py-3 bg-[#FAF8F5] border-t border-[#E6DEC8] grid grid-cols-3 gap-3 font-mono text-xs animate-fadeIn">
                    <div>
                      <span className="uppercase font-bold text-[#5C5042] block">Ideal Method</span>
                      <span className="font-bold text-[#1A1512]">{originInfo.idealBrew}</span>
                    </div>
                    <div>
                      <span className="uppercase font-bold text-[#5C5042] block">Ratio</span>
                      <span className="font-bold text-[#A3432A]">{originInfo.ratio}</span>
                    </div>
                    <div>
                      <span className="uppercase font-bold text-[#5C5042] block">Water Temp</span>
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
  );
}
