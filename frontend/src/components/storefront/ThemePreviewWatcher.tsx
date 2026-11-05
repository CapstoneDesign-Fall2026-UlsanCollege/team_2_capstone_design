"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Watcher({ initialPreset }: { initialPreset: string }) {
  const searchParams = useSearchParams();
  const previewTheme = searchParams.get("preview_theme");

  useEffect(() => {
    const theme = previewTheme || initialPreset;
    if (theme && typeof document !== "undefined") {
      document.documentElement.setAttribute("data-store-theme", theme);
      const el = document.querySelector("[data-store-theme]");
      if (el) {
        el.setAttribute("data-store-theme", theme);
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.removeAttribute("data-store-theme");
      }
    };
  }, [previewTheme, initialPreset]);

  return null;
}

export function ThemePreviewWatcher({ initialPreset }: { initialPreset: string }) {
  return (
    <Suspense fallback={null}>
      <Watcher initialPreset={initialPreset} />
    </Suspense>
  );
}
