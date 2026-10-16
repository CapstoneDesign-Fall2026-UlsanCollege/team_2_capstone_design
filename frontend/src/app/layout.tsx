import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";

export const viewport: Viewport = {
  themeColor: "#1A1512",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "BrewMellow | Himalayan Coffee",
  description: "Boutique Himalayan Coffee Subscription",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased bg-[#F5F2EB] text-[#2C2420] min-h-screen flex flex-col font-sans">
        {/* GLOBAL NAVBAR */}
        <Navbar />

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* DYNAMIC CONTEXTUAL FOOTER */}
        <Footer />

        {/* Mobile Bottom Navigation Bar (PWA App Feel) */}
        <MobileNav />

        {/* PWA One-Click Install Banner */}
        <PwaInstallBanner />
      </body>
    </html>
  );
}
