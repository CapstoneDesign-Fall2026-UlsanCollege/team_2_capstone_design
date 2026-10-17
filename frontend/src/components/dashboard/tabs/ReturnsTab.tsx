"use client";

import { RotateCcw, CheckCircle2 } from "lucide-react";

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
  onChangeReturnForm: (field: string, value: string) => void;
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
      <div className="bg-white border border-[#E6DEC8] p-6 md:p-8 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <RotateCcw size={22} className="text-[#A3432A]" />
          <h3 className="text-2xl font-serif font-bold text-[#1A1512]">
            Returns & Doorstep Courier Pickup
          </h3>
        </div>
        <p className="text-xs text-[#5C5042] max-w-2xl leading-relaxed mb-6">
          Under BrewMellow's <strong>Traditional Return Policy</strong>, unopened and sealed bags of coffee can be returned within <strong>7 days of delivery</strong>. Our Himalayan courier partner will pick up the package directly from your doorstep and initiate your manual refund to Khalti.
        </p>

        {returnForm.submitted ? (
          <div className="p-6 bg-[#E7F3E8] border border-[#C3E4C6] rounded-xl text-center max-w-lg mx-auto">
            <CheckCircle2 size={36} className="text-[#2E6B34] mx-auto mb-2" />
            <h4 className="text-base font-bold text-[#1A1512]">Return Request Dispatched!</h4>
            <p className="text-xs text-[#2E6B34] font-mono mt-1 font-bold">Ticket: {returnForm.ticketId}</p>
            <p className="text-xs text-[#5C5042] mt-3">
              A Himalayan Express courier will arrive at your address within 24-48 business hours. Upon inspection, your refund of the full order amount will be credited to your original payment method.
            </p>
            <button
              type="button"
              onClick={onResetReturn}
              className="mt-4 px-4 py-2 text-xs uppercase tracking-widest font-bold text-[#2E6B34] underline cursor-pointer"
            >
              Submit Another Return
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmitReturn} className="max-w-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="returnOrderId" className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1">
                  Select Order / Batch *
                </label>
                <select
                  id="returnOrderId"
                  value={returnForm.orderId}
                  onChange={(e) => onChangeReturnForm("orderId", e.target.value)}
                  className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={`INV-${o.id.toString().padStart(5, "0")}`}>
                      INV-{o.id.toString().padStart(5, "0")} — {o.origin_name} ({o.total_price_npr} NPR)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="returnReason" className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1">
                  Return Reason *
                </label>
                <select
                  id="returnReason"
                  value={returnForm.reason}
                  onChange={(e) => onChangeReturnForm("reason", e.target.value)}
                  className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
                >
                  <option value="Packaging arrived damaged in courier transit">Packaging arrived damaged</option>
                  <option value="Incorrect grind size prepared">Incorrect grind size received</option>
                  <option value="Ordered incorrect origin by mistake">Accidentally ordered wrong coffee</option>
                  <option value="Unopened bag - decided not to consume">Unopened bag — changing preference</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="returnPickupAddress" className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1">
                Doorstep Pickup Address *
              </label>
              <input
                id="returnPickupAddress"
                type="text"
                required
                value={returnForm.pickupAddress}
                onChange={(e) => onChangeReturnForm("pickupAddress", e.target.value)}
                className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
              />
            </div>

            <div>
              <label htmlFor="returnNotes" className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1">
                Additional Notes for Courier (Optional)
              </label>
              <textarea
                id="returnNotes"
                rows={2}
                placeholder="e.g. Please pick up after 2 PM"
                value={returnForm.customerNotes}
                onChange={(e) => onChangeReturnForm("customerNotes", e.target.value)}
                className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3.5 bg-[#A3432A] hover:bg-[#8A3722] text-white text-xs uppercase tracking-widest font-bold rounded-xl transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw size={14} /> Schedule Doorstep Return Pickup
            </button>
          </form>
        )}
      </div>

      {/* Subscription Cancellation & Pause Preferences */}
      <div className="bg-white border border-[#E6DEC8] p-6 md:p-8 rounded-2xl shadow-sm">
        <h3 className="text-xl font-serif font-bold text-[#1A1512] mb-1">
          Manage or Cancel Subscription Plan
        </h3>
        <p className="text-xs text-[#5C5042] mb-6 leading-relaxed max-w-2xl">
          Need a break from deliveries? Rather than losing your direct-trade pricing status, you can pause shipments or skip the upcoming delivery.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl">
            <h5 className="font-bold text-xs text-[#1A1512] mb-1">Skip Next Box</h5>
            <p className="text-[11px] text-[#5C5042] mb-3">Skip Oct 18 delivery. Resume automatically on Nov 15.</p>
            <button
              type="button"
              onClick={onSkipDelivery}
              className="text-xs font-bold text-[#A3432A] hover:underline cursor-pointer"
            >
              {subStatus === "SKIPPED" ? "Undo Skip" : "Skip Single Box →"}
            </button>
          </div>

          <div className="p-4 bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl">
            <h5 className="font-bold text-xs text-[#1A1512] mb-1">Pause Indefinitely</h5>
            <p className="text-[11px] text-[#5C5042] mb-3">Keep your pricing locked. Resume whenever you're ready.</p>
            <button
              type="button"
              onClick={onPauseSubscription}
              className="text-xs font-bold text-[#A3432A] hover:underline cursor-pointer"
            >
              {subStatus === "PAUSED" ? "Resume Deliveries" : "Pause Subscription →"}
            </button>
          </div>

          <div className="p-4 bg-[#FAF8F5] border border-[#E6DEC8] rounded-xl">
            <h5 className="font-bold text-xs text-[#A3432A] mb-1">Cancel Plan</h5>
            <p className="text-[11px] text-[#5C5042] mb-3">Stop auto-renewal at the end of the current billing cycle.</p>
            <button
              type="button"
              onClick={onCancelSubscription}
              className="text-xs font-bold text-[#A3432A] hover:underline cursor-pointer"
            >
              {subStatus === "CANCELLED" ? "Reactivate Subscription" : "Cancel Subscription →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
