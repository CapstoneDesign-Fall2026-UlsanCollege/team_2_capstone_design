import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  calculateContrastRatio,
  isValidStorefrontThemePreset,
  normalizeStorefrontThemePreset,
  resolveSafeAccentOverride,
  STOREFRONT_PRESET_TOKENS,
  VALID_STOREFRONT_THEME_PRESETS,
} from "./theme-contrast";
import {
  scanConsoleLine,
  scanStorefrontLine,
} from "../../scripts/check-surfaces.mjs";

function parseThemeBlocksFromGlobalsCss(): Record<string, Record<string, string>> {
  const globalsPath = path.resolve(__dirname, "../app/globals.css");
  const css = fs.readFileSync(globalsPath, "utf-8");
  const blocks: Record<string, Record<string, string>> = {};

  const blockRegex =
    /\[data-store-theme="([^"]+)"\][^{]*\{([\s\S]*?)\}/g;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(css)) !== null) {
    const themeId = match[1];
    const body = match[2];
    const vars: Record<string, string> = {};
    const varRegex = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
    let varMatch: RegExpExecArray | null;
    while ((varMatch = varRegex.exec(body)) !== null) {
      vars[varMatch[1]] = varMatch[2].trim();
    }
    blocks[themeId] = vars;
  }
  return blocks;
}

const REQUIRED_COLOR_VARS = [
  "--canvas",
  "--surface",
  "--border",
  "--ink",
  "--ink-2",
  "--primary",
  "--primary-hover",
  "--primary-foreground",
  "--status-success-bg",
  "--status-success-fg",
  "--status-success-border",
  "--status-warning-bg",
  "--status-warning-fg",
  "--status-warning-border",
  "--status-error-bg",
  "--status-error-fg",
  "--status-error-border",
] as const;

