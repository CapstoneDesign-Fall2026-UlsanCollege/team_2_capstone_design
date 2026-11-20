/**
 * Canonical Storefront Theme Registry — Single Source of Truth
 *
 * Used across all 5 ShopCraft surfaces:
 * 1. Platform landing showcase (ThemeTemplateStudio)
 * 2. Store creation wizard (/merchant/new)
 * 3. Merchant theme studio (/merchant/[storeSlug]/themes)
 * 4. Merchant store settings (SettingsForm)
 * 5. Public storefront (/s/[storeSlug])
 *
 * Font loading note:
 * Actual Google Fonts are loaded statically via next/font/google in
 * src/lib/storefront-fonts.ts (loaded families: Fraunces, Inter, Plus Jakarta Sans,
 * Space Grotesk, plus Noto Sans Devanagari for Nepali script fallback).
 * That respects the <= 2 new font families constraint beyond Fraunces and Inter.
 * Accordingly, pahadi-sage pairs Fraunces + Inter (replacing earlier unloaded
 * Young Serif + Manrope proposals) so every advertised pairing is genuinely loaded.
 */

export const VALID_STOREFRONT_THEME_PRESETS = [
  "editorial-warm",
  "pahadi-sage",
  "ktm-bold",
  "midnight-obsidian",
] as const;

export type StorefrontThemePresetId = (typeof VALID_STOREFRONT_THEME_PRESETS)[number];

export type HeroCompositionId =
  | "editorial-split"
  | "centered-story"
  | "full-bleed-poster"
  | "dark-spotlight";

export type ProductCardAspectId = "4/5" | "1/1" | "3/4";

export type HeaderAlignmentId = "left" | "centered";

export interface PresetTokenSet {
  canvas: string;
  surface: string;
  border: string;
  borderSubtle: string;
  ink: string;
  ink2: string;
  primary: string;
  primaryHover: string;
  primaryForeground: string;
  navActive: string;
  statusSuccessBg: string;
  statusSuccessFg: string;
  statusSuccessBorder: string;
  statusWarningBg: string;
  statusWarningFg: string;
  statusWarningBorder: string;
  statusErrorBg: string;
  statusErrorFg: string;
  statusErrorBorder: string;
}

export interface StorefrontFontPairing {
  id: string;
  label: string;
  displayFont: string;
  uiFont: string;
  fallbackFont: string;
  displayCssVar: string;
  uiCssVar: string;
  displayCssStack: string;
  uiCssStack: string;
  pairingNote: string;
}

export interface StorefrontStructuralMetadata {
  heroComposition: HeroCompositionId;
  heroLabel: string;
  productCardAspect: ProductCardAspectId;
  headerAlignment: HeaderAlignmentId;
}

export interface StorefrontThemePreviewMetadata {
  taglineLabel: string;
  sampleTag: string;
  sampleProductTitle: string;
  samplePrice: string;
  sampleImageSrc: string;
  photoBackdropHex: string;
  staggeredInShowcase: boolean;
  outlineCtaInShowcase: boolean;
}

export interface StorefrontThemeDefinition {
  id: StorefrontThemePresetId;
  displayName: string;
  shortDescription: string;
  bestForLabel: string;
  bestForCategories: readonly string[];
  tokenGroupId: "editorial-light" | "botanical-light" | "brutalist-light" | "obsidian-dark";
  surfaceMode: "light" | "dark";
  radius: {
    control: string;
    card: string;
  };
  fontPairing: StorefrontFontPairing;
  structural: StorefrontStructuralMetadata;
  preview: StorefrontThemePreviewMetadata;
  tokens: PresetTokenSet;
}

export const LIGHT_STATUS_TOKENS = {
  statusSuccessBg: "#E6F3EC",
  statusSuccessFg: "#1B5E3A",
  statusSuccessBorder: "#5B9574",
  statusWarningBg: "#FBF1DA",
  statusWarningFg: "#734D10",
  statusWarningBorder: "#9C7327",
  statusErrorBg: "#FCEAEA",
  statusErrorFg: "#992620",
  statusErrorBorder: "#B85651",
} as const;

