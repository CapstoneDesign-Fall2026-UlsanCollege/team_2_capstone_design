import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

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

export const metadata: Metadata = {
  title: "ShopCraft | Multi-Tenant Commerce & Subscriptions for Nepal",
  description: "Launch your online store in Nepal. For free. Native Khalti, Cash on Delivery, and recurring subscriptions without a USD card.",
};

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${bricolageGrotesque.variable} ${geist.variable} ${geistMono.variable} font-sans min-h-dvh flex flex-col bg-[var(--sc-paper,#FAFAF7)] text-[var(--sc-ink,#111318)]`}
    >
      <header className="sticky top-0 z-40 w-full border-b border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-paper,#FAFAF7)]/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="w-8 h-8 rounded-lg bg-[#0F2D1F] text-white flex items-center justify-center text-sm shadow-xs font-bold">
                ⛰️
              </span>
              <span className="font-extrabold tracking-tight text-xl text-[var(--sc-ink,#111318)]">
                ShopCraft
              </span>
              <span
                className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"
                title="Live Cloud Core"
                aria-label="Live dot"
              />
            </Link>

            {/* Desktop Nav Items */}
            <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-[var(--sc-ink-2,#4B5060)]">
              <Link href="#features" className="hover:text-[var(--sc-ink,#111318)] transition-colors">
                Features
              </Link>
              <Link href="#comparison" className="hover:text-[var(--sc-ink,#111318)] transition-colors">
                Shopify Comparison
              </Link>
              <Link href="#demos" className="hover:text-[var(--sc-ink,#111318)] transition-colors">
                Live Demos
              </Link>
              <Link href="#pricing" className="hover:text-[var(--sc-ink,#111318)] transition-colors">
                Pricing
              </Link>
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/account/addresses"
              className="hidden sm:inline-block text-xs font-mono text-[var(--sc-ink-2,#4B5060)] hover:text-[var(--sc-ink,#111318)] transition-colors"
            >
              Addresses
            </Link>

            <Link
              href="/login"
              className="text-xs font-medium text-[var(--sc-ink,#111318)] hover:underline px-2 py-1"
            >
              Log In
            </Link>

            <Link
              href="/merchant/new"
              className="px-4 py-2 rounded-lg bg-[#C2410C] hover:bg-[#EA580C] text-white font-medium text-xs shadow-xs transition-colors whitespace-nowrap"
            >
              Start Free Store →
            </Link>

            {/* Nepal Flag Indicator */}
            <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-zinc-200 text-xs font-mono text-zinc-600">
              <span className="text-sm">🇳🇵</span>
              <span className="font-bold text-[11px]">NP</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
