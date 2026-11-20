#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, "..");
const srcApp = path.join(frontendRoot, "src", "app");
const srcComponents = path.join(frontendRoot, "src", "components");

const storefrontDirs = [
  path.join(srcApp, "s"),
  path.join(srcComponents, "storefront"),
];

const merchantDirs = [
  path.join(srcApp, "merchant"),
  path.join(srcComponents, "merchant"),
];

const VALID_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);

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

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (entry.isFile() && VALID_EXTENSIONS.has(path.extname(entry.name))) {
      callback(fullPath);
    }
  }
}

export function runSurfaceChecks() {
  let violationsCount = 0;

  // 1. Check Storefront surface: Banned raw hex, CSS color functions, and hardcoded Tailwind palette colors
  for (const dir of storefrontDirs) {
    walkDir(dir, (filePath) => {
      const relPath = path.relative(frontendRoot, filePath).replace(/\\/g, "/");
      const content = fs.readFileSync(filePath, "utf-8");
      const stripped = stripComments(content);
      const lines = stripped.split("\n");
      lines.forEach((line, index) => {
        const hits = scanStorefrontLine(line, relPath);
        for (const hit of hits) {
          console.error(`[SURFACE VIOLATION: ${hit}] ${relPath}:${index + 1}`);
          console.error(`  Line: ${line.trim()}`);
          violationsCount++;
        }
      });
    });
  }

  // 2. Check Console surface: Banned --sf-* tokens in /merchant/** and components/merchant/**
  for (const dir of merchantDirs) {
    walkDir(dir, (filePath) => {
      const relPath = path.relative(frontendRoot, filePath).replace(/\\/g, "/");
      const content = fs.readFileSync(filePath, "utf-8");
      const stripped = stripComments(content);
      const lines = stripped.split("\n");
      lines.forEach((line, index) => {
        const hits = scanConsoleLine(line);
        for (const hit of hits) {
          console.error(`[SURFACE VIOLATION: ${hit}] ${relPath}:${index + 1}`);
          console.error(`  Line: ${line.trim()}`);
          violationsCount++;
        }
      });
    });
  }

  return violationsCount;
}

const isCliEntry =
  typeof process.argv[1] === "string" &&
  path.resolve(process.argv[1]) === __filename;

if (isCliEntry) {
  const violationsCount = runSurfaceChecks();
  if (violationsCount > 0) {
    console.error(`\nFound ${violationsCount} surface isolation violation(s). Exiting with error.`);
    process.exit(1);
  } else {
    console.log("SURFACE_ISOLATION_OK");
    process.exit(0);
  }
}
