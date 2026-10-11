import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";
import { ShoppingBag, User, Menu, Home, Coffee } from "lucide-react";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const viewport: Viewport = {
  themeColor: "#1A1512",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#F5F2EB] border-t border-[#E6DEC8] flex justify-around items-center h-16 z-50 pb-safe select-none">
          <Link href="/" className="flex flex-col items-center gap-1 text-[#5C5042] hover:text-[#1A1512]">
            <Home size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
          </Link>
          <Link href="/origins" className="flex flex-col items-center gap-1 text-[#5C5042] hover:text-[#1A1512]">
            <Coffee size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Origins</span>
          </Link>
          <Link href="/checkout" className="flex flex-col items-center gap-1 text-[#5C5042] hover:text-[#1A1512] relative">
            <ShoppingBag size={20} />
            <span className="absolute top-0 right-2 w-2 h-2 bg-[#A3432A] rounded-full"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Cart</span>
          </Link>
          <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[#5C5042] hover:text-[#1A1512]">
            <User size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Account</span>
          </Link>
        </nav>

        {/* Pad the bottom so content isn't hidden behind the sticky nav on mobile */}
        <div className="h-16 md:hidden"></div>

        {/* PWA One-Click Install Banner */}
        <PwaInstallBanner />
      </body>
    </html>
  );
}
