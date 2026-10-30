"use client";

import React, { useState } from "react";
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
];

interface SettingsFormProps {
  storeSlug: string;
  initialSettings: MerchantStoreSettings;
  onSaved?: (updated: MerchantStoreSettings) => void;
}

export function SettingsForm({ storeSlug, initialSettings, onSaved }: SettingsFormProps) {
  const [name, setName] = useState(initialSettings.name || "");
  const [tagline, setTagline] = useState(initialSettings.tagline || "");
  const [contactPhone, setContactPhone] = useState(initialSettings.contact_phone || "");
  const [themePreset, setThemePreset] = useState(initialSettings.theme_preset || "editorial-warm");

  // Shipping rates in Rupees (integers)
  const [insideValleyRs, setInsideValleyRs] = useState(
    Math.round((initialSettings.inside_valley_shipping_minor || 10000) / 100).toString()
  );
  const [outsideValleyRs, setOutsideValleyRs] = useState(
    Math.round((initialSettings.outside_valley_shipping_minor || 20000) / 100).toString()
  );
  const [freeShippingThresholdRs, setFreeShippingThresholdRs] = useState(
    initialSettings.free_shipping_threshold_minor
      ? Math.round(initialSettings.free_shipping_threshold_minor / 100).toString()
      : ""
  );

  // Khalti configuration
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const insideMinor = Math.max(0, Math.round((parseInt(insideValleyRs, 10) || 0) * 100));
    const outsideMinor = Math.max(0, Math.round((parseInt(outsideValleyRs, 10) || 0) * 100));
    const thresholdTrim = freeShippingThresholdRs.trim();
    const thresholdMinor = thresholdTrim ? Math.max(0, Math.round(parseInt(thresholdTrim, 10) * 100)) : null;

    const payload: MerchantSettingsUpdatePayload = {
      name: name.trim(),
      tagline: tagline.trim(),
      contact_phone: contactPhone.trim(),
      theme_preset: themePreset,
      inside_valley_shipping_minor: insideMinor,
      outside_valley_shipping_minor: outsideMinor,
      free_shipping_threshold_minor: thresholdMinor,
      khalti_mode: khaltiMode,
    };

    if (khaltiSecretKey.trim()) {
      payload.khalti_secret_key = khaltiSecretKey.trim();
    }

    try {
      const updated = await updateMerchantSettings(storeSlug, payload);
      setHasCustomKey(updated.has_custom_khalti_key);
      setMaskedKey(updated.khalti_key_masked);
      setKhaltiSecretKey("");
      setFeedback({ type: "success", message: "Store settings saved successfully." });
      if (onSaved) onSaved(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update store settings";
      setFeedback({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. Identity & Theme */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Store Identity &amp; Branding</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Configure how your store appears to customers arriving from social platforms.
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
            <label htmlFor="store-phone" className="text-xs font-medium text-[var(--foreground)]">
              Contact / WhatsApp Phone
            </label>
            <input
              id="store-phone"
              type="text"
              placeholder="98XXXXXXXX"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="store-tagline" className="text-xs font-medium text-[var(--foreground)]">
            Store Tagline / Bio
          </label>
          <input
            id="store-tagline"
            type="text"
            placeholder="e.g. Specialty single-origin roasts from Gulmi &amp; Ilam."
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
          />
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-xs font-medium text-[var(--foreground)]">
            Storefront Theme Preset
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESETS.map((preset) => {
              const isSelected = themePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setThemePreset(preset.id)}
                  className={`p-3.5 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? "border-[var(--ring)] bg-[var(--secondary)]/80"
                      : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--border)]/80"
                  }`}
                >
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[var(--foreground)]">
                        {preset.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 inline-block shrink-0"
                          style={{ backgroundColor: preset.dotColor }}
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 inline-block shrink-0"
                          style={{ backgroundColor: preset.bgColor }}
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--muted-foreground)] leading-snug">
                      {preset.desc}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded w-fit ${
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

      {/* 2. Delivery Rates */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Delivery Shipping Rates</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Set customer delivery fees calculated automatically at checkout across Nepal.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="valley-shipping" className="text-xs font-medium text-[var(--foreground)]">
              Inside Valley (Kathmandu)
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
            <p className="text-[10px] text-[var(--muted-foreground)]">Standard courier fee</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="outside-shipping" className="text-xs font-medium text-[var(--foreground)]">
              Outside Valley (Outstation)
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
            <p className="text-[10px] text-[var(--muted-foreground)]">Major hubs across provinces</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="free-threshold" className="text-xs font-medium text-[var(--foreground)]">
              Free Delivery Over (Optional)
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
            <p className="text-[10px] text-[var(--muted-foreground)]">Leave empty to charge all orders</p>
          </div>
        </div>
      </section>

      {/* 3. Khalti Gateway */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Khalti Payment Gateway</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Instant digital wallet payments in Nepal. Cash on Delivery is enabled automatically.
          </p>
        </div>

        {/* Status Pill Card */}
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
              ? `Connected secret key: ${maskedKey || "Configured"}. Your customers pay directly into your merchant account.`
              : "ShopCraft includes a shared sandbox gateway out of the box. Shoppers can test the complete Khalti flow immediately without you having to configure merchant credentials. When ready to receive live funds, provide your secret key below."}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--foreground)]">Gateway Environment</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setKhaltiMode("TEST")}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                khaltiMode === "TEST"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)] border-[var(--border)]"
              }`}
            >
              TEST (Sandbox)
            </button>
            <button
              type="button"
              onClick={() => setKhaltiMode("LIVE")}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                khaltiMode === "LIVE"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)] border-[var(--border)]"
              }`}
            >
              LIVE (Production)
            </button>
          </div>
        </div>

        {/* Secret Key Input */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="khalti-key" className="text-xs font-medium text-[var(--foreground)]">
              Khalti Merchant Secret Key
            </label>
            <a
              href="https://admin.khalti.com"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline"
            >
              Get keys from admin.khalti.com ↗
            </a>
          </div>

          <div className="relative">
            <input
              id="khalti-key"
              type={showSecretKey ? "text" : "password"}
              placeholder={maskedKey ? `Existing: ${maskedKey}` : "Paste live_secret_key_... or test_secret_key_..."}
              value={khaltiSecretKey}
              onChange={(e) => setKhaltiSecretKey(e.target.value)}
              className="w-full h-9 pl-3 pr-16 rounded border border-[var(--border)] bg-[var(--background)] text-xs font-mono text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
            />
            <button
              type="button"
              onClick={() => setShowSecretKey((p) => !p)}
              className="absolute right-2 top-2 text-[11px] font-mono text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer px-1.5 py-0.5 rounded bg-[var(--secondary)] border border-[var(--border)]"
            >
              {showSecretKey ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-[10px] text-[var(--muted-foreground)]">
            Stored encrypted with AES-256 (Fernet) on the backend. Leave blank to keep existing key.
          </p>
        </div>
      </section>

      {/* Action / Feedback */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {feedback && (
            <p
              className={`text-xs font-medium ${
                feedback.type === "success" ? "text-[var(--st-delivered)]" : "text-[var(--destructive)]"
              }`}
            >
              {feedback.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="h-10 px-5 rounded-md font-medium text-xs bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
        >
          {submitting ? "Saving changes..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
