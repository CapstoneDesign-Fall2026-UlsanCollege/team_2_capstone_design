import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontCatalogView } from "@/components/storefront/StorefrontCatalogView";
import { ProductItem, StorePublicMetadata } from "@/lib/api";
import { getServerApiOrigin } from "@/lib/env";
import { fetchPublicStoreOutcome } from "@/lib/storefront-fetch";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}): Promise<Metadata> {
  const { storeSlug } = await params;
  const result = await fetchPublicStoreOutcome(storeSlug);
  const encodedSlug = encodeURIComponent(storeSlug);
  if (result.status !== "ok") {
    return {
      title: result.status === "not_found" ? "This store isn't here" : "Store Unavailable",
      alternates: { canonical: `/s/${encodedSlug}` },
    };
  }
  const store = result.store;
  const storeName = store.name?.trim() || "Online Store";
  const tagline = store.tagline?.trim();

  return {
    title: `${storeName} — Online Store`,
    description:
      tagline ||
      `Shop online from ${storeName} in NPR with Khalti and cash on delivery across Nepal.`,
    alternates: { canonical: `/s/${encodeURIComponent(store.slug || storeSlug)}` },
  };
}

interface StoreCatalogData {
  products: ProductItem[];
}

async function fetchStoreData(
  storeSlug: string,
  bypassCache = false
): Promise<{
  status: "ok" | "not_found" | "unavailable";
  store: StorePublicMetadata | null;
  catalog: StoreCatalogData;
}> {
  const storeOutcome = await fetchPublicStoreOutcome(storeSlug, bypassCache);
  if (storeOutcome.status !== "ok") {
    return { status: storeOutcome.status, store: null, catalog: { products: [] } };
  }

  try {
    const origin = getServerApiOrigin();
    const encodedSlug = encodeURIComponent(storeSlug);
    const fetchInit: RequestInit = bypassCache
      ? { cache: "no-store" }
      : { next: { revalidate: 60 } };
    const catalogRes = await fetch(`${origin}/api/stores/${encodedSlug}/catalog/`, fetchInit);
    const catalog: StoreCatalogData = catalogRes.ok
      ? await catalogRes.json()
      : { products: [] };
    return { status: "ok", store: storeOutcome.store, catalog };
  } catch {
    return { status: "ok", store: storeOutcome.store, catalog: { products: [] } };
  }
}

export default async function StorefrontHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ preview_theme?: string; search?: string }>;
}) {
  const [{ storeSlug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const isThemePreview = Boolean(resolvedSearchParams?.preview_theme);
  const { status, store, catalog } = await fetchStoreData(storeSlug, isThemePreview);

  if (status === "not_found" || (status === "ok" && !store)) {
    notFound();
  }

  if (!store) {
    return null;
  }

  return (
    <StorefrontCatalogView
      store={store}
      products={catalog.products}
      isThemePreview={isThemePreview}
      initialSearchOpen={resolvedSearchParams?.search === "1"}
    />
  );
}
