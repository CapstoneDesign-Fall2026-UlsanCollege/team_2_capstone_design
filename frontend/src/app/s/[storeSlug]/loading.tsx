import React from "react";

export default function StorefrontLoading() {
  return (
    <div className="min-h-dvh bg-[var(--canvas)] text-[var(--ink)] font-sans flex flex-col">
      {/* Announcement Bar Skeleton */}
      <div className="w-full h-9 bg-[var(--ink)] animate-pulse" />

      {/* Header Skeleton */}
      <header className="h-16 border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-32 bg-[var(--border)] rounded-md animate-pulse" />
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="h-4 w-16 bg-[var(--border)] rounded animate-pulse" />
          <div className="h-4 w-16 bg-[var(--border)] rounded animate-pulse" />
          <div className="h-4 w-24 bg-[var(--border)] rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-11 h-11 bg-[var(--border)] rounded-lg animate-pulse" />
          <div className="w-20 h-11 bg-[var(--border)] rounded-lg animate-pulse" />
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* Hero Section Skeleton (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="h-4 w-28 bg-[var(--border)] rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-10 w-4/5 bg-[var(--border)] rounded-lg animate-pulse" />
              <div className="h-10 w-3/5 bg-[var(--border)] rounded-lg animate-pulse" />
            </div>
            <div className="h-16 w-full max-w-md bg-[var(--border)] rounded-lg animate-pulse" />
            <div className="flex items-center gap-4 pt-2">
              <div className="h-12 w-48 bg-[var(--border)] rounded-lg animate-pulse" />
              <div className="h-6 w-24 bg-[var(--border)] rounded animate-pulse" />
            </div>
            <div className="h-4 w-72 bg-[var(--border)] rounded animate-pulse" />
          </div>

          {/* Right Column (Product Image Card) */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-3">
            <div className="aspect-4/3 w-full bg-[var(--border)] rounded-xl animate-pulse" />
            <div className="flex items-center justify-between px-1">
              <div className="h-5 w-36 bg-[var(--border)] rounded animate-pulse" />
              <div className="h-5 w-20 bg-[var(--border)] rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Product Grid Skeleton (4 columns) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-7 w-40 bg-[var(--border)] rounded-lg animate-pulse" />
            <div className="h-9 w-28 bg-[var(--border)] rounded-lg animate-pulse" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-3"
              >
                <div className="aspect-square w-full bg-[var(--border)] rounded-lg animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-4 w-3/4 bg-[var(--border)] rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-[var(--border)] rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="h-5 w-16 bg-[var(--border)] rounded animate-pulse" />
                  <div className="h-10 w-16 bg-[var(--border)] rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