export const DARK_STATUS_TOKENS = {
  statusSuccessBg: "#112B20",
  statusSuccessFg: "#7CE3AE",
  statusSuccessBorder: "#4BA87A",
  statusWarningBg: "#2E230E",
  statusWarningFg: "#F5CE75",
  statusWarningBorder: "#BD9038",
  statusErrorBg: "#311418",
  statusErrorFg: "#FCA5A5",
  statusErrorBorder: "#C9666B",
} as const;

export const STOREFRONT_THEMES: readonly StorefrontThemeDefinition[] = [
  {
    id: "editorial-warm",
    displayName: "Editorial Warm",
    shortDescription:
      "Warm paper canvas, editorial serif headlines, and terracotta CTAs crafted for story-driven Nepali brands.",
    bestForLabel: "Coffee, Tea, Bakeries & Slow Food",
    bestForCategories: [
      "Specialty Coffee & Tea",
      "Bakery, Sweets & Cafe",
      "General Specialty Goods",
    ],
    tokenGroupId: "editorial-light",
    surfaceMode: "light",
    radius: {
      control: "8px",
      card: "12px",
    },
    fontPairing: {
      id: "fraunces-plus-jakarta",
      label: "Fraunces + Plus Jakarta Sans",
      displayFont: "Fraunces",
      uiFont: "Plus Jakarta Sans",
      fallbackFont: "Noto Sans Devanagari",
      displayCssVar: "--font-fraunces",
      uiCssVar: "--font-plus-jakarta",
      displayCssStack:
        'var(--font-fraunces), "Fraunces", var(--font-devanagari), "Noto Sans Devanagari", Georgia, serif',
      uiCssStack:
        'var(--font-plus-jakarta), "Plus Jakarta Sans", var(--font-devanagari), "Noto Sans Devanagari", -apple-system, BlinkMacSystemFont, sans-serif',
      pairingNote:
        "Loads Fraunces (600, 700) for display titles paired with Plus Jakarta Sans for warm, readable UI text and Noto Sans Devanagari fallback.",
    },
    structural: {
      heroComposition: "editorial-split",
      heroLabel: "Editorial Split",
      productCardAspect: "4/5",
      headerAlignment: "left",
    },
    preview: {
      taglineLabel: "Warm Editorial",
      sampleTag: "Roastery",
      sampleProductTitle: "Gulmi Reserve",
      samplePrice: "Rs. 750",
      sampleImageSrc: "/images/products/gulmi-reserve.svg",
      photoBackdropHex: "#1A1512",
      staggeredInShowcase: false,
      outlineCtaInShowcase: true,
    },
    tokens: {
      canvas: "#F5F2EB",
      surface: "#FFFDF9",
      border: "#857C70",
      borderSubtle: "#DDD6C9",
      ink: "#1A1512",
      ink2: "#594F47",
      primary: "#9A3D26",
      primaryHover: "#7F311E",
      primaryForeground: "#FFFDF9",
      navActive: "#EAE4D8",
      ...LIGHT_STATUS_TOKENS,
    },
  },
  {
    id: "pahadi-sage",
    displayName: "Pahadi Sage",
    shortDescription:
      "Botanical sage surfaces, soft rounded frames, and pine-green buttons built for mountain harvests and heritage crafts.",
    bestForLabel: "Mountain Teas, Honey, Herbs & Handloom",
    bestForCategories: [
      "Organic Honey, Herbs & Spices",
      "Himalayan Crafts & Handloom",
    ],
    tokenGroupId: "botanical-light",
    surfaceMode: "light",
    radius: {
      control: "12px",
      card: "16px",
    },
    fontPairing: {
      id: "fraunces-inter",
      label: "Fraunces + Inter",
      displayFont: "Fraunces",
      uiFont: "Inter",
      fallbackFont: "Noto Sans Devanagari",
      displayCssVar: "--font-fraunces",
      uiCssVar: "--font-inter",
      displayCssStack:
        'var(--font-fraunces), "Fraunces", var(--font-devanagari), "Noto Sans Devanagari", Georgia, serif',
      uiCssStack:
        'var(--font-inter), "Inter", var(--font-devanagari), "Noto Sans Devanagari", -apple-system, BlinkMacSystemFont, sans-serif',
      pairingNote:
        "Finalized pairing uses Fraunces + Inter (replacing earlier Young Serif + Manrope draft to stay within the <= 2 new Google Font families cap) with Noto Sans Devanagari fallback.",
    },
    structural: {
      heroComposition: "centered-story",
      heroLabel: "Centered Story",
      productCardAspect: "1/1",
      headerAlignment: "centered",
    },
    preview: {
      taglineLabel: "Botanical Harvest",
      sampleTag: "Harvest",
      sampleProductTitle: "Wild Cliff Honey",
      samplePrice: "Rs. 1,650",
      sampleImageSrc: "/images/products/himalayan-honey.svg",
      photoBackdropHex: "#14281D",
      staggeredInShowcase: true,
      outlineCtaInShowcase: false,
    },
    tokens: {
      canvas: "#F2F7F4",
      surface: "#FFFFFF",
      border: "#6A8275",
      borderSubtle: "#D5E2DA",
      ink: "#14281D",
      ink2: "#3E5749",
      primary: "#1C6342",
      primaryHover: "#154D33",
      primaryForeground: "#FFFFFF",
      navActive: "#E2EEE7",
      ...LIGHT_STATUS_TOKENS,
    },
  },
  {
    id: "ktm-bold",
    displayName: "KTM Bold",
    shortDescription:
      "Crisp monochrome bone canvas, sharp 4px corners, and high-voltage cobalt CTAs made for Kathmandu drops and urban gear.",
    bestForLabel: "Streetwear, Sneakers & Urban Tech",
    bestForCategories: ["Nepali Streetwear & Fashion"],
    tokenGroupId: "brutalist-light",
    surfaceMode: "light",
    radius: {
      control: "4px",
      card: "6px",
    },
    fontPairing: {
      id: "space-grotesk-inter",
      label: "Space Grotesk + Inter",
      displayFont: "Space Grotesk",
      uiFont: "Inter",
      fallbackFont: "Noto Sans Devanagari",
      displayCssVar: "--font-space-grotesk",
      uiCssVar: "--font-inter",
      displayCssStack:
        'var(--font-space-grotesk), "Space Grotesk", var(--font-devanagari), "Noto Sans Devanagari", sans-serif',
      uiCssStack:
        'var(--font-inter), "Inter", var(--font-devanagari), "Noto Sans Devanagari", -apple-system, BlinkMacSystemFont, sans-serif',
      pairingNote:
        "Pairs geometric Space Grotesk display headlines with crisp Inter body copy and Noto Sans Devanagari fallback.",
    },
    structural: {
      heroComposition: "full-bleed-poster",
      heroLabel: "Poster Drop",
      productCardAspect: "3/4",
      headerAlignment: "left",
    },
    preview: {
      taglineLabel: "Urban Drop",
      sampleTag: "Daily drop",
      sampleProductTitle: "Nuwakot Heritage",
      samplePrice: "Rs. 1,450",
      sampleImageSrc: "/images/products/nuwakot-heritage.svg",
      photoBackdropHex: "#0B0B0B",
      staggeredInShowcase: true,
      outlineCtaInShowcase: false,
    },
    tokens: {
      canvas: "#F4F4F0",
      surface: "#FFFFFF",
      border: "#5C5C57",
      borderSubtle: "#D6D6CE",
      ink: "#0B0B0B",
      ink2: "#4A4A46",
      primary: "#1D31E0",
      primaryHover: "#1625B5",
      primaryForeground: "#FFFFFF",
      navActive: "#E6E6E0",
      ...LIGHT_STATUS_TOKENS,
    },
  },
  {
    id: "midnight-obsidian",
    displayName: "Midnight Obsidian",
    shortDescription:
      "Deep obsidian night canvas paired with warm marigold-gold buttons and crisp slate surfaces for limited-edition drops.",
    bestForLabel: "Studio Drops, Tech Gear & Night Roasts",
    bestForCategories: ["Electronics & Tech Accessories"],
    tokenGroupId: "obsidian-dark",
    surfaceMode: "dark",
    radius: {
      control: "8px",
      card: "12px",
    },
    fontPairing: {
      id: "fraunces-plus-jakarta",
      label: "Fraunces + Plus Jakarta Sans",
      displayFont: "Fraunces",
      uiFont: "Plus Jakarta Sans",
      fallbackFont: "Noto Sans Devanagari",
      displayCssVar: "--font-fraunces",
      uiCssVar: "--font-plus-jakarta",
      displayCssStack:
        'var(--font-fraunces), "Fraunces", var(--font-devanagari), "Noto Sans Devanagari", Georgia, serif',
      uiCssStack:
        'var(--font-plus-jakarta), "Plus Jakarta Sans", var(--font-devanagari), "Noto Sans Devanagari", -apple-system, BlinkMacSystemFont, sans-serif',
      pairingNote:
        "Combines high-contrast Fraunces display typography with Plus Jakarta Sans UI copy and Noto Sans Devanagari fallback on a dark canvas.",
    },
    structural: {
      heroComposition: "dark-spotlight",
      heroLabel: "Dark Spotlight",
      productCardAspect: "4/5",
      headerAlignment: "centered",
    },
    preview: {
      taglineLabel: "Dark Studio",
      sampleTag: "Limited run",
      sampleProductTitle: "Ilam Gold",
      samplePrice: "Rs. 2,350",
      sampleImageSrc: "/images/products/ilam-gold.svg",
      photoBackdropHex: "#0B0D11",
      staggeredInShowcase: false,
      outlineCtaInShowcase: false,
    },
    tokens: {
      canvas: "#0B0D11",
      surface: "#141821",
      border: "#66738A",
      borderSubtle: "#262D3D",
      ink: "#F8FAFC",
      ink2: "#A8B3C7",
      primary: "#E5B143",
      primaryHover: "#F0C362",
      primaryForeground: "#0B0D11",
      navActive: "#1F2533",
      ...DARK_STATUS_TOKENS,
    },
  },
] as const;

