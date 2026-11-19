import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { PlatformNav } from "@/components/platform/PlatformNav";
import { PlatformThemeProvider } from "@/context/PlatformThemeContext";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
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
    <PlatformThemeProvider defaultTheme="dark">
      <div
        className={`${plusJakarta.variable} ${jetbrainsMono.variable} font-sans min-h-dvh flex flex-col bg-[#F9F9F7] dark:bg-[#0E0F12] text-[#161614] dark:text-[#ECECE9] selection:bg-[#161614] dark:selection:bg-[#ECECE9] selection:text-[#F9F9F7] dark:selection:text-[#0E0F12]`}
        style={{
          fontFamily: 'var(--font-plus-jakarta), -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <PlatformNav />
        <main className="flex-1 w-full pt-16">{children}</main>
      </div>
    </PlatformThemeProvider>
  );
}
