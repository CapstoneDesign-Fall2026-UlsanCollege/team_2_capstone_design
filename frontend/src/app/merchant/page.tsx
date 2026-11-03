"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMyStores, fetchSession } from "@/lib/api";
import { Loader2, Store } from "lucide-react";

export default function MerchantIndexRedirectPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("Resolving merchant workspace...");

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
          const lastActiveSlug = typeof window !== "undefined"
            ? localStorage.getItem("shopcraft_active_store_slug")
            : null;

          const matched = lastActiveSlug
            ? res.stores.find((s) => s.slug === lastActiveSlug)
            : null;

          const targetSlug = matched ? matched.slug : res.stores[0].slug;
          router.replace(`/merchant/${encodeURIComponent(targetSlug)}`);
        } else {
          router.replace("/merchant/new");
        }
      } catch (err) {
        if (!mounted) return;
        router.replace("/merchant/new");
      }
    }

    resolveMerchantStore();

    return () => {
      mounted = false;
    };
  }, [router]);

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
