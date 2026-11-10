"use client";

import { useEffect, useState } from "react";
import { fetchMerchantStoreOverview, fetchMyStores, MerchantStoreMembership } from "@/lib/api";

/**
 * Stores the signed-in user belongs to. Presentation only: uses the existing
 * authenticated endpoint; tenant resolution happens server-side.
 */
export function useMyStores(storeSlug?: string) {
  const [stores, setStores] = useState<MerchantStoreMembership[]>([]);

  useEffect(() => {
    let active = true;
    fetchMyStores()
      .then((res) => active && setStores(res.stores ?? []))
      .catch(() => active && setStores([]));
    return () => {
      active = false;
    };
  }, [storeSlug]);

  return stores;
}

/** Orders waiting to be handed to the courier (sidebar count badge). */
export function useOrdersToDispatch(storeSlug: string, refreshKey: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    fetchMerchantStoreOverview(storeSlug)
      .then((ov) => active && setCount(ov.pending_fulfillment_count ?? 0))
      .catch(() => active && setCount(0));
    return () => {
      active = false;
    };
  }, [storeSlug, refreshKey]);

  return count;
}
