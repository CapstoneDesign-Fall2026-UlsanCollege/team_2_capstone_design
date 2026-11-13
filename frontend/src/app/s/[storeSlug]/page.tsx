import { notFound } from "next/navigation";
import { StorefrontCatalogView } from "@/components/storefront/StorefrontCatalogView";
import { ProductItem, StorePublicMetadata } from "@/lib/api";
import { getServerApiOrigin } from "@/lib/env";

interface StoreCatalogData {
  products: ProductItem[];
}

async function fetchStoreData(storeSlug: string): Promise<{
  store: StorePublicMetadata | null;
  catalog: StoreCatalogData;
}> {
  const origin = getServerApiOrigin();
  const encodedSlug = encodeURIComponent(storeSlug);
  const [storeRes, catalogRes] = await Promise.all([
    fetch(`${origin}/api/stores/${encodedSlug}/`, {
      next: { revalidate: 60 },
    }),
    fetch(`${origin}/api/stores/${encodedSlug}/catalog/`, {
      next: { revalidate: 60 },
    }),
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
  searchParams: Promise<{ preview_theme?: string }>;
}) {
  const [{ storeSlug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const { store, catalog } = await fetchStoreData(storeSlug);

  if (!store) {
    notFound();
  }

  return (
    <StorefrontCatalogView
      store={store}
      products={catalog.products}
      isThemePreview={Boolean(resolvedSearchParams?.preview_theme)}
    />
  );
}
