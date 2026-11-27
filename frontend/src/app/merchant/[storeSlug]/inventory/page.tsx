"use client";

import React, { Suspense, use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Boxes,
  Check,
  Minus,
  PackageX,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  fetchMerchantInventory,
  formatNpr,
  MerchantInventoryItem,
  MerchantInventoryResponse,
  updateProductVariant,
} from "@/lib/api";
import { classifyMerchantPageError } from "@/lib/merchant-guard";

interface PageProps {
  params: Promise<{ storeSlug: string }>;
}

type InventoryFilter = "all" | "low" | "out" | "tracked";

function resolveInitialFilter(raw: string | null): InventoryFilter {
  const clean = (raw || "").trim().toLowerCase();
  if (clean === "low" || clean === "out" || clean === "tracked") return clean;
  return "all";
}

function StockBadge({ item }: { item: MerchantInventoryItem }) {
  if (!item.in_stock || (item.track_inventory && item.stock_quantity <= 0)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--error-bd)] bg-[var(--error-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--error-fg)]">
        Out of stock
      </span>
    );
  }
  if (!item.track_inventory) {
    return (
      <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--canvas)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-2)]">
        Unlimited
      </span>
    );
  }
  if (item.stock_quantity <= item.low_stock_threshold) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--warn-bd)] bg-[var(--warn-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--warn-fg)]">
        Low · {item.stock_quantity} left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--success-bd)] bg-[var(--success-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--success-fg)]">
      {item.stock_quantity} in stock
    </span>
  );
}

