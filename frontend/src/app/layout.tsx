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
  metadataBase: new URL("https://shopcraft.me"),
  title: {
    default: "ShopCraft — Online Store Builder for Nepal (Khalti & COD)",
    template: "%s | ShopCraft",
  },
  description:
    "Create an online store in Nepal in minutes. Sell in NPR with Khalti, cash on delivery, and province, district, and ward addresses. Free while in beta.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ShopCraft",
    title: "ShopCraft — Online Store Builder for Nepal (Khalti & COD)",
    description:
      "Name your store, pick a look, add products. Customers pay with Khalti or cash on delivery.",
    url: "https://shopcraft.me",
    images: [
      {
        url: "/images/merchant-dashboard-real.png",
        width: 1280,
        height: 800,
        alt: "ShopCraft merchant dashboard for online stores in Nepal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShopCraft — Online Store Builder for Nepal (Khalti & COD)",
    description:
      "Name your store, pick a look, add products. Customers pay with Khalti or cash on delivery.",
    images: ["/images/merchant-dashboard-real.png"],
  },
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
