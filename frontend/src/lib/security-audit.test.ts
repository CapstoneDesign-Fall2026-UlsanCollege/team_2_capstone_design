import { describe, expect, it } from "vitest";
import { sanitizeExternalHttpUrl } from "./storefront-helpers";
import { sanitizeOptionalRedirectTarget } from "./merchant-guard";

describe("sanitizeExternalHttpUrl (#70)", () => {
  it("allows http and https external links", () => {
    expect(sanitizeExternalHttpUrl("https://instagram.com/shopcraft")).toBe(
      "https://instagram.com/shopcraft"
    );
    expect(sanitizeExternalHttpUrl("  http://facebook.com/shopcraft  ")).toBe(
      "http://facebook.com/shopcraft"
    );
  });

  it("blocks javascript:, data:, relative, and malformed URLs", () => {
    expect(sanitizeExternalHttpUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeExternalHttpUrl("JAVASCRIPT:alert(1)")).toBeNull();
    expect(sanitizeExternalHttpUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(sanitizeExternalHttpUrl("/relative/path")).toBeNull();
    expect(sanitizeExternalHttpUrl("")).toBeNull();
    expect(sanitizeExternalHttpUrl(null)).toBeNull();
  });
});

describe("sanitizeOptionalRedirectTarget (#71)", () => {
  it("keeps safe relative same-origin paths", () => {
    expect(sanitizeOptionalRedirectTarget("/s/himalayan/checkout")).toBe("/s/himalayan/checkout");
    expect(sanitizeOptionalRedirectTarget("  /merchant/demo?tab=orders  ")).toBe(
      "/merchant/demo?tab=orders"
    );
  });

  it("blocks external redirects, protocol-relative URLs, backslashes, and schemes", () => {
    expect(sanitizeOptionalRedirectTarget("https://evil.com")).toBeNull();
    expect(sanitizeOptionalRedirectTarget("//evil.com/phish")).toBeNull();
    expect(sanitizeOptionalRedirectTarget("/\\evil.com")).toBeNull();
    expect(sanitizeOptionalRedirectTarget("javascript:alert(1)")).toBeNull();
    expect(sanitizeOptionalRedirectTarget("/foo\nbar")).toBeNull();
    expect(sanitizeOptionalRedirectTarget("")).toBeNull();
    expect(sanitizeOptionalRedirectTarget(null)).toBeNull();
  });
});
