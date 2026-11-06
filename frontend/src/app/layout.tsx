import type { Metadata, Viewport } from "next";
import { Noto_Sans_Devanagari, Inter, Fraunces } from "next/font/google";
import { ServiceWorkerCleanup } from "@/components/ServiceWorkerCleanup";
import "./globals.css";

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
  preload: false,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#111318",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ShopCraft | Multi-Tenant E-Commerce SaaS for Nepal",
  description: "Launch your independent Nepali online store with Khalti and Cash on Delivery.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ShopCraft",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${notoSansDevanagari.variable} ${inter.variable} ${fraunces.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-dvh antialiased bg-[var(--sc-paper)] text-[var(--sc-ink)] font-sans"
      >
        <ServiceWorkerCleanup />
        {children}
      </body>
    </html>
  );
}
