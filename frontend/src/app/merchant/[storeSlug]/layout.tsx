import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConsoleShell } from "@/components/merchant/ConsoleShell";

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
      className={`${geist.variable} ${geistMono.variable} font-sans console min-h-dvh bg-[var(--background)] text-[var(--foreground)] text-[13px] antialiased`}
    >
      <ConsoleShell storeSlug={storeSlug}>{children}</ConsoleShell>
    </div>
  );
}
