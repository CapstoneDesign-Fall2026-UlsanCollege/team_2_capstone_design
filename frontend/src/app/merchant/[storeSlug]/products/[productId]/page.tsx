"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchMerchantProduct, ProductItem } from "@/lib/api";
import { VariantGridEditor } from "@/components/merchant/VariantGridEditor";
import { SellingPlanConfig } from "@/components/merchant/SellingPlanConfig";

interface PageProps {
  params: Promise<{ storeSlug: string; productId: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { storeSlug, productId } = use(params);
  const router = useRouter();

  const prodIdNum = parseInt(productId, 10);
  const isInvalidId = isNaN(prodIdNum);

  const [loading, setLoading] = useState(!isInvalidId);
  const [error, setError] = useState<string | null>(isInvalidId ? "Invalid product ID" : null);
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [allowSubMaster, setAllowSubMaster] = useState(false);

  useEffect(() => {
    if (isNaN(prodIdNum)) return;
    let active = true;

    fetchMerchantProduct(storeSlug, prodIdNum)
      .then((data) => {
        if (active) {
          setProduct(data);
          setAllowSubMaster(data.allow_subscription);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : "Failed to load product details";
        if (msg.includes("401") || msg.includes("403") || msg.includes("Unauthorized")) {
          router.replace(
            `/login?next=/merchant/${encodeURIComponent(storeSlug)}/products/${productId}`
          );
          return;
        }
        setError(msg);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [storeSlug, prodIdNum, productId, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-[var(--secondary)] rounded animate-pulse" />
        <div className="h-28 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
        <div className="h-64 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center space-y-3">
        <p className="text-xs font-semibold text-[var(--destructive)]">
          {error || "Product not found or access denied."}
        </p>
        <Link
          href={`/merchant/${encodeURIComponent(storeSlug)}/products`}
          className="inline-block px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--secondary)] text-xs font-medium cursor-pointer"
        >
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  const samplePrice =
    product.variants.length > 0 ? product.variants[0].price_minor : 100000;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
        <Link
          href={`/merchant/${encodeURIComponent(storeSlug)}/products`}
          className="hover:text-[var(--foreground)] hover:underline"
        >
          Products
        </Link>
        <span>/</span>
        <span className="font-medium text-[var(--foreground)] truncate max-w-[200px]">
          {product.name}
        </span>
        <span>/</span>
        <span className="font-mono text-[11px]">Variants &amp; Pricing</span>
      </div>

      {/* Product Summary Header Card */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg border border-[var(--border)] overflow-hidden shrink-0 bg-[var(--background)] flex items-center justify-center">
            {product.image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={product.image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-mono text-[var(--muted-foreground)]">▤</span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[var(--foreground)] truncate">
                {product.name}
              </h1>
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{
                  backgroundColor: product.is_active
                    ? "var(--st-delivered)"
                    : "var(--st-cancelled)",
                }}
              />
            </div>
            <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 mt-0.5">
              {product.description || "No description provided."}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
                Slug: /{product.slug}
              </span>
              {Object.entries(product.attributes || {}).map(([k, v]) => (
                <span
                  key={k}
                  className="text-[10px] px-1.5 py-0.2 rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)]"
                >
                  {k}: {v}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Link
            href={`/s/${encodeURIComponent(storeSlug)}`}
            target="_blank"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded font-medium border border-[var(--border)] bg-[var(--secondary)] hover:bg-[var(--accent)] text-[var(--foreground)] text-xs transition-colors"
          >
            <span>Preview in Storefront</span>
            <span className="text-[10px]">↗</span>
          </Link>
        </div>
      </div>

      {/* Spreadsheet Variant Grid Editor */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Product Variants &amp; Packaging Sizes
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Edit size labels, stock levels, and integer prices in Nepalese Rupees.
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--muted-foreground)]">
            Tab/Enter to navigate cells
          </span>
        </div>

        <VariantGridEditor
          storeSlug={storeSlug}
          productId={product.id}
          initialVariants={product.variants}
          allowSubscriptionMaster={allowSubMaster}
        />
      </section>

      {/* Subscription Selling Plan Manager */}
      <SellingPlanConfig
        storeSlug={storeSlug}
        productId={product.id}
        initialAllowSubscription={product.allow_subscription}
        samplePriceMinor={samplePrice}
        onMasterToggle={(enabled) => setAllowSubMaster(enabled)}
      />
    </div>
  );
}
