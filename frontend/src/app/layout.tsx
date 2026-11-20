import type { Metadata, Viewport } from "next";
import { ServiceWorkerCleanup } from "@/components/ServiceWorkerCleanup";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0C111C" },
    { media: "(prefers-color-scheme: light)", color: "#F5F7FA" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://shopcraft.me"),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ShopCraft — Your shop, online, before your chiya cools.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShopCraft — Online Store Builder for Nepal (Khalti & COD)",
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
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-dvh antialiased bg-paper text-ink font-sans"
      >
        <ServiceWorkerCleanup />
        {children}
      </body>
    </html>
  );
}
