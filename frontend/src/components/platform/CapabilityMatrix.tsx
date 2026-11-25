"use client";

import React, { useState } from "react";
import { PlatformReveal } from "@/components/platform/PlatformReveal";

const NEPAL_LOCATIONS: Record<string, Record<string, string[]>> = {
  Bagmati: {
    Kathmandu: ["04", "01", "03", "10", "16", "31"],
    Lalitpur: ["03", "01", "05", "15", "20"],
    Bhaktapur: ["02", "04", "06", "08"],
  },
  Gandaki: {
    Kaski: ["06", "01", "08", "11", "17"],
    Tanahun: ["02", "01", "05", "09"],
  },
  Koshi: {
    Morang: ["02", "01", "05", "09"],
    Ilam: ["01", "03", "07"],
  },
  Lumbini: {
    Rupandehi: ["04", "01", "06", "09"],
    Banke: ["02", "01", "08"],
  },
};

const WEIGHT_VARIANTS = [
  { label: "250g", price: "Rs. 750" },
  { label: "500g", price: "Rs. 1,450" },
  { label: "1kg", price: "Rs. 2,750" },
] as const;

const SLIP_SAMPLES = [
  {
    id: "#HR-1044",
    meta: "Ward 04 · 2 items",
    badge: "Collect Rs. 1,450",
    paid: false,
  },
  {
    id: "#HR-2026-0001",
    meta: "Ward 04 · Paid online",
    badge: "PAID VIA KHALTI",
    paid: true,
  },
] as const;

