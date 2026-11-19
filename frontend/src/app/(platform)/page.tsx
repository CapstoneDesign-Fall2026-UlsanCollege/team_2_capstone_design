import React from "react";
import { HomeInteractiveTop } from "@/components/platform/HomeInteractiveTop";
import { DashboardMockupPreview } from "@/components/platform/DashboardMockupPreview";
import { WorkflowSection } from "@/components/platform/WorkflowSection";
import { CapabilityMatrix } from "@/components/platform/CapabilityMatrix";
import { FAQS, PlatformFaq } from "@/components/platform/PlatformFaq";
import { PlatformFooter } from "@/components/platform/PlatformFooter";

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ShopCraft",
    url: "https://shopcraft.me",
    description:
      "Online store builder for Nepal with NPR pricing, Khalti, cash on delivery, and ward-level delivery addresses.",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ShopCraft",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://shopcraft.me",
    description:
      "Create an online store in Nepal in minutes. Sell in NPR with Khalti, cash on delivery, and province, district, and ward addresses.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "NPR",
      description: "Free while in beta",
    },
    areaServed: {
      "@type": "Country",
      name: "Nepal",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  },
];

export default function PlatformHomePage() {
  return (
    <div className="relative w-full min-h-screen bg-[#FAF7F2] dark:bg-[#0d0d0e] text-zinc-900 dark:text-zinc-100 font-sans overflow-x-hidden transition-colors duration-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <HomeInteractiveTop />

      {/* 3. What works today */}
      <CapabilityMatrix />

      {/* Real merchant dashboard & orders screenshots */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-20 border-t border-zinc-200 dark:border-white/5 pt-20">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white text-center mb-3">
          See every order, paid or cash to collect
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 text-center max-w-lg mx-auto mb-10">
          See orders as they come in and print a packing slip with Khalti or cash-to-collect status.
        </p>
        <DashboardMockupPreview />
      </section>

      {/* 4. How it works */}
      <WorkflowSection />

      {/* 5. FAQ */}
      <PlatformFaq />

      {/* 6. Footer */}
      <PlatformFooter />
    </div>
  );
}
