import { notFound } from "next/navigation";
import { StorefrontCatalogView } from "@/components/storefront/StorefrontCatalogView";
import { ProductItem, StorePublicMetadata } from "@/lib/api";
import { getServerApiOrigin } from "@/lib/env";

interface StoreCatalogData {
  products: ProductItem[];
}

async function fetchStoreData(
  storeSlug: string,
  bypassCache = false
): Promise<{
  store: StorePublicMetadata | null;
  catalog: StoreCatalogData;
}> {
  const origin = getServerApiOrigin();
  const encodedSlug = encodeURIComponent(storeSlug);
  const fetchInit: RequestInit = bypassCache
    ? { cache: "no-store" }
    : { next: { revalidate: 60 } };
  const [storeRes, catalogRes] = await Promise.all([
    fetch(`${origin}/api/stores/${encodedSlug}/`, fetchInit),
    fetch(`${origin}/api/stores/${encodedSlug}/catalog/`, fetchInit),
  ]);

  if (storeRes.status === 404) {
    return { store: null, catalog: { products: [] } };
  }

  if (!storeRes.ok) {
    throw new Error(`Failed to load store metadata: ${storeRes.status}`);
  }

  const [store, catalog]: [StorePublicMetadata, StoreCatalogData] = await Promise.all([
    storeRes.json(),
    catalogRes.ok ? catalogRes.json() : Promise.resolve({ products: [] }),
  ]);

  return { store, catalog };
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
  const { store, catalog } = await fetchStoreData(storeSlug, isThemePreview);

  if (!store) {
    notFound();
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
