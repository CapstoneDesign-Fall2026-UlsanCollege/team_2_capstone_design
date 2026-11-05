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
  const cleanTarget = decodeURIComponent(productIdOrSlug).trim().toLowerCase();

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const [storeRes, catalogRes] = await Promise.all([
        fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/`, {
          cache: "no-store",
        }),
        fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/catalog/`, {
          cache: "no-store",
        }),
      ]);

      if (!storeRes.ok || !catalogRes.ok) {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }
      }

      const store: StorePublicMetadata | null = storeRes.ok
        ? await storeRes.json()
        : null;

      const catalog: StoreCatalogData = catalogRes.ok
        ? await catalogRes.json()
        : { products: [] };

      // Find product strictly from backend catalog by id or slug
      const product: ProductItem | null =
        catalog.products.find(
          (p) =>
            String(p.id) === cleanTarget ||
            (p.slug && p.slug.toLowerCase() === cleanTarget)
        ) || null;

      if (!product && attempt < 2) {
        await new Promise((r) => setTimeout(r, 300));
        continue;
      }

      const relatedProducts = (
        catalog.products.length > 0 ? catalog.products : []
      ).filter((p) => p.id !== product?.id).slice(0, 3);

      return {
        store,
        product,
        relatedProducts,
      };
    } catch {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 300));
        continue;
      }
    }
  }

  return {
    store: null,
    product: null,
    relatedProducts: [],
  };
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
