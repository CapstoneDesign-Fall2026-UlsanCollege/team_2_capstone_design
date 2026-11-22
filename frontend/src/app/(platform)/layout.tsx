import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Inter_Tight,
  Tiro_Devanagari_Hindi,
} from "next/font/google";
import { PlatformNav } from "@/components/platform/PlatformNav";
import { PlatformThemeProvider } from "@/context/PlatformThemeContext";
import { storefrontLatinFontVariablesClass } from "@/lib/storefront-fonts";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const tiroDevanagari = Tiro_Devanagari_Hindi({
  weight: "400",
  subsets: ["devanagari", "latin"],
  variable: "--font-devanagari",
  display: "swap",
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
        className={`${geist.variable} ${geistMono.variable} ${interTight.variable} ${instrumentSerif.variable} ${tiroDevanagari.variable} ${storefrontLatinFontVariablesClass} platform-shell min-h-dvh flex flex-col bg-paper text-ink transition-colors duration-200`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-btn focus:text-btn-ink focus:text-sm focus:font-semibold"
        >
          Skip to content
        </a>

        <PlatformNav />

        <main id="main" className="flex-1 w-full">
          {children}
        </main>
      </div>
    </PlatformThemeProvider>
  );
}
