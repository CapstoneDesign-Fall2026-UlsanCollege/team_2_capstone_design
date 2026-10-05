"use client";

import { useState } from "react";
import Link from "next/link";
import { Coffee, ShieldCheck, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";

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
      const res = await fetch("http://localhost:8000/api/orders/", {
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
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 font-sans selection:bg-amber-200">
      <div className="w-full max-w-lg">
        
        <Link href="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-amber-800 transition-colors mb-6 font-medium">
          <ArrowLeft size={20} /> Back to selection
        </Link>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-100">
          
          {/* Header */}
          <div className="bg-amber-900 text-white p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
              <Coffee size={150} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold relative z-10">Order Summary</h1>
            <p className="text-amber-200 text-sm mt-1 relative z-10">Secure Checkout</p>
          </div>
          
          <div className="p-6 md:p-8">
            {/* Receipt Details */}
            <div className="space-y-4 mb-8 bg-stone-50 p-5 rounded-2xl border border-stone-100">
              <div className="flex justify-between items-center text-stone-600">
                <span className="font-medium">Plan</span> 
                <span className="font-bold text-stone-900">{orderPayload.plan_name}</span>
              </div>
              <div className="flex justify-between items-center text-stone-600">
                <span className="font-medium">Origin</span> 
                <span className="font-bold text-stone-900">{orderPayload.origin_name}</span>
              </div>
              <div className="flex justify-between items-center text-stone-600">
                <span className="font-medium">Weight</span> 
                <span className="font-bold text-stone-900">{orderPayload.weight_kg} kg / delivery</span>
              </div>
              
              <div className="pt-4 mt-4 border-t-2 border-stone-200 border-dashed"></div>
              
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg text-stone-800">Total Price</span> 
                <span className="text-2xl font-black text-amber-900">Rs. {orderPayload.total_price_npr}</span>
              </div>
            </div>

            {/* Payment States */}
            {paymentStatus === "idle" && (
              <div className="space-y-4">
                <button 
                  onClick={handleFakePayment}
                  className="group relative w-full overflow-hidden bg-[#5C2D91] text-white py-4 rounded-2xl font-bold text-lg transition-all hover:bg-[#4A2474] hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  <ShieldCheck size={24} className="group-hover:scale-110 transition-transform" />
                  Pay with Khalti
                </button>
                <p className="text-center text-xs text-stone-400 font-medium uppercase tracking-wide">
                  Midterm Slice: Fake Payment Test Mode
                </p>
              </div>
            )}

            {paymentStatus === "processing" && (
              <div className="flex flex-col items-center justify-center py-6 text-amber-800">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p className="font-bold text-lg">Connecting to Khalti...</p>
                <p className="text-sm text-stone-500 mt-1">Please do not close this window</p>
              </div>
            )}

            {paymentStatus === "success" && (
              <div className="flex flex-col items-center justify-center py-6 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-black text-stone-900 mb-2">Payment Successful!</h3>
                <p className="text-stone-500 text-center mb-8">
                  Your order has been securely saved to the Neon database.
                </p>
                <Link href="/" className="px-8 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors">
                  Return to Home
                </Link>
              </div>
            )}

            {paymentStatus === "error" && (
              <div className="text-center py-6">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 font-bold border border-red-100">
                  Connection Error. Make sure the Django API is running.
                </div>
                <button 
                  onClick={() => setPaymentStatus("idle")}
                  className="text-amber-800 font-bold underline"
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