function MerchantInventoryInner({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filter, setFilter] = useState<InventoryFilter>(() =>
    resolveInitialFilter(searchParams.get("status"))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MerchantInventoryResponse | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  const loadInventory = useCallback(
    async (nextFilter: InventoryFilter = filter, nextQuery: string = searchQuery) => {
      try {
        setError(null);
        const res = await fetchMerchantInventory(storeSlug, {
          status: nextFilter,
          q: nextQuery.trim() || undefined,
          page: 1,
        });
        setData(res);
      } catch (err: unknown) {
        const action = classifyMerchantPageError(
          err,
          storeSlug,
          `/merchant/${encodeURIComponent(storeSlug)}/inventory`
        );
        if (action.kind === "unauthenticated") {
          setTimeout(() => router.replace(action.redirectTo), 0);
          return;
        }
        if (action.kind === "not_found") {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("shopcraft_merchant_notice", action.notice);
          }
          setTimeout(() => router.replace(action.redirectTo), 0);
          return;
        }
        setError(action.message);
      } finally {
        setLoading(false);
      }
    },
    [storeSlug, filter, searchQuery, router]
  );

  const handleLoadMore = async () => {
    const pagination = data?.pagination;
    if (!pagination?.has_more || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchMerchantInventory(storeSlug, {
        status: filter,
        q: searchQuery.trim() || undefined,
        page: pagination.page + 1,
      });
      setData((prev) => {
        if (!prev) return res;
        const seen = new Set(prev.items.map((row) => row.id));
        return {
          summary: res.summary,
          items: [...prev.items, ...res.items.filter((row) => !seen.has(row.id))],
          pagination: res.pagination,
        };
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load more inventory.");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        void loadInventory(filter, searchQuery);
      }
    }, searchQuery ? 200 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filter, searchQuery, loadInventory]);

  const handleFilterChange = (next: InventoryFilter) => {
    setFilter(next);
    setLoading(true);
  };

  const handlePatchItem = async (
    item: MerchantInventoryItem,
    patch: {
      track_inventory?: boolean;
      stock_quantity?: number;
      low_stock_threshold?: number;
      in_stock?: boolean;
    }
  ) => {
    setSavingId(item.id);
    setError(null);
    try {
      const updated = await updateProductVariant(storeSlug, item.product_id, item.id, patch);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((row) =>
            row.id === item.id
              ? {
                  ...row,
                  in_stock: updated.in_stock,
                  track_inventory: Boolean(updated.track_inventory),
                  stock_quantity: updated.stock_quantity ?? row.stock_quantity,
                  low_stock_threshold: updated.low_stock_threshold ?? row.low_stock_threshold,
                  is_low_stock: Boolean(updated.is_low_stock),
                  is_out_of_stock: Boolean(updated.is_out_of_stock),
                }
              : row
          ),
        };
      });
      setSavedId(item.id);
      setTimeout(() => {
        setSavedId((curr) => (curr === item.id ? null : curr));
      }, 1500);
      void loadInventory(filter, searchQuery);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update inventory.");
    } finally {
      setSavingId(null);
    }
  };

  const summary = data?.summary ?? {
    total_variants: 0,
    tracked_count: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    total_units: 0,
  };
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)] flex items-center gap-2">
            <Boxes className="size-5 text-[var(--ink-2)]" />
            <span>Inventory &amp; Stock Control</span>
          </h1>
          <p className="text-xs text-[var(--ink-2)] mt-0.5">
            Enable per-SKU stock counts to deduct automatically on checkout and restock on
            cancellations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void loadInventory(filter, searchQuery);
          }}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--canvas)] text-xs font-medium text-[var(--ink)] cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="size-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-1">
          <p className="text-xs font-medium text-[var(--ink-2)]">Tracked SKUs</p>
          <p className="text-2xl font-semibold tabular-nums text-[var(--ink)]">
            {summary.tracked_count}
            <span className="text-xs font-normal text-[var(--ink-2)]"> / {summary.total_variants}</span>
          </p>
          <p className="text-[11px] text-[var(--ink-2)]">Numeric stock enabled</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-1">
          <p className="text-xs font-medium text-[var(--ink-2)]">Total Units</p>
          <p className="text-2xl font-semibold tabular-nums text-[var(--ink)]">
            {summary.total_units}
          </p>
          <p className="text-[11px] text-[var(--ink-2)]">Across tracked variants</p>
        </div>

        <button
          type="button"
          onClick={() => handleFilterChange("low")}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--canvas)] p-4 space-y-1 text-left cursor-pointer transition-colors"
        >
          <p className="text-xs font-medium text-[var(--ink-2)] flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-[var(--warn-fg)]" />
            <span>Low Stock</span>
          </p>
          <p className="text-2xl font-semibold tabular-nums text-[var(--ink)]">
            {summary.low_stock_count}
          </p>
          <p className="text-[11px] text-[var(--ink-2)]">At or below alert threshold</p>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange("out")}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--canvas)] p-4 space-y-1 text-left cursor-pointer transition-colors"
        >
          <p className="text-xs font-medium text-[var(--ink-2)] flex items-center gap-1.5">
            <PackageX className="size-3.5 text-[var(--error-fg)]" />
            <span>Out of Stock</span>
          </p>
          <p className="text-2xl font-semibold tabular-nums text-[var(--ink)]">
            {summary.out_of_stock_count}
          </p>
          <p className="text-[11px] text-[var(--ink-2)]">Blocked at checkout</p>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] self-start">
          {(
            [
              { id: "all", label: "All SKUs" },
              { id: "low", label: `Low (${summary.low_stock_count})` },
              { id: "out", label: `Out (${summary.out_of_stock_count})` },
              { id: "tracked", label: `Tracked (${summary.tracked_count})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleFilterChange(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filter === tab.id
                  ? "bg-[var(--ink)] text-[var(--primary-foreground)]"
                  : "text-[var(--ink-2)] hover:text-[var(--ink)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-2)]" />
          <input
            type="search"
            placeholder="Search product, SKU, variant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--ink)] placeholder:text-[var(--ink-2)] focus:outline-none focus:border-[var(--ink)]"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-[var(--error-bd)] bg-[var(--error-bg)] text-xs text-[var(--error-fg)] font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-[var(--ink)]">No matching inventory variants</p>
          <p className="text-xs text-[var(--ink-2)]">
            Try switching filters or open a product to configure variant stock levels.
          </p>
          <Link
            href={`/merchant/${encodeURIComponent(storeSlug)}/products`}
            className="inline-block mt-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--nav-active)]"
          >
            Go to Products
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--canvas)] text-[var(--ink-2)]">
                  <th className="py-2.5 px-4 font-medium">Product / Variant</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium text-center">Track Stock</th>
                  <th className="py-2.5 px-3 font-medium">Available Qty</th>
                  <th className="py-2.5 px-3 font-medium">Alert ≤</th>
                  <th className="py-2.5 px-4 font-medium text-right">In Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {items.map((item) => {
                  const isBusy = savingId === item.id;
                  const isSaved = savedId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-[var(--canvas)]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <Link
                            href={`/merchant/${encodeURIComponent(storeSlug)}/products/${item.product_id}`}
                            className="font-semibold text-[var(--ink)] hover:underline block truncate"
                          >
                            {item.product_name} · {item.label}
                          </Link>
                          <span className="font-mono text-[11px] text-[var(--ink-2)]">
                            {item.sku} · {formatNpr(item.price_minor)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <StockBadge item={item} />
                          {isSaved && <Check className="size-3.5 text-[var(--success-fg)]" />}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Track inventory for ${item.product_name} ${item.label}`}
                          disabled={isBusy}
                          checked={item.track_inventory}
                          onChange={(e) =>
                            void handlePatchItem(item, {
                              track_inventory: e.target.checked,
                            })
                          }
                          className="size-4 rounded border-[var(--border)] accent-[var(--ink)] cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.track_inventory ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              disabled={isBusy || item.stock_quantity <= 0}
                              onClick={() =>
                                void handlePatchItem(item, {
                                  stock_quantity: Math.max(0, item.stock_quantity - 1),
                                })
                              }
                              aria-label={`Decrease stock for ${item.label}`}
                              className="size-7 rounded border border-[var(--border)] bg-[var(--canvas)] inline-flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] disabled:opacity-40 cursor-pointer"
                            >
                              <Minus className="size-3" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={2147483647}
                              aria-label={`Stock quantity for ${item.product_name} ${item.label}`}
                              disabled={isBusy}
                              defaultValue={item.stock_quantity}
                              key={`${item.id}-${item.stock_quantity}`}
                              onBlur={(e) => {
                                const parsed = parseInt(e.target.value, 10);
                                if (Number.isFinite(parsed) && parsed >= 0 && parsed !== item.stock_quantity) {
                                  void handlePatchItem(item, { stock_quantity: parsed });
                                }
                              }}
                              className="w-16 h-7 px-2 rounded border border-[var(--border)] bg-[var(--canvas)] text-center font-mono tabular-nums text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--ink)]"
                            />
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                void handlePatchItem(item, {
                                  stock_quantity: item.stock_quantity + 1,
                                })
                              }
                              aria-label={`Increase stock for ${item.label}`}
                              className="size-7 rounded border border-[var(--border)] bg-[var(--canvas)] inline-flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] disabled:opacity-40 cursor-pointer"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono text-[11px] text-[var(--ink-2)]">
                            Unlimited (toggle Track)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <input
                          type="number"
                          min={0}
                          max={32767}
                          aria-label={`Low stock threshold for ${item.product_name} ${item.label}`}
                          disabled={isBusy || !item.track_inventory}
                          defaultValue={item.low_stock_threshold}
                          key={`${item.id}-thr-${item.low_stock_threshold}`}
                          onBlur={(e) => {
                            const parsed = parseInt(e.target.value, 10);
                            if (
                              Number.isFinite(parsed) &&
                              parsed >= 0 &&
                              parsed <= 32767 &&
                              parsed !== item.low_stock_threshold
                            ) {
                              void handlePatchItem(item, { low_stock_threshold: parsed });
                            }
                          }}
                          className="w-16 h-7 px-2 rounded border border-[var(--border)] bg-[var(--canvas)] text-center font-mono tabular-nums text-xs text-[var(--ink)] disabled:opacity-40 focus:outline-none focus:border-[var(--ink)]"
                        />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <input
                          type="checkbox"
                          aria-label={`In stock status for ${item.product_name} ${item.label}`}
                          disabled={isBusy || (item.track_inventory && item.stock_quantity <= 0)}
                          checked={item.in_stock}
                          onChange={(e) =>
                            void handlePatchItem(item, { in_stock: e.target.checked })
                          }
                          className="size-4 rounded border-[var(--border)] accent-[var(--ink)] cursor-pointer disabled:opacity-40"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data?.pagination && data.pagination.total > 0 && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--border)] bg-[var(--canvas)] text-xs text-[var(--ink-2)]">
              <span>
                Showing {items.length} of {data.pagination.total} SKUs
              </span>
              {data.pagination.has_more && (
                <button
                  type="button"
                  onClick={() => void handleLoadMore()}
                  disabled={loadingMore}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] font-medium cursor-pointer disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "Load more SKUs"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MerchantInventoryPage({ params }: PageProps) {
  const { storeSlug } = use(params);
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-10 w-56 rounded-lg bg-[var(--surface)] animate-pulse" />
          <div className="h-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-pulse" />
        </div>
      }
    >
      <MerchantInventoryInner storeSlug={storeSlug} />
    </Suspense>
  );
}