export const STOREFRONT_THEME_MAP: Record<
  StorefrontThemePresetId,
  StorefrontThemeDefinition
> = {
  "editorial-warm": STOREFRONT_THEMES[0],
  "pahadi-sage": STOREFRONT_THEMES[1],
  "ktm-bold": STOREFRONT_THEMES[2],
  "midnight-obsidian": STOREFRONT_THEMES[3],
};

export const STOREFRONT_PRESET_TOKENS: Record<
  StorefrontThemePresetId,
  PresetTokenSet
> = {
  "editorial-warm": STOREFRONT_THEME_MAP["editorial-warm"].tokens,
  "pahadi-sage": STOREFRONT_THEME_MAP["pahadi-sage"].tokens,
  "ktm-bold": STOREFRONT_THEME_MAP["ktm-bold"].tokens,
  "midnight-obsidian": STOREFRONT_THEME_MAP["midnight-obsidian"].tokens,
};

export function isValidStorefrontThemePreset(
  value?: string | null
): value is StorefrontThemePresetId {
  return (
    typeof value === "string" &&
    (VALID_STOREFRONT_THEME_PRESETS as readonly string[]).includes(value.trim())
  );
}

export function normalizeStorefrontThemePreset(
  value?: string | null
): StorefrontThemePresetId {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return isValidStorefrontThemePreset(trimmed) ? trimmed : "editorial-warm";
}

export function getStorefrontTheme(
  value?: string | null
): StorefrontThemeDefinition {
  return STOREFRONT_THEME_MAP[normalizeStorefrontThemePreset(value)];
}

export function recommendStorefrontThemeId(
  category?: string | null
): StorefrontThemePresetId {
  const normalizedCategory = typeof category === "string" ? category.trim() : "";
  if (!normalizedCategory) return "editorial-warm";
  const matched = STOREFRONT_THEMES.find((theme) =>
    theme.bestForCategories.includes(normalizedCategory)
  );
  return matched ? matched.id : "editorial-warm";
}
