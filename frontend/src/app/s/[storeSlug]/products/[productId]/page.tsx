import React from "react";
import { notFound } from "next/navigation";
import { ProductItem, StorePublicMetadata } from "@/lib/api";
import { ProductDetailView } from "@/components/storefront/ProductDetailView";

interface StoreCatalogData {
  products: ProductItem[];
}

async function fetchStoreAndProduct(
  storeSlug: string,
  productIdOrSlug: string
): Promise<{
  store: StorePublicMetadata | null;
  product: ProductItem | null;
  relatedProducts: ProductItem[];
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

    const store: StorePublicMetadata | null = storeRes.ok
      ? await storeRes.json()
      : {
          slug: storeSlug,
          name: storeSlug,
          tagline: "Quality goods delivered across Nepal.",
          currency: "NPR",
          theme_preset: "editorial-warm",
          logo_url: "",
          accent_color: "",
          contact_phone: "9801234567",
          inside_valley_shipping_minor: 10000,
          outside_valley_shipping_minor: 20000,
          free_shipping_threshold_minor: null,
        };

    const catalog: StoreCatalogData = catalogRes.ok
      ? await catalogRes.json()
      : { products: [] };

    // Find product strictly from backend catalog
    const product: ProductItem | null =
      catalog.products.find(
        (p) =>
          String(p.id) === productIdOrSlug ||
          p.slug.toLowerCase() === productIdOrSlug.toLowerCase()
      ) || null;

    const relatedProducts = (
      catalog.products.length > 0 ? catalog.products : []
    ).filter((p) => p.id !== product?.id).slice(0, 3);

    return {
      store,
      product,
      relatedProducts,
    };
  } catch {
    return {
      store: null,
      product: null,
      relatedProducts: [],
    };
  }
}

export default async function StorefrontProductDetailPage({
  params,
}: {
  params: Promise<{ storeSlug: string; productId: string }>;
}) {
  const { storeSlug, productId } = await params;
  const { store, product, relatedProducts } =
    await fetchStoreAndProduct(storeSlug, productId);

  if (!store || !product) {
    notFound();
  }

  return (
    <ProductDetailView
      store={store}
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
