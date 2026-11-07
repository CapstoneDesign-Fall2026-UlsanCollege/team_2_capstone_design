const OPTIMIZED_REMOTE_HOSTS = new Set([
  "res.cloudinary.com",
  "images.unsplash.com",
]);

/**
 * Injects Cloudinary automatic format (`f_auto`) and perceptual quality (`q_auto`)
 * parameters on `res.cloudinary.com/.../image/upload/` URLs when not already present.
 */
export function optimizeCloudinaryUrl(rawUrl: string): string {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed || !trimmed.includes("res.cloudinary.com/")) {
    return trimmed;
  }

  const uploadMarker = "/image/upload/";
  const idx = trimmed.indexOf(uploadMarker);
  if (idx === -1) {
    return trimmed;
  }

  const afterUpload = trimmed.slice(idx + uploadMarker.length);
  if (
    afterUpload.startsWith("f_auto") ||
    afterUpload.startsWith("q_auto") ||
    afterUpload.includes("/f_auto")
  ) {
    return trimmed;
  }

  return `${trimmed.slice(0, idx + uploadMarker.length)}f_auto,q_auto/${afterUpload}`;
}

/**
 * Determines whether Next.js `<Image>` should skip server-side image optimization:
 * - SVGs, data URIs, and blob URLs bypass Next image resizing.
 * - Arbitrary external domains outside `next.config.ts` `remotePatterns` fall back
 *   to `unoptimized` so merchant-supplied URLs never crash rendering.
 * - Cloudinary (`res.cloudinary.com`), Unsplash, and local raster paths use full
 *   Next.js responsive `srcset` optimization.
 */
export function shouldBypassNextImageOptimization(rawUrl: string): boolean {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) return true;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("data:") ||
    lower.startsWith("blob:") ||
    lower.split("?")[0].endsWith(".svg")
  ) {
    return true;
  }

  if (trimmed.startsWith("/")) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return !OPTIMIZED_REMOTE_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return true;
  }
}
