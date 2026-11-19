"use client";

import React, { useState } from "react";
import Link from "next/link";
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
      {/* 1. HERO (Centered, flat dusk/white mountain dissolving cleanly into background) */}
      <section className="relative overflow-hidden border-b border-[#E2E2DC] dark:border-white/10 bg-[#F9F9F7] dark:bg-[#0E0F12] px-5 pt-16 pb-16 sm:pt-24 sm:pb-22 text-center">
        {/* Dark-mode dusk backdrop tint dissolving into #0E0F12 */}
        <div
          aria-hidden="true"
          className="hidden dark:block absolute inset-0 pointer-events-none bg-[#1B1E24]"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 92%)",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 92%)",
          }}
        />

        {/* Mountain image dissolving cleanly into background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-[center_30%] bg-no-repeat pointer-events-none opacity-72 dark:opacity-90 mix-blend-multiply dark:mix-blend-soft-light [filter:brightness(0.64)_contrast(5.4)_grayscale(1)] dark:[filter:brightness(0.95)_contrast(1.28)_grayscale(1)]"
          style={{
            backgroundImage: "url('/images/hero-mountain.jpg')",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.95) 45%, rgba(0,0,0,0) 96%)",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.95) 45%, rgba(0,0,0,0) 96%)",
          }}
        />

        <div className="relative z-10 max-w-[660px] mx-auto">
          <h1
            className="text-[34px] sm:text-[54px] font-semibold tracking-[-0.015em] leading-[1.12] sm:leading-[1.08] text-[#161614] dark:text-[#ECECE9]"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          >
            Your shop, online, before your{" "}
            <span className="relative inline-block whitespace-nowrap">
              chiya cools.
              <svg
                aria-hidden="true"
                viewBox="0 0 220 12"
                fill="none"
                preserveAspectRatio="none"
                className="absolute -left-0.5 -right-0.5 -bottom-1.5 w-[calc(100%+4px)] h-[10px] pointer-events-none"
              >
                <path
                  d="M2 8.5C58 3.5 142 2.5 218 7.5"
                  stroke="#F2A900"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-4.5 sm:mt-5 text-[16px] sm:text-[18px] leading-[1.55] text-[#4A4A45] dark:text-[#B4B6BD] max-w-[500px] mx-auto">
            Set up your store and add your products. Customers pay with Khalti or cash on delivery.
          </p>

          {/* Pill shape reserved strictly for main input and CTA */}
          <form onSubmit={handleCreate} className="mt-7.5 max-w-[500px] mx-auto">
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-2">
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Store name, e.g. Himalayan Roasters"
                aria-label="Store name"
                className="flex-1 min-h-[48px] px-5 rounded-full border border-[#C6C6BE] dark:border-white/25 bg-white dark:bg-[#15171B] text-[#161614] dark:text-[#ECECE9] placeholder:text-[#4A4A45] dark:placeholder:text-[#B4B6BD] text-[15px] focus:outline-none focus:border-[#161614] dark:focus:border-[#ECECE9]"
              />
              <button
                type="submit"
                className="min-h-[48px] px-6 rounded-full border border-[#161614] dark:border-[#ECECE9] bg-[#161614] dark:bg-[#ECECE9] text-[#F9F9F7] dark:text-[#0E0F12] font-bold text-[15px] whitespace-nowrap cursor-pointer hover:opacity-90 transition-opacity"
              >
                Create my store →
              </button>
            </div>

            <p
              className="mt-3.5 text-[13px] sc-mono text-[#4A4A45] dark:text-[#B4B6BD]"
              aria-live="polite"
            >
              shopcraft.me/s/
              <strong className="font-semibold text-[#161614] dark:text-[#ECECE9]">
                {slug}
              </strong>
              <span
                aria-hidden="true"
                className="inline-block w-[2px] h-[14px] bg-[#F2A900] align-[-2px] ml-[2px] sc-cursor-blink"
              />
            </p>
          </form>

          <Link
            href="/s/himalayan-roasters"
            className="inline-block mt-4 text-[13px] font-medium text-[#4A4A45] dark:text-[#B4B6BD] hover:text-[#161614] dark:hover:text-[#ECECE9] underline underline-offset-4 transition-colors"
          >
            See how a live store runs →
          </Link>
        </div>
      </section>

      {/* 2. FOUR STORE LOOKS */}
      <ThemeTemplateStudio storeName={storeName} />
    </>
  );
}
