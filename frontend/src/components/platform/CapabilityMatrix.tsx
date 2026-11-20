import React from "react";

export function CapabilityMatrix() {
  return (
    <section
      id="made-for-nepal"
      className="bg-band text-band-ink scroll-mt-16"
    >
      <div aria-hidden="true" className="platform-dhaka-strip opacity-90" />

      <div className="py-20 sm:py-28 max-w-[1180px] mx-auto px-4 sm:px-7">
        <div className="max-w-[820px] mx-auto text-center">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-gold font-medium">
            Made for Nepal
          </p>
          <h2 className="mt-4 font-display font-semibold tracking-[-0.048em] leading-none text-band-ink text-[36px] sm:text-[60px] lg:text-[76px]">
            Built for the way <span className="text-gold">Nepal</span> sells.
          </h2>
          <p className="mt-5 mx-auto max-w-[560px] text-base sm:text-lg text-band-ink-2 leading-relaxed">
            Rupees, Khalti, cash at the door, and addresses down to the ward. Not an afterthought.
          </p>
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-5">
          {/* Card 1: Province, district and ward */}
          <div className="rounded-3xl bg-card border border-line p-6 sm:p-8 flex flex-col justify-between gap-7">
            <div>
              <h3 className="font-display font-semibold tracking-[-0.04em] text-[26px] sm:text-[32px] leading-tight text-ink">
                Province, district and ward.
              </h3>
              <p className="mt-2.5 text-[15px] text-ink-2 leading-relaxed max-w-[420px]">
                Shoppers pick their location from lists, so riders get a clear address instead of a vague line of text.
              </p>
            </div>

            <div className="rounded-2xl bg-paper-2 border border-line p-3.5">
              <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_0.6fr] gap-2">
                <div className="rounded-xl bg-card border border-line px-3 py-2.5">
                  <span className="block font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-3">
                    Province
                  </span>
                  <span className="block text-sm font-medium text-ink mt-0.5">
                    Bagmati
                  </span>
                </div>
                <div className="rounded-xl bg-card border border-line px-3 py-2.5">
                  <span className="block font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-3">
                    District
                  </span>
                  <span className="block text-sm font-medium text-ink mt-0.5">
                    Kathmandu
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-xl bg-card border border-line px-3 py-2.5">
                  <span className="block font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-3">
                    Ward
                  </span>
                  <span className="block text-sm font-medium text-ink mt-0.5">
                    04
                  </span>
                </div>
              </div>
              <div className="mt-2 rounded-xl bg-card border border-line px-3 py-2.5 flex items-center justify-between gap-2 text-[13px] text-ink">
                <span className="font-mono">9841234567</span>
                <span className="font-mono text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full bg-paid-bg text-paid-ink">
                  98/97 format OK
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Khalti, or cash on delivery */}
          <div className="rounded-3xl bg-card border border-line p-6 sm:p-8 flex flex-col justify-between gap-7">
            <div>
              <h3 className="font-display font-semibold tracking-[-0.04em] text-[26px] sm:text-[32px] leading-tight text-ink">
                Khalti, or cash on delivery.
              </h3>
              <p className="mt-2.5 text-[15px] text-ink-2 leading-relaxed max-w-[420px]">
                Khalti runs in test mode until you add your live key. Cash orders get a number-format check, not an SMS.
              </p>
            </div>

            <div className="rounded-2xl bg-paper-2 border border-line p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-xl bg-card border border-line p-3.5">
                <p className="text-sm font-semibold text-ink">Khalti</p>
                <p className="text-xs text-ink-2 mt-1 leading-relaxed">
                  Test mode until your live key is added
                </p>
              </div>
              <div className="rounded-xl bg-card border border-line p-3.5">
                <p className="text-sm font-semibold text-ink">Cash on delivery</p>
                <p className="text-xs text-ink-2 mt-1 leading-relaxed">
                  Valid Nepali mobile number (98 or 97)
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Priced in rupees */}
          <div className="rounded-3xl bg-card border border-line p-6 sm:p-8 flex flex-col justify-between gap-7">
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
              <p className="font-mono text-[13px] text-ink-2 mt-0.5">Rs. 1,450</p>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="font-mono text-xs px-3 py-1.5 rounded-lg bg-card border border-line text-ink-2">
                  250g
                </span>
                <span className="font-mono text-xs px-3 py-1.5 rounded-lg bg-btn text-btn-ink font-medium">
                  500g
                </span>
                <span className="font-mono text-xs px-3 py-1.5 rounded-lg bg-card border border-line text-ink-2">
                  1kg
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Packing slip for every order */}
          <div className="rounded-3xl bg-card border border-line p-6 sm:p-8 flex flex-col justify-between gap-7">
            <div>
              <h3 className="font-display font-semibold tracking-[-0.04em] text-[26px] sm:text-[32px] leading-tight text-ink">
                A packing slip for every order.
              </h3>
              <p className="mt-2.5 text-[15px] text-ink-2 leading-relaxed max-w-[420px]">
                Print it, and it shows PAID or the cash to collect.
              </p>
            </div>

            <div className="rounded-2xl bg-paper-2 border border-line p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-semibold text-ink">#HR-1044</p>
                <p className="text-[12.5px] text-ink-2 mt-0.5">Ward 04 · 2 items</p>
              </div>
              <span className="font-mono text-[11px] font-semibold px-3 py-1 rounded-full bg-cash-bg text-cash-ink shrink-0">
                Collect Rs. 1,450
              </span>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-band-ink-2">
          <strong className="text-band-ink font-semibold">Coming next:</strong> SMS and WhatsApp order updates · Courier labels · Your own domain
        </p>
      </div>

      <div aria-hidden="true" className="platform-dhaka-strip opacity-90" />
    </section>
  );
}
