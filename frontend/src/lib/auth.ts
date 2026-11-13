"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchSession,
  fetchStorefrontAccount,
  logoutSession,
  StorefrontCustomerProfile,
  UserProfile,
} from "./api";
import { getStorefrontAccountBadge } from "./storefront-helpers";

const AUTH_CHANGE_EVENT = "shopcraft:auth-change";

export function emitAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
  }
}

export interface StorefrontAuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  customer: StorefrontCustomerProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useStorefrontAuth(storeSlug: string): StorefrontAuthState {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [customer, setCustomer] = useState<StorefrontCustomerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAuth = useCallback(async () => {
    try {
      const session = await fetchSession();
      if (session.authenticated && session.user) {
        try {
          const account = await fetchStorefrontAccount(storeSlug, { lookupOnly: true });
          const { isStorefrontCustomer } = getStorefrontAccountBadge(true, account.customer);
          if (isStorefrontCustomer && account.customer) {
            setIsAuthenticated(true);
            setCustomer(account.customer);
            setUser(account.user || session.user);
          } else {
            setIsAuthenticated(false);
            setUser(null);
            setCustomer(null);
          }
        } catch {
          setIsAuthenticated(false);
          setUser(null);
          setCustomer(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setCustomer(null);
      }
    } catch {
      setIsAuthenticated(false);
      setUser(null);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    // Defer so state updates never run synchronously in the effect body.
    void Promise.resolve().then(loadAuth);

    const handleAuthChange = () => {
      loadAuth();
    };

    if (typeof window !== "undefined") {
      window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      return () => {
        window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      };
    }
  }, [loadAuth]);

  const signOut = useCallback(async () => {
    try {
      await logoutSession();
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setCustomer(null);
      emitAuthChange();
    }
  }, []);

  return {
    isAuthenticated,
    user,
    customer,
    loading,
    refresh: loadAuth,
    signOut,
  };
}
