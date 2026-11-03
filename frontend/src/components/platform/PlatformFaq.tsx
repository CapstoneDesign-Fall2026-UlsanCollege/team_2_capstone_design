"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "Do I need an international credit card to get started with ShopCraft?",
    a: "No. ShopCraft is engineered 100% for Nepal. You can build your product catalog, configure grind or size variants, and launch your hosted storefront without any international USD card. Monthly software plans are settled in Nepalese Rupees (NPR) via Khalti, eSewa, or domestic bank transfer.",
  },
  {
    q: "What payment methods are supported for Nepali shoppers?",
    a: "Your hosted customer storefront natively supports instant Khalti Web Wallet ePayments (with secure redirect and verified return callback) and verified Cash on Delivery (COD) with mobile phone confirmation cues.",
  },
  {
    q: "Can I offer repeat subscriptions without bank auto-debit?",
    a: "Yes! Because auto-debit is not broadly supported across domestic cards in Nepal, ShopCraft uses non-recurring prepaid subscription cycles (3, 6, or 12 deliveries) or automated pay-per-delivery renewal links sent directly to the customer via SMS and WhatsApp.",
  },
  {
    q: "Can I connect my own custom .com.np or .com domain?",
    a: "Yes. Every storefront automatically includes a free hosted subdomain (e.g. yourbrand.shopcraft.com.np). You can map any registered custom domain (yourbrand.com.np or yourbrand.com) via standard CNAME records with free auto-renewing SSL certificates.",
  },
  {
    q: "How does shipping and Pathao logistics integration work?",
    a: "ShopCraft includes a cascading Nepal address selector (covering all 7 provinces, districts, and municipalities/wards) and generates 1-click printable 4x6\" thermal courier waybills with automated COD collection flags ready for Pathao Express and local courier hand-off.",
  },
  {
    q: "How long is the free trial period?",
    a: "Every merchant gets a 14-day fully featured free trial with unlimited products, variant matrices, and test checkout orders. You only select a paid plan when you are ready to publish and process live customer transactions.",
  },
];

export function PlatformFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-zinc-200 dark:border-white/5">
      <div className="text-center mb-16 space-y-3">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-3 py-1 rounded-full inline-block">
          Common questions
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-sans">
          Everything you need to know about setting up and running your independent store with ShopCraft.
        </p>
      </div>

      <div className="space-y-3 text-left">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="border-b border-zinc-200 dark:border-white/10 pb-4 transition-colors"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${idx}`}
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full py-4 text-left flex items-center justify-between gap-4 cursor-pointer group"
              >
                <span className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-zinc-900 dark:text-white" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div 
                  id={`faq-answer-${idx}`}
                  role="region"
                  className="pb-3 text-sm text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed"
                >
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
