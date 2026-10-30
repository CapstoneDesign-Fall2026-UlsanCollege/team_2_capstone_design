import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Fraunces,
  Plus_Jakarta_Sans,
  Young_Serif,
  Manrope,
  Space_Grotesk,
  Inter,
  JetBrains_Mono,
} from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const youngSerif = Young_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-young-serif",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
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
        contact_phone: "",
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
      contact_phone: "",
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
    title: store ? `${store.name} | ShopCraft` : "Store | ShopCraft",
    description: store?.tagline || "Online shop powered by ShopCraft.",
  };
}

function getPresetFontClasses(preset: string): string {
  switch (preset) {
    case "pahadi-sage":
      return `${youngSerif.variable} ${manrope.variable} ${jetbrainsMono.variable}`;
    case "ktm-bold":
      return `${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`;
    case "editorial-warm":
    default:
      return `${fraunces.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`;
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
  const fontClasses = getPresetFontClasses(themePreset);

  return (
    <div
      data-store-theme={themePreset}
      className={`${fontClasses} min-h-dvh bg-sf-canvas text-sf-ink font-sf-body flex flex-col`}
    >
      {children}
    </div>
  );
}
