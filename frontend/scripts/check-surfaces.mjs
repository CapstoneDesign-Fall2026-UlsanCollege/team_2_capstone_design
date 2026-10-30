#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, "..");
const srcApp = path.join(frontendRoot, "src", "app");

const storefrontDir = path.join(srcApp, "s");
const merchantDir = path.join(srcApp, "merchant");

const VALID_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);
const HEX_REGEX = /#[0-9a-fA-F]{3,8}\b/;
const SF_TOKEN_REGEX = /--sf-|(?:bg|text|border|ring|fill|stroke|font|rounded)-sf-/;

let violationsCount = 0;

function stripComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, (match) => "\n".repeat((match.match(/\n/g) || []).length))
    .replace(/\/\/[^\n]*/g, "");
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

// 1. Check Storefront surface: Banned raw hex colors in /s/**
walkDir(storefrontDir, (filePath) => {
  const content = fs.readFileSync(filePath, "utf-8");
  const stripped = stripComments(content);
  const lines = stripped.split("\n");
  lines.forEach((line, index) => {
    if (HEX_REGEX.test(line)) {
      console.error(
        `[SURFACE VIOLATION: STOREFRONT HEX] ${path.relative(frontendRoot, filePath)}:${index + 1}`
      );
      console.error(`  Line: ${line.trim()}`);
      violationsCount++;
    }
  });
});

// 2. Check Console surface: Banned --sf-* tokens in /merchant/**
walkDir(merchantDir, (filePath) => {
  const content = fs.readFileSync(filePath, "utf-8");
  const stripped = stripComments(content);
  const lines = stripped.split("\n");
  lines.forEach((line, index) => {
    if (SF_TOKEN_REGEX.test(line)) {
      console.error(
        `[SURFACE VIOLATION: CONSOLE SF-TOKEN] ${path.relative(frontendRoot, filePath)}:${index + 1}`
      );
      console.error(`  Line: ${line.trim()}`);
      violationsCount++;
    }
  });
});

if (violationsCount > 0) {
  console.error(`\nFound ${violationsCount} surface isolation violation(s). Exiting with error.`);
  process.exit(1);
} else {
  console.log("SURFACE_ISOLATION_OK");
  process.exit(0);
}
