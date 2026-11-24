import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@radix-ui/react-dialog", () => ({
  Root: ({ open, children }: { open?: boolean; children?: React.ReactNode }) =>
    open ? React.createElement("div", { "data-dialog-root": "true" }, children) : null,
  Portal: ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  Overlay: () => React.createElement("div"),
  Content: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", null, children),
  Title: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("h2", null, children),
  Description: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("p", null, children),
  Close: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", null, children),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => React.createElement("a", { href, ...rest }, children),
}));

import {
  ApiError,
  authenticateWithGoogle,
  fetchMyStores,
  fetchSession,
  invalidateApiGetCache,
  logoutSession,
  type MerchantStoreMembership,
  type MerchantStoreSettings,
  verifyEmailOtp,
} from "./api";
import {
  canRenderMerchantWorkspace,
  classifyMerchantPageError,
  isStoreOwner,
} from "./merchant-guard";
import { SettingsForm } from "@/components/merchant/SettingsForm";
import { AuditLogPanel } from "@/components/merchant/StaffAndAuditSection";
import { SetupGuideCard } from "@/components/merchant/SetupGuideCard";

const makeStore = (slug: string, role: "OWNER" | "STAFF" = "OWNER"): MerchantStoreMembership => ({
  id: slug === "store-a" ? 1 : 2,
  name: slug === "store-a" ? "Store A" : "Store B",
  slug,
  category: "Specialty Coffee & Tea",
  city: "Kathmandu",
  province: "Bagmati Province",
  theme_preset: "editorial-warm",
  logo_url: "",
  accent_color: "#18181b",
  role,
  created_at: "2026-11-09T00:00:00Z",
});

const makeSettings = (
  memberRole?: "OWNER" | "STAFF"
): MerchantStoreSettings => ({
  slug: "store-a",
  name: "Store A",
  tagline: "Small-batch craft",
  category: "Specialty Coffee & Tea",
  city: "Lalitpur",
  province: "Bagmati Province",
  contact_phone: "9800000001",
  contact_email: "owner@storea.np",
  support_email: "support@storea.np",
  address: "Jhamsikhel",
  story_headline: "Our story",
  about_text: "Crafted in Nepal",
  instagram_url: "",
  facebook_url: "",
  theme_preset: "editorial-warm",
  accent_color: "#18181b",
  logo_url: "",
  banner_url: "",
  currency: "NPR",
  inside_valley_shipping_minor: 10000,
  outside_valley_shipping_minor: 20000,
  free_shipping_threshold_minor: 150000,
  shipping_configured: true,
  has_khalti: false,
  has_custom_khalti_key: false,
  khalti_mode: "TEST",
  khalti_key_masked: "",
  cod_enabled: true,
  custom_domain: "",
  member_role: memberRole,
});

