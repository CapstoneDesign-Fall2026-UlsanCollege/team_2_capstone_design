"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

const THEME_COLOR_HEX: Record<ThemeMode, string> = {
  dark: "#0B0C0E",
  light: "#F7F5F0",
};

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

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
    document.documentElement.setAttribute("data-platform-theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.setAttribute("data-platform-theme", "light");
  }
  if (syncMeta) {
    syncThemeColorMeta(mode);
  }
}

export function PlatformThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("shopcraft-platform-theme");
        if (stored === "dark") return "dark";
      } catch {
        // ignore
      }
    }
    return "light";
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("shopcraft-platform-theme") as ThemeMode | null;
      const active: ThemeMode = stored === "dark" ? "dark" : "light";
      applyDocumentTheme(active, stored === "dark" || stored === "light");
    } catch {
      // Ignore SSR / localStorage errors
    }
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem("shopcraft-platform-theme", mode);
      applyDocumentTheme(mode, true);
    } catch {
      // Ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const nextTheme: ThemeMode = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem("shopcraft-platform-theme", nextTheme);
        applyDocumentTheme(nextTheme, true);
      } catch {
        // Ignore
      }
      return nextTheme;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <div
        suppressHydrationWarning
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
