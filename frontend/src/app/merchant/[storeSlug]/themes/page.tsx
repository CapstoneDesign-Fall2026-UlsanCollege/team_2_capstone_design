"use client";

import React, { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Palette,
  Eye,
  Smartphone,
  Monitor,
  Check,
  Save,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  fetchMerchantSettings,
  updateMerchantSettings,
  MerchantStoreSettings,
} from "@/lib/api";

interface PageProps {
  params: Promise<{ storeSlug: string }>;
}

interface PresetThemeOption {
  id: string;
  name: string;
  niche: string;
  fonts: string;
  canvasHex: string;
  ctaHex: string;
  accentHex: string;
  inkHex: string;
  description: string;
}

const THEME_PRESETS: PresetThemeOption[] = [
  {
    id: "editorial-warm",
    name: "Editorial Warm",
    niche: "Roasteries, Specialty Coffee & Artisanal Food",
    fonts: "Fraunces Serif + Plus Jakarta Sans",
    canvasHex: "#F5F2EB",
    ctaHex: "#A3432A",
    accentHex: "#2E6B34",
    inkHex: "#1A1512",
    description: "Refined editorial typography with warm parchment tones, inspired by artisanal roasteries and slow food.",
  },
  {
    id: "pahadi-sage",
    name: "Pahadi Sage",
    niche: "Mountain Teas, Wild Honey, Botanicals & Crafts",
    fonts: "Young Serif + Manrope",
    canvasHex: "#F3F7F4",
    ctaHex: "#1F6F4A",
    accentHex: "#C2410C",
    inkHex: "#14281D",
    description: "Earthy botanical sage tones designed for organic growers, natural herbs, and Himalayan honey cooperatives.",
  },
  {
    id: "ktm-bold",
    name: "KTM Bold",
    niche: "Kathmandu Streetwear, Apparel & Urban Tech",
    fonts: "Space Grotesk + Inter",
    canvasHex: "#F4F4F0",
    ctaHex: "#2B3BFF",
    accentHex: "#D7FF3A",
    inkHex: "#0B0B0B",
    description: "High-contrast brutalist lines with electric cobalt accents, tailored for contemporary streetwear and tech drops.",
  },
  {
    id: "midnight-obsidian",
    name: "Midnight Obsidian",
    niche: "Luxury Dark Mode, Night Roasts & Leather",
    fonts: "Fraunces Serif + Plus Jakarta Sans",
    canvasHex: "#0B0D11",
    ctaHex: "#F2A900",
    accentHex: "#10B981",
    inkHex: "#F9FAFB",
    description: "Sleek obsidian black luxury aesthetic with warm amber gold highlights for high-ticket artisanal craft.",
  },
];

