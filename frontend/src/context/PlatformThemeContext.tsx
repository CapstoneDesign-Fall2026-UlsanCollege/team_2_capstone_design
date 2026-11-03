"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

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

export function PlatformThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("shopcraft-platform-theme") as ThemeMode | null;
      if (stored === "dark") {
        setThemeState("dark");
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-platform-theme", "dark");
      } else {
        setThemeState("light");
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-platform-theme", "light");
      }
    } catch {
      // Ignore SSR / localStorage errors
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setThemeState((prev) => {
      const nextTheme = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem("shopcraft-platform-theme", nextTheme);
        if (nextTheme === "dark") {
          document.documentElement.classList.add("dark");
          document.documentElement.setAttribute("data-platform-theme", "dark");
        } else {
          document.documentElement.classList.remove("dark");
          document.documentElement.setAttribute("data-platform-theme", "light");
        }
      } catch {
        // Ignore
      }
      return nextTheme;
    });
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem("shopcraft-platform-theme", mode);
      if (mode === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-platform-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-platform-theme", "light");
      }
    } catch {
      // Ignore
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <div data-platform-theme={theme} className={theme === "dark" ? "dark" : ""}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function usePlatformTheme() {
  return useContext(ThemeContext);
}
