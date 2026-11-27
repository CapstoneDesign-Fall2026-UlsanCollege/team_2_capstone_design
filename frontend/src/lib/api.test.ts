import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiFetch,
  fetchMerchantCustomersPage,
  fetchMerchantProductsPage,
  fetchStoreCatalog,
  invalidateApiGetCache,
} from "./api";

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...extraHeaders },
  });
}

describe("fetchMerchantCustomersPage pagination headers", () => {
  beforeEach(() => invalidateApiGetCache());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const row = (id: number, orders = 0, spent = 0) => ({
    id, email: `c${id}@x.com`, full_name: `C${id}`, phone: "", orders_count: orders,
    total_spent_minor: spent, city: "", created_at: "2026-01-01T00:00:00Z",
  });

  it("reads total, page, has_more and store-wide KPIs from response headers", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse([row(1, 3, 100), row(2)], 200, {
        "X-Total-Count": "130", "X-Page": "2", "X-Page-Size": "50", "X-Has-More": "1",
        "X-Repeat-Customers": "40", "X-Total-Spent-Minor": "120000",
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchMerchantCustomersPage("shop", { page: 2 });
    expect(res.pagination).toEqual({ total: 130, page: 2, page_size: 50, has_more: true });
    expect(res.repeatCustomers).toBe(40);
    expect(res.totalSpentMinor).toBe(120000);
    expect(res.customers).toHaveLength(2);
    const url = String((fetchMock.mock.calls[0] as unknown[])[0]);
    expect(url).toContain("page=2");
  });

  it("falls back to the loaded rows when the server sends no pagination headers", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse([row(1, 2, 500), row(2, 1, 200)])));
    const res = await fetchMerchantCustomersPage("shop");
    expect(res.pagination.total).toBe(2);
    expect(res.pagination.has_more).toBe(false);
    expect(res.repeatCustomers).toBe(1);
    expect(res.totalSpentMinor).toBe(700);
  });

  it("does not serve a stale cached page (each page is fetched fresh)", async () => {
    const fetchMock = vi.fn(async () => jsonResponse([row(1)], 200, { "X-Total-Count": "1", "X-Has-More": "0" }));
    vi.stubGlobal("fetch", fetchMock);
    await fetchMerchantCustomersPage("shop");
    await fetchMerchantCustomersPage("shop");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("puts the search query and page size in the URL, encoded", async () => {
    const fetchMock = vi.fn(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);
    await fetchMerchantCustomersPage("my shop", { query: "a&b c", pageSize: 25 });
    const url = String((fetchMock.mock.calls[0] as unknown[])[0]);
    expect(url).toContain("/api/merchant/stores/my%20shop/customers/");
    expect(url).toContain("q=a%26b+c");
    expect(url).toContain("page_size=25");
  });

  it("surfaces API errors instead of returning an empty page", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ detail: "Not found." }, 404)));
    await expect(fetchMerchantCustomersPage("nope")).rejects.toMatchObject({ status: 404 });
  });
});

describe("fetchMerchantProductsPage & fetchStoreCatalog pagination", () => {
  beforeEach(() => invalidateApiGetCache());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const prod = (id: number, active = true) => ({
    id,
    slug: `p-${id}`,
    name: `Product ${id}`,
    description: "",
    image_url: "",
    attributes: {},
    allow_one_time: true,
    is_active: active,
    sort_order: id,
    variants: [],
  });

  it("reads product pagination and status counts from X-* headers", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse([prod(1, true), prod(2, false)], 200, {
        "X-Total-Count": "75",
        "X-Page": "2",
        "X-Page-Size": "50",
        "X-Has-More": "1",
        "X-All-Count": "75",
        "X-Active-Count": "65",
        "X-Draft-Count": "10",
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchMerchantProductsPage("demo-shop", {
      status: "draft",
      q: "matcha",
      page: 2,
      pageSize: 50,
    });

    expect(res.pagination).toEqual({ total: 75, page: 2, page_size: 50, has_more: true });
    expect(res.allCount).toBe(75);
    expect(res.activeCount).toBe(65);
    expect(res.draftCount).toBe(10);
    expect(res.products).toHaveLength(2);
    const url = String((fetchMock.mock.calls[0] as unknown[])[0]);
    expect(url).toContain("status=draft");
    expect(url).toContain("q=matcha");
    expect(url).toContain("page=2");
    expect(url).toContain("page_size=50");
  });

  it("falls back when product headers are absent", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse([prod(1, true), prod(2, false)])));
    const res = await fetchMerchantProductsPage("demo-shop");
    expect(res.pagination.total).toBe(2);
    expect(res.pagination.has_more).toBe(false);
    expect(res.allCount).toBe(2);
    expect(res.activeCount).toBe(1);
    expect(res.draftCount).toBe(1);
  });

  it("appends catalog page and search params when requested", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ products: [prod(1)], pagination: { total: 65, page: 2, page_size: 48, has_more: false } })
    );
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchStoreCatalog("demo-shop", { page: 2, pageSize: 48, q: "oolong" });
    expect(res.pagination?.total).toBe(65);
    const url = String((fetchMock.mock.calls[0] as unknown[])[0]);
    expect(url).toContain("/api/stores/demo-shop/catalog/?");
    expect(url).toContain("page=2");
    expect(url).toContain("page_size=48");
    expect(url).toContain("q=oolong");
  });
});

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
