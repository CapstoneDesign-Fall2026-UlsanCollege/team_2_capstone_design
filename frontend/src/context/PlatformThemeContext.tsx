"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

export type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const STORAGE_KEY = "shopcraft-platform-theme";
const THEME_EVENT = "shopcraft-theme-change";

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

function subscribeTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(THEME_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(THEME_EVENT, handler);
  };
}

interface PlatformThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}

export function PlatformThemeProvider({
  children,
  defaultTheme = "light",
}: PlatformThemeProviderProps) {
  const theme = useSyncExternalStore<ThemeMode>(
    subscribeTheme,
    () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "dark" || stored === "light") return stored;
      } catch {
        // Ignore storage restrictions
      }
      return defaultTheme;
    },
    () => defaultTheme
  );

  useEffect(() => {
    try {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-platform-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-platform-theme", "light");
      }
    } catch {
      // Ignore
    }
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
      window.dispatchEvent(new Event(THEME_EVENT));
    } catch {
      // Ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

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
