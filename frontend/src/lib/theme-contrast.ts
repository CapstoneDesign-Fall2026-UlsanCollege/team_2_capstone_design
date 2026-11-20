/**
 * Theme & WCAG AA Contrast Validation Engine
 *
 * Enforces ShopCraft storefront rules:
 * 1. Minimum contrast ratio of 4.5:1 for standard body text (WCAG AA).
 * 2. Minimum contrast ratio of 3.0:1 for large display headlines (>= 18pt / 24px).
 * 3. Tenants may NOT pick accent colors in green (85°-165°), amber/yellow (35°-80°),
 *    or red (345°-25°) ranges to avoid collision with semantic status colors.
 * 4. Invalid or failing tenant overrides automatically fall back to design token defaults.
 */

export const VALID_STOREFRONT_THEME_PRESETS = [
  "editorial-warm",
  "pahadi-sage",
  "ktm-bold",
  "midnight-obsidian",
] as const;

export type StorefrontThemePresetId = (typeof VALID_STOREFRONT_THEME_PRESETS)[number];

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

const LIGHT_STATUS_TOKENS = {
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

const DARK_STATUS_TOKENS = {
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

/**
 * Temporary Phase A token fixture matching globals.css [data-store-theme] rules.
 * Unified into the storefront theme registry in Phase B.
 */
export const STOREFRONT_PRESET_TOKENS: Record<StorefrontThemePresetId, PresetTokenSet> = {
  "editorial-warm": {
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
  "pahadi-sage": {
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
  "ktm-bold": {
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
  "midnight-obsidian": {
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
};

/**
 * Validates an optional merchant accent hex override against:
 * 1. Valid hex syntax
 * 2. Forbidden semantic status hues (red/amber/green)
 * 3. Button text WCAG AA contrast (>= 4.5:1 against #FFFFFF or #0B0D11)
 * 4. Button visibility against both preset surface and canvas (>= 3.0:1)
 */
export function resolveSafeAccentOverride(
  accentColor?: string | null,
  themePreset?: string | null
): { primary: string; primaryHover: string; primaryForeground: string } | null {
  const raw = typeof accentColor === "string" ? accentColor.trim() : "";
  if (!raw) return null;

  const clean = raw.startsWith("#") ? raw : `#${raw}`;
  const rgb = hexToRgb(clean);
  if (!rgb) return null;

  if (isForbiddenStatusHue(rgb[0], rgb[1], rgb[2])) {
    return null;
  }

  const normalizedHex = `#${rgb
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;

  const whiteContrast = calculateContrastRatio("#FFFFFF", normalizedHex);
  const darkContrast = calculateContrastRatio("#0B0D11", normalizedHex);
  const primaryForeground = whiteContrast >= darkContrast ? "#FFFFFF" : "#0B0D11";
  const bestFgContrast = Math.max(whiteContrast, darkContrast);
  if (bestFgContrast < 4.5) {
    return null;
  }

  const presetTokens = STOREFRONT_PRESET_TOKENS[normalizeStorefrontThemePreset(themePreset)];
  const surfaceContrast = calculateContrastRatio(normalizedHex, presetTokens.surface);
  const canvasContrast = calculateContrastRatio(normalizedHex, presetTokens.canvas);
  if (surfaceContrast < 3.0 || canvasContrast < 3.0) {
    return null;
  }

  return {
    primary: normalizedHex,
    primaryHover: normalizedHex,
    primaryForeground,
  };
}

export interface ThemeTokens {
  canvas: string;
  surface: string;
  border: string;
  ink: string;
  ink2: string;
  primary: string;
  primaryHover: string;
  radiusControl: string;
  radiusCard: string;
}

export const DEFAULT_STOREFRONT_TOKENS: ThemeTokens = {
  canvas: "#F4F3F1",
  surface: "#FBFAF9",
  border: "#E2DFDA",
  ink: "#171716",
  ink2: "#5C5954",
  primary: "#171716",
  primaryHover: "#2E2D2B",
  radiusControl: "8px",
  radiusCard: "12px",
};

/**
 * Converts a hex string (#RGB, #RRGGBB) to [r, g, b] (0-255).
 */
export function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace(/^#/, "").trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : [r, g, b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : [r, g, b];
  }
  return null;
}

/**
 * Calculates relative luminance as defined in WCAG 2.1 specs.
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Returns contrast ratio between two hex colors (e.g. 4.5 for 4.5:1).
 */
export function calculateContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const fg = hexToRgb(foregroundHex);
  const bg = hexToRgb(backgroundHex);
  if (!fg || !bg) return 1.0;

  const lum1 = getRelativeLuminance(fg[0], fg[1], fg[2]);
  const lum2 = getRelativeLuminance(bg[0], bg[1], bg[2]);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if RGB color falls into forbidden status hue ranges:
 * Green (~85° to 165°), Amber/Yellow (~35° to 80°), or Red (~345° to 25°).
 */
export function isForbiddenStatusHue(r: number, g: number, b: number): boolean {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const d = max - min;

  // Low saturation neutrals (grays, charcoals, beiges) are always permitted
  if (d < 0.15) {
    return false;
  }

  let h = 0;
  if (max === rNorm) {
    h = ((gNorm - bNorm) / d) % 6;
  } else if (max === gNorm) {
    h = (bNorm - rNorm) / d + 2;
  } else {
    h = (rNorm - gNorm) / d + 4;
  }
  const degrees = Math.round(h * 60 + 360) % 360;

  // Forbidden ranges:
  // Red family: 345° - 360° or 0° - 25°
  const isRed = degrees >= 345 || degrees <= 25;
  // Amber / Yellow family: 35° - 80°
  const isAmber = degrees >= 35 && degrees <= 80;
  // Green family: 85° - 165°
  const isGreen = degrees >= 85 && degrees <= 165;

  return isRed || isAmber || isGreen;
}

/**
 * Validates tenant color overrides against WCAG AA standards and status color collisions.
 * Returns safe CSS variable definitions with automatic fallback to defaults.
 */
export function resolveSafeTenantTokens(overrides?: {
  canvas?: string | null;
  surface?: string | null;
  ink?: string | null;
  ink2?: string | null;
  accentColor?: string | null;
  radius?: number | string | null;
}): {
  tokens: ThemeTokens;
  warnings: string[];
} {
  const warnings: string[] = [];
  const defaults = DEFAULT_STOREFRONT_TOKENS;

  let canvas = overrides?.canvas && hexToRgb(overrides.canvas) ? overrides.canvas : defaults.canvas;
  const surface = overrides?.surface && hexToRgb(overrides.surface) ? overrides.surface : defaults.surface;
  let ink = overrides?.ink && hexToRgb(overrides.ink) ? overrides.ink : defaults.ink;
  let ink2 = overrides?.ink2 && hexToRgb(overrides.ink2) ? overrides.ink2 : defaults.ink2;

  // Check WCAG AA contrast: ink on surface >= 4.5:1
  const inkContrast = calculateContrastRatio(ink, surface);
  if (inkContrast < 4.5) {
    warnings.push(`Tenant ink ${ink} on surface ${surface} failed WCAG AA (ratio ${inkContrast.toFixed(2)}:1 < 4.5:1). Falling back to default ink.`);
    ink = defaults.ink;
  }

  // Check WCAG AA contrast: ink-2 on surface >= 4.5:1 for small text
  const ink2Contrast = calculateContrastRatio(ink2, surface);
  if (ink2Contrast < 4.5) {
    warnings.push(`Tenant ink-2 ${ink2} on surface ${surface} failed WCAG AA (ratio ${ink2Contrast.toFixed(2)}:1 < 4.5:1). Falling back to default ink-2.`);
    ink2 = defaults.ink2;
  }

  // Check WCAG AA contrast: ink on canvas >= 4.5:1
  const canvasContrast = calculateContrastRatio(ink, canvas);
  if (canvasContrast < 4.5) {
    warnings.push(`Tenant ink on canvas ${canvas} failed WCAG AA. Falling back to default canvas.`);
    canvas = defaults.canvas;
  }

  // Accent color validation: must not collide with green, amber, or red
  let primary = defaults.primary;
  let primaryHover = defaults.primaryHover;
  if (overrides?.accentColor) {
    const rgb = hexToRgb(overrides.accentColor);
    if (rgb && isForbiddenStatusHue(rgb[0], rgb[1], rgb[2])) {
      warnings.push(`Accent color ${overrides.accentColor} clashes with green/amber/red status colors. Reverting to primary default.`);
    } else if (rgb) {
      // Must also pass contrast >= 4.5:1 against white text inside button
      const btnTextContrast = calculateContrastRatio("#FFFFFF", overrides.accentColor);
      if (btnTextContrast >= 4.5) {
        primary = overrides.accentColor;
        primaryHover = overrides.accentColor;
      } else {
        warnings.push(`Accent color ${overrides.accentColor} fails contrast with white button text (${btnTextContrast.toFixed(2)}:1 < 4.5:1). Reverting to primary default.`);
      }
    }
  }

  const radiusControl = typeof overrides?.radius === "number"
    ? `${overrides.radius}px`
    : typeof overrides?.radius === "string" && overrides.radius
    ? overrides.radius
    : defaults.radiusControl;

  return {
    tokens: {
      canvas,
      surface,
      border: defaults.border,
      ink,
      ink2,
      primary,
      primaryHover,
      radiusControl,
      radiusCard: defaults.radiusCard,
    },
    warnings,
  };
}
