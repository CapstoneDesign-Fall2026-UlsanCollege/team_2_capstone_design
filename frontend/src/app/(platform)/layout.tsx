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
  title: "ShopCraft | Multi-Tenant E-Commerce & Subscription SaaS for Nepal",
  description:
    "Launch your independent online store in Nepal. Purpose-built for specialty coffee roasters, artisan tea estates, and consumable brands. Native Khalti & COD with recurring subscriptions.",
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
