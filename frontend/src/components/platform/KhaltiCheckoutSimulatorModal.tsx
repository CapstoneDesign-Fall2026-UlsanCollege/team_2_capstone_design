"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Smartphone,
  X,
  Zap,
} from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KhaltiCheckoutSimulatorModal({ isOpen, onClose }: ModalProps) {
  const [step, setStep] = useState<"cart" | "khalti_sheet" | "verifying" | "success">("cart");
  const [phone, setPhone] = useState("9801987654");
  const [mpin, setMpin] = useState("1234");

  if (!isOpen) return null;

  const handleStartKhalti = () => {
    setStep("khalti_sheet");
  };

  const handleConfirmKhalti = () => {
    setStep("verifying");
    setTimeout(() => {
      setStep("success");
    }, 1800);
  };

  const handleReset = () => {
    setStep("cart");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-[36px] bg-[#121212] p-3 text-white shadow-2xl border-4 border-[#2A2A2A]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-md hover:bg-zinc-200 cursor-pointer z-10"
          aria-label="Close simulator"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Mobile Phone Speaker Notch */}
        <div className="w-full flex justify-center pb-2">
          <div className="w-24 h-3.5 bg-black rounded-full flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#1A1A1A] mr-2" />
            <span className="w-8 h-1 bg-[#2A2A2A] rounded-full" />
          </div>
        </div>

        {/* Screen Viewport */}
        <div className="w-full bg-[#FAF7F2] text-[#121212] rounded-[28px] overflow-hidden min-h-[520px] flex flex-col justify-between text-left text-xs">
          {/* Mobile Top Header */}
          <div className="px-4 py-2.5 bg-white border-b border-[#E1E3E5] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-[11px] text-[#121212]">Himalayan Coffee Roasters</span>
            </div>
            <span className="font-mono text-[10px] text-[#707070]">Express Checkout</span>
          </div>

          {/* STEP 1: CART / CHECKOUT */}
          {step === "cart" && (
            <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-[10px] font-mono uppercase text-[#707070] font-bold">
                  Single-Screen Mobile Checkout
                </div>

                {/* Item Card */}
                <div className="p-3 rounded-xl border border-[#E1E3E5] bg-white flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=200&q=80"
                      alt="Coffee"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs truncate">Gulmi Reserve Bourbon Arabica</div>
                    <div className="text-[10px] text-[#707070]">250g Whole Bean · Washed</div>
                    <div className="font-mono font-bold text-xs text-[#121212] mt-0.5">Rs. 750</div>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="p-3 rounded-xl border border-[#E1E3E5] bg-white space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#707070]">Recipient:</span>
                    <span className="font-bold">Aarav Shrestha</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#707070]">Phone:</span>
                    <span className="font-mono font-bold">{phone}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#707070]">Delivery:</span>
                    <span className="font-medium text-right truncate pl-2">Lazimpat, Ward 3, KTM</span>
                  </div>
                </div>

                {/* Payment Option Toggle */}
                <div className="p-3 rounded-xl border-2 border-purple-600 bg-purple-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">
                      K
                    </div>
                    <div>
                      <div className="font-bold text-xs text-purple-950">Khalti Web Wallet</div>
                      <div className="text-[10px] text-purple-800">Instant 1-tap OTP settlement</div>
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-purple-700" />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleStartKhalti}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>Pay with Khalti • Rs. 750</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* STEP 2: KHALTI OVERLAY SHEET */}
          {step === "khalti_sheet" && (
            <div className="p-4 space-y-4 flex-1 flex flex-col justify-between bg-white animate-in slide-in-from-bottom-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E1E3E5] pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-purple-700 text-white flex items-center justify-center font-bold text-xs">
                      Khalti
                    </div>
                    <span className="font-bold text-xs text-[#121212]">Khalti ePayment Gateway</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-700">Rs. 750</span>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-bold text-[#555555] block">
                    Khalti Registered Mobile:
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#D1D5DB] font-mono text-xs font-bold text-[#121212]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#555555] block">
                    Khalti 4-Digit MPIN:
                  </label>
                  <input
                    type="password"
                    value={mpin}
                    onChange={(e) => setMpin(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#D1D5DB] font-mono text-xs font-bold tracking-widest text-center text-[#121212]"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-purple-50 text-[10px] text-purple-900 border border-purple-200">
                  🔒 Test Sandbox Mode: 1-click verified by ShopCraft Khalti v2 API adapter.
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmKhalti}
                className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Authorize &amp; Confirm Rs. 750</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 3: VERIFYING / SPINNER */}
          {step === "verifying" && (
            <div className="p-6 space-y-4 flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-700 animate-spin" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-[#121212]">Verifying Khalti Payment...</h4>
                <p className="text-xs text-[#707070]">PIDX verification polling directly against Khalti API</p>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS RECEIPT */}
          {step === "success" && (
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between text-center animate-in zoom-in-95 duration-200">
              <div className="space-y-3 pt-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-[#121212]">Order Confirmed!</h4>
                <div className="font-mono text-[11px] text-[#707070]">Order #HR-2026-0099</div>

                <div className="p-3 rounded-xl border border-[#E1E3E5] bg-white text-left space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#707070]">Paid via:</span>
                    <span className="font-bold text-purple-700">Khalti Wallet (NPR 750)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#707070]">Fulfillment:</span>
                    <span className="font-semibold text-emerald-700">Pathao 24h Express Ready</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#707070]">Confirmation:</span>
                    <span>SMS &amp; WhatsApp Receipt Sent</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2.5 rounded-lg border border-[#121212] text-[#121212] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-zinc-100 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Test Again</span>
              </button>
            </div>
          )}

          {/* Footer Note */}
          <div className="p-2.5 bg-zinc-100 border-t border-[#E1E3E5] text-[10px] text-center text-[#707070]">
            ⚡ 2.8 second average mobile conversion speed in Nepal
          </div>
        </div>
      </div>
    </div>
  );
}
