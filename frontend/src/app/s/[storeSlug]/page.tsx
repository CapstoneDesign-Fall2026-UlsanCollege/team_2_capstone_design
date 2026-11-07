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
  const storeRes = await fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/`, {
    cache: "no-store",
  });

  if (storeRes.status === 404) {
    return { store: null, catalog: { products: [] } };
  }

  if (!storeRes.ok) {
    throw new Error(`Failed to load store metadata: ${storeRes.status}`);
  }

  const store: StorePublicMetadata = await storeRes.json();

  const catalogRes = await fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/catalog/`, {
    cache: "no-store",
  });

  const catalog: StoreCatalogData = catalogRes.ok
    ? await catalogRes.json()
    : { products: [] };

  return { store, catalog };
}

export default async function StorefrontHomePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const { store, catalog } = await fetchStoreData(storeSlug);

  if (!store) {
    notFound();
  }

  return (
    <StorefrontCatalogView
      store={store}
      products={catalog.products}
    />
  );
}
