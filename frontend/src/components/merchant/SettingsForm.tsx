"use client";

import React, { useState } from "react";
import { Banknote, Globe, Lock, ShieldCheck, Truck } from "lucide-react";
import {
  MerchantSettingsUpdatePayload,
  MerchantStoreSettings,
  updateMerchantSettings,
} from "@/lib/api";

const PRESETS = [
  {
    id: "editorial-warm",
    name: "Editorial Warm",
    desc: "Serif headlines, warm paper tones, terracotta accents. Best for coffee, tea, baked goods, artisan pantry.",
    dotColor: "#A3432A",
    bgColor: "#F5F2EB",
  },
  {
    id: "pahadi-sage",
    name: "Pahadi Sage",
    desc: "Soft organic greens, clean serifs, deep pine primary. Best for herbal remedies, honey, organic skincare.",
    dotColor: "#1F6F4A",
    bgColor: "#F3F7F4",
  },
  {
    id: "ktm-bold",
    name: "KTM Bold",
    desc: "Space Grotesk typography, sharp 4px corners, electric blue primary. Best for streetwear, tech, sneakers.",
    dotColor: "#2B3BFF",
    bgColor: "#F4F4F0",
  },
  {
    id: "midnight-obsidian",
    name: "Midnight Obsidian (Dark)",
    desc: "Deep obsidian canvas, warm marigold accent, emerald badges. Best for premium night brands, electronics & spirits.",
    dotColor: "#F59E0B",
    bgColor: "#0B0D11",
  },
];

const NEPAL_PROVINCES = [
  "Bagmati Province",
  "Gandaki Province",
  "Koshi Province",
  "Lumbini Province",
  "Madhesh Province",
  "Karnali Province",
  "Sudurpashchim Province",
];

export type SettingsSectionFilter = "general" | "payments" | "shipping";

interface SettingsFormProps {
  storeSlug: string;
  initialSettings: MerchantStoreSettings;
  section?: SettingsSectionFilter;
  onSaved?: (updated: MerchantStoreSettings) => void;
}

