#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  STOREFRONT_ALLOWLIST,
  scanConsoleLine,
  scanStorefrontLine,
  stripComments,
} from "./surface-rules.mjs";

export { STOREFRONT_ALLOWLIST, scanConsoleLine, scanStorefrontLine, stripComments };

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
