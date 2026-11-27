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

export function isStoreOwner(role?: string | null): boolean {
  return role === "OWNER";
}

export function canRenderMerchantWorkspace(
  status: "loading" | "authorized" | "error",
  currentStore: MerchantStoreMembership | null,
  storeSlug: string
): boolean {
  return status === "authorized" && currentStore !== null && currentStore.slug === storeSlug;
}

export type MerchantPageErrorAction =
  | { kind: "unauthenticated"; redirectTo: string }
  | { kind: "not_found"; redirectTo: string; notice: string }
  | { kind: "forbidden"; message: string }
  | { kind: "error"; message: string };

export function classifyMerchantPageError(
  err: unknown,
  storeSlug: string,
  currentPath?: string
): MerchantPageErrorAction {
  const nextTarget = currentPath || `/merchant/${encodeURIComponent(storeSlug)}`;
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return {
        kind: "unauthenticated",
        redirectTo: `/login?next=${encodeURIComponent(nextTarget)}`,
      };
    }
    if (err.status === 404) {
      return {
        kind: "not_found",
        redirectTo: "/merchant",
        notice: "That store isn't available on your account.",
      };
    }
    if (err.status === 403) {
      return {
        kind: "forbidden",
        message: err.message || "Owner permission required for this action.",
      };
    }
  }

  return {
    kind: "error",
    message: err instanceof Error ? err.message : "Failed to load workspace data.",
  };
}

/**
 * Returns a safe same-origin relative path (starting with a single `/`) or `null`.
 * Blocks external origins, protocol-relative `//`, backslashes, and `javascript:`/`data:` schemes.
 */
export function sanitizeOptionalRedirectTarget(raw?: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return null;
  }
  if (/[\x00-\x1f\\]/.test(trimmed)) {
    return null;
  }
  return trimmed;
}
