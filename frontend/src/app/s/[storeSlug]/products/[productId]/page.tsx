import React from "react";
import { notFound } from "next/navigation";
import { ProductItem, StorePublicMetadata } from "@/lib/api";
import { getServerApiOrigin } from "@/lib/env";
import { ProductDetailView } from "@/components/storefront/ProductDetailView";

interface StoreProductDetailData {
  product: ProductItem;
  related_products: ProductItem[];
}

async function fetchStoreAndProduct(
  storeSlug: string,
  productIdOrSlug: string
): Promise<{
  store: StorePublicMetadata | null;
  product: ProductItem | null;
  relatedProducts: ProductItem[];
}> {
  const origin = getServerApiOrigin();
  const encodedSlug = encodeURIComponent(storeSlug);
  const cleanRef = encodeURIComponent(decodeURIComponent(productIdOrSlug).trim());

  try {
    const [storeRes, pdpRes] = await Promise.all([
      fetch(`${origin}/api/stores/${encodedSlug}/`, {
        next: { revalidate: 60 },
      }),
      fetch(`${origin}/api/stores/${encodedSlug}/products/${cleanRef}/`, {
        next: { revalidate: 60 },
      }),
    ]);

    if (!storeRes.ok || !pdpRes.ok) {
      return {
        store: storeRes.ok ? await storeRes.json() : null,
        product: null,
        relatedProducts: [],
      };
    }

    const [store, pdpData]: [StorePublicMetadata, StoreProductDetailData] = await Promise.all([
      storeRes.json(),
      pdpRes.json(),
    ]);

    return {
      store,
      product: pdpData.product || null,
      relatedProducts: pdpData.related_products || [],
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