export function SettingsForm({
  storeSlug,
  initialSettings,
  section = "general",
  onSaved,
}: SettingsFormProps) {
  const isOwner = (initialSettings.member_role || "OWNER") === "OWNER";

  // 1. Identity & Story
  const [name, setName] = useState(initialSettings.name || "");
  const [tagline, setTagline] = useState(initialSettings.tagline || "");
  const [city, setCity] = useState(initialSettings.city || "Kathmandu");
  const [province, setProvince] = useState(initialSettings.province || "Bagmati Province");
  const [storyHeadline, setStoryHeadline] = useState(initialSettings.story_headline || "");
  const [aboutText, setAboutText] = useState(initialSettings.about_text || "");
  const [logoUrl, setLogoUrl] = useState(initialSettings.logo_url || "");
  const [bannerUrl, setBannerUrl] = useState(initialSettings.banner_url || "");

  // 2. Contact & Socials
  const [contactPhone, setContactPhone] = useState(initialSettings.contact_phone || "");
  const [contactEmail, setContactEmail] = useState(
    initialSettings.support_email || initialSettings.contact_email || ""
  );
  const [address, setAddress] = useState(initialSettings.address || "");
  const [instagramUrl, setInstagramUrl] = useState(initialSettings.instagram_url || "");
  const [facebookUrl, setFacebookUrl] = useState(initialSettings.facebook_url || "");

  // 3. Theme Preset
  const [themePreset, setThemePreset] = useState(
    initialSettings.theme_preset || "editorial-warm"
  );

  // 4. Shipping & Custom Domain
  const [insideValleyRs, setInsideValleyRs] = useState(
    Math.round((initialSettings.inside_valley_shipping_minor ?? 10000) / 100).toString()
  );
  const [outsideValleyRs, setOutsideValleyRs] = useState(
    Math.round((initialSettings.outside_valley_shipping_minor ?? 20000) / 100).toString()
  );
  const [freeShippingThresholdRs, setFreeShippingThresholdRs] = useState(
    initialSettings.free_shipping_threshold_minor
      ? Math.round(initialSettings.free_shipping_threshold_minor / 100).toString()
      : ""
  );
  const [customDomain, setCustomDomain] = useState(initialSettings.custom_domain || "");

  // 5. COD & Khalti configuration
  const [codEnabled, setCodEnabled] = useState(initialSettings.cod_enabled !== false);
  const [khaltiMode, setKhaltiMode] = useState<"TEST" | "LIVE">(
    initialSettings.khalti_mode || "TEST"
  );
  const [khaltiSecretKey, setKhaltiSecretKey] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(initialSettings.has_custom_khalti_key);
  const [maskedKey, setMaskedKey] = useState(initialSettings.khalti_key_masked || "");

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const handleClearKhaltiKey = async () => {
    if (!isOwner) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const updated = await updateMerchantSettings(storeSlug, {
        clear_khalti_secret_key: true,
        khalti_mode: "TEST",
      });
      setHasCustomKey(updated.has_custom_khalti_key);
      setMaskedKey(updated.khalti_key_masked);
      setKhaltiMode(updated.khalti_mode);
      setKhaltiSecretKey("");
      setFeedback({
        type: "success",
        message: "Custom Khalti key cleared. Store reverted to Platform Sandbox.",
      });
      if (onSaved) onSaved(updated);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to clear Khalti key.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const insideMinor = Math.max(0, Math.round((parseInt(insideValleyRs, 10) || 0) * 100));
    const outsideMinor = Math.max(0, Math.round((parseInt(outsideValleyRs, 10) || 0) * 100));
    const thresholdTrim = freeShippingThresholdRs.trim();
    const thresholdMinor = thresholdTrim
      ? Math.max(0, Math.round(parseInt(thresholdTrim, 10) * 100))
      : null;

    const payload: MerchantSettingsUpdatePayload = {
      name: name.trim(),
      tagline: tagline.trim(),
      city: city.trim(),
      province,
      story_headline: storyHeadline.trim(),
      about_text: aboutText.trim(),
      logo_url: logoUrl.trim(),
      banner_url: bannerUrl.trim(),
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
      support_email: contactEmail.trim(),
      address: address.trim(),
      instagram_url: instagramUrl.trim(),
      facebook_url: facebookUrl.trim(),
      theme_preset: themePreset,
      inside_valley_shipping_minor: insideMinor,
      outside_valley_shipping_minor: outsideMinor,
      free_shipping_threshold_minor: thresholdMinor,
      cod_enabled: codEnabled,
    };

    if (isOwner) {
      payload.khalti_mode = khaltiMode;
      payload.custom_domain = customDomain.trim().toLowerCase();
      if (khaltiSecretKey.trim()) {
        payload.khalti_secret_key = khaltiSecretKey.trim();
      }
    }

    try {
      const updated = await updateMerchantSettings(storeSlug, payload);
      setHasCustomKey(updated.has_custom_khalti_key);
      setMaskedKey(updated.khalti_key_masked);
      setCustomDomain(updated.custom_domain || "");
      setCodEnabled(updated.cod_enabled !== false);
      setKhaltiSecretKey("");
      setFeedback({ type: "success", message: "Store settings saved and audited." });
      if (onSaved) onSaved(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update store settings";
      setFeedback({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* SECTION A: GENERAL & STORY */}
      {section === "general" && (
        <>
          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Store Identity &amp; Nepal Location
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Configure your brand name, dispatch city, and visual assets shown across your
                storefront.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="store-name" className="text-xs font-medium text-[var(--foreground)]">
                  Store Name
                </label>
                <input
                  id="store-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="store-tagline"
                  className="text-xs font-medium text-[var(--foreground)]"
                >
                  Store Tagline (Short Pitch)
                </label>
                <input
                  id="store-tagline"
                  type="text"
                  placeholder="e.g. Small-batch specialty Arabica roasted in Lalitpur"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="store-city" className="text-xs font-medium text-[var(--foreground)]">
                  Primary Dispatch City
                </label>
                <input
                  id="store-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="store-province"
                  className="text-xs font-medium text-[var(--foreground)]"
                >
                  Province
                </label>
                <select
                  id="store-province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                >
                  {NEPAL_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="store-logo" className="text-xs font-medium text-[var(--foreground)]">
                  Logo Image URL (Optional)
                </label>
                <input
                  id="store-logo"
                  type="text"
                  placeholder="/uploads/stores/..."
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="store-banner"
                  className="text-xs font-medium text-[var(--foreground)]"
                >
                  Banner / Hero Cover URL (Optional)
                </label>
                <input
                  id="store-banner"
                  type="text"
                  placeholder="/uploads/stores/..."
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
              </div>
            </div>

            {/* Theme Preset */}
            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <label className="text-xs font-medium text-[var(--foreground)]">
                Storefront Theme Preset
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PRESETS.map((preset) => {
                  const isSelected = themePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setThemePreset(preset.id)}
                      className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? "border-[var(--ring)] bg-[var(--secondary)]/80"
                          : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--border)]/80"
                      }`}
                    >
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-[var(--foreground)]">
                            {preset.name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block shrink-0"
                              style={{ backgroundColor: preset.dotColor }}
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block shrink-0"
                              style={{ backgroundColor: preset.bgColor }}
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-[var(--muted-foreground)] leading-snug line-clamp-2">
                          {preset.desc}
                        </p>
                      </div>

                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded w-fit ${
                          isSelected
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                        }`}
                      >
                        {isSelected ? "Selected" : "Choose"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Store Story &amp; About Page
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Powers your `/s/{storeSlug}/about` narrative page. Share your craft, sourcing, or
                founder origin.
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="story-headline"
                className="text-xs font-medium text-[var(--foreground)]"
              >
                Story Headline / Philosophy
              </label>
              <input
                id="story-headline"
                type="text"
                placeholder="e.g. Direct-trade Gulmi & Nuwakot beans roasted every Tuesday."
                value={storyHeadline}
                onChange={(e) => setStoryHeadline(e.target.value)}
                className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="about-text" className="text-xs font-medium text-[var(--foreground)]">
                Brand Story &amp; Bio
              </label>
              <textarea
                id="about-text"
                rows={4}
                placeholder="Tell shoppers how your products are sourced, crafted, and packed in Nepal..."
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                className="w-full p-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs leading-relaxed text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] resize-y"
              />
            </div>
          </section>

          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Contact &amp; Social Channels
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Displayed in your storefront footer and WhatsApp customer support links.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="store-phone"
                  className="text-xs font-medium text-[var(--foreground)]"
                >
                  WhatsApp / Support Mobile
                </label>
                <input
                  id="store-phone"
                  type="text"
                  placeholder="98XXXXXXXX"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs font-mono text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="store-email"
                  className="text-xs font-medium text-[var(--foreground)]"
                >
                  Support Email
                </label>
                <input
                  id="store-email"
                  type="email"
                  placeholder="hello@yourstore.com.np"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="store-address"
                className="text-xs font-medium text-[var(--foreground)]"
              >
                Workshop / Pickup Address
              </label>
              <input
                id="store-address"
                type="text"
                placeholder="e.g. Jhamsikhel, Ward 3, Lalitpur"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="instagram-url"
                  className="text-xs font-medium text-[var(--foreground)]"
                >
                  Instagram URL
                </label>
                <input
                  id="instagram-url"
                  type="url"
                  placeholder="https://instagram.com/yourhandle"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="facebook-url"
                  className="text-xs font-medium text-[var(--foreground)]"
                >
                  Facebook URL
                </label>
                <input
                  id="facebook-url"
                  type="url"
                  placeholder="https://facebook.com/yourpage"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
              </div>
            </div>
          </section>
        </>
      )}

      {/* SECTION B: PAYMENTS & COD */}
      {section === "payments" && (
        <>
          {/* Cash on Delivery Toggle Card */}
          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-semibold text-[var(--foreground)]">
                    Cash on Delivery (COD)
                  </h2>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] max-w-xl leading-relaxed">
                  Allow shoppers across Nepal to pay integer Rs. cash to the courier rider on
                  delivery.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={codEnabled}
                onClick={() => setCodEnabled((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer ${
                  codEnabled ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ${
                    codEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="p-3 rounded-md border border-[var(--border)] bg-[var(--secondary)]/50 flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--muted-foreground)]">Current COD Checkout Status:</span>
              <span
                className={`font-bold ${
                  codEnabled
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {codEnabled ? "ENABLED ON CHECKOUT" : "DISABLED — KHALTI ONLY"}
              </span>
            </div>
          </section>

          {/* Khalti Gateway Card */}
          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Khalti ePayment v2 Credentials</span>
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Encrypted at rest with Fernet AES-256. Raw secret keys are never returned to the
                  browser.
                </p>
              </div>

              {!isOwner && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--border)] bg-[var(--secondary)] text-[11px] font-mono text-[var(--muted-foreground)]">
                  <Lock className="w-3 h-3" />
                  <span>Owner Only</span>
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{
                      backgroundColor: hasCustomKey ? "var(--st-delivered)" : "var(--st-new)",
                    }}
                  />
                  <span className="text-xs font-semibold text-[var(--foreground)]">
                    {hasCustomKey
                      ? khaltiMode === "LIVE"
                        ? "Live Merchant Key Connected"
                        : "Custom Test Key Connected"
                      : "Platform Sandbox Active (Ready for Test Orders)"}
                  </span>
                </div>

                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)]">
                  {khaltiMode} MODE
                </span>
              </div>

              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                {hasCustomKey
                  ? `Connected secret key: ${
                      maskedKey || "Configured"
                    }. Settlements deposit directly to your Khalti merchant account.`
                  : "ShopCraft provides a zero-config sandbox out of the box so shoppers can test Khalti checkout immediately."}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground)]">
                Gateway Environment
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!isOwner}
                  onClick={() => setKhaltiMode("TEST")}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer disabled:opacity-50 ${
                    khaltiMode === "TEST"
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                      : "bg-[var(--secondary)] text-[var(--muted-foreground)] border-[var(--border)]"
                  }`}
                >
                  TEST (Sandbox)
                </button>
                <button
                  type="button"
                  disabled={!isOwner}
                  onClick={() => setKhaltiMode("LIVE")}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer disabled:opacity-50 ${
                    khaltiMode === "LIVE"
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                      : "bg-[var(--secondary)] text-[var(--muted-foreground)] border-[var(--border)]"
                  }`}
                >
                  LIVE (Production)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="khalti-key" className="text-xs font-medium text-[var(--foreground)]">
                  Khalti Merchant Secret Key
                </label>
                <div className="flex items-center gap-3">
                  {hasCustomKey && isOwner && (
                    <button
                      type="button"
                      onClick={handleClearKhaltiKey}
                      className="text-[11px] font-mono text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                    >
                      Clear Custom Key
                    </button>
                  )}
                  <a
                    href="https://admin.khalti.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline"
                  >
                    admin.khalti.com ↗
                  </a>
                </div>
              </div>

              <div className="relative">
                <input
                  id="khalti-key"
                  disabled={!isOwner}
                  type={showSecretKey ? "text" : "password"}
                  placeholder={
                    !isOwner
                      ? "Restricted to store owners"
                      : maskedKey
                      ? `Existing: ${maskedKey} (enter new key to rotate)`
                      : "Paste live_secret_key_... or test_secret_key_..."
                  }
                  value={khaltiSecretKey}
                  onChange={(e) => setKhaltiSecretKey(e.target.value)}
                  className="w-full h-9 pl-3 pr-16 rounded border border-[var(--border)] bg-[var(--background)] text-xs font-mono text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-60"
                />
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setShowSecretKey((p) => !p)}
                    className="absolute right-2 top-1.5 text-[11px] font-mono text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer px-1.5 py-0.5 rounded bg-[var(--secondary)] border border-[var(--border)]"
                  >
                    {showSecretKey ? "Hide" : "Show"}
                  </button>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* SECTION C: SHIPPING & CUSTOM DOMAINS */}
      {section === "shipping" && (
        <>
          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-500" />
              <div>
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                  Nepal Delivery Zones &amp; Free Threshold
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Calculated automatically at checkout based on Kathmandu Valley vs. Outstation
                  districts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="valley-shipping"
                  className="text-xs font-medium text-[var(--foreground)]"
                >
                  Inside Kathmandu Valley
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-[var(--muted-foreground)]">
                    Rs.
                  </span>
                  <input
                    id="valley-shipping"
                    type="number"
                    min="0"
                    step="5"
                    required
                    value={insideValleyRs}
                    onChange={(e) => setInsideValleyRs(e.target.value)}
                    className="w-full h-9 pl-10 pr-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs font-mono tabular-nums text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                  />
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Kathmandu, Lalitpur &amp; Bhaktapur
                </p>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="outside-shipping"
                  className="text-xs font-medium text-[var(--foreground)]"
                >
                  Outside Valley (7 Provinces)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-[var(--muted-foreground)]">
                    Rs.
                  </span>
                  <input
                    id="outside-shipping"
                    type="number"
                    min="0"
                    step="5"
                    required
                    value={outsideValleyRs}
                    onChange={(e) => setOutsideValleyRs(e.target.value)}
                    className="w-full h-9 pl-10 pr-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs font-mono tabular-nums text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                  />
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Pokhara, Chitwan, Biratnagar, Butwal, etc.
                </p>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="free-threshold"
                  className="text-xs font-medium text-[var(--foreground)]"
                >
                  Free Delivery Threshold
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-[var(--muted-foreground)]">
                    Rs.
                  </span>
                  <input
                    id="free-threshold"
                    type="number"
                    min="0"
                    step="50"
                    placeholder="e.g. 1500"
                    value={freeShippingThresholdRs}
                    onChange={(e) => setFreeShippingThresholdRs(e.target.value)}
                    className="w-full h-9 pl-10 pr-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs font-mono tabular-nums text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                  />
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Leave empty to charge delivery on all carts
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <div>
                  <h2 className="text-sm font-semibold text-[var(--foreground)]">
                    Custom Domain &amp; Nepal `.com.np` Routing
                  </h2>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Connect your free Mercantile `.com.np` domain or `.com` storefront hostname.
                  </p>
                </div>
              </div>
              {!isOwner && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--secondary)] text-[10px] font-mono text-[var(--muted-foreground)]">
                  <Lock className="w-3 h-3" />
                  <span>Owner Only</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--foreground)]">
                  Default ShopCraft Path
                </label>
                <div className="h-9 px-3 rounded border border-[var(--border)] bg-[var(--secondary)] flex items-center text-xs font-mono text-[var(--foreground)]">
                  shopcraft.com.np/s/{storeSlug}
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="custom-domain"
                  className="text-xs font-medium text-[var(--foreground)]"
                >
                  Custom Domain (Optional)
                </label>
                <input
                  id="custom-domain"
                  type="text"
                  disabled={!isOwner}
                  placeholder={`shop.${storeSlug}.com.np`}
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs font-mono text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-60"
                />
              </div>
            </div>

            <div className="p-3 rounded-md border border-[var(--border)] bg-[var(--secondary)]/50 text-[11px] font-mono text-[var(--muted-foreground)] space-y-1">
              <p className="font-semibold text-[var(--foreground)]">
                DNS CNAME Record Instructions (Mercantile register.com.np / Cloudflare):
              </p>
              <p>
                Type: <span className="text-[var(--foreground)]">CNAME</span> · Host:{" "}
                <span className="text-[var(--foreground)]">shop</span> (or{" "}
                <span className="text-[var(--foreground)]">www</span>) · Target:{" "}
                <span className="text-[var(--foreground)]">cname.shopcraft.com.np</span>
              </p>
            </div>
          </section>
        </>
      )}

      {/* Save Footer */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {feedback && (
            <p
              className={`text-xs font-medium ${
                feedback.type === "success"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {feedback.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="h-9 px-5 rounded-md font-semibold text-xs bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
        >
          {submitting ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
