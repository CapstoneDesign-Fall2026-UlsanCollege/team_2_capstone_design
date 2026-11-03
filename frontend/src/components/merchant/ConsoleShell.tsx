"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { MerchantSidebar } from "@/components/merchant/MerchantSidebar";
import { MerchantBottomNav } from "@/components/merchant/MerchantBottomNav";
import { CommandPalette } from "@/components/merchant/CommandPalette";
import { usePlatformTheme } from "@/context/PlatformThemeContext";

interface ConsoleShellProps {
  storeSlug: string;
  children: React.ReactNode;
}

export function ConsoleShell({ storeSlug, children }: ConsoleShellProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { theme, toggleTheme } = usePlatformTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-dvh bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
      {/* Desktop 240px Sidebar */}
      <MerchantSidebar
        storeSlug={storeSlug}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile / Tablet Header Bar */}
        <header className="lg:hidden h-12 border-b border-[var(--border)] bg-[var(--card)] px-4 flex items-center justify-between sticky top-0 z-20 transition-colors">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-extrabold text-xs tracking-tight text-[var(--foreground)]">
              ShopCraft
            </Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <Link
              href="/merchant"
              title="Switch store"
              className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[var(--foreground)] hover:text-emerald-500 transition-colors truncate max-w-[140px] px-1.5 py-0.5 rounded bg-[var(--secondary)]"
            >
              <span className="truncate">{storeSlug}</span>
              <span className="text-[10px] text-[var(--muted-foreground)]">▾</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-zinc-600" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="text-xs px-2 py-1 rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)] cursor-pointer"
            >
              ⌘K
            </button>
            <Link
              href={`/s/${encodeURIComponent(storeSlug)}`}
              target="_blank"
              className="text-xs font-mono text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Live ↗
            </Link>
          </div>
        </header>

        {/* Page Content with safe-area spacing for mobile bottom tabs */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto pb-24 lg:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MerchantBottomNav storeSlug={storeSlug} />

        {/* ⌘K Command Palette Dialog */}
        <CommandPalette
          storeSlug={storeSlug}
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
        />
      </div>
    </div>
  );
}
