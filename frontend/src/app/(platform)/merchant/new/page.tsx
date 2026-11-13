"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  MapPin,
  PartyPopper,
  Phone,
  Sparkles,
  Store,
} from "lucide-react";
import {
  ApiError,
  checkStoreSlug,
  createStore,
  fetchSession,
  StorePublicMetadata,
} from "@/lib/api";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CATEGORY_OPTIONS = [
  { id: "Specialty Coffee & Tea", label: "Specialty Coffee & Tea", desc: "Single-origin beans, herbal infusions, micro-roasters" },
  { id: "Himalayan Crafts & Handloom", label: "Himalayan Crafts & Handloom", desc: "Singing bowls, pashmina, Dhaka textiles, felt craft" },
  { id: "Nepali Streetwear & Fashion", label: "Nepali Streetwear & Fashion", desc: "Urban apparel, hemp fashion, jewelry, lifestyle drops" },
  { id: "Bakery, Sweets & Cafe", label: "Bakery, Sweets & Cafe", desc: "Artisanal bakery, local confectionery, roasted snacks" },
  { id: "Organic Honey, Herbs & Spices", label: "Organic Honey & Spices", desc: "Wild cliff honey, cardamom, turmeric, Ayurvedic goods" },
  { id: "Electronics & Tech Accessories", label: "Tech & Accessories", desc: "Custom cables, smart gear, phone cases, electronics" },
  { id: "General Specialty Goods", label: "Other Specialty Goods", desc: "Curated goods, original creations, local artisan products" },
];

const PROVINCE_OPTIONS = [
  "Bagmati Province",
  "Gandaki Province",
  "Koshi Province",
  "Lumbini Province",
  "Madhesh Province",
  "Karnali Province",
  "Sudurpashchim Province",
];

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
    id: "midnight-obsidian",
    name: "Midnight Obsidian",
    desc: "Deep matte charcoal, electric blue, Space Grotesk display. For streetwear, tech, sneakers, modern drops.",
    accent: "#2563EB",
    canvas: "#0D0D0E",
  },
  {
    id: "ktm-bold",
    name: "Modern Minimalist",
    desc: "High contrast monochrome, stark canvas, Space Grotesk. For contemporary art, accessories, jewelry, gear.",
    accent: "#2B3BFF",
    canvas: "#F4F4F0",
  },
];

function CreateStoreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialName = searchParams.get("name") || "";
  const initialTheme = searchParams.get("theme") || "editorial-warm";

  // Navigation & Step state: 1: Basics, 2: Location/Contact, 3: Theme, 4: Celebration
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [loadingSession, setLoadingSession] = useState(true);
  const [storeName, setStoreName] = useState(initialName);
  const [customSlug, setCustomSlug] = useState("");
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [category, setCategory] = useState("");
  const [tagline, setTagline] = useState("");

  const [contactPhone, setContactPhone] = useState("");
  const [province, setProvince] = useState("Bagmati Province");
  const [city, setCity] = useState("Kathmandu");
  const [streetAddress, setStreetAddress] = useState("");

  const [themePreset, setThemePreset] = useState(initialTheme);

  // Slug availability
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  // Submission & Success state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdStore, setCreatedStore] = useState<StorePublicMetadata | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const activeSlug = customSlug || slugify(storeName) || "store";

  // 1. Session check on mount
  useEffect(() => {
    let mounted = true;
    fetchSession()
      .then((session) => {
        if (!mounted) return;
        if (!session.authenticated) {
          const nextTarget = `/merchant/new?name=${encodeURIComponent(initialName)}&theme=${encodeURIComponent(initialTheme)}`;
          router.replace(`/login?next=${encodeURIComponent(nextTarget)}`);
          return;
        }
      })
      .catch(() => {
        if (!mounted) return;
        const nextTarget = `/merchant/new?name=${encodeURIComponent(initialName)}&theme=${encodeURIComponent(initialTheme)}`;
        router.replace(`/login?next=${encodeURIComponent(nextTarget)}`);
      })
      .finally(() => {
        if (mounted) setLoadingSession(false);
      });

    return () => {
      mounted = false;
    };
  }, [router, initialName, initialTheme]);

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

  const handleNextStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!storeName.trim()) {
      setFormError("Please enter your store name.");
      return;
    }

    if (!activeSlug) {
      setFormError("Please enter a valid store name.");
      return;
    }

    // Guard against race condition if debounced slug check is in flight
    if (slugChecking || slugAvailable === null) {
      try {
        setSlugChecking(true);
        const res = await checkStoreSlug(activeSlug);
        setSlugAvailable(res.available);
        if (!res.available) {
          setSlugError(res.reason || "This URL slug is taken.");
          setFormError(res.reason || "This URL slug is taken. Please choose another.");
          return;
        }
      } catch {
        setSlugAvailable(true);
      } finally {
        setSlugChecking(false);
      }
    } else if (slugAvailable === false) {
      setFormError(slugError || "This URL slug is taken. Please choose another.");
      return;
    }

    setCurrentStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanPhone = contactPhone.trim();
    if (cleanPhone && !/^9[78]\d{8}$/.test(cleanPhone)) {
      setFormError("Enter a valid 10-digit Nepali mobile number starting with 98 or 97.");
      return;
    }

    if (!city.trim()) {
      setFormError("Please specify your business city or district.");
      return;
    }

    setCurrentStep(3);
  };

  const handleLaunchStore = async () => {
    setFormError(null);
    setSubmitting(true);

    try {
      const created = await createStore({
        name: storeName.trim(),
        slug: activeSlug,
        category,
        city: city.trim(),
        province,
        tagline: tagline.trim(),
        contact_phone: contactPhone.trim(),
        theme_preset: themePreset,
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("shopcraft_active_store_slug", created.slug);
      }

      setCreatedStore(created);
      setCurrentStep(4);
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

  const handleCopyStoreLink = () => {
    if (!createdStore) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://shopcraft.com.np";
    const fullUrl = `${origin}/s/${createdStore.slug}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
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

  // ---------------------------------------------------------------------------
  // Step 4: "Your Store is Ready!" Celebration Screen
  // ---------------------------------------------------------------------------
  if (currentStep === 4 && createdStore) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://shopcraft.com.np";
    const storeUrl = `${origin}/s/${createdStore.slug}`;

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-[var(--sc-ink,#111318)] animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8 sm:p-10 rounded-2xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 mx-auto flex items-center justify-center">
            <PartyPopper className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold font-mono border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Your store is live on ShopCraft!</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {createdStore.name}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--sc-ink-2,#4B5060)] max-w-md mx-auto">
              Your multi-tenant storefront, catalog database, and verified payment rails have been provisioned.
            </p>
          </div>

          {/* Store URL Card with 1-Click Copy */}
          <div className="p-4 rounded-xl bg-[var(--sc-paper,#FAFAF7)] border border-[var(--sc-line,#E8E8E1)] text-left space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--sc-ink-3,#8B90A0)] block">
              Public Storefront Link
            </span>
            <div className="flex items-center justify-between gap-3 bg-[var(--sc-surface,#FFFFFF)] p-2.5 rounded-lg border border-[var(--sc-line,#E8E8E1)]">
              <span className="font-mono text-xs text-[var(--sc-ink,#111318)] truncate font-semibold">
                {storeUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyStoreLink}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Setup Checklist Preview */}
          <div className="p-4 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-left space-y-2.5">
            <span className="text-xs font-bold text-[var(--sc-ink,#111318)] block">
              Next Steps in Your Merchant Console:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--sc-ink-2,#4B5060)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Storefront URL reserved &amp; live</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--sc-ink-3,#8B90A0)] shrink-0" />
                <span>Add your first product in Catalog</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--sc-ink-3,#8B90A0)] shrink-0" />
                <span>Set delivery fees &amp; thresholds</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--sc-ink-3,#8B90A0)] shrink-0" />
                <span>Connect Khalti or configure COD</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/merchant/${encodeURIComponent(createdStore.slug)}`}
              className="flex-1 h-12 flex items-center justify-center font-semibold rounded-xl bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] hover:opacity-90 transition-opacity text-sm shadow-xs cursor-pointer"
            >
              Open Merchant Console →
            </Link>
            <Link
              href={`/s/${encodeURIComponent(createdStore.slug)}`}
              target="_blank"
              className="sm:w-48 h-12 flex items-center justify-center gap-1.5 font-semibold rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] hover:bg-[var(--sc-paper,#FAFAF7)] transition-colors text-sm shadow-2xs"
            >
              <span>Visit Live Store</span>
              <ExternalLink className="w-4 h-4 text-[var(--sc-ink-2,#4B5060)]" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Wizard Steps 1, 2, 3
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-[var(--sc-ink,#111318)]">
      {/* Wizard Header & Progress Bar */}
      <div className="space-y-4 mb-8 border-b border-[var(--sc-line,#E8E8E1)] pb-6">
        <div className="flex items-center justify-between text-xs text-[var(--sc-ink-2,#4B5060)]">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-mono">
              Step {currentStep} of 3 · {currentStep === 1 ? "Store Basics" : currentStep === 2 ? "Location & Contact" : "Theme Preset"}
            </span>
          </div>

          <span className="font-mono text-[11px] text-[var(--sc-ink-3,#8B90A0)]">
            Shopify-Equivalent Parity
          </span>
        </div>

        {/* 3-Step Progress Indicator */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`h-1.5 rounded-full transition-colors ${currentStep >= 1 ? "bg-[var(--sc-ink,#111318)]" : "bg-[var(--sc-line,#E8E8E1)]"}`} />
          <div className={`h-1.5 rounded-full transition-colors ${currentStep >= 2 ? "bg-[var(--sc-ink,#111318)]" : "bg-[var(--sc-line,#E8E8E1)]"}`} />
          <div className={`h-1.5 rounded-full transition-colors ${currentStep >= 3 ? "bg-[var(--sc-ink,#111318)]" : "bg-[var(--sc-line,#E8E8E1)]"}`} />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {currentStep === 1 && "Create your ShopCraft store"}
            {currentStep === 2 && "Where is your business located?"}
            {currentStep === 3 && "Pick your store's visual theme"}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--sc-ink-2,#4B5060)] mt-1">
            {currentStep === 1 && "Start by naming your brand and choosing what you plan to sell."}
            {currentStep === 2 && "Configure your courier dispatch origin and customer support details."}
            {currentStep === 3 && "Choose a typography and color palette tailored for your product niche."}
          </p>
        </div>
      </div>

      {formError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          {formError}
        </div>
      )}

      {/* STEP 1: Store Basics & Category */}
      {currentStep === 1 && (
        <form onSubmit={handleNextStep1} className="space-y-6">
          <div className="p-6 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] space-y-5 shadow-xs">
            <div>
              <label
                htmlFor="wizard-name"
                className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1.5 font-semibold"
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
                placeholder="e.g. Himalayan Artisans, Kathmandu Coffee Roasters..."
                className="w-full h-12 px-3 text-base font-medium rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
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
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-[var(--sc-ink-3,#8B90A0)]">shopcraft.com.np/s/</span>
                    <input
                      type="text"
                      value={customSlug || slugify(storeName)}
                      onChange={(e) => setCustomSlug(slugify(e.target.value))}
                      className="flex-1 h-9 px-2 text-xs font-mono rounded border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-paper,#FAFAF7)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-zinc-800"
                    />
                  </div>
                  <div className="flex items-center text-xs font-mono">
                    {slugChecking ? (
                      <span className="text-[var(--sc-ink-3,#8B90A0)] text-[11px]">Checking availability...</span>
                    ) : slugAvailable ? (
                      <span className="text-emerald-700 font-medium text-[11px]">
                        ✓ Available: shopcraft.com.np/s/{activeSlug}
                      </span>
                    ) : slugError ? (
                      <span className="text-red-700 font-medium text-[11px]">
                        ✗ {slugError}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 rounded bg-[var(--sc-paper,#FAFAF7)] border border-[var(--sc-line,#E8E8E1)] text-xs font-mono">
                  <span className="text-[var(--sc-ink-3,#8B90A0)]">URL:</span>
                  <span className="font-semibold text-[var(--sc-ink,#111318)]">
                    shopcraft.com.np/s/{activeSlug}
                  </span>
                  {slugChecking ? (
                    <span className="text-[var(--sc-ink-3,#8B90A0)] text-[11px] ml-auto">checking...</span>
                  ) : slugAvailable ? (
                    <span className="text-emerald-700 font-medium text-[11px] ml-auto">
                      ✓ Available
                    </span>
                  ) : slugError ? (
                    <span className="text-red-700 font-medium text-[11px] ml-auto">
                      ✗ {slugError}
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            {/* Category Selector: "What are you selling?" */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] font-semibold">
                2. What will you be selling? (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setCategory(isSelected ? "" : cat.id)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "border-[var(--sc-ink,#111318)] bg-[var(--sc-paper,#FAFAF7)] shadow-2xs"
                          : "border-[var(--sc-line,#E8E8E1)] hover:border-zinc-400 bg-[var(--sc-surface,#FFFFFF)]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--sc-ink,#111318)]">
                          {cat.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <p className="text-[11px] text-[var(--sc-ink-2,#4B5060)] mt-0.5">
                        {cat.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tagline */}
            <div>
              <label
                htmlFor="wizard-tagline"
                className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1"
              >
                Short Brand Tagline (Optional)
              </label>
              <input
                id="wizard-tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Handcrafted specialty goods sourced across Nepal."
                className="w-full h-11 px-3 text-xs rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-zinc-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!storeName.trim() || slugAvailable === false || slugChecking}
            className="w-full h-12 flex items-center justify-center gap-2 font-semibold rounded-xl bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] hover:opacity-90 disabled:opacity-50 transition-opacity text-sm shadow-xs cursor-pointer"
          >
            <span>Continue to Business Location</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* STEP 2: Location & Contact */}
      {currentStep === 2 && (
        <form onSubmit={handleNextStep2} className="space-y-6">
          <div className="p-6 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] font-semibold">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Courier Dispatch Origin & Customer Support</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="wizard-phone"
                  className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1"
                >
                  Customer Support Phone *
                </label>
                <div className="relative">
                  <input
                    id="wizard-phone"
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="9801234567"
                    className="w-full h-11 pl-8 pr-3 text-xs font-mono rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-zinc-800"
                  />
                  <Phone className="w-3.5 h-3.5 text-[var(--sc-ink-3,#8B90A0)] absolute left-2.5 top-3.5" />
                </div>
                <p className="text-[10px] text-[var(--sc-ink-3,#8B90A0)] font-mono mt-1">
                  10 digits starting with 98 or 97
                </p>
              </div>

              <div>
                <label
                  htmlFor="wizard-province"
                  className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1"
                >
                  Province *
                </label>
                <select
                  id="wizard-province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full h-11 px-3 text-xs rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-zinc-800"
                >
                  {PROVINCE_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="wizard-city"
                  className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1"
                >
                  City / District *
                </label>
                <input
                  id="wizard-city"
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Kathmandu, Lalitpur, Pokhara..."
                  className="w-full h-11 px-3 text-xs rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-zinc-800"
                />
              </div>

              <div>
                <label
                  htmlFor="wizard-address"
                  className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1"
                >
                  Street / Nearest Chowk (Optional)
                </label>
                <input
                  id="wizard-address"
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="e.g. Jhamsikhel Road, Ward 3"
                  className="w-full h-11 px-3 text-xs rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-zinc-800"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="h-12 px-5 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-xs font-semibold text-[var(--sc-ink,#111318)] hover:bg-[var(--sc-paper,#FAFAF7)] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              className="flex-1 h-12 flex items-center justify-center gap-2 font-semibold rounded-xl bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] hover:opacity-90 transition-opacity text-sm shadow-xs cursor-pointer"
            >
              <span>Continue to Theme Selection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Theme Preset Selector & Launch */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] space-y-4 shadow-xs">
            <div>
              <span className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1 font-semibold">
                Choose Visual Preset
              </span>
              <p className="text-xs text-[var(--sc-ink-2,#4B5060)]">
                You can fully customize colors, typography tokens, and header announcement banners later in the Theme Editor.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {THEME_OPTIONS.map((theme) => {
                const selected = themePreset === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => setThemePreset(theme.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      selected
                        ? "border-[var(--sc-ink,#111318)] bg-[var(--sc-paper,#FAFAF7)] shadow-xs"
                        : "border-[var(--sc-line,#E8E8E1)] hover:border-zinc-400 bg-[var(--sc-surface,#FFFFFF)]"
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={submitting}
              className="h-12 px-5 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-xs font-semibold text-[var(--sc-ink,#111318)] hover:bg-[var(--sc-paper,#FAFAF7)] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleLaunchStore}
              disabled={submitting}
              className="flex-1 h-12 flex items-center justify-center gap-2 font-semibold rounded-xl bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] hover:opacity-90 disabled:opacity-50 transition-opacity text-sm shadow-xs cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Provisioning store on Neon PostgreSQL...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Launch Store on ShopCraft →</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
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
