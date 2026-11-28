"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function slugifyStoreName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface StoreNameFormProps {
  value?: string;
  onChange?: (val: string) => void;
  showMeta?: boolean;
  inputId?: string;
}

export function StoreNameForm({
  value,
  onChange,
  showMeta = false,
  inputId,
}: StoreNameFormProps) {
  const [internalName, setInternalName] = useState("");
  const isControlled = value !== undefined;
  const storeName = isControlled ? value : internalName;
  const setStoreName = (next: string) => {
    if (!isControlled) setInternalName(next);
    onChange?.(next);
  };

  const slug = slugifyStoreName(storeName) || "your-store";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = storeName.trim();
    window.location.href = trimmed
      ? `/signup?name=${encodeURIComponent(trimmed)}&next=/merchant/new`
      : "/signup?next=/merchant/new";
  };

  return (
    <div className="mx-auto max-w-[560px]">
      <form
        onSubmit={handleSubmit}
        className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-[20px] sm:rounded-full bg-card border border-line-strong focus-within:border-accent p-2 sm:p-1.5 transition-colors duration-200"
      >
        <div className="flex flex-1 min-w-0 items-center px-3 sm:pl-4">
          {storeName.length === 0 && (
            <span
              aria-hidden="true"
              className="w-0.5 h-[18px] bg-gold shrink-0 mr-1.5 platform-caret-blink"
            />
          )}
          <input
            id={inputId}
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Store name, e.g. Himalayan Roasters"
            aria-label="Store name"
            className="w-full min-h-[46px] bg-transparent text-ink placeholder:text-ink-3 text-[15px] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="group min-h-[48px] px-6 rounded-[14px] sm:rounded-full bg-btn hover:bg-btn-hover text-btn-ink font-semibold text-sm inline-flex items-center justify-center gap-2 shrink-0 transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          <span>Create my store</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </form>

      {showMeta && (
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[12.5px] text-ink-3">
          <span className="font-mono" aria-live="polite">
            shopcraft.me/s/<strong className="text-ink">{slug}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <Link
            href="/s/kora-coffee-tea"
            className="inline-flex items-center min-h-[44px] py-2 font-medium text-accent underline decoration-[var(--sc-gold)] underline-offset-4 hover:opacity-85 transition-opacity"
          >
            See how a live store runs →
          </Link>
          <span aria-hidden="true">·</span>
          <span>Free while in beta</span>
        </div>
      )}
    </div>
  );
}
