"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Search } from "lucide-react";

interface CommandPaletteProps {
  storeSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandItem {
  id: string;
  label: string;
  category: string;
  onSelect: () => void;
}

export function CommandPalette({ storeSlug, open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);

  const commands = useMemo<CommandItem[]>(() => {
    const base = `/merchant/${encodeURIComponent(storeSlug)}`;
    const go = (path: string) => () => router.push(`${base}${path}`);
    return [
      { id: "home", label: "Home", category: "Go to", onSelect: go("") },
      { id: "orders", label: "Orders", category: "Go to", onSelect: go("/orders") },
      { id: "products", label: "Products", category: "Go to", onSelect: go("/products") },
      { id: "customers", label: "Customers", category: "Go to", onSelect: go("/customers") },
      { id: "discounts", label: "Discounts", category: "Go to", onSelect: go("/discounts") },
      { id: "analytics", label: "Analytics", category: "Go to", onSelect: go("/analytics") },
      { id: "online-store", label: "Online Store", category: "Go to", onSelect: go("/themes") },
      { id: "settings", label: "Settings", category: "Go to", onSelect: go("/settings") },
      {
        id: "view-store",
        label: "View store",
        category: "Storefront",
        onSelect: () => window.open(`/s/${encodeURIComponent(storeSlug)}`, "_blank", "noopener"),
      },
    ];
  }, [router, storeSlug]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? commands.filter(
          (c) => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
        )
      : commands;
  }, [commands, search]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setActive(0);
    }
  }, [open]);

  const run = (item: CommandItem) => {
    onOpenChange(false);
    item.onSelect();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      run(results[active]);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="console fixed left-1/2 top-[15%] z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] outline-none"
        >
          <Dialog.Title className="sr-only">Search the console</Dialog.Title>
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-4">
            <Search className="size-4 shrink-0 text-[var(--ink-2)]" aria-hidden="true" />
            <input
              type="text"
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls="command-results"
              aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
              aria-label="Search pages and actions"
              placeholder="Search pages and actions"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              className="h-12 w-full bg-transparent text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-2)] focus:outline-none focus-visible:outline-none"
            />
            <span className="text-xs text-[var(--ink-2)]">Esc</span>
          </div>

          <ul id="command-results" role="listbox" className="max-h-72 overflow-y-auto p-2">
            {results.length === 0 ? (
              <li className="p-4 text-center text-[13px] text-[var(--ink-2)]">No results.</li>
            ) : (
              results.map((item, i) => (
                <li
                  key={item.id}
                  id={`cmd-${item.id}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => run(item)}
                  className={`flex min-h-11 cursor-pointer items-center justify-between rounded-lg px-3 text-[13px] md:min-h-9 ${
                    i === active ? "bg-[var(--nav-active)]" : ""
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-[var(--ink-2)]">{item.category}</span>
                </li>
              ))
            )}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
