import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  STOREFRONT_THEMES,
  STOREFRONT_THEME_MAP,
  VALID_STOREFRONT_THEME_PRESETS,
  getStorefrontTheme,
  normalizeStorefrontThemePreset,
  recommendStorefrontThemeId,
} from "./storefront-themes";

const FRONTEND_ROOT = path.resolve(__dirname, "..", "..");
const REPO_ROOT = path.resolve(FRONTEND_ROOT, "..");

function parseCssThemeBlock(css: string, themeId: string): string {
  const escaped = themeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `\\[data-store-theme="${escaped}"\\][^{]*\\{([\\s\\S]*?)\\}`,
    "m"
  );
  const match = css.match(regex);
  if (!match) {
    throw new Error(`Missing [data-store-theme="${themeId}"] block in globals.css`);
  }
  return match[1];
}

function getCssVar(block: string, varName: string): string {
  const regex = new RegExp(`${varName}\\s*:\\s*([^;]+);`);
  const match = block.match(regex);
  if (!match) {
    throw new Error(`Missing CSS var ${varName}`);
  }
  return match[1].trim();
}

describe("Storefront Theme Registry (Single Source of Truth)", () => {
  it("matches the exact 4 backend Store.THEME_PRESET_CHOICES slugs", () => {
    const modelsPy = fs.readFileSync(
      path.join(REPO_ROOT, "backend", "stores", "models.py"),
      "utf-8"
    );
    const choicesMatch = modelsPy.match(/THEME_PRESET_CHOICES\s*=\s*\[([\s\S]*?)\]/);
    expect(choicesMatch).not.toBeNull();

    const backendSlugs = Array.from(
      choicesMatch![1].matchAll(/\(\s*"([a-z-]+)"\s*,/g),
      (m) => m[1]
    );

    expect(backendSlugs).toEqual([
      "editorial-warm",
      "pahadi-sage",
      "ktm-bold",
      "midnight-obsidian",
    ]);
    expect([...VALID_STOREFRONT_THEME_PRESETS]).toEqual(backendSlugs);
    expect(STOREFRONT_THEMES.map((t) => t.id)).toEqual(backendSlugs);
  });

  it("exposes complete metadata, structural IDs, and previews for all 4 themes", () => {
    for (const theme of STOREFRONT_THEMES) {
      expect(theme.displayName.length).toBeGreaterThan(2);
      expect(theme.shortDescription.length).toBeGreaterThan(15);
      expect(theme.bestForLabel.length).toBeGreaterThan(5);
      expect(theme.bestForCategories.length).toBeGreaterThan(0);
      expect(theme.tokenGroupId).toBeTruthy();
      expect(theme.structural.heroComposition).toBeTruthy();
      expect(["4/5", "1/1", "3/4"]).toContain(theme.structural.productCardAspect);
      expect(["left", "centered"]).toContain(theme.structural.headerAlignment);
      expect(theme.preview.sampleProductTitle.length).toBeGreaterThan(2);
      expect(theme.preview.sampleImageSrc.startsWith("/images/")).toBe(true);
      expect(STOREFRONT_THEME_MAP[theme.id]).toBe(theme);
    }
  });

  it("loads at most 2 new Latin font families beyond Fraunces and Inter with Noto Sans Devanagari fallback", () => {
    const fontsFile = fs.readFileSync(
      path.join(FRONTEND_ROOT, "src", "lib", "storefront-fonts.ts"),
      "utf-8"
    );
    const importMatch = fontsFile.match(
      /import\s*\{([\s\S]*?)\}\s*from\s*["']next\/font\/google["']/
    );
    expect(importMatch).not.toBeNull();

    const importedLoaders = importMatch![1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const coreFonts = new Set(["Fraunces", "Inter", "Noto_Sans_Devanagari"]);
    const newLatinFonts = importedLoaders.filter((name) => !coreFonts.has(name));

    expect(importedLoaders).toContain("Fraunces");
    expect(importedLoaders).toContain("Inter");
    expect(importedLoaders).toContain("Noto_Sans_Devanagari");
    expect(newLatinFonts.length).toBeLessThanOrEqual(2);
    expect(fontsFile).toContain('variable: "--font-devanagari"');

    const loaderToFamilyName: Record<string, string> = {
      Fraunces: "Fraunces",
      Inter: "Inter",
      Plus_Jakarta_Sans: "Plus Jakarta Sans",
      Space_Grotesk: "Space Grotesk",
      Noto_Sans_Devanagari: "Noto Sans Devanagari",
    };
    const loadedFamilyNames = new Set(
      importedLoaders.map((loader) => loaderToFamilyName[loader])
    );

    const globalsCss = fs.readFileSync(
      path.join(FRONTEND_ROOT, "src", "app", "globals.css"),
      "utf-8"
    );

    for (const theme of STOREFRONT_THEMES) {
      expect(loadedFamilyNames.has(theme.fontPairing.displayFont)).toBe(true);
      expect(loadedFamilyNames.has(theme.fontPairing.uiFont)).toBe(true);
      expect(theme.fontPairing.fallbackFont).toBe("Noto Sans Devanagari");
      expect(theme.fontPairing.uiCssStack).toContain("Noto Sans Devanagari");
      expect(theme.fontPairing.displayCssStack).toContain("Noto Sans Devanagari");

      const block = parseCssThemeBlock(globalsCss, theme.id);
      const cssSerif = getCssVar(block, "--font-serif");
      const cssUi = getCssVar(block, "--font-ui");

      expect(cssSerif).toContain(theme.fontPairing.displayCssVar);
      expect(cssSerif).toContain("Noto Sans Devanagari");
      expect(cssUi).toContain(theme.fontPairing.uiCssVar);
      expect(cssUi).toContain("Noto Sans Devanagari");
    }
  });

  it("is consumed by all 5 surfaces without duplicate preset definitions", () => {
    const surfaceFiles = [
      path.join(FRONTEND_ROOT, "src", "components", "platform", "ThemeTemplateStudio.tsx"),
      path.join(FRONTEND_ROOT, "src", "app", "(platform)", "merchant", "new", "page.tsx"),
      path.join(FRONTEND_ROOT, "src", "app", "merchant", "[storeSlug]", "themes", "page.tsx"),
      path.join(FRONTEND_ROOT, "src", "components", "merchant", "SettingsForm.tsx"),
    ];

    for (const filePath of surfaceFiles) {
      const src = fs.readFileSync(filePath, "utf-8");
      expect(src).toContain("@/lib/storefront-themes");
      expect(src).not.toMatch(/\b(LOOK_CARDS|THEME_OPTIONS|THEME_PRESETS|PRESETS)\s*[:=]\s*\[/);
      expect(src).not.toContain("Young Serif");
      expect(src).not.toContain("Manrope");
    }

    const storefrontLayout = fs.readFileSync(
      path.join(FRONTEND_ROOT, "src", "app", "s", "[storeSlug]", "layout.tsx"),
      "utf-8"
    );
    expect(storefrontLayout).toContain("@/lib/storefront-fonts");
    expect(storefrontLayout).toContain("storefrontFontVariablesClass");
    expect(storefrontLayout).toContain("@/lib/theme-contrast");
  });

  it("normalizes unknown presets safely and recommends themes by category", () => {
    expect(normalizeStorefrontThemePreset("ktm-bold")).toBe("ktm-bold");
    expect(normalizeStorefrontThemePreset("unknown-theme")).toBe("editorial-warm");
    expect(normalizeStorefrontThemePreset(null)).toBe("editorial-warm");

    expect(getStorefrontTheme("pahadi-sage").displayName).toBe("Pahadi Sage");
    expect(recommendStorefrontThemeId("Specialty Coffee & Tea")).toBe("editorial-warm");
    expect(recommendStorefrontThemeId("Organic Honey, Herbs & Spices")).toBe("pahadi-sage");
    expect(recommendStorefrontThemeId("Nepali Streetwear & Fashion")).toBe("ktm-bold");
    expect(recommendStorefrontThemeId("Electronics & Tech Accessories")).toBe("midnight-obsidian");
  });

  it("wires CSS-driven structural switches via data-store-theme without forked component trees", () => {
    const globalsCss = fs.readFileSync(
      path.join(FRONTEND_ROOT, "src", "app", "globals.css"),
      "utf-8"
    );

    // 1. Product card aspect ratios + control/card radii per theme
    for (const theme of STOREFRONT_THEMES) {
      const [w, h] = theme.structural.productCardAspect.split("/");
      const block = parseCssThemeBlock(globalsCss, theme.id);
      const aspectVar = getCssVar(block, "--product-card-aspect");
      expect(aspectVar.replace(/\s+/g, "")).toBe(`${w}/${h}`);
      expect(getCssVar(block, "--radius-control")).toBe(theme.radius.control);
      expect(getCssVar(block, "--radius-card")).toBe(theme.radius.card);
    }

    // 2. Centered header alignment + distinct desktop hero compositions + section chrome in globals.css
    expect(globalsCss).toContain('[data-store-theme="pahadi-sage"] .sf-header-inner');
    expect(globalsCss).toContain('[data-store-theme="midnight-obsidian"] .sf-header-inner');
    expect(globalsCss).toContain('[data-store-theme="pahadi-sage"] .sf-hero-grid');
    expect(globalsCss).toContain('[data-store-theme="ktm-bold"] .sf-hero-grid');
    expect(globalsCss).toContain('[data-store-theme="midnight-obsidian"] .sf-hero-media');
    expect(globalsCss).toContain('[data-store-theme="editorial-warm"] #collection-section > .grid');
    expect(globalsCss).toContain('[data-store-theme="ktm-bold"] #collection-section > .grid > *::after');
    expect(globalsCss).toContain('[data-store-theme="midnight-obsidian"] #collection-section > .grid');
    expect(globalsCss).toContain(":is(:lang(ne), :lang(hi), :lang(mai), :lang(sa))");
    expect(globalsCss).toContain("prefers-reduced-motion: reduce");
    expect(globalsCss).not.toMatch(/box-shadow\s*:/);
    expect(globalsCss).not.toMatch(/(linear|radial|conic)-gradient\s*\(/);
    expect(globalsCss).toContain(".sf-product-media");

    // 3. Shared storefront components attach CSS hook classes without branching on themePreset
    const headerSrc = fs.readFileSync(
      path.join(FRONTEND_ROOT, "src", "components", "storefront", "StorefrontHeader.tsx"),
      "utf-8"
    );
    expect(headerSrc).toContain("sf-header-inner");
    expect(headerSrc).toContain("sf-header-brand");
    expect(headerSrc).toContain("sf-header-nav");
    expect(headerSrc).toContain("sf-header-actions");

    const catalogSrc = fs.readFileSync(
      path.join(FRONTEND_ROOT, "src", "components", "storefront", "StorefrontCatalogView.tsx"),
      "utf-8"
    );
    expect(catalogSrc).toContain("sf-hero-grid");
    expect(catalogSrc).toContain("sf-hero-copy");
    expect(catalogSrc).toContain("sf-hero-media");
    expect(catalogSrc).toContain("sf-hero-frame");

    const gridSrc = fs.readFileSync(
      path.join(FRONTEND_ROOT, "src", "components", "storefront", "ProductGrid.tsx"),
      "utf-8"
    );
    expect(gridSrc).toContain("sf-card-radius");
    expect(gridSrc).toContain("sf-product-media");

    // 4. Lightweight wizard Step 2 previews render swatches, font stacks, store name, Best for line, no iframes
    const wizardSrc = fs.readFileSync(
      path.join(FRONTEND_ROOT, "src", "app", "(platform)", "merchant", "new", "page.tsx"),
      "utf-8"
    );
    expect(wizardSrc).toContain("theme.fontPairing.displayCssStack");
    expect(wizardSrc).toContain("Best for:");
    expect(wizardSrc).toContain("theme.tokens.canvas");
    expect(wizardSrc).toContain("theme.structural.productCardAspect");
    expect(wizardSrc).not.toContain("<iframe");
  });
});
