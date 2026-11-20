"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  isValidStorefrontThemePreset,
  normalizeStorefrontThemePreset,
} from "@/lib/theme-contrast";

export function useEffectiveStoreTheme(initialPreset: string): string {
  const searchParams = useSearchParams();
  const previewTheme = searchParams?.get("preview_theme");
  if (isValidStorefrontThemePreset(previewTheme)) {
    return previewTheme;
  }
  return normalizeStorefrontThemePreset(initialPreset);
}

function Watcher({ initialPreset }: { initialPreset: string }) {
  const searchParams = useSearchParams();
  const rawPreview = searchParams?.get("preview_theme");
  const hasValidPreview = isValidStorefrontThemePreset(rawPreview);
  const effectiveTheme = hasValidPreview
    ? rawPreview
    : normalizeStorefrontThemePreset(initialPreset);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.documentElement.setAttribute("data-store-theme", effectiveTheme);
    const themedNodes = document.querySelectorAll<HTMLElement>("[data-store-theme]");
    themedNodes.forEach((node) => {
      node.setAttribute("data-store-theme", effectiveTheme);
    });

    const rootEl = document.querySelector<HTMLElement>("[data-storefront-root]");
    const savedInline = rootEl
      ? {
          primary: rootEl.style.getPropertyValue("--primary"),
          primaryHover: rootEl.style.getPropertyValue("--primary-hover"),
          primaryForeground: rootEl.style.getPropertyValue("--primary-foreground"),
        }
      : null;

    if (rootEl && hasValidPreview) {
      rootEl.style.removeProperty("--primary");
      rootEl.style.removeProperty("--primary-hover");
      rootEl.style.removeProperty("--primary-foreground");
    }

    return () => {
      if (typeof document === "undefined") return;
      document.documentElement.removeAttribute("data-store-theme");
      if (rootEl && savedInline) {
        if (savedInline.primary) {
          rootEl.style.setProperty("--primary", savedInline.primary);
        }
        if (savedInline.primaryHover) {
          rootEl.style.setProperty("--primary-hover", savedInline.primaryHover);
        }
        if (savedInline.primaryForeground) {
          rootEl.style.setProperty("--primary-foreground", savedInline.primaryForeground);
        }
      }
    };
  }, [effectiveTheme, hasValidPreview]);

  return null;
}

export function ThemePreviewWatcher({ initialPreset }: { initialPreset: string }) {
  return (
    <Suspense fallback={null}>
      <Watcher initialPreset={initialPreset} />
    </Suspense>
  );
}
