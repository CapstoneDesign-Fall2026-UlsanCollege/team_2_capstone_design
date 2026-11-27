import { describe, expect, it } from "vitest";
import { sanitizeExternalHttpUrl } from "./storefront-helpers";

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
