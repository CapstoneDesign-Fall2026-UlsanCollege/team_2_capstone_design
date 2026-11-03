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
      id: "nav-customers",
      label: "Go to Customers Directory",
      category: "Navigation",
      shortcut: "G C",
      onSelect: () => router.push(`/merchant/${encodeURIComponent(storeSlug)}/customers`),
    },
    {
      id: "nav-themes",
      label: "Go to Online Store & Themes",
      category: "Navigation",
      shortcut: "G T",
      onSelect: () => router.push(`/merchant/${encodeURIComponent(storeSlug)}/themes`),
    },
    {
      id: "nav-orders",
      label: "Go to Orders Queue",
      category: "Navigation",
      shortcut: "G R",
      onSelect: () => router.push(`/merchant/${encodeURIComponent(storeSlug)}/orders`),
    },
    {
      id: "nav-subscriptions",
      label: "Go to Subscriptions & Renewals",
      category: "Navigation",
      shortcut: "G B",
      onSelect: () => router.push(`/merchant/${encodeURIComponent(storeSlug)}/subscriptions`),
    },
    {
      id: "nav-discounts",
      label: "Go to Discounts & Promo Codes",
      category: "Navigation",
      shortcut: "G D",
      onSelect: () => router.push(`/merchant/${encodeURIComponent(storeSlug)}/discounts`),
    },
    {
      id: "nav-analytics",
      label: "Go to Analytics & Nepal Provinces",
      category: "Navigation",
      shortcut: "G A",
      onSelect: () => router.push(`/merchant/${encodeURIComponent(storeSlug)}/analytics`),
    },
    {
      id: "nav-settings",
      label: "Go to Store Settings, Staff & Security Logs",
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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity" />
        <Dialog.Content className="fixed top-[18%] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl overflow-hidden outline-none">
          <Dialog.Title className="sr-only">Merchant Console Command Palette</Dialog.Title>
          <div className="flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-mono text-zinc-500 mr-2">⌘</span>
            <input
              type="text"
              autoFocus
              placeholder="Type a command or search console..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
            />
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              ESC
            </kbd>
          </div>

          <div className="max-h-72 overflow-y-auto p-2 space-y-1">
            {filteredCommands.length === 0 ? (
              <p className="p-4 text-center text-xs text-zinc-500">
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
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {item.category}
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.label}</span>
                  </div>
                  {item.shortcut && (
                    <span className="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
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
