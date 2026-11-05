import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
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
          tagline: "Specialty goods delivered across Nepal.",
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
    <div className="min-h-dvh bg-sf-canvas text-sf-ink flex flex-col font-sf-body">
      {/* Minimal Header */}
      <header className="sticky top-0 z-30 w-full border-b border-sf-line bg-sf-surface/90 backdrop-blur-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center gap-1.5 text-xs font-sf-mono text-sf-muted hover:text-sf-ink transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Store</span>
          </Link>

          <span className="font-sf-display text-sm sm:text-base font-bold text-sf-ink truncate max-w-[200px] sm:max-w-none">
            {store.name}
          </span>

          <div className="inline-flex items-center gap-1 text-[11px] font-sf-mono text-sf-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-sf-accent" aria-hidden="true" />
            <span className="hidden sm:inline">Verified Nepali Merchant</span>
          </div>
        </div>
      </header>

      {/* Main Product Detail View */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <ProductDetailView
          store={store}
          product={product}
          relatedProducts={relatedProducts}
        />
      </main>
    </div>
  );
}
