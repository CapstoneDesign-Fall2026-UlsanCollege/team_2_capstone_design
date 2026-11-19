import React from "react";

interface FaqItem {
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  {
    q: "What does it cost?",
    a: "Nothing during beta. You can create a store and list products without a card.",
  },
  {
    q: "How do shoppers pay?",
    a: "Online via wallet checkout or in person when the rider drops off the parcel. Phone numbers are checked on arrival orders.",
  },
  {
    q: "Where does my store live?",
    a: "At shopcraft.me/s/your-store-name. You pick the handle when you sign up.",
  },
  {
    q: "How do I prepare deliveries?",
    a: "Shoppers choose their province and ward at checkout. You print a packing slip showing whether payment is cleared or due in cash.",
  },
];

export function PlatformFaq() {
  return (
    <section
      id="faq"
      className="py-14 sm:py-18 px-5 border-b border-[#E2E2DC] dark:border-white/10 scroll-mt-20"
    >
      <div className="max-w-[1040px] mx-auto">
        <h2
          className="text-[28px] sm:text-[36px] font-semibold tracking-[-0.01em] leading-[1.18] text-left text-[#161614] dark:text-[#ECECE9] mb-6"
          style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
        >
          Questions
        </h2>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-x-10 md:gap-y-6 text-left">
          {FAQS.map((faq) => (
            <div key={faq.q}>
              <dt className="text-[16px] font-bold text-[#161614] dark:text-[#ECECE9]">
                {faq.q}
              </dt>
              <dd className="mt-1.5 text-[14px] text-[#4A4A45] dark:text-[#B4B6BD] leading-relaxed">
                {faq.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
