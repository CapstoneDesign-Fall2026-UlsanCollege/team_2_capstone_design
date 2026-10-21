import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";

// 1. Boutique Typography System (Editorial Serif + Contemporary Clean Sans + Technical Monospace)
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// 2. Viewport & PWA Mobile Edge-to-Edge Configuration
export const viewport: Viewport = {
  themeColor: "#1A1512",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "BrewMellow | Boutique Himalayan Coffee",
  description: "Direct-trade, high-altitude micro-lots from Nepal roasted to order and delivered on recurring cycles.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BrewMellow",
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
      className={`${fraunces.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="antialiased bg-[#F5F2EB] text-[#2C2420] min-h-screen flex flex-col font-sans"
      >
        {/* GLOBAL NAVBAR */}
        <Navbar />

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* DYNAMIC CONTEXTUAL FOOTER */}
        <Footer />

        {/* Mobile Bottom Navigation Dock (PWA Native Feel with 48px Touch Targets & Safe-Area Clearance) */}
        <MobileNav />

        {/* PWA Smart Install Banner (Non-colliding top notification & native iOS modal) */}
        <PwaInstallBanner />
      </body>
    </html>
  );
}
