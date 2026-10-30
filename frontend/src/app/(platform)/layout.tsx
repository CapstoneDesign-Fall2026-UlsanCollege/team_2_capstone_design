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
  title: "ShopCraft | Platform",
  description: "Independent e-commerce and subscription SaaS platform for Nepal.",
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-extrabold tracking-tight text-lg text-[var(--sc-ink,#111318)]">
              ShopCraft
            </span>
            <span
              className="w-2 h-2 rounded-full bg-[var(--sc-marigold,#F2A900)] inline-block"
              title="Live Platform"
              aria-label="Live dot"
            />
          </Link>

          <nav className="flex items-center gap-4 text-xs font-mono">
            <Link
              href="/account/addresses"
              className="text-[var(--sc-ink-2,#4B5060)] hover:text-[var(--sc-ink,#111318)] transition-colors"
            >
              Addresses
            </Link>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-md bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] font-sans text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
