"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchMyStores, fetchSession, logoutSession, MerchantStoreMembership } from "@/lib/api";
import { AlertTriangle, Loader2, LogOut, Plus, ShieldAlert, Store } from "lucide-react";

export default function MerchantIndexRedirectPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("Resolving merchant workspace...");
  const [noAccessEmail, setNoAccessEmail] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [userStores, setUserStores] = useState<MerchantStoreMembership[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("shopcraft_merchant_notice");
      if (stored) {
        setNotice(stored);
        sessionStorage.removeItem("shopcraft_merchant_notice");
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function resolveMerchantStore() {
      try {
        const session = await fetchSession();
        if (!mounted) return;

        if (!session.authenticated) {
          router.replace("/login?next=/merchant");
          return;
        }

        setStatusMessage("Loading your stores...");
        const res = await fetchMyStores();
        if (!mounted) return;

        const stores = res.stores || [];
        const lastActiveSlug =
          typeof window !== "undefined"
            ? localStorage.getItem("shopcraft_active_store_slug")
            : null;
        const validLastActive = lastActiveSlug
          ? stores.find((s) => s.slug === lastActiveSlug)
          : null;

        // If stale or invalid slug is stored (e.g. from visiting an unowned store like 'aadi'), clear it immediately
        if (lastActiveSlug && !validLastActive && typeof window !== "undefined") {
          localStorage.removeItem("shopcraft_active_store_slug");
        }

        if (stores.length === 1) {
          // Exactly 1 store: auto-route directly to it
          router.replace(`/merchant/${encodeURIComponent(stores[0].slug)}`);
        } else if (stores.length > 1) {
          // Multiple stores: if user previously worked in one of their valid stores, route to it
          if (validLastActive) {
            router.replace(`/merchant/${encodeURIComponent(validLastActive.slug)}`);
            return;
          }
          // Otherwise display the store picker
          setUserStores(stores);
        } else {
          // 0 stores: render the "No Merchant Store Access" with "Create your shop" CTA
          setNoAccessEmail(session.user?.email || "");
        }
      } catch {
        if (!mounted) return;
        setLoadError("Unable to verify merchant store memberships. Please try again.");
      }
    }

    resolveMerchantStore();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logoutSession();
      router.replace("/login?next=/merchant");
    } finally {
      setSigningOut(false);
    }
  };

  // Multiple stores: store picker UI
  if (userStores && userStores.length > 1) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-xl border border-zinc-800 bg-zinc-900/90 space-y-5 shadow-2xl">
          {notice && (
            <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
              <AlertTriangle className="size-4 shrink-0 text-amber-400" />
              <span>{notice}</span>
            </div>
          )}

          <div className="text-center space-y-1">
            <h1 className="text-base font-semibold text-zinc-100">Select a Store</h1>
            <p className="text-xs text-zinc-400">
              You belong to multiple merchant workspaces. Choose which store to open:
            </p>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {userStores.map((st) => (
              <Link
                key={st.slug}
                href={`/merchant/${encodeURIComponent(st.slug)}`}
                className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/60 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-100">
                    {st.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="truncate text-xs font-medium text-zinc-100">{st.name}</p>
                    <p className="text-[11px] text-zinc-400 font-mono">/s/{st.slug}</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {st.role}
                </span>
              </Link>
            ))}
          </div>

          <div className="pt-2 space-y-2">
            <Link
              href="/merchant/new"
              className="w-full h-10 rounded-lg border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800/60 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create another store</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full h-10 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{signingOut ? "Signing out..." : "Sign out & switch account"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 0 stores or Load Error
  if (noAccessEmail !== null || loadError) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-xl border border-zinc-800 bg-zinc-900/90 text-center space-y-5 shadow-2xl">
          {notice && (
            <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200 text-left">
              <AlertTriangle className="size-4 shrink-0 text-amber-400" />
              <span>{notice}</span>
            </div>
          )}

          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-base font-semibold text-zinc-100">
              {loadError ? "Workspace Unavailable" : "No Merchant Store Access"}
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {loadError
                ? loadError
                : `Your signed-in account${
                    noAccessEmail ? ` (${noAccessEmail})` : ""
                  } does not have a membership in any merchant store.`}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            {noAccessEmail !== null && (
              <Link
                href="/merchant/new"
                className="w-full h-11 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <Store className="w-4 h-4" />
                <span>Create your shop →</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full h-11 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-50 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{signingOut ? "Signing out..." : "Sign out & switch account"}</span>
            </button>

            <Link
              href="/"
              className="w-full h-10 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 text-xs font-medium flex items-center justify-center transition-colors"
            >
              Return to ShopCraft Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading spinner
  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm p-8 rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
          <Store className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-zinc-100">ShopCraft Merchant Console</h2>
          <p className="text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>{statusMessage}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