export function CapabilityMatrix() {
  const provinces = Object.keys(NEPAL_LOCATIONS);
  const [province, setProvince] = useState("Bagmati");
  const districts = Object.keys(NEPAL_LOCATIONS[province]);
  const [district, setDistrict] = useState("Kathmandu");
  const wards = NEPAL_LOCATIONS[province][district] ?? ["01"];
  const [ward, setWard] = useState("04");
  const [phone, setPhone] = useState("9841234567");
  const [paymentMode, setPaymentMode] = useState<"khalti" | "cod">("khalti");
  const [variantIdx, setVariantIdx] = useState(1);
  const [slipIdx, setSlipIdx] = useState(0);

  const isPhoneValid = /^(97|98)\d{8}$/.test(phone.replace(/[\s-]/g, ""));
  const activeVariant = WEIGHT_VARIANTS[variantIdx] ?? WEIGHT_VARIANTS[1];
  const activeSlip = SLIP_SAMPLES[slipIdx] ?? SLIP_SAMPLES[0];

  const handleProvinceChange = (nextProvince: string) => {
    setProvince(nextProvince);
    const firstDistrict = Object.keys(NEPAL_LOCATIONS[nextProvince])[0];
    setDistrict(firstDistrict);
    setWard(NEPAL_LOCATIONS[nextProvince][firstDistrict][0]);
  };

  const handleDistrictChange = (nextDistrict: string) => {
    setDistrict(nextDistrict);
    setWard(NEPAL_LOCATIONS[province][nextDistrict][0]);
  };

  return (
    <section
      id="made-for-nepal"
      className="bg-band text-band-ink scroll-mt-16"
    >
      <div aria-hidden="true" className="platform-dhaka-strip opacity-90" />

      <div className="py-20 sm:py-28 max-w-[1180px] mx-auto px-4 sm:px-7">
        <PlatformReveal className="max-w-[820px] mx-auto text-center">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-gold font-medium">
            Made for Nepal
          </p>
          <h2 className="mt-4 font-display font-semibold tracking-[-0.048em] leading-none text-band-ink text-[36px] sm:text-[60px] lg:text-[76px]">
            Built for the way <span className="text-gold">Nepal</span> sells.
          </h2>
          <p className="mt-5 mx-auto max-w-[560px] text-base sm:text-lg text-band-ink-2 leading-relaxed">
            Rupees, Khalti, cash at the door, and addresses down to the ward. Not an afterthought.
          </p>
        </PlatformReveal>

        <div className="mt-12 sm:mt-16 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-5">
          {/* Card 1: Interactive Province, district and ward */}
          <PlatformReveal
            delayMs={40}
            className="rounded-3xl bg-card border border-line p-6 sm:p-8 flex flex-col justify-between gap-7 transition-transform duration-300 hover:-translate-y-1"
          >
            <div>
              <h3 className="font-display font-semibold tracking-[-0.04em] text-[26px] sm:text-[32px] leading-tight text-ink">
                Province, district and ward.
              </h3>
              <p className="mt-2.5 text-[15px] text-ink-2 leading-relaxed max-w-[420px]">
                Shoppers pick their location from lists, so riders get a clear address instead of a vague line of text.
              </p>
            </div>

            <div className="rounded-2xl bg-paper-2 border border-line p-3.5">
              <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_0.7fr] gap-2">
                <label className="rounded-xl bg-card border border-line px-3 py-2 block focus-within:border-accent transition-colors">
                  <span className="block font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-3">
                    Province
                  </span>
                  <select
                    aria-label="Sample province"
                    value={province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full min-h-[44px] sm:min-h-[32px] bg-transparent text-sm font-medium text-ink mt-0.5 focus:outline-none cursor-pointer"
                  >
                    {provinces.map((p) => (
                      <option key={p} value={p} className="bg-card text-ink">
                        {p}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-xl bg-card border border-line px-3 py-2 block focus-within:border-accent transition-colors">
                  <span className="block font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-3">
                    District
                  </span>
                  <select
                    aria-label="Sample district"
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full min-h-[44px] sm:min-h-[32px] bg-transparent text-sm font-medium text-ink mt-0.5 focus:outline-none cursor-pointer"
                  >
                    {districts.map((d) => (
                      <option key={d} value={d} className="bg-card text-ink">
                        {d}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="col-span-2 sm:col-span-1 rounded-xl bg-card border border-line px-3 py-2 block focus-within:border-accent transition-colors">
                  <span className="block font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-3">
                    Ward
                  </span>
                  <select
                    aria-label="Sample ward"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full min-h-[44px] sm:min-h-[32px] bg-transparent text-sm font-medium text-ink mt-0.5 focus:outline-none cursor-pointer"
                  >
                    {wards.map((w) => (
                      <option key={w} value={w} className="bg-card text-ink">
                        {w}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-2 rounded-xl bg-card border border-line px-3 py-1 flex items-center justify-between gap-2 text-[13px] text-ink focus-within:border-accent transition-colors">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-label="Sample Nepali mobile number"
                  maxLength={14}
                  className="w-32 sm:w-36 min-h-[44px] bg-transparent font-mono text-[13px] text-ink focus:outline-none"
                />
                <span
                  aria-live="polite"
                  className={`font-mono text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 transition-colors ${
                    isPhoneValid
                      ? "bg-paid-bg text-paid-ink"
                      : "bg-cash-bg text-cash-ink"
                  }`}
                >
                  {isPhoneValid ? "98/97 format OK" : "Use 10 digits (98/97)"}
                </span>
              </div>
            </div>
          </PlatformReveal>

          {/* Card 2: Interactive Khalti, or cash on delivery */}
          <PlatformReveal
            delayMs={100}
            className="rounded-3xl bg-card border border-line p-6 sm:p-8 flex flex-col justify-between gap-7 transition-transform duration-300 hover:-translate-y-1"
          >
            <div>
              <h3 className="font-display font-semibold tracking-[-0.04em] text-[26px] sm:text-[32px] leading-tight text-ink">
                Khalti, or cash on delivery.
              </h3>
              <p className="mt-2.5 text-[15px] text-ink-2 leading-relaxed max-w-[420px]">
                Khalti runs in test mode until you add your live key. Cash orders get a number-format check, not an SMS.
              </p>
            </div>

            <div className="rounded-2xl bg-paper-2 border border-line p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={paymentMode === "khalti"}
                onClick={() => setPaymentMode("khalti")}
                className={`min-h-[44px] rounded-xl bg-card border p-3.5 text-left transition-all duration-150 cursor-pointer ${
                  paymentMode === "khalti"
                    ? "border-accent"
                    : "border-line opacity-80 hover:opacity-100"
                }`}
              >
                <p className="text-sm font-semibold text-ink">Khalti</p>
                <p className="text-xs text-ink-2 mt-1 leading-relaxed">
                  Test mode until your live key is added
                </p>
              </button>

              <button
                type="button"
                aria-pressed={paymentMode === "cod"}
                onClick={() => setPaymentMode("cod")}
                className={`min-h-[44px] rounded-xl bg-card border p-3.5 text-left transition-all duration-150 cursor-pointer ${
                  paymentMode === "cod"
                    ? "border-accent"
                    : "border-line opacity-80 hover:opacity-100"
                }`}
              >
                <p className="text-sm font-semibold text-ink">Cash on delivery</p>
                <p className="text-xs text-ink-2 mt-1 leading-relaxed">
                  Valid Nepali mobile number (98 or 97)
                </p>
              </button>
            </div>
          </PlatformReveal>

          {/* Card 3: Interactive Priced in rupees */}
          <PlatformReveal
            delayMs={160}
            className="rounded-3xl bg-card border border-line p-6 sm:p-8 flex flex-col justify-between gap-7 transition-transform duration-300 hover:-translate-y-1"
          >
            <div>
              <h3 className="font-display font-semibold tracking-[-0.04em] text-[26px] sm:text-[32px] leading-tight text-ink">
                Priced in rupees.
              </h3>
              <p className="mt-2.5 text-[15px] text-ink-2 leading-relaxed max-w-[420px]">
                Add sizes and variants to any product.
              </p>
            </div>

            <div className="rounded-2xl bg-paper-2 border border-line p-4">
              <p className="text-[15px] font-semibold text-ink">
                Nuwakot Heritage Roast
              </p>
              <p
                key={activeVariant.price}
                aria-live="polite"
                className="font-mono text-[13px] text-ink-2 mt-0.5 platform-pop-in"
              >
                {activeVariant.price}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                {WEIGHT_VARIANTS.map((variant, idx) => {
                  const selected = idx === variantIdx;
                  return (
                    <button
                      key={variant.label}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setVariantIdx(idx)}
                      className={`min-h-[44px] min-w-[48px] font-mono text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 active:scale-95 cursor-pointer ${
                        selected
                          ? "bg-btn border-btn text-btn-ink font-medium"
                          : "bg-card border-line text-ink-2 hover:text-ink"
                      }`}
                    >
                      {variant.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </PlatformReveal>

          {/* Card 4: Interactive Packing slip for every order */}
          <PlatformReveal
            delayMs={220}
            className="rounded-3xl bg-card border border-line p-6 sm:p-8 flex flex-col justify-between gap-7 transition-transform duration-300 hover:-translate-y-1"
          >
            <div>
              <h3 className="font-display font-semibold tracking-[-0.04em] text-[26px] sm:text-[32px] leading-tight text-ink">
                A packing slip for every order.
              </h3>
              <p className="mt-2.5 text-[15px] text-ink-2 leading-relaxed max-w-[420px]">
                Print it, and it shows PAID or the cash to collect.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSlipIdx((i) => (i === 0 ? 1 : 0))}
              aria-label="Switch sample packing slip status"
              className="w-full min-h-[44px] rounded-2xl bg-paper-2 border border-line hover:border-line-strong p-4 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
            >
              <div key={activeSlip.id} className="platform-pop-in">
                <p className="font-mono text-xs font-semibold text-ink">{activeSlip.id}</p>
                <p className="text-[12.5px] text-ink-2 mt-0.5">{activeSlip.meta}</p>
              </div>
              <span
                key={activeSlip.badge}
                className={`font-mono text-[11px] font-semibold px-3 py-1 rounded-full shrink-0 platform-pop-in ${
                  activeSlip.paid
                    ? "bg-paid-bg text-paid-ink"
                    : "bg-cash-bg text-cash-ink"
                }`}
              >
                {activeSlip.badge}
              </span>
            </button>
          </PlatformReveal>
        </div>

        <p className="mt-10 text-center text-sm text-band-ink-2">
          <strong className="text-band-ink font-semibold">Coming next:</strong> SMS and WhatsApp order updates · Courier labels · Your own domain
        </p>
      </div>

      <div aria-hidden="true" className="platform-dhaka-strip opacity-90" />
    </section>
  );
}
