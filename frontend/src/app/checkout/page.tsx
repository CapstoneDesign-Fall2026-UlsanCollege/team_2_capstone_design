"use client";

import { useState } from "react";
import Link from "next/link";

export default function CheckoutPage() {
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

  const handleFakePayment = () => {
    setPaymentStatus("processing");
    // Simulate network request
    setTimeout(() => {
      // Fake successful Khalti payment for midterm slice
      setPaymentStatus("success");
    }, 1500);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        <div className="space-y-2 mb-6">
          <p className="flex justify-between"><span>Plan:</span> <span>3 Months Premium</span></p>
          <p className="flex justify-between"><span>Origin:</span> <span>Gulmi Reserve</span></p>
          <p className="flex justify-between"><span>Weight:</span> <span>1 kg / delivery</span></p>
          <hr className="my-2" />
          <p className="flex justify-between font-bold"><span>Total:</span> <span>NPR 3,420</span></p>
        </div>

        {paymentStatus === "idle" && (
          <button 
            onClick={handleFakePayment}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition"
          >
            Pay with Khalti (Test Mode)
          </button>
        )}

        {paymentStatus === "processing" && (
          <div className="text-center text-gray-600 font-medium py-3">
            Processing payment...
          </div>
        )}

        {paymentStatus === "success" && (
          <div className="text-center">
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4 font-bold">
              Payment Successful! (Fake Test)
            </div>
            <Link href="/" className="text-purple-600 underline">
              Return Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
