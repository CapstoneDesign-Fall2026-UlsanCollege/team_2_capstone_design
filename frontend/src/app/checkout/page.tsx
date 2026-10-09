"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Suspense } from "react";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

  const hasSelection = searchParams.has("origin");

  // Read from URL params (passed from /subscribe), or fall back to defaults
  const originName = searchParams.get("name") || "Gulmi Reserve";
  const originId = Number(searchParams.get("origin")) || 1;
  const weightKg = Number(searchParams.get("weight")) || 1;
  const totalPrice = Number(searchParams.get("price")) || 1200;
  const planId = searchParams.get("plan_id") || "PAYG";
  const planName = searchParams.get("plan_name") || "Pay per delivery";

  const orderPayload = {
    origin_id: originId,
    origin_name: originName,
    weight_kg: weightKg,
    plan_id: planId,
    plan_name: planName,
    total_price_npr: totalPrice,
    is_fake_payment: true,
  };

  const handleFakePayment = async () => {
    setPaymentStatus("processing");

    // Simulate network delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 2000));

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

  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex flex-col items-center p-6 font-sans justify-center">
        <div className="w-full max-w-md text-center bg-white p-12 shadow-sm border border-[#E6DEC8]">
          <CheckCircle size={48} className="text-[#2E6B34] mx-auto mb-6" />
          <h1 className="text-3xl font-serif font-bold text-[#1A1512] mb-4">Payment Successful!</h1>
          <p className="text-[#5C5042] text-sm mb-8 leading-relaxed">
            Your Himalayan Coffee subscription is confirmed. Your first order is being prepared for roasting.
          </p>
          <Link
            href="/dashboard"
            className="inline-block w-full bg-[#1A1512] text-white py-4 text-sm uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!hasSelection) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex flex-col items-center p-6 font-sans justify-center">
        <div className="w-full max-w-md text-center bg-white p-12 shadow-sm border border-[#E6DEC8]">
          <h1 className="text-3xl font-serif font-bold text-[#1A1512] mb-4">Your Cart is Empty</h1>
          <p className="text-[#5C5042] text-sm mb-8 leading-relaxed">
            It looks like you haven't built your coffee subscription plan yet. 
          </p>
          <Link
            href="/subscribe"
            className="inline-block w-full bg-[#1A1512] text-white py-4 text-sm uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors"
          >
            Build Your Plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EB] flex flex-col items-center p-6 font-sans">
      <div className="w-full max-w-md mt-16">

        <Link href="/subscribe" className="inline-flex items-center gap-2 text-[#8A7966] hover:text-[#2C2420] transition-colors mb-8 text-sm uppercase tracking-widest font-bold">
          <ArrowLeft size={16} /> Change Selection
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
                <span>Origin</span>
                <span className="font-bold text-[#1A1512]">{orderPayload.origin_name}</span>
              </div>
              <div className="flex justify-between text-[#5C5042] text-sm uppercase tracking-wide">
                <span>Weight</span>
                <span className="font-bold text-[#1A1512]">{orderPayload.weight_kg} kg</span>
              </div>
              <div className="flex justify-between text-[#5C5042] text-sm uppercase tracking-wide">
                <span>Plan</span>
                <span className="font-bold text-[#1A1512]">{orderPayload.plan_name}</span>
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
                  Midterm Slice · Simulated Payment
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
                <CheckCircle size={40} className="mx-auto text-green-600 mb-4" />
                <div className="text-green-700 text-xl font-serif font-bold mb-2">
                  Payment Successful
                </div>
                <p className="text-sm text-[#8A7966] mb-6">Order #{Math.floor(Math.random() * 9000) + 1000} confirmed</p>
                <Link href="/" className="text-[#8A7966] text-sm uppercase tracking-widest font-bold hover:text-[#1A1512] underline decoration-[#E6DEC8] underline-offset-8 transition-colors">
                  Return to Home
                </Link>
              </div>
            )}

            {paymentStatus === "error" && (
              <div className="text-center py-6">
                <AlertTriangle size={36} className="mx-auto text-[#A3432A] mb-4" />
                <div className="bg-[#FAF5F5] text-[#A3432A] p-4 text-sm font-medium border border-[#F0DADA] mb-6">
                  Connection Error — Django API is not running locally.
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center">
        <p className="text-[#8A7966] text-sm uppercase tracking-widest font-bold animate-pulse">Loading checkout...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
