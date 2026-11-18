import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { PlatformNav } from "@/components/platform/PlatformNav";
import { PlatformThemeProvider } from "@/context/PlatformThemeContext";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShopCraft — Create an Online Store in Nepal with Khalti & COD",
  description:
    "Name your store, pick a look, and sell in NPR with Khalti, cash on delivery, and Nepal province, district, and ward checkout. Free while in beta.",
  keywords: [
    "online store Nepal",
    "ecommerce website Nepal",
    "Khalti online store",
    "cash on delivery Nepal",
    "ShopCraft Nepal",
    "sell online in NPR",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://shopcraft.me",
    siteName: "ShopCraft",
    title: "ShopCraft — Your shop, online, before your chiya cools.",
    description:
      "Name your store, pick a look, add products. Customers pay with Khalti or cash on delivery.",
    images: [
      {
        url: "/images/merchant-dashboard-real.png",
        width: 1280,
        height: 800,
        alt: "ShopCraft merchant dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShopCraft — Create an Online Store in Nepal with Khalti & COD",
    description:
      "Name your store, pick a look, add products. Customers pay with Khalti or cash on delivery.",
    images: ["/images/merchant-dashboard-real.png"],
  },
};

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PlatformThemeProvider>
      <div
        className={`${plusJakarta.variable} font-sans min-h-dvh flex flex-col bg-white dark:bg-[#0A0B0E] text-[#121212] dark:text-zinc-100 selection:bg-[#121212] selection:text-white transition-colors duration-200`}
      >
        {/* 1. Fixed Sticky Minimalist Shopify-Grade SaaS Nav with Dark Mode Toggle */}
        <PlatformNav />

        {/* Main SaaS Platform Content */}
        <main className="flex-1 w-full pt-16">{children}</main>
      </div>
    </PlatformThemeProvider>
  );
}
