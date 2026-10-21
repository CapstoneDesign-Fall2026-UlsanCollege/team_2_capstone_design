"use client";

import { RotateCcw, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

interface ReturnsTabProps {
  returnForm: {
    orderId: string;
    reason: string;
    pickupAddress: string;
    customerNotes: string;
    submitted: boolean;
    ticketId: string;
  };
  orders: any[];
  subStatus: "ACTIVE" | "SKIPPED" | "PAUSED" | "CANCELLED";
  onChangeReturnForm: (field: string, val: string) => void;
  onSubmitReturn: (e: React.FormEvent) => void;
  onResetReturn: () => void;
  onSkipDelivery: () => void;
  onPauseSubscription: () => void;
  onCancelSubscription: () => void;
}

export default function ReturnsTab({
  returnForm,
  orders,
  subStatus,
  onChangeReturnForm,
  onSubmitReturn,
  onResetReturn,
  onSkipDelivery,
  onPauseSubscription,
  onCancelSubscription,
}: ReturnsTabProps) {
  return (
    <div className="space-y-8">
      {/* 14-Day Freshness Guarantee & Doorstep Returns Form */}
      <div className="bg-white border border-[#E6DEC8] p-6 md:p-8 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E6DEC8] gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-serif font-bold text-[#1A1512]">
              14-Day Freshness Guarantee & Doorstep Returns
            </h3>
            <p className="font-mono text-xs text-[#5C5042] mt-0.5">
              If an unopened coffee bag arrives damaged or the grind doesn&apos;t match, we collect from your door at zero cost.
            </p>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#2E6B34] bg-[#E7F3E8] px-3 py-1.5 rounded-lg border border-[#C3E4C6] self-start sm:self-auto">
            <ShieldCheck size={14} /> 100% Roaster Protected
          </div>
        </div>

        {returnForm.submitted ? (
          <div className="bg-[#FAF8F5] border border-[#2E6B34]/30 rounded-xl p-6 text-center max-w-lg mx-auto">
            <CheckCircle2 size={36} className="text-[#2E6B34] mx-auto mb-2" />
            <h4 className="text-base font-bold text-[#1A1512]">Return Request Dispatched!</h4>
            <p className="text-xs text-[#2E6B34] font-mono mt-1 font-bold">Ticket: {returnForm.ticketId}</p>
            <p className="text-xs text-[#5C5042] mt-3 leading-relaxed">
              A Himalayan Express courier will arrive at your address within 24-48 business hours. Upon inspection, your refund of the full order amount will be credited to your original payment method.
            </p>
            <button
              type="button"
              onClick={onResetReturn}
              className="mt-4 px-4 py-2 font-mono text-xs uppercase tracking-widest font-bold text-[#2E6B34] underline cursor-pointer"
            >
              Submit Another Return
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmitReturn} className="max-w-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="returnOrderId" className="block font-mono text-xs uppercase tracking-wider font-bold text-[#5C5042] mb-1.5">
                  Select Order / Batch *
                </label>
                <select
                  id="returnOrderId"
                  value={returnForm.orderId}
                  onChange={(e) => onChangeReturnForm("orderId", e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={`INV-${o.id.toString().padStart(5, "0")}`}>
                      INV-{o.id.toString().padStart(5, "0")} — {o.origin_name} ({o.total_price_npr} NPR)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="returnReason" className="block font-mono text-xs uppercase tracking-wider font-bold text-[#5C5042] mb-1.5">
                  Return Reason *
                </label>
                <select
                  id="returnReason"
                  value={returnForm.reason}
                  onChange={(e) => onChangeReturnForm("reason", e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
                >
                  <option value="Packaging arrived damaged in courier transit">Packaging arrived damaged</option>
                  <option value="Incorrect grind size prepared">Incorrect grind size received</option>
                  <option value="Ordered incorrect origin by mistake">Accidentally ordered wrong coffee</option>
                  <option value="Unopened bag - decided not to consume">Unopened bag — changing preference</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="returnPickupAddress" className="block font-mono text-xs uppercase tracking-wider font-bold text-[#5C5042] mb-1.5">
                Doorstep Pickup Address *
              </label>
              <input
                id="returnPickupAddress"
                type="text"
                required
                value={returnForm.pickupAddress}
                onChange={(e) => onChangeReturnForm("pickupAddress", e.target.value)}
                className="w-full min-h-[48px] px-3.5 py-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
              />
            </div>

            <div>
              <label htmlFor="returnNotes" className="block font-mono text-xs uppercase tracking-wider font-bold text-[#5C5042] mb-1.5">
                Additional Notes for Courier (Optional)
              </label>
              <textarea
                id="returnNotes"
                rows={2}
                placeholder="e.g. Please pick up after 2 PM"
                value={returnForm.customerNotes}
                onChange={(e) => onChangeReturnForm("customerNotes", e.target.value)}
                className="w-full p-3.5 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
              />
            </div>

            <button
              type="submit"
              className="min-h-[48px] px-6 py-3.5 bg-[#A3432A] hover:bg-[#8A3722] text-white font-mono text-xs uppercase tracking-widest font-bold rounded-xl transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <RotateCcw size={14} /> Schedule Doorstep Return Pickup
            </button>
          </form>
        )}
      </div>

      {/* Subscription Cancellation & Pause Preferences */}
      <div className="bg-white border border-[#E6DEC8] p-6 md:p-8 rounded-2xl shadow-xs">
        <h3 className="text-xl font-serif font-bold text-[#1A1512] mb-1">
          Manage or Modify Subscription Schedule
        </h3>
        <p className="text-xs text-[#5C5042] mb-6 leading-relaxed max-w-2xl font-sans">
          Need a break from deliveries? Rather than losing your direct-trade pricing status, you can pause shipments or skip the upcoming delivery.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl flex flex-col justify-between">
            <div>
              <h5 className="font-mono font-bold text-xs uppercase tracking-wider text-[#1A1512] mb-1">Skip Next Box</h5>
              <p className="text-xs text-[#5C5042] mb-3 leading-relaxed">Skip upcoming delivery cycle. Resumes automatically on next cycle.</p>
            </div>
            <button
              type="button"
              onClick={onSkipDelivery}
              className="min-h-[40px] font-mono text-xs font-bold text-[#A3432A] hover:underline cursor-pointer text-left"
            >
              {subStatus === "SKIPPED" ? "Undo Skip" : "Skip Single Box →"}
            </button>
          </div>

          <div className="p-4 bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl flex flex-col justify-between">
            <div>
              <h5 className="font-mono font-bold text-xs uppercase tracking-wider text-[#1A1512] mb-1">Pause Indefinitely</h5>
              <p className="text-xs text-[#5C5042] mb-3 leading-relaxed">Keep your pricing locked. Resume whenever you&apos;re ready.</p>
            </div>
            <button
              type="button"
              onClick={onPauseSubscription}
              className="min-h-[40px] font-mono text-xs font-bold text-[#A3432A] hover:underline cursor-pointer text-left"
            >
              {subStatus === "PAUSED" ? "Resume Deliveries" : "Pause Subscription →"}
            </button>
          </div>

          <div className="p-4 bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl flex flex-col justify-between">
            <div>
              <h5 className="font-mono font-bold text-xs uppercase tracking-wider text-[#A3432A] mb-1">Cancel Plan</h5>
              <p className="text-xs text-[#5C5042] mb-3 leading-relaxed">Stop auto-renewal at the end of the current billing cycle.</p>
            </div>
            <button
              type="button"
              onClick={onCancelSubscription}
              className="min-h-[40px] font-mono text-xs font-bold text-[#A3432A] hover:underline cursor-pointer text-left"
            >
              {subStatus === "CANCELLED" ? "Reactivate Subscription" : "Cancel Subscription →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
