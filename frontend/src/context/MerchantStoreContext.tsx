"use client";

import React, { createContext, useContext } from "react";
import { MerchantStoreMembership } from "@/lib/api";

export interface MerchantStoreContextValue {
  storeSlug: string;
  currentStore: MerchantStoreMembership;
  stores: MerchantStoreMembership[];
}

const MerchantStoreContext = createContext<MerchantStoreContextValue | null>(null);

export function useMerchantStore(): MerchantStoreContextValue {
  const ctx = useContext(MerchantStoreContext);
  if (!ctx) {
    throw new Error("useMerchantStore must be used within a MerchantStoreProvider");
  }
  return ctx;
}

export function MerchantStoreProvider({
  value,
  children,
}: {
  value: MerchantStoreContextValue;
  children: React.ReactNode;
}) {
  return (
    <MerchantStoreContext.Provider value={value}>
      {children}
    </MerchantStoreContext.Provider>
  );
}
