"use client";

import React, { use, useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, fetchMerchantProducts, ProductItem } from "@/lib/api";
import { ProductListTable } from "@/components/merchant/ProductListTable";
import { ProductSheet } from "@/components/merchant/ProductSheet";

interface PageProps {
  params: Promise<{ storeSlug: string }>;
}

export default function MerchantProductsPage({ params }: PageProps) {
  const { storeSlug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);

  // Filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all");

  // Sheet state: controlled via local state or URL ?action=new
  const actionNew = searchParams.get("action") === "new";
  const [userSheetOpen, setUserSheetOpen] = useState(false);
  const sheetOpen = userSheetOpen || actionNew;

  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  const loadProducts = useCallback(() => {
    let active = true;
    fetchMerchantProducts(storeSlug)
      .then((data) => {
        if (active) {
          setProducts(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : "Failed to load products";
        const isAuth =
          (err instanceof ApiError && (err.status === 401 || err.status === 403)) ||
          msg.includes("401") ||
          msg.includes("403") ||
          msg.toLowerCase().includes("unauthorized") ||
          msg.toLowerCase().includes("credentials");

        if (isAuth) {
          router.replace(`/login?next=/merchant/${encodeURIComponent(storeSlug)}/products`);
          return;
        }
        setError(msg);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [storeSlug, router]);

  useEffect(() => {
    const cleanup = loadProducts();
    return cleanup;
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Status filter
      if (statusFilter === "active" && !p.is_active) return false;
      if (statusFilter === "draft" && p.is_active) return false;

      // Text search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const inName = p.name.toLowerCase().includes(q);
      const inSlug = p.slug.toLowerCase().includes(q);
      const inDesc = p.description.toLowerCase().includes(q);
      const inAttrs = Object.values(p.attributes || {}).some((v) =>
        v.toLowerCase().includes(q)
      );

      return inName || inSlug || inDesc || inAttrs;
    });
  }, [products, statusFilter, searchQuery]);

  const handleEdit = (prod: ProductItem) => {
    setSelectedProduct(prod);
    setUserSheetOpen(true);
  };

  const handleAddNew = () => {
    setSelectedProduct(null);
    setUserSheetOpen(true);
  };

  const handleProductSaved = (saved: ProductItem) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      if (exists) {
        return prev.map((p) => (p.id === saved.id ? saved : p));
      }
      return [saved, ...prev];
    });
  };

  const handleSheetOpenChange = (isOpen: boolean) => {
    setUserSheetOpen(isOpen);
    if (!isOpen && actionNew) {
      router.replace(`/merchant/${encodeURIComponent(storeSlug)}/products`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
            Products &amp; Catalog
          </h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            Manage your store offerings, attributes, and packaging variants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/s/${encodeURIComponent(storeSlug)}`}
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded font-medium border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] text-xs transition-colors"
          >
            <span>Storefront</span>
            <span className="text-[10px]">↗</span>
          </Link>
          <button
            type="button"
            onClick={handleAddNew}
            className="h-8 px-3.5 rounded bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>+ New Product</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-2.5 text-xs text-[var(--muted-foreground)]">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by title, tag, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)]"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1 bg-[var(--secondary)]/60 p-0.5 rounded-lg border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              statusFilter === "all"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            All ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              statusFilter === "active"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Active ({products.filter((p) => p.is_active).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("draft")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              statusFilter === "draft"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Draft ({products.filter((p) => !p.is_active).length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-12 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
          <div className="h-14 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
          <div className="h-14 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center space-y-3">
          <p className="text-xs font-semibold text-[var(--destructive)]">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              loadProducts();
            }}
            className="px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--secondary)] text-xs font-medium cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : (
        <ProductListTable
          storeSlug={storeSlug}
          products={filteredProducts}
          onEdit={handleEdit}
          onRefresh={loadProducts}
          onAddNew={handleAddNew}
        />
      )}

      {/* Product Drawer Sheet */}
      <ProductSheet
        storeSlug={storeSlug}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        product={selectedProduct}
        onSaved={handleProductSaved}
      />
    </div>
  );
}
