"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  isValidStorefrontThemePreset,
  normalizeStorefrontThemePreset,
} from "@/lib/theme-contrast";

function extractStoreSlugFromPathname(pathname: string | null): string | undefined {
  if (!pathname) return undefined;
  const match = pathname.match(/^\/s\/([^/?#]+)/);
  if (!match) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function getPreviewStorageKey(storeSlug?: string): string {
  return `shopcraft_preview_theme:${storeSlug || "default"}`;
}

function readSessionPreviewTheme(storageKey: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(storageKey);
    return isValidStorefrontThemePreset(stored) ? stored : null;
  } catch {
    return null;
  }
}

function writeSessionPreviewTheme(storageKey: string, value: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.sessionStorage.setItem(storageKey, value);
    } else {
      window.sessionStorage.removeItem(storageKey);
    }
  } catch {
    // Ignore storage access errors in restricted browser contexts
  }
}

export function useEffectiveStoreTheme(initialPreset: string, storeSlug?: string): string {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const rawPreview = searchParams?.get("preview_theme");
  const resolvedSlug = storeSlug || extractStoreSlugFromPathname(pathname);
  const storageKey = getPreviewStorageKey(resolvedSlug);
  const [sessionTheme, setSessionTheme] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let nextTheme: string | null = null;
    if (rawPreview === "default" || rawPreview === "reset") {
      writeSessionPreviewTheme(storageKey, null);
      nextTheme = null;
    } else if (isValidStorefrontThemePreset(rawPreview)) {
      writeSessionPreviewTheme(storageKey, rawPreview);
      nextTheme = rawPreview;
    } else {
      nextTheme = readSessionPreviewTheme(storageKey);
    }
    Promise.resolve().then(() => {
      if (active) setSessionTheme(nextTheme);
    });
    return () => {
      active = false;
    };
  }, [rawPreview, storageKey]);

  if (rawPreview === "default" || rawPreview === "reset") {
    return normalizeStorefrontThemePreset(initialPreset);
  }
  if (isValidStorefrontThemePreset(rawPreview)) {
    return rawPreview;
  }
  if (sessionTheme && isValidStorefrontThemePreset(sessionTheme)) {
    return sessionTheme;
  }
  return normalizeStorefrontThemePreset(initialPreset);
}

function Watcher({
  initialPreset,
  storeSlug,
}: {
  initialPreset: string;
  storeSlug?: string;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const rawPreview = searchParams?.get("preview_theme");
  const resolvedSlug = storeSlug || extractStoreSlugFromPathname(pathname);
  const storageKey = getPreviewStorageKey(resolvedSlug);

  const isReset = rawPreview === "default" || rawPreview === "reset";
  const hasUrlPreview = isValidStorefrontThemePreset(rawPreview);
  const sessionPreview = !isReset && !hasUrlPreview ? readSessionPreviewTheme(storageKey) : null;

  const hasValidPreview = !isReset && (hasUrlPreview || Boolean(sessionPreview));
  const effectiveTheme = hasUrlPreview
    ? (rawPreview as string)
    : sessionPreview
    ? sessionPreview
    : normalizeStorefrontThemePreset(initialPreset);

  useEffect(() => {
    if (isReset) {
      writeSessionPreviewTheme(storageKey, null);
    } else if (hasUrlPreview && rawPreview) {
      writeSessionPreviewTheme(storageKey, rawPreview);
    }

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
  }, [effectiveTheme, hasValidPreview, isReset, hasUrlPreview, rawPreview, storageKey]);

  return null;
}

export function ThemePreviewWatcher({
  initialPreset,
  storeSlug,
}: {
  initialPreset: string;
  storeSlug?: string;
}) {
  return (
    <Suspense fallback={null}>
      <Watcher initialPreset={initialPreset} storeSlug={storeSlug} />
    </Suspense>
  );
}