describe("storefront theme contrast and token integrity (Phase A)", () => {
  const cssBlocks = parseThemeBlocksFromGlobalsCss();

  it("defines all 4 preset themes in both globals.css and STOREFRONT_PRESET_TOKENS", () => {
    for (const presetId of VALID_STOREFRONT_THEME_PRESETS) {
      expect(cssBlocks[presetId]).toBeDefined();
      expect(STOREFRONT_PRESET_TOKENS[presetId]).toBeDefined();

      for (const cssVar of REQUIRED_COLOR_VARS) {
        expect(cssBlocks[presetId][cssVar], `${presetId} missing ${cssVar}`).toMatch(
          /^#[0-9a-fA-F]{6}$/
        );
      }
    }
  });

  it("keeps globals.css preset tokens synchronized with STOREFRONT_PRESET_TOKENS", () => {
    for (const presetId of VALID_STOREFRONT_THEME_PRESETS) {
      const cssVars = cssBlocks[presetId];
      const fixture = STOREFRONT_PRESET_TOKENS[presetId];

      expect(cssVars["--canvas"].toUpperCase()).toBe(fixture.canvas.toUpperCase());
      expect(cssVars["--surface"].toUpperCase()).toBe(fixture.surface.toUpperCase());
      expect(cssVars["--border"].toUpperCase()).toBe(fixture.border.toUpperCase());
      expect(cssVars["--ink"].toUpperCase()).toBe(fixture.ink.toUpperCase());
      expect(cssVars["--ink-2"].toUpperCase()).toBe(fixture.ink2.toUpperCase());
      expect(cssVars["--primary"].toUpperCase()).toBe(fixture.primary.toUpperCase());
      expect(cssVars["--primary-hover"].toUpperCase()).toBe(fixture.primaryHover.toUpperCase());
      expect(cssVars["--primary-foreground"].toUpperCase()).toBe(
        fixture.primaryForeground.toUpperCase()
      );
      expect(cssVars["--status-success-bg"].toUpperCase()).toBe(
        fixture.statusSuccessBg.toUpperCase()
      );
      expect(cssVars["--status-success-fg"].toUpperCase()).toBe(
        fixture.statusSuccessFg.toUpperCase()
      );
      expect(cssVars["--status-success-border"].toUpperCase()).toBe(
        fixture.statusSuccessBorder.toUpperCase()
      );
      expect(cssVars["--status-warning-bg"].toUpperCase()).toBe(
        fixture.statusWarningBg.toUpperCase()
      );
      expect(cssVars["--status-warning-fg"].toUpperCase()).toBe(
        fixture.statusWarningFg.toUpperCase()
      );
      expect(cssVars["--status-warning-border"].toUpperCase()).toBe(
        fixture.statusWarningBorder.toUpperCase()
      );
      expect(cssVars["--status-error-bg"].toUpperCase()).toBe(
        fixture.statusErrorBg.toUpperCase()
      );
      expect(cssVars["--status-error-fg"].toUpperCase()).toBe(
        fixture.statusErrorFg.toUpperCase()
      );
      expect(cssVars["--status-error-border"].toUpperCase()).toBe(
        fixture.statusErrorBorder.toUpperCase()
      );
    }
  });

  it("passes WCAG AA contrast checks for text, buttons, borders, and status tokens on every theme", () => {
    for (const presetId of VALID_STOREFRONT_THEME_PRESETS) {
      const vars = cssBlocks[presetId];

      // Main text & secondary text against canvas and surface (>= 4.5:1)
      expect(
        calculateContrastRatio(vars["--ink"], vars["--canvas"]),
        `${presetId} ink/canvas`
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        calculateContrastRatio(vars["--ink"], vars["--surface"]),
        `${presetId} ink/surface`
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        calculateContrastRatio(vars["--ink-2"], vars["--canvas"]),
        `${presetId} ink-2/canvas`
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        calculateContrastRatio(vars["--ink-2"], vars["--surface"]),
        `${presetId} ink-2/surface`
      ).toBeGreaterThanOrEqual(4.5);

      // Primary CTA & hover text contrast (>= 4.5:1)
      expect(
        calculateContrastRatio(vars["--primary-foreground"], vars["--primary"]),
        `${presetId} primaryFg/primary`
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        calculateContrastRatio(vars["--primary-foreground"], vars["--primary-hover"]),
        `${presetId} primaryFg/primaryHover`
      ).toBeGreaterThanOrEqual(4.5);

      // Important UI border contrast (>= 3.0:1)
      expect(
        calculateContrastRatio(vars["--border"], vars["--canvas"]),
        `${presetId} border/canvas`
      ).toBeGreaterThanOrEqual(3.0);
      expect(
        calculateContrastRatio(vars["--border"], vars["--surface"]),
        `${presetId} border/surface`
      ).toBeGreaterThanOrEqual(3.0);

      // Semantic status tokens (>= 4.5:1 fg/bg and >= 3.0:1 border/bg)
      expect(
        calculateContrastRatio(vars["--status-success-fg"], vars["--status-success-bg"]),
        `${presetId} success fg/bg`
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        calculateContrastRatio(vars["--status-success-border"], vars["--status-success-bg"]),
        `${presetId} success border/bg`
      ).toBeGreaterThanOrEqual(3.0);

      expect(
        calculateContrastRatio(vars["--status-warning-fg"], vars["--status-warning-bg"]),
        `${presetId} warning fg/bg`
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        calculateContrastRatio(vars["--status-warning-border"], vars["--status-warning-bg"]),
        `${presetId} warning border/bg`
      ).toBeGreaterThanOrEqual(3.0);

      expect(
        calculateContrastRatio(vars["--status-error-fg"], vars["--status-error-bg"]),
        `${presetId} error fg/bg`
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        calculateContrastRatio(vars["--status-error-border"], vars["--status-error-bg"]),
        `${presetId} error border/bg`
      ).toBeGreaterThanOrEqual(3.0);
    }
  });

  it("validates preset names and falls back safely for unknown values", () => {
    expect(isValidStorefrontThemePreset("midnight-obsidian")).toBe(true);
    expect(isValidStorefrontThemePreset("minimal-slate")).toBe(false);
    expect(normalizeStorefrontThemePreset("ktm-bold")).toBe("ktm-bold");
    expect(normalizeStorefrontThemePreset("unknown-theme")).toBe("editorial-warm");
    expect(normalizeStorefrontThemePreset(undefined)).toBe("editorial-warm");
  });

  it("enforces contrast and forbidden-hue checks on optional merchant accent overrides", () => {
    // Rejects invalid, forbidden status hues, and low-contrast colors
    expect(resolveSafeAccentOverride("", "editorial-warm")).toBeNull();
    expect(resolveSafeAccentOverride("not-hex", "editorial-warm")).toBeNull();
    expect(resolveSafeAccentOverride("#DC2626", "editorial-warm")).toBeNull(); // Red
    expect(resolveSafeAccentOverride("#D97706", "editorial-warm")).toBeNull(); // Amber
    expect(resolveSafeAccentOverride("#16A34A", "pahadi-sage")).toBeNull(); // Green
    expect(resolveSafeAccentOverride("#9CA3AF", "editorial-warm")).toBeNull(); // Fails contrast
    expect(resolveSafeAccentOverride("#18181B", "midnight-obsidian")).toBeNull(); // Dark on dark
    expect(resolveSafeAccentOverride("#F8FAFC", "editorial-warm")).toBeNull(); // Light on light

    // Accepts safe accessible accents with computed foreground
    expect(resolveSafeAccentOverride("#1D4ED8", "editorial-warm")).toEqual({
      primary: "#1D4ED8",
      primaryHover: "#1D4ED8",
      primaryForeground: "#FFFFFF",
    });
    expect(resolveSafeAccentOverride("#60A5FA", "midnight-obsidian")).toEqual({
      primary: "#60A5FA",
      primaryHover: "#60A5FA",
      primaryForeground: "#0B0D11",
    });
  });

  it("check-surfaces scanner flags raw hex, color functions, and hardcoded Tailwind palettes", () => {
    expect(scanStorefrontLine('<div className="bg-[#fff]">')).toContain("STOREFRONT HEX");
    expect(scanStorefrontLine('<div style={{ color: "rgb(0, 0, 0)" }}>')).toContain(
      "STOREFRONT COLOR FUNCTION"
    );
    expect(scanStorefrontLine('<div style={{ color: "hsl(0, 0%, 100%)" }}>')).toContain(
      "STOREFRONT COLOR FUNCTION"
    );
    expect(scanStorefrontLine('<a className="bg-emerald-700 text-white">')).toContain(
      "STOREFRONT HARDCODED PALETTE UTILITY"
    );
    expect(scanStorefrontLine('<div className="bg-black/50 text-blue-800 border-gray-200">')).toContain(
      "STOREFRONT HARDCODED PALETTE UTILITY"
    );
    expect(
      scanStorefrontLine(
        '<button className="bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--border)] bg-[var(--overlay-scrim)]">'
      )
    ).toEqual([]);
    expect(scanConsoleLine('<div className="bg-sf-canvas">--sf-cta</div>')).toEqual([
      "CONSOLE SF-TOKEN",
    ]);
  });
});
