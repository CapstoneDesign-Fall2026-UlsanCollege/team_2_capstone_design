import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MerchantStoreGuard } from "@/components/merchant/MerchantStoreGuard";
import { PlatformThemeProvider } from "@/context/PlatformThemeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    <PlatformThemeProvider>
      <div
        className={`${inter.variable} console min-h-dvh bg-[var(--background)] text-[var(--foreground)] text-[13px] antialiased`}
      >
        <MerchantStoreGuard storeSlug={storeSlug}>{children}</MerchantStoreGuard>
      </div>
    </PlatformThemeProvider>
  );
}
