import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Fraunces, Inter } from "next/font/google";
import { AccountProvider } from "@/components/storefront/AccountContext";
import { AccountSheet } from "@/components/storefront/AccountSheet";
import { CartProvider } from "@/components/storefront/CartContext";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { ThemePreviewWatcher } from "@/components/storefront/ThemePreviewWatcher";
import { resolveSafeTenantTokens } from "@/lib/theme-contrast";

// Uniform typography across all tenants: Fraunces (headlines) + Inter (UI)
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

interface StorePublicData {
  slug: string;
  name: string;
  tagline: string;
  currency: string;
  theme_preset: string;
  logo_url: string | null;
  contact_phone: string;
  accent_color?: string | null;
  free_shipping_threshold_minor?: number | null;
}

async function fetchStore(storeSlug: string): Promise<StorePublicData | null> {
  const origin = process.env.DJANGO_API_ORIGIN || "http://127.0.0.1:8000";
  const res = await fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/`, {
    cache: "no-store",
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to load store metadata: ${res.status}`);
  }
  return await res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}): Promise<Metadata> {
  const { storeSlug } = await params;
  const store = await fetchStore(storeSlug);

  return {
    title: store ? `${store.name} | Storefront` : "Store | ShopCraft",
    description: store?.tagline || "Online shop powered by ShopCraft.",
  };
}

/**
 * Load ONLY the fonts required by the active tenant
 */
function getActiveTenantFontClasses(_preset?: string): string {
  return `${fraunces.variable} ${inter.variable}`;
}

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const store = await fetchStore(storeSlug);

  if (!store) {
    notFound();
  }

  const themePreset = store.theme_preset || "editorial-warm";
  const fontClasses = getActiveTenantFontClasses(themePreset);

  // Validate tenant overrides against WCAG AA contrast and prohibited status hues
  const safeTokens = resolveSafeTenantTokens({
    accentColor: store.accent_color,
  });

  const customStyle: React.CSSProperties = {
    ["--canvas" as string]: safeTokens.tokens.canvas,
    ["--surface" as string]: safeTokens.tokens.surface,
    ["--border" as string]: safeTokens.tokens.border,
    ["--ink" as string]: safeTokens.tokens.ink,
    ["--ink-2" as string]: safeTokens.tokens.ink2,
    ["--primary" as string]: safeTokens.tokens.primary,
    ["--primary-hover" as string]: safeTokens.tokens.primaryHover,
  };

  return (
    <div
      data-store-theme={themePreset}
      style={customStyle}
      className={`${fontClasses} storefront min-h-dvh bg-[var(--canvas)] text-[var(--ink)] font-sans flex flex-col`}
    >
      <ThemePreviewWatcher initialPreset={themePreset} />
      <AccountProvider>
        <CartProvider
          storeSlug={store.slug}
          themePreset={themePreset}
          freeShippingThresholdMinor={store.free_shipping_threshold_minor}
        >
          {children}
          <CartDrawer />
          <AccountSheet storeSlug={store.slug} themePreset={themePreset} />
        </CartProvider>
      </AccountProvider>
    </div>
  );
}
