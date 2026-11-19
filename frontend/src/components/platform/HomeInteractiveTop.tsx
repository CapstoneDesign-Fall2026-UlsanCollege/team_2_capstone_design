"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ThemeTemplateStudio } from "@/components/platform/ThemeTemplateStudio";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function HomeInteractiveTop() {
  const [storeName, setStoreName] = useState("");
  const slug = slugify(storeName) || "your-store";

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = storeName.trim();
    window.location.href = name
      ? `/signup?name=${encodeURIComponent(name)}&next=/merchant/new`
      : "/signup?next=/merchant/new";
  };

  return (
    <>
      {/* 1. Hero: one input */}
      <section className="relative z-10 pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-900 dark:text-white leading-[1.08]">
          Your shop, online, before your chiya cools.
        </h1>
        <p className="mt-6 text-base sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Set up your online store in Nepal and add your products. Customers pay with Khalti or cash on delivery.
        </p>

        <form onSubmit={handleCreate} className="mt-10 max-w-lg mx-auto">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Store name, e.g. Himalayan Roasters"
              aria-label="Store name"
              className="flex-1 min-h-[48px] px-5 py-3 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm focus:border-zinc-500 dark:focus:border-white/40"
            />
            <button
              type="submit"
              className="min-h-[48px] px-6 py-3 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <span>Create my store</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-3 text-xs font-mono text-zinc-500 dark:text-zinc-400" aria-live="polite">
            shopcraft.me/s/<span className="font-bold text-zinc-900 dark:text-white">{slug}</span>
          </p>
        </form>

        <div className="mt-4">
          <Link
            href="/s/himalayan-roasters"
            className="inline-flex items-center min-h-[44px] px-3 py-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white underline underline-offset-4 transition-colors"
          >
            Or browse a live example store →
          </Link>
        </div>
      </section>

      {/* 2. Live storefront preview with theme switching */}
      <ThemeTemplateStudio storeName={storeName} />
    </>
  );
}
