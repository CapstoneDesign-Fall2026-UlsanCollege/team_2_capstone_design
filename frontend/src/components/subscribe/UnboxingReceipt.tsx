"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight, Package, Scale, Sparkles, UserCheck } from "lucide-react";
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
}: UnboxingReceiptProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E6DEC8] shadow-md p-6 sticky top-28">
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-4 border-b border-[#F0EAE1] mb-5">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#A3432A] block">
            {isTrialMode ? "Trial Parcel Manifest" : "Monthly Unboxing Manifest"}
          </span>
          <h2 className="text-lg font-serif font-bold text-[#1A1512]">
            {isTrialMode ? "150g Trial Box" : `${selectedPlan.name}`}
          </h2>
        </div>
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
            isTrialMode
              ? "bg-[#FAF5EC] text-[#A3432A] border border-[#E58A1F]/30"
              : "bg-[#E7F3E8] text-[#2E6B34]"
          }`}
        >
          {isTrialMode ? "One-Time Order" : "Prepaid Roastery Club"}
        </span>
      </div>

      {/* Box Contents Breakdown */}
      <div className="space-y-3.5 mb-6 text-xs">
        {/* Curated Coffees */}
        <div className="flex items-start gap-2.5 pb-3 border-b border-[#FAF8F5]">
          <Package size={15} className="text-[#A3432A] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-[#8A7966] text-[10px] uppercase font-bold block">
              Curated Coffees
            </span>
            <div className="font-semibold text-[#1A1512] mt-0.5 space-y-1">
              {selectedOriginsList.map((o) => (
                <div key={o.id} className="flex justify-between items-center text-xs">
                  <span className="truncate">
                    {bagCounts[o.id]}x {o.name}
                  </span>
                  <span className="text-[#8A7966] text-[11px] shrink-0 font-mono ml-2">
                    {activeSize.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Total Batch Weight */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#FAF8F5]">
          <Scale size={15} className="text-[#A3432A] shrink-0" />
          <div className="flex-1 flex justify-between items-center">
            <span className="text-[#8A7966] text-[10px] uppercase font-bold">
              Total Parcel Volume
            </span>
            <span className="font-bold text-[#1A1512] text-xs">
              {totalSelectedBags} Bag{totalSelectedBags > 1 ? "s" : ""} • {totalWeightKg} kg (
              {activeSize.cups})
            </span>
          </div>
        </div>

        {/* Grind Type */}
        <div className="flex items-center justify-between text-xs pb-3 border-b border-[#FAF8F5]">
          <span className="text-[#8A7966] text-[10px] uppercase font-bold">Grind Setting</span>
          <span className="font-semibold text-[#1A1512] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E6DEC8]">
            {selectedGrind.name}
          </span>
        </div>

        {/* Shipping Schedule */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8A7966] text-[10px] uppercase font-bold">Courier Shipping</span>
          <span className="font-bold text-[#2E6B34] flex items-center gap-1">
            <Sparkles size={11} /> Free Kathmandu Valley
          </span>
        </div>
      </div>

      {/* Mathematical Pricing Ledger */}
      <div className="bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl p-4 mb-6 space-y-2 text-xs">
        {isTrialMode ? (
          <>
            <div className="flex justify-between text-[#8A7966]">
              <span>Sample Bag (150g)</span>
              <span className="font-mono text-[#1A1512]">Rs. {rawSubtotal}</span>
            </div>
            <div className="flex justify-between text-[#8A7966]">
              <span>Kathmandu Valley Express</span>
              <span className="font-bold text-[#2E6B34]">FREE</span>
            </div>
            <div className="pt-2 border-t border-[#E6DEC8] flex justify-between items-baseline font-bold">
              <span className="text-xs uppercase tracking-wider text-[#1A1512]">Total Due Today</span>
              <span className="text-xl font-serif text-[#A3432A]">Rs. {totalDueToday}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between text-[#8A7966]">
              <span>Box Base ({totalSelectedBags} bags / mo)</span>
              <span className="font-mono text-[#1A1512]">Rs. {rawSubtotal}</span>
            </div>

            {bundleDiscountPercent > 0 && (
              <div className="flex justify-between text-[#2E6B34] font-medium">
                <span>Multi-Bag Bundle ({bundleDiscountPercent}% Off)</span>
                <span className="font-mono">-Rs. {bundleDiscountAmount}</span>
              </div>
            )}

            <div className="flex justify-between text-[#5C5042] font-semibold pt-1 border-t border-[#E6DEC8]/60">
              <span>Standard Monthly Cycle</span>
              <span className="font-mono text-[#1A1512]">Rs. {monthlyAfterBundle}</span>
            </div>

            {selectedPlan.months > 1 && (
              <>
                <div className="flex justify-between text-[#8A7966]">
                  <span>Cycle Contract ({selectedPlan.months} Months)</span>
                  <span className="font-mono text-[#1A1512]">
                    Rs. {monthlyAfterBundle * selectedPlan.months}
                  </span>
                </div>
                {planDiscountPercent > 0 && (
                  <div className="flex justify-between text-[#2E6B34] font-bold">
                    <span>Prepay Discount ({planDiscountPercent}% Off)</span>
                    <span className="font-mono">-Rs. {planDiscountAmount}</span>
                  </div>
                )}
              </>
            )}

            <div className="pt-2.5 border-t border-[#E6DEC8] flex justify-between items-baseline">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8A7966] block">
                  Total Due Today ({selectedPlan.months} Mo)
                </span>
                {selectedPlan.months > 1 && (
                  <span className="text-[11px] text-[#2E6B34] font-bold">
                    Effective: Rs. {effectiveMonthlyPrice} / month
                  </span>
                )}
              </div>
              <span className="text-2xl font-serif font-bold text-[#A3432A]">
                Rs. {totalDueToday.toLocaleString()}
              </span>
            </div>

            {totalSavings > 0 && (
              <div className="text-center pt-1.5">
                <span className="inline-block bg-[#E7F3E8] text-[#2E6B34] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  Total Saved: Rs. {totalSavings.toLocaleString()} NPR
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Checkout CTA */}
      <Link
        href={checkoutHref}
        className="w-full py-3.5 rounded-xl bg-[#A3432A] hover:bg-[#8A3722] text-white text-center uppercase tracking-widest text-xs font-bold transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2 group focus:outline-hidden focus:ring-2 focus:ring-[#A3432A]"
      >
        <span>Proceed To Delivery</span>
        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Trust & Guarantee */}
      <div className="mt-4 pt-4 border-t border-[#F0EAE1] space-y-2 text-[11px] text-[#8A7966]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#2E6B34] shrink-0" />
          <span>Roasted fresh in Lalitpur • Dispatched within 24 hours</span>
        </div>
        {!isTrialMode && (
          <div className="flex items-center gap-2">
            <UserCheck size={14} className="text-[#2E6B34] shrink-0" />
            <span>Pause, swap beans, or cancel anytime from your dashboard</span>
          </div>
        )}
      </div>
    </div>
  );
}
