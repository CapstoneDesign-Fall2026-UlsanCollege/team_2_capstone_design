"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MerchantSidebar } from "@/components/merchant/MerchantSidebar";
import { MerchantBottomNav } from "@/components/merchant/MerchantBottomNav";
import { CommandPalette } from "@/components/merchant/CommandPalette";

interface ConsoleShellProps {
  storeSlug: string;
  children: React.ReactNode;
}

export function ConsoleShell({ storeSlug, children }: ConsoleShellProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

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
    <div className="flex min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      {/* Desktop 232px Sidebar */}
      <MerchantSidebar
        storeSlug={storeSlug}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile / Tablet Header Bar */}
        <header className="lg:hidden h-12 border-b border-[var(--border)] bg-[var(--card)] px-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-extrabold text-xs tracking-tight">
              ShopCraft
            </Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <span className="font-mono text-xs font-semibold">{storeSlug}</span>
          </div>

          <div className="flex items-center gap-2">
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
