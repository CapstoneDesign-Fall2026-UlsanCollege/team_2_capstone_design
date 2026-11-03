"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Watcher({ initialPreset }: { initialPreset: string }) {
  const searchParams = useSearchParams();
  const previewTheme = searchParams.get("preview_theme");

  useEffect(() => {
    const theme = previewTheme || initialPreset;
    const el = document.querySelector("[data-store-theme]");
    if (el && theme) {
      el.setAttribute("data-store-theme", theme);
    }
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
