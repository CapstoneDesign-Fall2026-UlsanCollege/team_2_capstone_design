import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

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
  title: "Merchant Console | ShopCraft",
  description: "Neutral merchant workspace and order queue.",
};

export default async function MerchantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;

  return (
    <div
      className={`${geist.variable} ${geistMono.variable} font-sans console min-h-dvh bg-[var(--background)] text-[var(--foreground)] text-[13px] antialiased flex flex-col`}
    >
      <header className="h-12 border-b border-[var(--border)] bg-[var(--card)] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold text-xs tracking-tight">
            ShopCraft
          </Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)]">
            {storeSlug}
          </span>
        </div>

        <nav className="flex items-center gap-3 text-xs">
          <Link
            href={`/s/${encodeURIComponent(storeSlug)}`}
            target="_blank"
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Live Store ↗
          </Link>
          <Link
            href="/account/addresses"
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Account
          </Link>
        </nav>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">{children}</main>
    </div>
  );
}
