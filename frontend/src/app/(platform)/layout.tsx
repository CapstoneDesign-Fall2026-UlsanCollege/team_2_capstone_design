import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { PlatformNav } from "@/components/platform/PlatformNav";
import { PlatformThemeProvider } from "@/context/PlatformThemeContext";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "optional",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "optional",
});

export const metadata: Metadata = {
  title: {
    absolute: "Online Store Builder for Nepal – Khalti & COD | ShopCraft",
  },
  description:
    "Create an online store in Nepal in minutes. Sell in rupees with Khalti and cash on delivery, with province, district and ward checkout. Free during beta.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://shopcraft.me",
    siteName: "ShopCraft",
    title: "ShopCraft — Your shop, online, before your chiya cools.",
    description:
      "Name your store, pick a look, add products. Customers pay with Khalti or cash on delivery.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ShopCraft — Your shop, online, before your chiya cools.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Store Builder for Nepal – Khalti & COD | ShopCraft",
    description:
      "Name your store, pick a look, add products. Customers pay with Khalti or cash on delivery.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ShopCraft — Your shop, online, before your chiya cools.",
      },
    ],
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
        className={`${plusJakarta.variable} ${jetbrainsMono.variable} platform-shell font-sans min-h-dvh flex flex-col bg-white dark:bg-[#0A0B0E] text-[#121212] dark:text-zinc-100 selection:bg-[#121212] selection:text-white transition-colors duration-200`}
        style={{
          fontFamily: "var(--font-plus-jakarta), -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-[#111318] focus:text-white focus:text-sm focus:font-semibold"
        >
          Skip to content
        </a>

        {/* 1. Fixed Sticky Minimalist Shopify-Grade SaaS Nav with Dark Mode Toggle */}
        <PlatformNav />

        {/* Main SaaS Platform Content */}
        <main id="main" className="flex-1 w-full pt-16">{children}</main>
      </div>
    </PlatformThemeProvider>
  );
}
