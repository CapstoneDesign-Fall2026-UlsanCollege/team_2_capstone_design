"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight, Package, Scale, UserCheck, Clock } from "lucide-react";
import { OriginItem } from "./OriginCard";

interface UnboxingReceiptProps {
  isTrialMode: boolean;
  summaryName: string;
  selectedOriginsList: OriginItem[];
  bagCounts: { [id: number]: number };
  activeSize: { id: string; label: string; value: number; tag?: string; cups: string };
  selectedGrind: { id: string; name: string };
  selectedPlan: { id: string; name: string; discount: number; months: number; tag: string };
  totalSelectedBags: number;
  totalWeightKg: number;
  rawSubtotal: number;
  bundleDiscountPercent: number;
  bundleDiscountAmount: number;
  monthlyAfterBundle: number;
  planDiscountPercent: number;
  planDiscountAmount: number;
  totalDueToday: number;
  effectiveMonthlyPrice: number;
  totalSavings: number;
  customer: { name?: string; email?: string } | null;
  checkoutHref: string;
  isDrawer?: boolean;
}

export default function UnboxingReceipt({
  isTrialMode,
  summaryName,
  selectedOriginsList,
  bagCounts,
  activeSize,
  selectedGrind,
  selectedPlan,
  totalSelectedBags,
  totalWeightKg,
  rawSubtotal,
  bundleDiscountPercent,
  bundleDiscountAmount,
  monthlyAfterBundle,
  planDiscountPercent,
  planDiscountAmount,
  totalDueToday,
  effectiveMonthlyPrice,
  totalSavings,
  customer,
  checkoutHref,
  isDrawer = false,
}: UnboxingReceiptProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#E6DEC8] shadow-sm p-6 ${
        isDrawer ? "" : "lg:sticky lg:top-28"
      }`}
    >
      {/* Header Manifest Ribbon */}
      <div className="flex items-center justify-between pb-4 border-b border-dashed border-[#1A1512]/20 mb-5">
        <div>
          <span className="font-mono text-xs uppercase font-bold tracking-widest text-[#A3432A] block">
            {isTrialMode ? "Trial Parcel Manifest" : "Roastery Dispatch Manifest"}
          </span>
          <h2 className="text-xl font-serif font-bold text-[#1A1512] mt-0.5">
            {isTrialMode ? "150g Trial Lot" : `${selectedPlan.name}`}
          </h2>
        </div>
        <span
          className={`font-mono text-xs font-bold px-3 py-1 rounded-full border ${
            isTrialMode
              ? "bg-[#FAF5EC] text-[#A3432A] border-[#E58A1F]/30"
              : "bg-[#E7F3E8] text-[#2E6B34] border-[#C3E4C6]"
          }`}
        >
          {isTrialMode ? "One-Time Order" : "Roastery Club"}
        </span>
      </div>

      {/* Box Contents Breakdown */}
      <div className="space-y-4 mb-6 text-xs">
        {/* Curated Coffees List */}
        <div className="flex items-start gap-3 pb-3.5 border-b border-[#F0EAE1]">
          <Package size={16} className="text-[#A3432A] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-mono text-xs text-[#5C5042] uppercase font-bold block mb-1">
              Curated Micro-Lots ({totalSelectedBags} Total)
            </span>
            <div className="font-semibold text-[#1A1512] space-y-1.5">
              {selectedOriginsList.map((o) => (
                <div key={o.id} className="flex justify-between items-center text-xs">
                  <span className="truncate font-serif text-sm">
                    {bagCounts[o.id]}x {o.name}
                  </span>
                  <span className="font-mono text-[#5C5042] shrink-0 ml-2 font-semibold">
                    {activeSize.label} ({o.process})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Total Batch Weight & Yield */}
        <div className="flex items-center gap-3 pb-3.5 border-b border-[#F0EAE1]">
          <Scale size={16} className="text-[#A3432A] shrink-0" />
          <div className="flex-1 flex justify-between items-center">
            <span className="font-mono text-xs text-[#5C5042] uppercase font-bold">
              Total Batch Weight
            </span>
            <span className="font-mono font-bold text-[#1A1512] text-xs">
              {totalWeightKg} kg • {activeSize.cups}
            </span>
          </div>
        </div>

        {/* Grind Type */}
        <div className="flex items-center justify-between text-xs pb-3.5 border-b border-[#F0EAE1]">
          <span className="font-mono text-xs text-[#5C5042] uppercase font-bold">Grind Setting</span>
          <span className="font-mono font-bold text-[#1A1512] bg-[#FAF8F5] px-2.5 py-1 rounded-md border border-[#E6DEC8]">
            {selectedGrind.name}
          </span>
        </div>

        {/* Roastery Dispatch Schedule */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-xs text-[#5C5042] uppercase font-bold flex items-center gap-1.5">
            <Clock size={13} className="text-[#A3432A]" /> Courier Dispatch
          </span>
          <span className="font-mono font-bold text-[#2E6B34]">
            Free Doorstep Shipping
          </span>
        </div>
      </div>

      {/* Roastery Pricing Ledger */}
      <div className="bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl p-4 mb-6 space-y-2 text-xs">
        {isTrialMode ? (
          <>
            <div className="flex justify-between text-[#5C5042]">
              <span className="font-mono">Sample Micro-Lot (150g)</span>
              <span className="font-mono font-bold text-[#1A1512]">Rs. {rawSubtotal}</span>
            </div>
            <div className="flex justify-between text-[#5C5042]">
              <span className="font-mono">Express Courier Shipping</span>
              <span className="font-mono font-bold text-[#2E6B34]">FREE (Kathmandu Valley)</span>
            </div>
            <div className="pt-2.5 border-t border-dashed border-[#1A1512]/20 flex justify-between items-baseline font-bold">
              <span className="font-mono text-xs uppercase tracking-wider text-[#1A1512]">Total Due Today</span>
              <span className="text-2xl font-serif text-[#A3432A]">Rs. {totalDueToday}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between text-[#5C5042]">
              <span className="font-mono">Box Base ({totalSelectedBags} bag{totalSelectedBags > 1 ? "s" : ""} / cycle)</span>
              <span className="font-mono font-bold text-[#1A1512]">Rs. {rawSubtotal}</span>
            </div>

            {bundleDiscountPercent > 0 && (
              <div className="flex justify-between text-[#2E6B34] font-medium">
                <span className="font-mono">Multi-Bag Bundle ({bundleDiscountPercent}% Off)</span>
                <span className="font-mono font-bold">-Rs. {bundleDiscountAmount}</span>
              </div>
            )}

            <div className="flex justify-between text-[#1A1512] font-semibold pt-1 border-t border-[#E6DEC8]">
              <span className="font-mono">Standard Monthly Cycle</span>
              <span className="font-mono font-bold">Rs. {monthlyAfterBundle}</span>
            </div>

            {selectedPlan.months > 1 && (
              <>
                <div className="flex justify-between text-[#5C5042]">
                  <span className="font-mono">Prepaid Period ({selectedPlan.months} Months)</span>
                  <span className="font-mono text-[#1A1512]">
                    Rs. {monthlyAfterBundle * selectedPlan.months}
                  </span>
                </div>
                {planDiscountPercent > 0 && (
                  <div className="flex justify-between text-[#2E6B34] font-bold">
                    <span className="font-mono">Prepay Commitment ({planDiscountPercent}% Off)</span>
                    <span className="font-mono">-Rs. {planDiscountAmount}</span>
                  </div>
                )}
              </>
            )}

            <div className="pt-3 border-t border-dashed border-[#1A1512]/20 flex justify-between items-baseline">
              <div>
                <span className="font-mono text-xs uppercase font-bold text-[#5C5042] block">
                  Total Due Today ({selectedPlan.months} Mo)
                </span>
                {selectedPlan.months > 1 && (
                  <span className="font-mono text-xs text-[#2E6B34] font-bold block mt-0.5">
                    Effective: Rs. {effectiveMonthlyPrice} / month
                  </span>
                )}
              </div>
              <span className="text-2xl font-serif font-bold text-[#A3432A]">
                Rs. {totalDueToday.toLocaleString()}
              </span>
            </div>

            {totalSavings > 0 && (
              <div className="text-center pt-2">
                <span className="inline-block bg-[#E7F3E8] border border-[#C3E4C6] text-[#2E6B34] px-3 py-1 rounded-full font-mono text-xs font-bold">
                  Total Savings: Rs. {totalSavings.toLocaleString()} NPR
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Primary Checkout CTA Button */}
      <Link
        href={checkoutHref}
        className="w-full min-h-[48px] py-3.5 rounded-xl bg-[#A3432A] hover:bg-[#8A3722] text-white text-center uppercase tracking-widest text-xs font-bold transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2 group cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#A3432A] active:scale-[0.99]"
      >
        <span>Proceed To Delivery</span>
        <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Trust & Guarantee Ledger Footnotes */}
      <div className="mt-5 pt-4 border-t border-[#F0EAE1] space-y-2 text-xs text-[#5C5042]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-[#2E6B34] shrink-0" />
          <span>Roasted fresh in Lalitpur • Dispatched within 48h of roast</span>
        </div>
        {!isTrialMode && (
          <div className="flex items-center gap-2">
            <UserCheck size={15} className="text-[#2E6B34] shrink-0" />
            <span>Pause, swap micro-lots, or cancel anytime from dashboard</span>
          </div>
        )}
      </div>
    </div>
  );
}