export default function MerchantThemesPage({ params }: PageProps) {
  const { storeSlug } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState<MerchantStoreSettings | null>(null);
  const [themePreset, setThemePreset] = useState("editorial-warm");
  const [tagline, setTagline] = useState("");
  const [storyHeadline, setStoryHeadline] = useState("");
  const [aboutText, setAboutText] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Preview State
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"theme" | "branding" | "story">("theme");

  useEffect(() => {
    let active = true;
    fetchMerchantSettings(storeSlug)
      .then((data) => {
        if (!active) return;
        setSettings(data);
        setThemePreset(data.theme_preset || "editorial-warm");
        setTagline(data.tagline || "");
        setStoryHeadline(data.story_headline || "");
        setAboutText(data.about_text || "");
        setBannerUrl(data.banner_url || "");
        setLogoUrl(data.logo_url || "");
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load store settings");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [storeSlug]);

  const handleSaveTheme = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const updated = await updateMerchantSettings(storeSlug, {
        theme_preset: themePreset,
        tagline: tagline.trim(),
        story_headline: storyHeadline.trim(),
        about_text: aboutText.trim(),
        banner_url: bannerUrl.trim(),
        logo_url: logoUrl.trim(),
      });
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save theme settings");
    } finally {
      setSaving(false);
    }
  };

  const currentPresetDef = useMemo(
    () => THEME_PRESETS.find((p) => p.id === themePreset) || THEME_PRESETS[0],
    [themePreset]
  );

  const previewUrl = `/s/${encodeURIComponent(storeSlug)}?preview_theme=${encodeURIComponent(themePreset)}`;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-[var(--muted)] animate-pulse rounded" />
        <div className="h-96 bg-[var(--muted)] animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)] flex items-center gap-2">
              <Palette className="w-5 h-5 text-emerald-500" />
              <span>Online Store · Themes</span>
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              {currentPresetDef.name}
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Configure typography pairings, design tokens, brand narrative, and media. Changes are section-driven with zero code forks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/s/${encodeURIComponent(storeSlug)}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] text-xs font-semibold transition-colors"
          >
            <span>View Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleSaveTheme}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Published!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save &amp; Publish</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Polaris Layout: Left Controls + Right Live Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Theme Customization Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sub-tabs */}
          <div className="flex items-center gap-1 p-1 bg-[var(--secondary)]/60 rounded-lg border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setActiveTab("theme")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === "theme"
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Presets &amp; Palette
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("branding")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === "branding"
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Hero &amp; Media
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("story")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === "story"
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Story Page
            </button>
          </div>

          {/* Tab 1: Presets & Palette */}
          {activeTab === "theme" && (
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--foreground)]">
                  Storefront Presets
                </h3>
                <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                  Instant CSS token switch
                </span>
              </div>

              <div className="space-y-2.5">
                {THEME_PRESETS.map((p) => {
                  const isSelected = themePreset === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setThemePreset(p.id)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500"
                          : "border-[var(--border)] bg-[var(--secondary)]/20 hover:border-[var(--border)]/80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                          <span>{p.name}</span>
                        </span>

                        {/* Palette Swatches */}
                        <div className="flex items-center gap-1 bg-white/10 dark:bg-black/20 p-1 rounded border border-[var(--border)]">
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: p.canvasHex }}
                            title="Canvas"
                          />
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: p.ctaHex }}
                            title="CTA Button"
                          />
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: p.accentHex }}
                            title="Accent"
                          />
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: p.inkHex }}
                            title="Ink Text"
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-[var(--muted-foreground)] leading-snug">
                        {p.description}
                      </p>

                      <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-[var(--muted-foreground)] border-t border-[var(--border)]/40">
                        <span>Niche: {p.niche.split(",")[0]}</span>
                        <span className="italic">{p.fonts.split("+")[0].trim()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Hero & Media */}
          {activeTab === "branding" && (
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--foreground)]">
                Hero Banner &amp; Brand Media
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--foreground)] block">
                  Store Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Specialty Himalayan coffee, roasted weekly in Lalitpur."
                  className="w-full h-8 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Displayed below store title in the hero banner and metadata.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--foreground)] block">
                  Hero Cover Image URL
                </label>
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full h-8 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] font-mono focus:outline-none focus:border-[var(--ring)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--foreground)] block">
                  Store Logo URL (Optional)
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full h-8 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] font-mono focus:outline-none focus:border-[var(--ring)]"
                />
              </div>
            </div>
          )}

          {/* Tab 3: Story & About Us */}
          {activeTab === "story" && (
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--foreground)]">
                Our Story &amp; Philosophy
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--foreground)] block">
                  Story Headline
                </label>
                <input
                  type="text"
                  value={storyHeadline}
                  onChange={(e) => setStoryHeadline(e.target.value)}
                  placeholder="e.g. Specialty coffee from the high-altitude hills of Nepal."
                  className="w-full h-8 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--foreground)] block">
                  Brand Philosophy (About Text)
                </label>
                <textarea
                  rows={6}
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  placeholder="Share your origin, roasting methods, ethical sourcing, and mission..."
                  className="w-full p-2.5 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] leading-relaxed focus:outline-none focus:border-[var(--ring)]"
                />
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Powers your customer-facing &quot;/s/{storeSlug}/about&quot; page.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Viewport Preview Frame (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between bg-[var(--card)] p-2 rounded-lg border border-[var(--border)]">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted-foreground)]">
              <Eye className="w-3.5 h-3.5 text-emerald-500" />
              <span>Preview: {currentPresetDef.name}</span>
            </div>

            {/* Viewport Toggles */}
            <div className="flex items-center gap-1 bg-[var(--secondary)] p-0.5 rounded">
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                className={`p-1.5 rounded transition-colors ${
                  viewport === "desktop"
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
                title="Desktop View (1280px)"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewport("mobile")}
                className={`p-1.5 rounded transition-colors ${
                  viewport === "mobile"
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
                title="Mobile View (375px)"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Iframe Viewport Container */}
          <div className="flex justify-center bg-[var(--secondary)]/30 p-3 sm:p-5 rounded-2xl border border-[var(--border)] min-h-[640px] overflow-hidden">
            <div
              className={`transition-all duration-300 overflow-hidden shadow-2xl ${
                viewport === "mobile"
                  ? "w-[375px] h-[667px] rounded-[36px] border-8 border-zinc-900 bg-white"
                  : "w-full h-[620px] rounded-xl border border-[var(--border)] bg-white"
              }`}
            >
              <iframe
                src={previewUrl}
                title="Live Storefront Preview"
                className="w-full h-full border-0 bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
