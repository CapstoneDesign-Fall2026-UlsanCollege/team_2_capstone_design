import { describe, expect, it } from "vitest";
import { resolveMerchantStoreAccess, classifyStoreError } from "./merchant-guard";
import { ApiError, MerchantStoreMembership, sanitizeRedirectTarget } from "./api";

const mockStore = (slug: string, name: string): MerchantStoreMembership => ({
  id: 1,
  name,
  slug,
  category: "Coffee & Tea",
  city: "Kathmandu",
  province: "Bagmati",
  theme_preset: "editorial-warm",
  logo_url: "https://example.com/logo.png",
  accent_color: "#18181b",
  role: "OWNER",
  created_at: "2026-11-09T00:00:00Z",
});

describe("sanitizeRedirectTarget (?next= open-redirect defense)", () => {
  it("allows clean relative merchant routes", () => {
    expect(sanitizeRedirectTarget("/merchant/aayushman-shop")).toBe("/merchant/aayushman-shop");
    expect(sanitizeRedirectTarget("/merchant")).toBe("/merchant");
    expect(sanitizeRedirectTarget("/")).toBe("/");
  });

  it("handles storeNameParam priority", () => {
    expect(sanitizeRedirectTarget(null, "My Himalayan Shop")).toBe(
      "/merchant/new?name=My%20Himalayan%20Shop"
    );
  });

  it("blocks protocol-relative URLs (//evil.com)", () => {
    expect(sanitizeRedirectTarget("//evil.com")).toBe("/merchant");
    expect(sanitizeRedirectTarget("///evil.com")).toBe("/merchant");
    expect(sanitizeRedirectTarget("//merchant/evil")).toBe("/merchant");
  });

  it("blocks backslash bypass attempts (/\\evil.com, \\evil.com)", () => {
    expect(sanitizeRedirectTarget("/\\evil.com")).toBe("/merchant");
    expect(sanitizeRedirectTarget("\\evil.com")).toBe("/merchant");
    expect(sanitizeRedirectTarget("/merchant\\something")).toBe("/merchant");
  });

  it("blocks external schemes (https:, http:, javascript:, data:)", () => {
    expect(sanitizeRedirectTarget("https://evil.com")).toBe("/merchant");
    expect(sanitizeRedirectTarget("http://evil.com/merchant")).toBe("/merchant");
    expect(sanitizeRedirectTarget("javascript:alert(1)")).toBe("/merchant");
    expect(sanitizeRedirectTarget("data:text/html,malicious")).toBe("/merchant");
  });

  it("blocks CRLF / newline injection", () => {
    expect(sanitizeRedirectTarget("/merchant\r\nattacker.com")).toBe("/merchant");
    expect(sanitizeRedirectTarget("/merchant\tevil.com")).toBe("/merchant");
  });

  it("falls back safely on null, undefined, or empty values", () => {
    expect(sanitizeRedirectTarget(null)).toBe("/merchant");
    expect(sanitizeRedirectTarget(undefined)).toBe("/merchant");
    expect(sanitizeRedirectTarget("   ")).toBe("/merchant");
  });
});

describe("resolveMerchantStoreAccess", () => {
  it("redirects unauthenticated user to /login with next param", () => {
    const result = resolveMerchantStoreAccess("aayushman-shop", false, []);
    expect(result).toEqual({
      status: "unauthenticated",
      redirectTo: "/login?next=/merchant/aayushman-shop",
    });
  });

  it("authorizes when the user owns the store", () => {
    const myStore = mockStore("aayushman-shop", "Aayushman Shop");
    const result = resolveMerchantStoreAccess("aayushman-shop", true, [myStore]);
    expect(result).toEqual({
      status: "authorized",
      currentStore: myStore,
    });
  });

  it("redirects to user's only store when trying to access another user's store (1 store owned)", () => {
    const myStore = mockStore("aayushman-shop", "Aayushman Shop");
    const result = resolveMerchantStoreAccess("aadi", true, [myStore]);
    expect(result).toEqual({
      status: "unauthorized",
      redirectTo: "/merchant/aayushman-shop",
      notice: "That store isn't available on your account.",
    });
  });

  it("redirects to /merchant store picker when user owns multiple stores", () => {
    const store1 = mockStore("aayushman-shop", "Aayushman Shop");
    const store2 = mockStore("himalayan-craft", "Himalayan Craft");
    const result = resolveMerchantStoreAccess("aadi", true, [store1, store2]);
    expect(result).toEqual({
      status: "unauthorized",
      redirectTo: "/merchant",
      notice: "That store isn't available on your account.",
    });
  });

  it("redirects to /merchant when user owns 0 stores", () => {
    const result = resolveMerchantStoreAccess("aadi", true, []);
    expect(result).toEqual({
      status: "unauthorized",
      redirectTo: "/merchant",
      notice: "That store isn't available on your account.",
    });
  });

  it("behaves identically for nonexistent slug and foreign slug (no store enumeration leak)", () => {
    const myStore = mockStore("aayushman-shop", "Aayushman Shop");
    const foreignResult = resolveMerchantStoreAccess("aadi", true, [myStore]);
    const nonexistentResult = resolveMerchantStoreAccess("nonexistent-store-xyz", true, [myStore]);

    expect(foreignResult).toEqual(nonexistentResult);
  });
});

describe("classifyStoreError", () => {
  it("classifies 401 as auth redirect", () => {
    const err = new ApiError(401, "Authentication credentials were not provided.");
    const result = classifyStoreError(err, "aadi");
    expect(result).toEqual({
      type: "auth",
      redirectTo: "/login?next=/merchant/aadi",
    });
  });

  it("classifies 403 as unauthorized redirect with notice", () => {
    const err = new ApiError(403, "Forbidden");
    const result = classifyStoreError(err, "aadi");
    expect(result).toEqual({
      type: "unauthorized",
      redirectTo: "/merchant",
      notice: "That store isn't available on your account.",
    });
  });

  it("classifies 404 as unauthorized redirect with notice (prevents enumeration leak)", () => {
    const err = new ApiError(404, "Store not found.");
    const result = classifyStoreError(err, "aadi");
    expect(result).toEqual({
      type: "unauthorized",
      redirectTo: "/merchant",
      notice: "That store isn't available on your account.",
    });
  });

  it("classifies 500 as server error (distinct from auth/unauthorized)", () => {
    const err = new ApiError(500, "Internal Server Error");
    const result = classifyStoreError(err, "aadi");
    expect(result).toEqual({
      type: "network_server",
      errorMessage: "Internal Server Error",
    });
  });

  it("classifies TypeError / network failure as network error", () => {
    const err = new TypeError("Failed to fetch");
    const result = classifyStoreError(err, "aadi");
    expect(result).toEqual({
      type: "network_server",
      errorMessage: "Failed to fetch",
    });
  });
});
