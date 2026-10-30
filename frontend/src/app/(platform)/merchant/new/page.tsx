"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { checkStoreSlug, createStore, fetchSession, ApiError } from "@/lib/api";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const THEME_OPTIONS = [
  {
    id: "editorial-warm",
    name: "Editorial Warm",
    desc: "Earthy terracotta, warm paper canvas, Fraunces serif display. For coffee, tea, roasters, bakeries, books.",
    accent: "#A3432A",
    canvas: "#F5F2EB",
  },
  {
    id: "pahadi-sage",
    name: "Pahadi Sage",
    desc: "Herbal forest green, warm sage lines, Young Serif display. For organic honey, ayurveda, skincare, teas.",
    accent: "#1F6F4A",
    canvas: "#F3F7F4",
  },
  {
    id: "ktm-bold",
    name: "KTM Bold",
    desc: "High contrast electric blue, stark canvas, Space Grotesk. For streetwear, tech, sneakers, contemporary art.",
    accent: "#2B3BFF",
    canvas: "#F4F4F0",
  },
];

function CreateStoreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialName = searchParams.get("name") || "";

  const [loadingSession, setLoadingSession] = useState(true);
  const [storeName, setStoreName] = useState(initialName || "Pahadi Honey");
  const [customSlug, setCustomSlug] = useState("");
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [tagline, setTagline] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [themePreset, setThemePreset] = useState("pahadi-sage");

  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activeSlug = customSlug || slugify(storeName) || "store";

  // 1. Session check
  useEffect(() => {
    let mounted = true;
    fetchSession()
      .then((session) => {
        if (!mounted) return;
        if (!session.authenticated) {
          const nextTarget = `/merchant/new?name=${encodeURIComponent(storeName)}`;
          setTimeout(() => router.replace(`/login?next=${encodeURIComponent(nextTarget)}`), 0);
          return;
        }
      })
      .catch(() => {
        if (!mounted) return;
        const nextTarget = `/merchant/new?name=${encodeURIComponent(storeName)}`;
        setTimeout(() => router.replace(`/login?next=${encodeURIComponent(nextTarget)}`), 0);
      })
      .finally(() => {
        if (mounted) setLoadingSession(false);
      });

    return () => {
      mounted = false;
    };
  }, [router, storeName]);

  // 2. Debounced slug availability check
  useEffect(() => {
    if (!activeSlug || activeSlug === "store") return;

    let mounted = true;
    const timer = setTimeout(async () => {
      setSlugChecking(true);
      try {
        const res = await checkStoreSlug(activeSlug);
        if (!mounted) return;
        setSlugAvailable(res.available);
        setSlugError(res.available ? null : res.reason || "This URL slug is taken.");
      } catch {
        if (!mounted) return;
        setSlugAvailable(true);
        setSlugError(null);
      } finally {
        if (mounted) setSlugChecking(false);
      }
    }, 400);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [activeSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!storeName.trim()) {
      setFormError("Please enter your store name.");
      return;
    }

    if (!activeSlug || slugAvailable === false) {
      setFormError("Please choose an available URL slug.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createStore({
        name: storeName.trim(),
        slug: activeSlug,
        theme_preset: themePreset,
        tagline: tagline.trim(),
        contact_phone: contactPhone.trim(),
      });

      // Successfully launched! Navigate directly to the merchant console for this store
      router.push(`/merchant/${encodeURIComponent(created.slug)}`);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.fieldErrors) {
        const firstKey = Object.keys(err.fieldErrors)[0];
        if (firstKey) {
          setFormError(`${firstKey}: ${err.fieldErrors[firstKey][0]}`);
          return;
        }
      }
      const msg = err instanceof Error ? err.message : "Unable to launch store. Try again.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-[var(--sc-line,#E8E8E1)] rounded" />
        <div className="h-4 w-96 bg-[var(--sc-line,#E8E8E1)]/60 rounded" />
        <div className="h-64 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-[var(--sc-ink,#111318)]">
      {/* Editorial Header */}
      <div className="space-y-2 mb-8 border-b border-[var(--sc-line,#E8E8E1)] pb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-xs text-[var(--sc-ink-2,#4B5060)]">
          <span className="w-2 h-2 rounded-full bg-[var(--sc-marigold,#F2A900)]" />
          <span>Step 1 of 1 · Store Creation</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Create your ShopCraft store</h1>
        <p className="text-sm text-[var(--sc-ink-2,#4B5060)] max-w-xl">
          Get your shop online with verified Khalti payments, cash on delivery, and instant mobile-first storefronts.
        </p>
      </div>

      {formError && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--sc-danger,#B42318)]/10 border border-[var(--sc-danger,#B42318)] text-[var(--sc-danger,#B42318)] text-xs">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Store Name & Slug */}
        <div className="p-6 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] space-y-4 shadow-xs">
          <div>
            <label
              htmlFor="wizard-name"
              className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1.5"
            >
              1. Store Name *
            </label>
            <input
              id="wizard-name"
              type="text"
              required
              value={storeName}
              onChange={(e) => {
                setStoreName(e.target.value);
                if (!isEditingSlug) setCustomSlug("");
              }}
              placeholder="e.g. Pahadi Honey, Kathmandu Kicks..."
              className="w-full h-12 px-3 text-base font-medium rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-[var(--sc-marigold,#F2A900)] focus:ring-1 focus:ring-[var(--sc-marigold,#F2A900)]"
            />
          </div>

          {/* Slug URL editor */}
          <div className="pt-1 space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--sc-ink-2,#4B5060)]">
              <span className="font-mono">Storefront Web Address</span>
              <button
                type="button"
                onClick={() => setIsEditingSlug(!isEditingSlug)}
                className="text-xs text-[var(--sc-ink-2,#4B5060)] hover:text-[var(--sc-ink,#111318)] underline cursor-pointer"
              >
                {isEditingSlug ? "Auto-generate slug" : "Customize URL"}
              </button>
            </div>

            {isEditingSlug ? (
              <div className="flex items-center gap-1.5 pt-1">
                <span className="font-mono text-xs text-[var(--sc-ink-3,#8B90A0)]">shopcraft.com.np/s/</span>
                <input
                  type="text"
                  value={customSlug || slugify(storeName)}
                  onChange={(e) => setCustomSlug(slugify(e.target.value))}
                  className="flex-1 h-9 px-2 text-xs font-mono rounded border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-paper,#FAFAF7)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-[var(--sc-marigold,#F2A900)]"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded bg-[var(--sc-paper,#FAFAF7)] border border-[var(--sc-line,#E8E8E1)] text-xs font-mono">
                <span className="text-[var(--sc-ink-3,#8B90A0)]">URL:</span>
                <span className="font-semibold text-[var(--sc-ink,#111318)]">
                  shopcraft.com.np/s/{activeSlug}
                </span>
                {slugChecking ? (
                  <span className="text-[var(--sc-ink-3,#8B90A0)] text-[11px] ml-auto">checking...</span>
                ) : slugAvailable ? (
                  <span className="text-[var(--sc-success,#15803D)] font-medium text-[11px] ml-auto">
                    ✓ Available
                  </span>
                ) : slugError ? (
                  <span className="text-[var(--sc-danger,#B42318)] font-medium text-[11px] ml-auto">
                    ✗ {slugError}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="wizard-tagline"
              className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1"
            >
              Short Tagline (Optional)
            </label>
            <input
              id="wizard-tagline"
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Pure raw Himalayan honey harvested from cliff colonies."
              className="w-full h-11 px-3 text-xs rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-[var(--sc-marigold,#F2A900)]"
            />
          </div>

          <div>
            <label
              htmlFor="wizard-phone"
              className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1"
            >
              Customer Support Phone
            </label>
            <input
              id="wizard-phone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="e.g. 9801234567"
              className="w-full h-11 px-3 text-xs font-mono rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-[var(--sc-marigold,#F2A900)]"
            />
          </div>
        </div>

        {/* Step 2: Theme Presets */}
        <div className="p-6 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] space-y-4 shadow-xs">
          <div>
            <span className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1">
              2. Choose Visual Preset
            </span>
            <p className="text-xs text-[var(--sc-ink-2,#4B5060)]">
              Every preset includes an automatic Nepali Devanagari font fallback and contrast guards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THEME_OPTIONS.map((theme) => {
              const selected = themePreset === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => setThemePreset(theme.id)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    selected
                      ? "border-[var(--sc-ink,#111318)] bg-[var(--sc-paper,#FAFAF7)]"
                      : "border-[var(--sc-line,#E8E8E1)] hover:border-[var(--sc-ink-3,#8B90A0)] bg-[var(--sc-surface,#FFFFFF)]"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{theme.name}</span>
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block"
                        style={{ backgroundColor: theme.accent }}
                      />
                    </div>
                    <p className="text-[11px] text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
                      {theme.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--sc-line,#E8E8E1)] flex items-center justify-between text-[11px] font-mono">
                    <span className={selected ? "font-bold text-[var(--sc-ink,#111318)]" : "text-[var(--sc-ink-3,#8B90A0)]"}>
                      {selected ? "✓ Active" : "Select"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Launch CTA Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || slugChecking || slugAvailable === false}
            className="w-full h-12 flex items-center justify-center font-medium rounded-lg bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] hover:opacity-95 disabled:opacity-50 transition-opacity text-sm shadow-xs"
          >
            {submitting ? "Launching your store..." : "Launch Store on ShopCraft →"}
          </button>
          <p className="text-center text-[11px] text-[var(--sc-ink-3,#8B90A0)] font-mono mt-2">
            Instant deployment · Khalti test wallet ready on launch
          </p>
        </div>
      </form>
    </div>
  );
}

export default function CreateStorePage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto py-16 px-4">Loading wizard...</div>}>
      <CreateStoreContent />
    </Suspense>
  );
}
