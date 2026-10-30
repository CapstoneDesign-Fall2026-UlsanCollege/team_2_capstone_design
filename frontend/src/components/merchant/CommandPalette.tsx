"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";

interface CommandPaletteProps {
  storeSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandItem {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  onSelect: () => void;
}

export function CommandPalette({ storeSlug, open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const commands: CommandItem[] = [
    {
      id: "nav-overview",
      label: "Go to Store Overview",
      category: "Navigation",
      shortcut: "G O",
      onSelect: () => router.push(`/merchant/${encodeURIComponent(storeSlug)}`),
    },
    {
      id: "nav-products",
      label: "Go to Products & Catalog",
      category: "Navigation",
      shortcut: "G P",
      onSelect: () => router.push(`/merchant/${encodeURIComponent(storeSlug)}/products`),
    },
    {
      id: "nav-orders",
      label: "Go to Orders Queue",
      category: "Navigation",
      shortcut: "G R",
      onSelect: () => router.push(`/merchant/${encodeURIComponent(storeSlug)}/orders`),
    },
    {
      id: "nav-settings",
      label: "Go to Store Settings & Khalti",
      category: "Navigation",
      shortcut: "G S",
      onSelect: () => router.push(`/merchant/${encodeURIComponent(storeSlug)}/settings`),
    },
    {
      id: "live-store",
      label: "View Live Storefront",
      category: "Storefront",
      shortcut: "↗",
      onSelect: () => window.open(`/s/${encodeURIComponent(storeSlug)}`, "_blank"),
    },
    {
      id: "account-addresses",
      label: "Manage Delivery Addresses",
      category: "Account",
      onSelect: () => router.push("/account/addresses"),
    },
  ];

  const filteredCommands = commands.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity" />
        <Dialog.Content className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-xl overflow-hidden outline-none">
          <div className="flex items-center px-4 border-b border-[var(--border)]">
            <span className="text-xs font-mono text-[var(--muted-foreground)] mr-2">⌘</span>
            <input
              type="text"
              autoFocus
              placeholder="Type a command or search console..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 bg-transparent text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
            />
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)]">
              ESC
            </kbd>
          </div>

          <div className="max-h-72 overflow-y-auto p-2 space-y-1">
            {filteredCommands.length === 0 ? (
              <p className="p-4 text-center text-xs text-[var(--muted-foreground)]">
                No matching commands found.
              </p>
            ) : (
              filteredCommands.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.onSelect();
                    onOpenChange(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-[var(--secondary)] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)]">
                      {item.category}
                    </span>
                    <span className="font-medium text-[var(--foreground)]">{item.label}</span>
                  </div>
                  {item.shortcut && (
                    <span className="text-[10px] font-mono text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
