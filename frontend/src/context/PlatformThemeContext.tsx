"use client";

import React, { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "shopcraft-platform-theme";

const THEME_COLOR_HEX: Record<ThemeMode, string> = {
  dark: "#000000",
  light: "#FFFFFF",
};

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

const listeners = new Set<() => void>();

function notifyThemeListeners() {
  listeners.forEach((listener) => listener());
}

function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window === "undefined") {
    return () => listeners.delete(listener);
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getThemeSnapshot(): ThemeMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function getServerThemeSnapshot(): ThemeMode {
  return "dark";
}

function syncThemeColorMeta(mode: ThemeMode) {
  const color = THEME_COLOR_HEX[mode];
  const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
  if (metas.length === 0) {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    document.head.appendChild(meta);
    return;
  }
  metas.forEach((meta) => {
    meta.setAttribute("content", color);
  });
}

function applyDocumentTheme(mode: ThemeMode, syncMeta = false) {
  if (mode === "dark") {
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.setAttribute("data-platform-theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.setAttribute("data-platform-theme", "light");
  }
  if (syncMeta) {
    syncThemeColorMeta(mode);
  }
}

export function PlatformThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const hasStored = stored === "dark" || stored === "light";
      applyDocumentTheme(theme, hasStored);
    } catch {
      // Ignore SSR / localStorage errors
    }
    return () => {
      document.documentElement.classList.remove("dark");
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.removeAttribute("data-platform-theme");
    };
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
      applyDocumentTheme(mode, true);
      notifyThemeListeners();
    } catch {
      // Ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeMode = getThemeSnapshot() === "light" ? "dark" : "light";
    setTheme(nextTheme);
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <div
        suppressHydrationWarning
        data-theme={theme}
        data-platform-theme={theme}
        className={theme === "dark" ? "dark" : ""}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function usePlatformTheme() {
  return useContext(ThemeContext);
}
