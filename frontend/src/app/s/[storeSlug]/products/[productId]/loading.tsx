import React from "react";

export default function ProductDetailLoading() {
  return (
    <div className="min-h-dvh bg-[var(--canvas)] text-[var(--ink)] font-sans flex flex-col">
      {/* Header Skeleton */}
      <header className="h-16 border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6 flex items-center justify-between">
        <div className="h-6 w-32 bg-[var(--border)] rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="w-11 h-11 bg-[var(--border)] rounded-lg animate-pulse" />
          <div className="w-20 h-11 bg-[var(--border)] rounded-lg animate-pulse" />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
          {/* Gallery Skeleton */}
          <div className="space-y-4">
            <div className="aspect-square w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-pulse" />
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-20 h-20 rounded-lg border border-[var(--border)] bg-[var(--surface)] animate-pulse" />
              ))}
            </div>
          </div>

          {/* Details Skeleton */}
          <div className="space-y-6">
            <div className="h-5 w-24 bg-[var(--border)] rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-9 w-4/5 bg-[var(--border)] rounded-lg animate-pulse" />
              <div className="h-7 w-28 bg-[var(--border)] rounded-lg animate-pulse" />
            </div>
            <div className="h-20 w-full bg-[var(--border)] rounded-xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-20 bg-[var(--border)] rounded animate-pulse" />
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-11 w-20 rounded-lg bg-[var(--border)] animate-pulse" />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 pt-4">
              <div className="h-12 w-32 rounded-lg bg-[var(--border)] animate-pulse" />
              <div className="h-12 flex-1 rounded-lg bg-[var(--border)] animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
