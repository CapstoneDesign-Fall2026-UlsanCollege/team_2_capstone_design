import type { MetadataRoute } from "next";
import { getServerApiOrigin } from "@/lib/env";

export const revalidate = 3600;

interface SitemapStoreEntry {
  slug: string;
  updated_at?: string | null;
}

const FALLBACK_SHOWCASE_SLUGS = ["himalayan-roasters", "brewmellow"];

async function fetchPublishedStoreEntries(): Promise<SitemapStoreEntry[]> {
  let origin: string;
  try {
    origin = getServerApiOrigin();
  } catch {
    return [];
  }

  try {
    const res = await fetch(`${origin}/api/stores/sitemap/`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const payload = (await res.json()) as { stores?: SitemapStoreEntry[] };
      if (Array.isArray(payload.stores)) {
        return payload.stores.filter((s) => Boolean(s?.slug));
      }
    }
  } catch {
    // Fall through to per-slug active check
  }

  // Fallback for older backend deployments before /api/stores/sitemap/ is deployed
  const results = await Promise.all(
    FALLBACK_SHOWCASE_SLUGS.map(async (slug) => {
      try {
        const res = await fetch(`${origin}/api/stores/${encodeURIComponent(slug)}/`, {
          next: { revalidate: 3600 },
        });
        return res.ok ? { slug } : null;
      } catch {
        return null;
      }
    })
  );

  return results.filter((entry): entry is SitemapStoreEntry => entry !== null);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://shopcraft.me";
  const now = new Date();
  const stores = await fetchPublishedStoreEntries();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now },
    { url: `${baseUrl}/about`, lastModified: now },
    { url: `${baseUrl}/privacy`, lastModified: now },
    { url: `${baseUrl}/terms`, lastModified: now },
  ];

  const storeRoutes: MetadataRoute.Sitemap = stores.map((store) => ({
    url: `${baseUrl}/s/${encodeURIComponent(store.slug)}`,
    lastModified: store.updated_at ? new Date(store.updated_at) : now,
  }));

  return [...staticRoutes, ...storeRoutes];
}
