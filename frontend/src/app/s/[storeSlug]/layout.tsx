import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowLeft, RotateCw } from "lucide-react";
import { AccountProvider } from "@/components/storefront/AccountContext";
import { AccountSheet } from "@/components/storefront/AccountSheet";
import { CartProvider } from "@/components/storefront/CartContext";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { ThemePreviewWatcher } from "@/components/storefront/ThemePreviewWatcher";
import { resolveSafeTenantTokens } from "@/lib/theme-contrast";
import { fetchPublicStoreOutcome } from "@/lib/storefront-fetch";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}): Promise<Metadata> {
  const { storeSlug } = await params;
  const result = await fetchPublicStoreOutcome(storeSlug);
  if (result.status !== "ok") {
    return {
      title: result.status === "not_found" ? "This store isn't here" : "Store Unavailable",
    };
  }
  const storeName = result.store.name?.trim() || "Online Store";
  const cleanTagline = result.store.tagline?.trim();

  return {
    title: storeName,
    description: cleanTagline || `${storeName} online storefront.`,
  };
}

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const result = await fetchPublicStoreOutcome(storeSlug);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "unavailable") {
    return (
      <div
        data-store-theme="editorial-warm"
        className="storefront min-h-dvh bg-[var(--canvas)] text-[var(--ink)] flex flex-col items-center justify-center p-4 font-sans"
      >
        <div className="w-full max-w-md p-6 sm:p-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-[var(--error-bg)] border border-[var(--error-bd)] text-[var(--error-fg)] mx-auto flex items-center justify-center">
            <AlertCircle className="w-7 h-7" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-[var(--ink)]">
              Unable to Load Store
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-sm mx-auto leading-relaxed">
              We are having trouble reaching the store service right now. Please try again shortly.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5 max-w-xs mx-auto">
            <Link
              href={`/s/${encodeURIComponent(storeSlug)}`}
              className="w-full min-h-[44px] h-12 rounded-lg bg-[var(--primary)] text-[var(--surface)] hover:bg-[var(--primary-hover)] text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <RotateCw className="w-4 h-4" aria-hidden="true" />
              <span>Try Again</span>
            </Link>

            <Link
              href="/"
              className="w-full min-h-[44px] h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--canvas)] text-xs font-medium text-[var(--ink)] transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--ink-2)]" aria-hidden="true" />
              <span>Return to ShopCraft Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const store = result.store;
  const themePreset = store.theme_preset || "editorial-warm";

  // Validate tenant overrides against WCAG AA contrast and prohibited status hues
  const safeTokens = resolveSafeTenantTokens({
    accentColor: store.accent_color,
  });

  const customStyle: React.CSSProperties = {
    ["--canvas" as string]: safeTokens.tokens.canvas,
    ["--surface" as string]: safeTokens.tokens.surface,
    ["--border" as string]: safeTokens.tokens.border,
    ["--ink" as string]: safeTokens.tokens.ink,
    ["--ink-2" as string]: safeTokens.tokens.ink2,
    ["--primary" as string]: safeTokens.tokens.primary,
    ["--primary-hover" as string]: safeTokens.tokens.primaryHover,
  };

  return (
    <div
      data-store-theme={themePreset}
      style={customStyle}
      className="storefront min-h-dvh bg-[var(--canvas)] text-[var(--ink)] font-sans flex flex-col"
    >
      <ThemePreviewWatcher initialPreset={themePreset} />
      <AccountProvider>
        <CartProvider
          storeSlug={store.slug}
          themePreset={themePreset}
          freeShippingThresholdMinor={
            store.shipping_configured &&
            typeof store.free_shipping_threshold_minor === "number" &&
            store.free_shipping_threshold_minor > 0
              ? store.free_shipping_threshold_minor
              : null
          }
        >
          {children}
          <CartDrawer />
          <AccountSheet storeSlug={store.slug} themePreset={themePreset} />
        </CartProvider>
      </AccountProvider>
    </div>
  );
}
