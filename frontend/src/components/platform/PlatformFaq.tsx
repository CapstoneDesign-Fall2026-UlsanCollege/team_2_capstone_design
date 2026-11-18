import React from "react";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "What does it cost?",
    a: "Nothing right now. ShopCraft is in beta and free to use. No card needed.",
  },
  {
    q: "How do my customers pay?",
    a: "With Khalti, or cash on delivery. For cash on delivery we check the phone number before the order goes through.",
  },
  {
    q: "Where does my store live?",
    a: "At shopcraft.me/s/your-store-name. You choose the name when you sign up.",
  },
  {
    q: "Can I change how my store looks?",
    a: "Yes. Pick one of four looks, then set your logo, colors and fonts. You can switch later.",
  },
  {
    q: "How do I get orders to customers?",
    a: "Customers pick their province, district and ward at checkout. You print a packing slip for each order that shows whether it is paid or cash to collect.",
  },
  {
    q: "What is coming next?",
    a: "SMS and WhatsApp order updates, courier labels, and your own domain name. None of these work yet.",
  },
];

export function PlatformFaq() {
  return (
    <section
      id="faq"
      className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto border-t border-zinc-200 dark:border-white/5 scroll-mt-20"
    >
      <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white text-center mb-12">
        Questions
      </h2>

      <dl className="space-y-8 text-left">
        {FAQS.map((faq) => (
          <div key={faq.q}>
            <dt className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
              {faq.q}
            </dt>
            <dd className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {faq.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
