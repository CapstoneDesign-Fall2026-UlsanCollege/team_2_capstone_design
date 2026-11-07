/**
 * Environment-driven API origin helpers for ShopCraft (Vercel + Heroku).
 * Zero hardcoded localhost URLs in production code.
 */

export function getBrowserApiBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  return raw.replace(/\/+$/, "");
}

export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = getBrowserApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
}

export function getServerApiOrigin(): string {
  const configured = (
    process.env.DJANGO_API_ORIGIN ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");

  if (!configured) {
    throw new Error(
      "API origin is not configured. Set DJANGO_API_ORIGIN or NEXT_PUBLIC_API_BASE_URL in the environment."
    );
  }

  return configured;
}
