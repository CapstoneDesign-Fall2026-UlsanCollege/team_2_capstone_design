import React from "react";
import Link from "next/link";
import { ArrowLeft, Search, Store } from "lucide-react";
import { Chip } from "@/components/ui/chip";

export default function RootNotFound() {
  return (
    <div
      data-store-theme="editorial-warm"
      className="min-h-dvh bg-[var(--canvas)] text-[var(--ink)] flex flex-col items-center justify-center p-4 font-sans"
    >
      <div className="w-full max-w-md p-6 sm:p-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center space-y-6">
        <div className="inline-flex justify-center">
          <Chip tone="neutral">404 Not Found</Chip>
        </div>

        <div className="w-14 h-14 rounded-full bg-[var(--canvas)] border border-[var(--border)] text-[var(--ink-2)] mx-auto flex items-center justify-center">
          <Search className="w-7 h-7" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-[var(--ink)]">
            Store or Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-sm mx-auto leading-relaxed">
            The store, product, or URL you are trying to visit does not exist or has been relocated.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5 max-w-xs mx-auto">
          <Link
            href="/"
            className="w-full min-h-[44px] h-12 rounded-lg bg-[var(--primary)] text-[var(--surface)] hover:bg-[var(--primary-hover)] text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to ShopCraft Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
