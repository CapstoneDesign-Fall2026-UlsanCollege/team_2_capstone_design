import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountProvider } from "@/components/storefront/AccountContext";
import { AccountSheet } from "@/components/storefront/AccountSheet";
import { CartProvider } from "@/components/storefront/CartContext";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { ThemePreviewWatcher } from "@/components/storefront/ThemePreviewWatcher";
import { resolveSafeTenantTokens } from "@/lib/theme-contrast";
import { getServerApiOrigin } from "@/lib/env";

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
  const origin = getServerApiOrigin();
  const res = await fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/`, {
    next: { revalidate: 60 },
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
  const storeName = store?.name?.trim() || "Online Store";
  const cleanTagline = store?.tagline?.trim();

  return {
    title: storeName,
    description: cleanTagline || `${storeName} online storefront.`,
  };
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
      className="storefront min-h-dvh bg-[var(--canvas)] text-[var(--ink)] font-sans flex flex-col"
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
