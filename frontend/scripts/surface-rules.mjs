const HEX_REGEX = /#[0-9a-fA-F]{3,8}\b/;
const COLOR_FN_REGEX = /\b(?:rgba?|hsla?|oklch|oklab|lch|lab)\s*\(/i;
const TAILWIND_PALETTE_REGEX =
  /(?:^|[\s"'`}:!])(?:bg|text|border(?:-[trblxy])?|ring(?:-offset)?|outline|divide|fill|stroke|accent|caret|decoration|placeholder|from|via|to|shadow)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))(?:\/(?:\d+|\[[^\]]+\]))?(?=[\s"'`}\])]|$)/;

const SF_TOKEN_REGEX = /--sf-|(?:bg|text|border|ring|fill|stroke|font|rounded)-sf-/;

/**
 * Explicit allowlist for unavoidable storefront exceptions (must stay empty unless documented).
 * Format: { file: "src/...", pattern: "...", reason: "..." }
 */
export const STOREFRONT_ALLOWLIST = [];

export function stripComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, (match) => "\n".repeat((match.match(/\n/g) || []).length))
    .replace(/\/\/[^\n]*/g, "");
}

function isAllowlisted(relPath, line) {
  return STOREFRONT_ALLOWLIST.some(
    (entry) => entry.file === relPath && line.includes(entry.pattern)
  );
}

export function scanStorefrontLine(line, relPath = "") {
  if (isAllowlisted(relPath, line)) {
    return [];
  }
  const violations = [];
  if (HEX_REGEX.test(line)) {
    violations.push("STOREFRONT HEX");
  }
  if (COLOR_FN_REGEX.test(line)) {
    violations.push("STOREFRONT COLOR FUNCTION");
  }
  if (TAILWIND_PALETTE_REGEX.test(line)) {
    violations.push("STOREFRONT HARDCODED PALETTE UTILITY");
  }
  return violations;
}

export function scanConsoleLine(line) {
  return SF_TOKEN_REGEX.test(line) ? ["CONSOLE SF-TOKEN"] : [];
}
