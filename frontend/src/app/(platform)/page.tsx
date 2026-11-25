import React from "react";
import { HomeInteractiveTop } from "@/components/platform/HomeInteractiveTop";
import { CapabilityMatrix } from "@/components/platform/CapabilityMatrix";
import { DashboardMockupPreview } from "@/components/platform/DashboardMockupPreview";
import { WorkflowSection } from "@/components/platform/WorkflowSection";
import { PlatformFaq } from "@/components/platform/PlatformFaq";
import { PLATFORM_FAQS, PLATFORM_STEPS } from "@/components/platform/platform-content";
import { ClosingCtaSection } from "@/components/platform/ClosingCtaSection";
import { PlatformFooter } from "@/components/platform/PlatformFooter";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://shopcraft.me/#organization",
      name: "ShopCraft",
      url: "https://shopcraft.me",
      email: "hello@shopcraft.me",
      logo: {
        "@type": "ImageObject",
        url: "https://shopcraft.me/icon-512x512.png",
        width: 512,
        height: 512,
      },
      areaServed: {
        "@type": "Country",
        name: "Nepal",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://shopcraft.me/#website",
      url: "https://shopcraft.me",
      name: "ShopCraft",
      inLanguage: "en-NP",
      publisher: { "@id": "https://shopcraft.me/#organization" },
      description:
        "Online store builder for Nepal with NPR pricing, Khalti, cash on delivery, and ward-level delivery addresses.",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://shopcraft.me/#app",
      name: "ShopCraft",
      applicationCategory: "BusinessApplication",
      operatingSystem: "All",
      inLanguage: "en-NP",
      url: "https://shopcraft.me",
      isAccessibleForFree: true,
      publisher: { "@id": "https://shopcraft.me/#organization" },
      description:
        "Create an online store in Nepal in minutes. Sell in NPR with Khalti, cash on delivery, four curated looks, printable packing slips, and province, district, and ward addresses.",
      featureList: [
        "Nepali rupee (NPR) pricing with sizes and variants",
        "Khalti payment integration (test and live key support)",
        "Cash on delivery with Nepali mobile number format verification (98/97)",
        "Nepal province, district, and ward address checkout",
        "Four switchable storefront looks",
        "Merchant order console and printable packing slips",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "NPR",
        availability: "https://schema.org/InStock",
        description: "Free while in beta",
      },
      areaServed: {
        "@type": "Country",
        name: "Nepal",
      },
    },
    {
      "@type": "HowTo",
      "@id": "https://shopcraft.me/#howto",
      name: "How to open an online store in Nepal with ShopCraft",
      totalTime: "PT3M",
      step: PLATFORM_STEPS.map((s, idx) => ({
        "@type": "HowToStep",
        position: idx + 1,
        name: s.title,
        text: s.desc,
      })),
    },
    {
      "@type": "FAQPage",
      "@id": "https://shopcraft.me/#faq",
      mainEntity: PLATFORM_FAQS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
  ],
};

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