describe("Merchant RBAC & Cross-Tenant Frontend Guards", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    invalidateApiGetCache();
  });

  it("isStoreOwner fails closed for non-OWNER roles and missing values", () => {
    expect(isStoreOwner("OWNER")).toBe(true);
    expect(isStoreOwner("STAFF")).toBe(false);
    expect(isStoreOwner("")).toBe(false);
    expect(isStoreOwner(null)).toBe(false);
    expect(isStoreOwner(undefined)).toBe(false);
    expect(isStoreOwner("owner")).toBe(false);
  });

  it("canRenderMerchantWorkspace blocks stale Store A render frame when navigating to Store B", () => {
    const storeA = makeStore("store-a", "OWNER");
    const storeB = makeStore("store-b", "OWNER");

    // Cross-slug race condition: guard still holds Store A from previous route while URL is now store-b
    expect(canRenderMerchantWorkspace("authorized", storeA, "store-b")).toBe(false);
    expect(canRenderMerchantWorkspace("loading", storeA, "store-a")).toBe(false);
    expect(canRenderMerchantWorkspace("error", storeA, "store-a")).toBe(false);
    expect(canRenderMerchantWorkspace("authorized", null, "store-a")).toBe(false);

    // Authorized ONLY when status is authorized AND validated store matches active route slug
    expect(canRenderMerchantWorkspace("authorized", storeA, "store-a")).toBe(true);
    expect(canRenderMerchantWorkspace("authorized", storeB, "store-b")).toBe(true);
  });

  it("classifyMerchantPageError separates 401 login, 404 store-not-available, and 403 inline forbidden", () => {
    expect(
      classifyMerchantPageError(
        new ApiError(401, "Unauthorized"),
        "store-a",
        "/merchant/store-a/settings"
      )
    ).toEqual({
      kind: "unauthenticated",
      redirectTo: "/login?next=%2Fmerchant%2Fstore-a%2Fsettings",
    });

    expect(
      classifyMerchantPageError(new ApiError(404, "Store not found."), "store-b")
    ).toEqual({
      kind: "not_found",
      redirectTo: "/merchant",
      notice: "That store isn't available on your account.",
    });

    // Crucial: 403 for logged-in STAFF must NOT bounce to /login
    const forbidden = classifyMerchantPageError(
      new ApiError(403, "Only store owners can view security audit logs."),
      "store-a"
    );
    expect(forbidden).toEqual({
      kind: "forbidden",
      message: "Only store owners can view security audit logs.",
    });

    expect(classifyMerchantPageError(new Error("Network offline"), "store-a")).toEqual({
      kind: "error",
      message: "Network offline",
    });
  });

  it("fetchSession and fetchMyStores bypass recentGetCache with cache: no-store", async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ authenticated: true, user: null, stores: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchSession();
    await fetchSession();
    await fetchMyStores();
    await fetchMyStores();

    // Must never coalesce behind the 2.5s micro-cache (4 separate network calls)
    expect(fetchMock).toHaveBeenCalledTimes(4);
    for (const call of fetchMock.mock.calls) {
      expect((call[1] as RequestInit).cache).toBe("no-store");
    }
  });

  it("logoutSession, verifyEmailOtp, and authenticateWithGoogle clear shopcraft_active_store_slug", async () => {
    const removeItem = vi.fn();
    const sRemoveItem = vi.fn();
    vi.stubGlobal("window", {
      localStorage: { removeItem },
      sessionStorage: { removeItem: sRemoveItem },
    });
    vi.stubGlobal("document", { cookie: "csrftoken=testcsrf123" });

    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ detail: "ok", user: { id: 1, email: "a@b.com", full_name: "A", phone: "" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await logoutSession();
    expect(removeItem).toHaveBeenCalledWith("shopcraft_active_store_slug");
    expect(sRemoveItem).toHaveBeenCalledWith("shopcraft_merchant_notice");

    removeItem.mockClear();
    await verifyEmailOtp("a@b.com", "123456");
    expect(removeItem).toHaveBeenCalledWith("shopcraft_active_store_slug");

    removeItem.mockClear();
    await authenticateWithGoogle("fake-jwt");
    expect(removeItem).toHaveBeenCalledWith("shopcraft_active_store_slug");
  });

  it("SettingsForm fails closed when member_role is STAFF or missing, and allows OWNER saves", () => {
    const staffHtml = renderToStaticMarkup(
      React.createElement(SettingsForm, {
        storeSlug: "store-a",
        initialSettings: makeSettings("STAFF"),
        section: "general",
      })
    );
    expect(staffHtml).toContain("View-only mode (Staff)");
    expect(staffHtml).toContain("Owner permission required to save changes");
    expect(staffHtml).toContain("<fieldset disabled");
    expect(staffHtml).not.toContain(">Save Settings<");

    const missingRoleHtml = renderToStaticMarkup(
      React.createElement(SettingsForm, {
        storeSlug: "store-a",
        initialSettings: makeSettings(undefined),
        section: "payments",
      })
    );
    expect(missingRoleHtml).toContain("View-only mode (Staff)");
    expect(missingRoleHtml).toContain("<fieldset disabled");

    const ownerHtml = renderToStaticMarkup(
      React.createElement(SettingsForm, {
        storeSlug: "store-a",
        initialSettings: makeSettings("OWNER"),
        section: "general",
      })
    );
    expect(ownerHtml).not.toContain("View-only mode (Staff)");
    expect(ownerHtml).toContain(">Save Settings<");
  });

  it("AuditLogPanel blocks audit log UI when isOwner is false", () => {
    const html = renderToStaticMarkup(
      React.createElement(AuditLogPanel, { storeSlug: "store-a", isOwner: false })
    );
    expect(html).toContain("Owner Permission Required");
    expect(html).toContain("restricted to store owners");
    expect(html).not.toContain("Filter logs...");
  });

  it("SetupGuideCard hides owner-only action links from STAFF", () => {
    const checklist = {
      has_products: true,
      has_shipping: false,
      has_khalti: false,
      has_story: false,
    };
    const staffGuide = renderToStaticMarkup(
      React.createElement(SetupGuideCard, {
        storeSlug: "store-a",
        checklist,
        isOwner: false,
      })
    );
    expect(staffGuide).toContain("Owner setup");
    expect(staffGuide).not.toContain("Set delivery rates");

    const ownerGuide = renderToStaticMarkup(
      React.createElement(SetupGuideCard, {
        storeSlug: "store-a",
        checklist,
        isOwner: true,
      })
    );
    expect(ownerGuide).toContain("Set delivery rates");
    expect(ownerGuide).not.toContain("Owner setup");
  });
});
