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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 font-sans">
      <div className="w-full max-w-md mt-10">
        
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium">
          <ArrowLeft size={16} /> Back to selection
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          
          {/* Header */}
          <div className="bg-amber-900 text-white p-6">
            <h1 className="text-2xl font-bold">Order Summary</h1>
          </div>
          
          <div className="p-6">
            {/* Receipt Details */}
            <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex justify-between text-gray-700">
                <span>Plan</span> 
                <span className="font-bold">{orderPayload.plan_name}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Origin</span> 
                <span className="font-bold">{orderPayload.origin_name}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Weight</span> 
                <span className="font-bold">{orderPayload.weight_kg} kg / delivery</span>
              </div>
              
              <div className="pt-3 mt-3 border-t border-gray-300 border-dashed"></div>
              
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Total Price</span> 
                <span className="text-xl font-bold text-amber-900">Rs. {orderPayload.total_price_npr}</span>
              </div>
            </div>

            {/* Payment States */}
            {paymentStatus === "idle" && (
              <div className="space-y-3">
                <button 
                  onClick={handleFakePayment}
                  className="w-full bg-[#5C2D91] text-white py-3 rounded-lg font-bold hover:bg-[#4A2474] transition-colors"
                >
                  Pay with Khalti
                </button>
                <p className="text-center text-sm text-gray-500">
                  Midterm Slice: Fake Payment Test Mode
                </p>
              </div>
            )}

            {paymentStatus === "processing" && (
              <div className="text-center py-6 text-gray-600">
                <p className="font-bold">Connecting to Khalti...</p>
              </div>
            )}

            {paymentStatus === "success" && (
              <div className="text-center py-6">
                <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 font-bold">
                  Payment Successful!
                </div>
                <Link href="/" className="text-amber-800 font-bold underline">
                  Return to Home
                </Link>
              </div>
            )}

            {paymentStatus === "error" && (
              <div className="text-center py-6">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 font-bold border border-red-200">
                  Connection Error. Is the Django API running?
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
