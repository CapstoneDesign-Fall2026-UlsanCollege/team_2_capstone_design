"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { ApiError, fetchMyStores, fetchSession, MerchantStoreMembership } from "@/lib/api";
import { resolveMerchantStoreAccess, classifyStoreError } from "@/lib/merchant-guard";
import { ConsoleShell } from "@/components/merchant/ConsoleShell";
import { MerchantStoreProvider } from "@/context/MerchantStoreContext";
import { Button } from "@/components/ui/button";

interface MerchantStoreGuardProps {
  storeSlug: string;
  children: React.ReactNode;
}

export function MerchantStoreGuard({ storeSlug, children }: MerchantStoreGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "authorized" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stores, setStores] = useState<MerchantStoreMembership[]>([]);
  const [currentStore, setCurrentStore] = useState<MerchantStoreMembership | null>(null);

  const validateAccess = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      // 1. Verify user is authenticated
      const session = await fetchSession();
      if (!session.authenticated) {
        router.replace(`/login?next=/merchant/${encodeURIComponent(storeSlug)}`);
        return;
      }

      // 2. Fetch authenticated user's store memberships
      const res = await fetchMyStores();
      const userStores = res.stores || [];
      setStores(userStores);

      // 3. Resolve membership access
      const access = resolveMerchantStoreAccess(storeSlug, session.authenticated, userStores);
      if (access.status === "authorized") {
        setCurrentStore(access.currentStore);
        if (typeof window !== "undefined") {
          localStorage.setItem("shopcraft_active_store_slug", storeSlug);
        }
        setStatus("authorized");
        return;
      }

      if (access.status === "unauthenticated") {
        router.replace(access.redirectTo);
        return;
      }

      // access.status === "unauthorized"
      if (typeof window !== "undefined") {
        sessionStorage.setItem("shopcraft_merchant_notice", access.notice);
      }
      router.replace(access.redirectTo);
    } catch (err: unknown) {
      const classified = classifyStoreError(err, storeSlug);
      if (classified.type === "auth" && classified.redirectTo) {
        router.replace(classified.redirectTo);
        return;
      }
      if (classified.type === "unauthorized" && classified.redirectTo) {
        if (typeof window !== "undefined" && classified.notice) {
          sessionStorage.setItem("shopcraft_merchant_notice", classified.notice);
        }
        router.replace(classified.redirectTo);
        return;
      }

      // Distinct network failure or 5xx server error
      setErrorMessage(classified.errorMessage || "Unable to connect to merchant services");
      setStatus("error");
    }
  }, [storeSlug, router]);

  useEffect(() => {
    validateAccess();
  }, [validateAccess]);

  // Loading skeleton: neutral shell outline with NO store name or guessed text
  if (status === "loading") {
    return (
      <div
        className="flex min-h-dvh bg-[var(--canvas)] text-[var(--ink)]"
        aria-busy="true"
        aria-label="Loading merchant workspace"
      >
        {/* Neutral sidebar skeleton */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] p-4 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-[var(--nav-active)] animate-pulse" />
            <div className="h-4 w-28 rounded bg-[var(--nav-active)] animate-pulse" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-9 w-full rounded-lg bg-[var(--nav-active)] animate-pulse" />
            ))}
          </div>
        </aside>

        {/* Neutral content skeleton */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4 lg:px-6">
            <div className="h-4 w-36 rounded bg-[var(--surface)] animate-pulse" />
            <div className="flex gap-2">
              <div className="h-9 w-24 rounded-lg bg-[var(--surface)] animate-pulse" />
              <div className="h-9 w-28 rounded-lg bg-[var(--surface)] animate-pulse" />
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="h-8 w-32 rounded bg-[var(--surface)] animate-pulse" />
            <div className="h-28 rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-pulse" />
              ))}
            </div>
            <div className="h-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-pulse" />
          </main>
        </div>
      </div>
    );
  }

  // Error state: reserved exclusively for genuine network or 5xx server issues
  if (status === "error") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--canvas)] p-4">
        <div className="mx-auto max-w-md p-8 text-center space-y-4">
          <div className="size-10 rounded-full border border-[var(--error-bd)] bg-[var(--error-bg)] text-[var(--error-fg)] flex items-center justify-center mx-auto">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--ink)]">
              {errorMessage || "Unable to connect to merchant services"}
            </p>
            <p className="text-xs text-[var(--ink-2)]">
              Please verify your network connection or try again.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-2">
            <Button onClick={() => validateAccess()} variant="primary" size="sm">
              <RefreshCw className="size-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentStore) return null;

  return (
    <MerchantStoreProvider value={{ storeSlug, currentStore, stores }}>
      <ConsoleShell storeSlug={storeSlug} currentStore={currentStore} stores={stores}>
        {children}
      </ConsoleShell>
    </MerchantStoreProvider>
  );
}
