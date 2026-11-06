"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export interface AccountContextValue {
  isAccountOpen: boolean;
  prefillEmail: string;
  openAccount: (email?: string) => void;
  closeAccount: () => void;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [prefillEmail, setPrefillEmail] = useState("");
  const pathname = usePathname();

  const openAccount = useCallback((email?: string) => {
    if (email) {
      setPrefillEmail(email);
    }
    setIsAccountOpen(true);
  }, []);

  const closeAccount = useCallback(() => {
    setIsAccountOpen(false);
  }, []);

  return (
    <AccountContext.Provider
      value={{
        isAccountOpen,
        prefillEmail,
        openAccount,
        closeAccount,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return ctx;
}
