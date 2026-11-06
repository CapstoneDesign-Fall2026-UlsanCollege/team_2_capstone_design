import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Fraunces,
  Inter,
  Young_Serif,
  Space_Grotesk,
} from "next/font/google";
import { CartProvider } from "@/components/storefront/CartContext";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { ThemePreviewWatcher } from "@/components/storefront/ThemePreviewWatcher";
import { resolveSafeTenantTokens } from "@/lib/theme-contrast";

// Default typography: Fraunces 600 (headlines) + Inter (UI)
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

// Tenant-specific optional fonts loaded only when active
const youngSerif = Young_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-young-serif",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
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
  try {
    const res = await fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/`, {
      cache: "no-store",
    });
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      return {
        slug: storeSlug,
        name: storeSlug,
        tagline: "",
        currency: "NPR",
        theme_preset: "editorial-warm",
        logo_url: null,
        contact_phone: "9801234567",
        accent_color: null,
        free_shipping_threshold_minor: null,
      };
    }
    return await res.json();
  } catch {
    return {
      slug: storeSlug,
      name: storeSlug,
      tagline: "",
      currency: "NPR",
      theme_preset: "editorial-warm",
      logo_url: null,
      contact_phone: "9801234567",
      accent_color: null,
      free_shipping_threshold_minor: null,
    };
  }
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
function getActiveTenantFontClasses(preset: string): string {
  switch (preset) {
    case "pahadi-sage":
      return `${fraunces.variable} ${inter.variable} ${youngSerif.variable}`;
    case "ktm-bold":
      return `${fraunces.variable} ${inter.variable} ${spaceGrotesk.variable}`;
    case "midnight-obsidian":
    case "editorial-warm":
    default:
      return `${fraunces.variable} ${inter.variable}`;
  }
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
      <CartProvider
        storeSlug={store.slug}
        themePreset={themePreset}
        freeShippingThresholdMinor={store.free_shipping_threshold_minor}
      >
        {children}
        <CartDrawer />
      </CartProvider>
    </div>
  );
}
