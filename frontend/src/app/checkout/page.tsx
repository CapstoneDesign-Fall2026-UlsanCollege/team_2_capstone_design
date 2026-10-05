"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CheckoutPage() {
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

  // Hardcoded for the UI demo slice. Normally this would come from global state/context.
  const orderPayload = {
    origin_id: 1,
    origin_name: "Gulmi Reserve",
    weight_kg: 1,
    plan_id: "3M",
    plan_name: "3 Months",
    total_price_npr: 1140, // 1200 * 1 * 0.95
    is_fake_payment: true
  };

  const handleFakePayment = async () => {
    setPaymentStatus("processing");
    
    try {
      const res = await fetch("/api/orders/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (res.ok) {
        setPaymentStatus("success");
      } else {
        setPaymentStatus("error");
      }
    } catch (err) {
      setPaymentStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] flex flex-col items-center p-6 font-sans">
      <div className="w-full max-w-md mt-16">
        
        <Link href="/" className="inline-flex items-center gap-2 text-[#8A7966] hover:text-[#2C2420] transition-colors mb-8 text-sm uppercase tracking-widest font-bold">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="bg-white shadow-sm border border-[#E6DEC8]">
          
          {/* Header */}
          <div className="p-8 pb-4 text-center">
            <h1 className="text-3xl font-serif font-bold text-[#1A1512]">Order Summary</h1>
          </div>
          
          <div className="p-8 pt-4">
            {/* Receipt Details */}
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-[#5C5042] text-sm uppercase tracking-wide">
                <span>Plan</span> 
                <span className="font-bold text-[#1A1512]">{orderPayload.plan_name}</span>
              </div>
              <div className="flex justify-between text-[#5C5042] text-sm uppercase tracking-wide">
                <span>Origin</span> 
                <span className="font-bold text-[#1A1512]">{orderPayload.origin_name}</span>
              </div>
              <div className="flex justify-between text-[#5C5042] text-sm uppercase tracking-wide">
                <span>Weight</span> 
                <span className="font-bold text-[#1A1512]">{orderPayload.weight_kg} kg</span>
              </div>
              
              <div className="pt-6 mt-6 border-t border-[#E6DEC8]"></div>
              
              <div className="flex justify-between items-end">
                <span className="font-bold text-[#8A7966] uppercase tracking-widest text-xs">Total</span> 
                <span className="text-3xl font-serif text-[#1A1512]">Rs. {orderPayload.total_price_npr}</span>
              </div>
            </div>

            {/* Payment States */}
            {paymentStatus === "idle" && (
              <div className="space-y-4">
                <button 
                  onClick={handleFakePayment}
                  className="w-full bg-[#5C2D91] text-white py-4 text-sm uppercase tracking-widest font-bold hover:bg-[#4A2474] transition-colors"
                >
                  Pay with Khalti
                </button>
                <p className="text-center text-xs text-[#8A7966] uppercase tracking-widest">
                  Midterm Slice / Test Mode
                </p>
              </div>
            )}

            {paymentStatus === "processing" && (
              <div className="text-center py-10 text-[#5C5042] bg-[#F5F2EB] rounded-lg border border-[#E6DEC8] mb-6">
                <p className="text-sm uppercase tracking-widest font-bold animate-pulse">Connecting to Khalti Secure Gateway...</p>
              </div>
            )}

            {paymentStatus === "success" && (
              <div className="text-center py-6">
                <div className="text-[#A3432A] text-xl font-serif font-bold mb-6">
                  Payment Successful
                </div>
                <Link href="/" className="text-[#8A7966] text-sm uppercase tracking-widest font-bold hover:text-[#1A1512] underline decoration-[#E6DEC8] underline-offset-8 transition-colors">
                  Return to Home
                </Link>
              </div>
            )}

            {paymentStatus === "error" && (
              <div className="text-center py-6">
                <div className="bg-[#FAF5F5] text-[#A3432A] p-4 text-sm font-medium border border-[#F0DADA] mb-6">
                  Connection Error. Is the Django API running?
                </div>
                <button 
                  onClick={() => setPaymentStatus("idle")}
                  className="text-[#8A7966] text-sm uppercase tracking-widest font-bold hover:text-[#1A1512] underline decoration-[#E6DEC8] underline-offset-8 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
