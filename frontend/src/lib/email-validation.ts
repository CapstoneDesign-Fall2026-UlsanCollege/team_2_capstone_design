/**
 * Client-side email format validation and domain typo suggestion helpers
 * for OTP sign-in flows. Never mutates or auto-corrects user input.
 */

const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const DOMAIN_TYPO_MAP: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "yaho.com": "yahoo.com",
};

export interface EmailValidationResult {
  valid: boolean;
  cleanEmail: string;
  error: string | null;
}

/**
 * Validates that an email string has a valid basic structure before
 * triggering an OTP request.
 */
export function validateEmailFormat(rawEmail: string): EmailValidationResult {
  const cleanEmail = rawEmail.trim().toLowerCase();
  if (!cleanEmail) {
    return {
      valid: false,
      cleanEmail,
      error: "Please enter your email address.",
    };
  }

  const parts = cleanEmail.split("@");
  const localPart = parts[0] || "";
  const domainPart = parts[1] || "";

  if (
    parts.length !== 2 ||
    !EMAIL_FORMAT_REGEX.test(cleanEmail) ||
    cleanEmail.includes("..") ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    domainPart.startsWith(".") ||
    domainPart.endsWith(".")
  ) {
    return {
      valid: false,
      cleanEmail,
      error: "Please enter a valid email address (e.g., name@example.com).",
    };
  }

  return {
    valid: true,
    cleanEmail,
    error: null,
  };
}

/**
 * Returns a suggested corrected email address if the domain matches a known
 * common typo, or null otherwise. Never modifies the caller's input.
 */
export function getEmailTypoSuggestion(rawEmail: string): string | null {
  const clean = rawEmail.trim().toLowerCase();
  const atIndex = clean.indexOf("@");
  if (atIndex <= 0) return null;

  const localPart = clean.slice(0, atIndex);
  const domainPart = clean.slice(atIndex + 1);
  if (!localPart || !domainPart || domainPart.includes("@")) return null;

  const correctedDomain = DOMAIN_TYPO_MAP[domainPart];
  if (!correctedDomain) return null;

  return `${localPart}@${correctedDomain}`;
}
