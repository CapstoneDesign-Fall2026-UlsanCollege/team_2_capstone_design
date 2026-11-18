import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  getEmailTypoSuggestion,
  normalizePrefillEmail,
  validateEmailFormat,
} from "./email-validation";

describe("validateEmailFormat", () => {
  it("accepts valid email addresses and normalizes whitespace and case", () => {
    expect(validateEmailFormat("  User.Name+1@Example.COM ")).toEqual({
      valid: true,
      cleanEmail: "user.name+1@example.com",
      error: null,
    });
    expect(validateEmailFormat("customer@shopcraft.me").valid).toBe(true);
    expect(validateEmailFormat("buyer@college.edu.np").valid).toBe(true);
  });

  it("rejects empty or whitespace-only input", () => {
    const empty = validateEmailFormat("");
    expect(empty.valid).toBe(false);
    expect(empty.error).toBe("Please enter your email address.");

    const spaces = validateEmailFormat("   ");
    expect(spaces.valid).toBe(false);
    expect(spaces.error).toBe("Please enter your email address.");
  });

  it("rejects malformed email addresses before API submission", () => {
    const invalidInputs = [
      "notanemail",
      "user@",
      "@gmail.com",
      "user@gmail",
      "user@gmail.c",
      "user@.com",
      ".user@gmail.com",
      "user.@gmail.com",
      "user@gmail..com",
      "user name@gmail.com",
      "a@b@gmail.com",
    ];

    for (const input of invalidInputs) {
      const res = validateEmailFormat(input);
      expect(res.valid, `expected "${input}" to be invalid`).toBe(false);
      expect(res.error).toBe("Please enter a valid email address (e.g., name@example.com).");
    }
  });
});

describe("getEmailTypoSuggestion", () => {
  it("suggests corrected domains for common typos without altering input", () => {
    expect(getEmailTypoSuggestion("aadi@gmial.com")).toBe("aadi@gmail.com");
    expect(getEmailTypoSuggestion("aadi@gmai.com")).toBe("aadi@gmail.com");
    expect(getEmailTypoSuggestion("aadi@gamil.com")).toBe("aadi@gmail.com");
    expect(getEmailTypoSuggestion("aadi@hotmial.com")).toBe("aadi@hotmail.com");
    expect(getEmailTypoSuggestion("aadi@yaho.com")).toBe("aadi@yahoo.com");
  });

  it("handles uppercase and surrounding whitespace in typo suggestions", () => {
    expect(getEmailTypoSuggestion("  User@GMIAL.COM  ")).toBe("user@gmail.com");
  });

  it("returns null for valid domains or incomplete addresses", () => {
    expect(getEmailTypoSuggestion("aadi@gmail.com")).toBeNull();
    expect(getEmailTypoSuggestion("aadi@hotmail.com")).toBeNull();
    expect(getEmailTypoSuggestion("aadi@yahoo.com")).toBeNull();
    expect(getEmailTypoSuggestion("aadi@shopcraft.me")).toBeNull();
    expect(getEmailTypoSuggestion("aadi")).toBeNull();
    expect(getEmailTypoSuggestion("@gmial.com")).toBeNull();
    expect(getEmailTypoSuggestion("a@b@gmial.com")).toBeNull();
  });
});

describe("OTP components integrate validation, typo hint, change-email link, and spam note", () => {
  const otpCardSource = fs.readFileSync(
    path.resolve(__dirname, "../components/auth/OtpInput.tsx"),
    "utf8"
  );
  const accountSheetSource = fs.readFileSync(
    path.resolve(__dirname, "../components/storefront/AccountSheet.tsx"),
    "utf8"
  );

  it("wires validation, typo hint, Wrong email? Change it, and spam folder note into PasswordlessAuthCard", () => {
    expect(otpCardSource).toContain("validateEmailFormat");
    expect(otpCardSource).toContain("getEmailTypoSuggestion");
    expect(otpCardSource).toContain("Did you mean");
    expect(otpCardSource).toContain("Wrong email? Change it");
    expect(otpCardSource).toContain("spam folder");
  });

  it("wires validation, typo hint, Wrong email? Change it, and spam folder note into AccountSheet", () => {
    expect(accountSheetSource).toContain("validateEmailFormat");
    expect(accountSheetSource).toContain("getEmailTypoSuggestion");
    expect(accountSheetSource).toContain("Did you mean");
    expect(accountSheetSource).toContain("Wrong email? Change it");
    expect(accountSheetSource).toContain("spam folder");
  });
});

describe("Issue #56 regression: guards prefill email against synthetic click events", () => {
  it("ignores non-string or empty prefill arguments cleanly", () => {
    const syntheticClickEvent = { type: "click", target: {} };
    expect(normalizePrefillEmail(syntheticClickEvent)).toBeNull();
    expect(normalizePrefillEmail(123)).toBeNull();
    expect(normalizePrefillEmail(null)).toBeNull();
    expect(normalizePrefillEmail("   ")).toBeNull();
    expect(normalizePrefillEmail("  buyer@gmial.com ")).toBe("buyer@gmial.com");

    expect(
      validateEmailFormat(syntheticClickEvent as unknown as string).valid
    ).toBe(false);
    expect(
      getEmailTypoSuggestion(syntheticClickEvent as unknown as string)
    ).toBeNull();
  });

  it("uses normalizePrefillEmail in AccountContext and avoids direct onOpenAccount={openAccount} forwarding", () => {
    const accountContextSource = fs.readFileSync(
      path.resolve(__dirname, "../components/storefront/AccountContext.tsx"),
      "utf8"
    );
    const catalogViewSource = fs.readFileSync(
      path.resolve(__dirname, "../components/storefront/StorefrontCatalogView.tsx"),
      "utf8"
    );
    const productDetailSource = fs.readFileSync(
      path.resolve(__dirname, "../components/storefront/ProductDetailView.tsx"),
      "utf8"
    );

    expect(accountContextSource).toContain("normalizePrefillEmail");
    expect(catalogViewSource).not.toContain("onOpenAccount={openAccount}");
    expect(productDetailSource).not.toContain("onOpenAccount={openAccount}");
  });
});
