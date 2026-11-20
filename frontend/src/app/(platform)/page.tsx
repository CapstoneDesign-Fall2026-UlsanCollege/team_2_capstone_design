import React from "react";
import { HomeInteractiveTop } from "@/components/platform/HomeInteractiveTop";
import { CapabilityMatrix } from "@/components/platform/CapabilityMatrix";
import { DashboardMockupPreview } from "@/components/platform/DashboardMockupPreview";
import { WorkflowSection } from "@/components/platform/WorkflowSection";
import { PlatformFaq, FAQS } from "@/components/platform/PlatformFaq";
import { ClosingCtaSection } from "@/components/platform/ClosingCtaSection";
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
    <div className="relative w-full min-h-screen bg-paper text-ink overflow-x-clip transition-colors duration-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 1. Hero & 2. Storefront Looks */}
      <HomeInteractiveTop />

      {/* 3. Built for the way Nepal sells */}
      <CapabilityMatrix />

      {/* 4. Merchant Console Orders & Packing Slip */}
      <DashboardMockupPreview />

      {/* 5. Three steps to open */}
      <WorkflowSection />

      {/* 6. FAQ */}
      <PlatformFaq />

      {/* 7. Closing CTA */}
      <ClosingCtaSection />

      {/* 8. Footer */}
      <PlatformFooter />
    </div>
  );
}
