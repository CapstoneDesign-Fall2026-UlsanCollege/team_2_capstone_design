import { notFound } from "next/navigation";
import { StorefrontCatalogView } from "@/components/storefront/StorefrontCatalogView";
import { ProductItem, SellingPlanItem, StorePublicMetadata } from "@/lib/api";

interface StoreCatalogData {
  products: ProductItem[];
  selling_plans: SellingPlanItem[];
}

async function fetchStoreData(storeSlug: string): Promise<{
  store: StorePublicMetadata | null;
  catalog: StoreCatalogData;
}> {
  const origin = process.env.DJANGO_API_ORIGIN || "http://127.0.0.1:8000";
  try {
    const [storeRes, catalogRes] = await Promise.all([
      fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/`, {
        cache: "no-store",
      }),
      fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/catalog/`, {
        cache: "no-store",
      }),
    ]);

    if (storeRes.status === 404) {
      return { store: null, catalog: { products: [], selling_plans: [] } };
    }

    const store: StorePublicMetadata = storeRes.ok
      ? await storeRes.json()
      : {
          slug: storeSlug,
          name: storeSlug,
          tagline: "Artisanal goods delivered across Kathmandu Valley and nationwide.",
          currency: "NPR",
          theme_preset: "editorial-warm",
          logo_url: "",
          accent_color: "",
          contact_phone: "9801234567",
          inside_valley_shipping_minor: 10000,
          outside_valley_shipping_minor: 25000,
          free_shipping_threshold_minor: null,
        };

    const catalog: StoreCatalogData = catalogRes.ok
      ? await catalogRes.json()
      : { products: [], selling_plans: [] };

    return { store, catalog };
  } catch {
    return {
      store: null,
      catalog: { products: [], selling_plans: [] },
    };
  }
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
      sellingPlans={catalog.selling_plans}
    />
  );
}
