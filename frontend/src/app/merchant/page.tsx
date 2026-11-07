"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchMyStores, fetchSession, logoutSession } from "@/lib/api";
import { Loader2, LogOut, ShieldAlert, Store } from "lucide-react";

export default function MerchantIndexRedirectPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("Resolving merchant workspace...");
  const [noAccessEmail, setNoAccessEmail] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

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

        if (res.stores && res.stores.length > 0) {
          const lastActiveSlug =
            typeof window !== "undefined"
              ? localStorage.getItem("shopcraft_active_store_slug")
              : null;

          const matched = lastActiveSlug
            ? res.stores.find((s) => s.slug === lastActiveSlug)
            : null;

          const targetSlug = matched ? matched.slug : res.stores[0].slug;
          router.replace(`/merchant/${encodeURIComponent(targetSlug)}`);
        } else {
          // A customer sign-in or merchant login without StoreMembership grants nothing on /merchant
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

  if (noAccessEmail !== null || loadError) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-xl border border-zinc-800 bg-zinc-900/90 text-center space-y-5 shadow-2xl">
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
