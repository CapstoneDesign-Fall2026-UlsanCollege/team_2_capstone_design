import { ApiError, MerchantStoreMembership } from "@/lib/api";

export type StoreAccessResult =
  | { status: "unauthenticated"; redirectTo: string }
  | { status: "authorized"; currentStore: MerchantStoreMembership }
  | { status: "unauthorized"; redirectTo: string; notice: string };

export function resolveMerchantStoreAccess(
  storeSlug: string,
  authenticated: boolean,
  userStores: MerchantStoreMembership[]
): StoreAccessResult {
  if (!authenticated) {
    return {
      status: "unauthenticated",
      redirectTo: `/login?next=/merchant/${encodeURIComponent(storeSlug)}`,
    };
  }

  const matched = userStores.find((s) => s.slug === storeSlug);
  if (matched) {
    return {
      status: "authorized",
      currentStore: matched,
    };
  }

  const notice = "That store isn't available on your account.";
  if (userStores.length === 1) {
    return {
      status: "unauthorized",
      redirectTo: `/merchant/${encodeURIComponent(userStores[0].slug)}`,
      notice,
    };
  }

  return {
    status: "unauthorized",
    redirectTo: "/merchant",
    notice,
  };
}

export function classifyStoreError(
  err: unknown,
  storeSlug: string
): {
  type: "auth" | "unauthorized" | "network_server";
  redirectTo?: string;
  notice?: string;
  errorMessage?: string;
} {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return {
        type: "auth",
        redirectTo: `/login?next=/merchant/${encodeURIComponent(storeSlug)}`,
      };
    }
    if (err.status === 403 || err.status === 404) {
      return {
        type: "unauthorized",
        redirectTo: "/merchant",
        notice: "That store isn't available on your account.",
      };
    }
  }

  const msg = err instanceof Error ? err.message : "Unable to connect to merchant services";
  return {
    type: "network_server",
    errorMessage: msg,
  };
}
