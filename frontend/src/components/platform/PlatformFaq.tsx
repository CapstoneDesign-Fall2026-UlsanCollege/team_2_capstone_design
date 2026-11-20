import React from "react";

interface FaqItem {
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  {
    q: "What does it cost?",
    a: "Nothing right now. ShopCraft is in beta and free to use. No card needed.",
  },
  {
    q: "How do shoppers pay?",
    a: "With Khalti, or with cash when the order arrives. For cash orders we check that the number is a valid Nepali mobile number (98 or 97). We don't confirm it by SMS yet.",
  },
  {
    q: "Where does my store live?",
    a: "At shopcraft.me/s/your-store-name. You choose the name when you sign up.",
  },
  {
    q: "Can I change how my store looks?",
    a: "Yes. Pick one of four looks and add your logo. You can switch later.",
  },
];

export function PlatformFaq() {
  return (
    <section
      id="faq"
      className="py-20 sm:py-28 bg-paper-2 border-t border-line scroll-mt-16"
    >
      <div className="max-w-[1180px] mx-auto px-4 sm:px-7 grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-10 lg:gap-20 items-start">
        <div>
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-ink-3 font-medium">
            Questions
          </p>
          <h2 className="mt-3.5 font-display font-semibold tracking-[-0.048em] leading-none text-ink text-[36px] sm:text-[54px] lg:text-[66px]">
            Questions before <span className="text-accent">you start.</span>
          </h2>
        </div>

        <dl>
          {FAQS.map((faq) => (
            <div
              key={faq.q}
              className="py-6 sm:py-7 border-t border-line last:border-b"
            >
              <dt className="text-lg sm:text-[19px] font-semibold tracking-[-0.01em] text-ink">
                {faq.q}
              </dt>
              <dd className="mt-2 text-[15.5px] text-ink-2 leading-relaxed max-w-[580px]">
                {faq.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
