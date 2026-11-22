import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, invalidateApiGetCache } from "./api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("apiFetch GET micro-cache invalidation (#62)", () => {
  beforeEach(() => {
    invalidateApiGetCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("caches repeated GET requests within 2.5s when no mutation occurs", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ authenticated: true, user: { id: 1 } }));
    vi.stubGlobal("fetch", fetchMock);

    const first = await apiFetch<{ authenticated: boolean }>("/api/auth/me/");
    const second = await apiFetch<{ authenticated: boolean }>("/api/auth/me/");

    expect(first.authenticated).toBe(true);
    expect(second.authenticated).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("invalidates GET cache after POST logout so immediate session check sees unauthenticated state", async () => {
    let signedIn = true;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || "GET").toUpperCase();
      if (url.endsWith("/api/auth/csrf/")) {
        return jsonResponse({ csrfToken: "csrf-123" });
      }
      if (url.endsWith("/api/auth/logout/") && method === "POST") {
        signedIn = false;
        return jsonResponse({ detail: "Signed out." });
      }
      if (url.endsWith("/api/auth/me/")) {
        return jsonResponse({ authenticated: signedIn, user: signedIn ? { id: 1 } : null });
      }
      return jsonResponse({}, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    const beforeLogout = await apiFetch<{ authenticated: boolean }>("/api/auth/me/");
    expect(beforeLogout.authenticated).toBe(true);

    await apiFetch<{ detail: string }>("/api/auth/logout/", { method: "POST" });

    const afterLogout = await apiFetch<{ authenticated: boolean }>("/api/auth/me/");
    expect(afterLogout.authenticated).toBe(false);
  });

  it("invalidates GET cache on PATCH and DELETE so merchant CRUD reloads fresh server state", async () => {
    let discountActive = true;
    let staffCount = 2;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || "GET").toUpperCase();
      if (url.endsWith("/api/auth/csrf/")) {
        return jsonResponse({ csrfToken: "csrf-123" });
      }
      if (url.endsWith("/discounts/") && method === "GET") {
        return jsonResponse({ discounts: [{ id: 1, is_active: discountActive }] });
      }
      if (url.endsWith("/discounts/1/") && method === "PATCH") {
        discountActive = false;
        return jsonResponse({ id: 1, is_active: false });
      }
      if (url.endsWith("/staff/") && method === "GET") {
        return jsonResponse({ members: Array.from({ length: staffCount }, (_, i) => ({ id: i + 1 })) });
      }
      if (url.endsWith("/staff/2/") && method === "DELETE") {
        staffCount = 1;
        return jsonResponse({ detail: "Removed." });
      }
      return jsonResponse({}, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    const d1 = await apiFetch<{ discounts: Array<{ is_active: boolean }> }>("/api/merchant/stores/shop/discounts/");
    expect(d1.discounts[0].is_active).toBe(true);

    await apiFetch("/api/merchant/stores/shop/discounts/1/", {
      method: "PATCH",
      body: JSON.stringify({ is_active: false }),
    });

    const d2 = await apiFetch<{ discounts: Array<{ is_active: boolean }> }>("/api/merchant/stores/shop/discounts/");
    expect(d2.discounts[0].is_active).toBe(false);

    const s1 = await apiFetch<{ members: Array<{ id: number }> }>("/api/merchant/stores/shop/staff/");
    expect(s1.members).toHaveLength(2);

    await apiFetch("/api/merchant/stores/shop/staff/2/", { method: "DELETE" });

    const s2 = await apiFetch<{ members: Array<{ id: number }> }>("/api/merchant/stores/shop/staff/");
    expect(s2.members).toHaveLength(1);
  });

  it("prevents an in-flight pre-mutation GET from poisoning the cache after a mutation", async () => {
    let resolveStaleGet!: (res: Response) => void;
    let getCall = 0;

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || "GET").toUpperCase();
      if (url.endsWith("/api/auth/csrf/")) {
        return Promise.resolve(jsonResponse({ csrfToken: "csrf-123" }));
      }
      if (url.endsWith("/api/auth/me/") && method === "GET") {
        getCall += 1;
        if (getCall === 1) {
          return new Promise<Response>((resolve) => {
            resolveStaleGet = resolve;
          });
        }
        return Promise.resolve(jsonResponse({ authenticated: true, user: { id: 99 } }));
      }
      if (url.endsWith("/api/auth/otp/verify/") && method === "POST") {
        return Promise.resolve(jsonResponse({ ok: true }));
      }
      return Promise.resolve(jsonResponse({}, 404));
    });
    vi.stubGlobal("fetch", fetchMock);

    const stalePromise = apiFetch<{ authenticated: boolean }>("/api/auth/me/");
    await apiFetch("/api/auth/otp/verify/", { method: "POST", body: JSON.stringify({ code: "123456" }) });

    resolveStaleGet(jsonResponse({ authenticated: false, user: null }));
    const staleResult = await stalePromise;
    expect(staleResult.authenticated).toBe(false);

    const freshResult = await apiFetch<{ authenticated: boolean; user: { id: number } | null }>("/api/auth/me/");
    expect(freshResult.authenticated).toBe(true);
    expect(freshResult.user?.id).toBe(99);
  });

  it("bypasses recentGetCache when cache option is no-store", async () => {
    let callCount = 0;
    const fetchMock = vi.fn(async () => {
      callCount += 1;
      return jsonResponse({ count: callCount });
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = await apiFetch<{ count: number }>("/api/auth/me/");
    const second = await apiFetch<{ count: number }>("/api/auth/me/", { cache: "no-store" });

    expect(first.count).toBe(1);
    expect(second.count).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
