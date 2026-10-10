"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertTriangle, Loader2, MapPin, Phone, Mail, User, Lock, ShieldCheck } from "lucide-react";
import { Suspense } from "react";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "Kathmandu",
    landmark: "",
    password: "",
  });

  const hasSelection = searchParams.has("origin");

  // Read selection from URL params
  const originName = searchParams.get("name") || "Gulmi Reserve";
  const originId = Number(searchParams.get("origin")) || 1;
  const weightKg = Number(searchParams.get("weight")) || 1;
  const totalPrice = Number(searchParams.get("price")) || 1200;
  const planId = searchParams.get("plan_id") || "PAYG";
  const planName = searchParams.get("plan_name") || "Pay per delivery";

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!formData.fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage("Please enter a contact phone number for delivery.");
      return;
    }
    if (!formData.streetAddress.trim()) {
      setErrorMessage("Please enter your delivery street address.");
      return;
    }
    if (!formData.password || formData.password.length < 4) {
      setErrorMessage("Please set a password (at least 4 characters) to manage your subscription.");
      return;
    }

    setPaymentStatus("processing");

    // Full delivery address
    const fullAddress = `${formData.streetAddress}, ${formData.city}${formData.landmark ? ` (Near: ${formData.landmark})` : ""}`;

    const orderPayload = {
      origin_id: originId,
      origin_name: originName,
      weight_kg: weightKg,
      plan_id: planId,
      plan_name: planName,
      total_price_npr: totalPrice,
      customer_name: formData.fullName,
      customer_email: formData.email,
      customer_phone: formData.phone,
      delivery_address: fullAddress,
      is_fake_payment: true,
      status: "CONFIRMED",
    };

    // Save demo user session to browser
    localStorage.setItem(
      "demo_user",
      JSON.stringify({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: fullAddress,
        memberSince: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      })
    );

    // Simulate Khalti verification network delay
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
      // Even if offline, allow presentation to proceed
      setPaymentStatus("success");
    }
  };

  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex flex-col items-center p-6 font-sans justify-center">
        <div className="w-full max-w-lg text-center bg-white p-10 md:p-14 shadow-xl border border-[#E6DEC8]">
          <div className="w-16 h-16 bg-[#E7F3E8] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={36} className="text-[#2E6B34]" />
          </div>
          
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2E6B34] bg-[#E7F3E8] px-3 py-1 rounded-full">
            Payment Verified via Khalti
          </span>

          <h1 className="text-3xl font-serif font-bold text-[#1A1512] mt-4 mb-2">Subscription Confirmed!</h1>
          <p className="text-[#5C5042] text-sm mb-6 leading-relaxed">
            Welcome, <strong>{formData.fullName}</strong>. Your account has been registered and your first batch of Himalayan coffee is scheduled for roasting.
          </p>

          <div className="bg-[#FAF8F5] border border-[#E6DEC8] p-4 text-left text-xs mb-8 space-y-1.5">
            <p className="text-[#8A7966] font-bold uppercase tracking-wider text-[10px]">Delivery Dispatched To:</p>
            <p className="font-bold text-[#1A1512]">{formData.streetAddress}, {formData.city}</p>
            <p className="text-[#5C5042]">Contact: {formData.phone} • {formData.email}</p>
            <p className="text-[#A3432A] font-semibold pt-1 border-t border-[#E6DEC8] mt-2">
              Commitment: {planName} ({originName})
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-block w-full bg-[#1A1512] text-white py-4 text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors"
          >
            Access Customer Dashboard
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
            className="inline-block w-full bg-[#1A1512] text-white py-4 text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors"
          >
            Build Your Plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EB] p-6 font-sans pb-32">
      <div className="max-w-5xl mx-auto pt-8">

        <Link href="/subscribe" className="inline-flex items-center gap-2 text-[#8A7966] hover:text-[#2C2420] transition-colors mb-8 text-xs uppercase tracking-widest font-bold">
          <ArrowLeft size={16} /> Change Selection
        </Link>

        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1512] mb-2">Checkout & Delivery Setup</h1>
        <p className="text-[#5C5042] text-sm mb-10">Enter your shipping details and set up your subscription account.</p>

        {errorMessage && (
          <div className="mb-8 p-4 bg-[#FAF5F5] border border-[#F0DADA] text-[#A3432A] text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={16} /> {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Delivery & Account Form (2 Cols) */}
          <div className="lg:col-span-2 space-y-8">
            <form onSubmit={handlePayment} id="checkout-form" className="bg-white border border-[#E6DEC8] p-8 md:p-10 shadow-sm space-y-8">
              
              {/* Section 1: Contact Details */}
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1A1512] mb-4 flex items-center gap-2">
                  <User size={18} className="text-[#A3432A]" /> Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aditya Gupta"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="aditya@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5]"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                    Mobile Phone Number (for delivery SMS) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+977 9800000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5]"
                  />
                </div>
              </div>

              {/* Section 2: Delivery Address */}
              <div className="pt-6 border-t border-[#F0EAE1]">
                <h3 className="text-lg font-serif font-bold text-[#1A1512] mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-[#A3432A]" /> Shipping Address
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                      Street Address / Ward / Area *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jhamsikhel, Ward 3, House #14"
                      value={formData.streetAddress}
                      onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                      className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                        City / District *
                      </label>
                      <select
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5]"
                      >
                        <option value="Kathmandu">Kathmandu</option>
                        <option value="Lalitpur">Lalitpur</option>
                        <option value="Bhaktapur">Bhaktapur</option>
                        <option value="Pokhara">Pokhara</option>
                        <option value="Dhulikhel">Dhulikhel</option>
                        <option value="Other / Outside Valley">Other / Outside Valley</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                        Landmark / Note (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Near St. Mary's School"
                        value={formData.landmark}
                        onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                        className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Account Creation Password */}
              <div className="pt-6 border-t border-[#F0EAE1]">
                <h3 className="text-lg font-serif font-bold text-[#1A1512] mb-2 flex items-center gap-2">
                  <Lock size={18} className="text-[#A3432A]" /> Create Account Password
                </h3>
                <p className="text-xs text-[#8A7966] mb-4">
                  Set a password so you can log in to your dashboard to pause, skip, or edit your monthly roasts.
                </p>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                    Account Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5]"
                  />
                </div>
              </div>

            </form>
          </div>

          {/* Right Column: Order Summary & Khalti Payment (1 Col) */}
          <div className="space-y-6">
            <div className="bg-white border border-[#E6DEC8] p-8 shadow-sm">
              <h2 className="text-xl font-serif font-bold text-[#1A1512] pb-4 mb-6 border-b border-[#F0EAE1]">
                Subscription Summary
              </h2>

              <div className="space-y-4 text-xs mb-6">
                <div className="flex justify-between">
                  <span className="text-[#8A7966] uppercase tracking-wider font-bold">Origin:</span>
                  <span className="font-bold text-[#1A1512]">{originName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A7966] uppercase tracking-wider font-bold">Weight:</span>
                  <span className="font-bold text-[#1A1512]">{weightKg} kg / delivery</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A7966] uppercase tracking-wider font-bold">Prepaid Commitment:</span>
                  <span className="font-bold text-[#1A1512]">{planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A7966] uppercase tracking-wider font-bold">Doorstep Shipping:</span>
                  <span className="font-bold text-[#2E6B34]">FREE</span>
                </div>

                <div className="pt-4 border-t border-[#F0EAE1] flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#8A7966]">Total NPR:</span>
                  <span className="text-3xl font-serif font-bold text-[#1A1512]">Rs. {totalPrice}</span>
                </div>
              </div>

              {/* Payment Button */}
              {paymentStatus === "idle" && (
                <button
                  type="submit"
                  form="checkout-form"
                  className="w-full bg-[#5C2D91] text-white py-4 text-xs uppercase tracking-widest font-bold hover:bg-[#4A2474] transition-all shadow-md flex items-center justify-center gap-2"
                >
                  Pay with Khalti
                </button>
              )}

              {paymentStatus === "processing" && (
                <div className="text-center py-6 bg-[#FAF5F2] border border-[#E6DEC8]">
                  <Loader2 size={24} className="animate-spin text-[#5C2D91] mx-auto mb-2" />
                  <p className="text-xs uppercase tracking-widest font-bold text-[#5C5042]">
                    Connecting to Khalti Gateway...
                  </p>
                </div>
              )}

              {paymentStatus === "error" && (
                <div className="mt-4 p-4 bg-[#FAF5F5] border border-[#F0DADA] text-center">
                  <p className="text-xs text-[#A3432A] font-bold mb-2">Connection Timeout</p>
                  <button
                    onClick={() => setPaymentStatus("idle")}
                    className="text-xs uppercase font-bold text-[#1A1512] underline"
                  >
                    Try Again
                  </button>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-[#F0EAE1] flex items-center gap-2 text-[10px] text-[#8A7966]">
                <ShieldCheck size={14} className="text-[#2E6B34]" />
                <span>256-Bit SSL Encrypted & Khalti Protected</span>
              </div>
            </div>

            {/* Direct Trade Note */}
            <div className="bg-[#FAF8F5] border border-[#E6DEC8] p-6 text-xs text-[#5C5042]">
              <p className="font-bold text-[#1A1512] uppercase tracking-wider mb-1">Freshness Guarantee</p>
              <p className="leading-relaxed">
                Your first batch of {originName} is roasted only after this order is processed. Shipped via door-to-door courier.
              </p>
            </div>
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
        <Loader2 size={32} className="animate-spin text-[#1A1512]" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
