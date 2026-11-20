import type { Metadata } from "next";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string; productId: string }>;
}): Promise<Metadata> {
  const { storeSlug, productId } = await params;
  const { store, product } = await fetchStoreAndProduct(storeSlug, productId);
  const slug = encodeURIComponent(store?.slug || storeSlug);
  const prodSlug = encodeURIComponent(product?.slug || productId);

  if (!store || !product) {
    return {
      title: "Product Not Found",
      alternates: { canonical: `/s/${slug}/products/${prodSlug}` },
    };
  }

  const cleanDesc = (product.description || "").trim().slice(0, 155);
  return {
    title: `${product.name} — ${store.name}`,
    description: cleanDesc || `Order ${product.name} from ${store.name} in NPR.`,
    alternates: { canonical: `/s/${slug}/products/${prodSlug}` },
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
