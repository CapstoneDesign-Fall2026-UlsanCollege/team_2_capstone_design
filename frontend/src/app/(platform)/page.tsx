import React from "react";
import { HomeInteractiveTop } from "@/components/platform/HomeInteractiveTop";
import { CapabilityMatrix } from "@/components/platform/CapabilityMatrix";
import { DashboardMockupPreview } from "@/components/platform/DashboardMockupPreview";
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
    <div className="relative w-full min-h-screen bg-[#F9F9F7] dark:bg-[#0E0F12] text-[#161614] dark:text-[#ECECE9] overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 1. Hero + 2. Four store looks */}
      <HomeInteractiveTop />

      {/* 3. What works today */}
      <CapabilityMatrix />

      {/* 4. Full-width 6-order Nepali dashboard preview */}
      <DashboardMockupPreview />

      {/* 5. Questions */}
      <PlatformFaq />

      {/* 6. Footer */}
      <PlatformFooter />
    </div>
  );
}
