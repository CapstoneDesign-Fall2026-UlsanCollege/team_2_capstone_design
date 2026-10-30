"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { deleteMerchantProduct, formatNpr, ProductItem } from "@/lib/api";

interface ProductListTableProps {
  storeSlug: string;
  products: ProductItem[];
  onEdit: (product: ProductItem) => void;
  onRefresh: () => void;
  onAddNew: () => void;
}

interface PendingArchive {
  product: ProductItem;
  timerId: NodeJS.Timeout;
  remainingSeconds: number;
}

export function ProductListTable({
  storeSlug,
  products,
  onEdit,
  onRefresh,
  onAddNew,
}: ProductListTableProps) {
  const [pendingArchive, setPendingArchive] = useState<PendingArchive | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Derived list: exclude pending archived item without needing state sync
  const displayedProducts = pendingArchive
    ? products.filter((p) => p.id !== pendingArchive.product.id)
    : products;

  // Clean up countdown timer on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (pendingArchive?.timerId) clearTimeout(pendingArchive.timerId);
    };
  }, [pendingArchive]);

  const handleArchiveClick = (product: ProductItem) => {
    // If another deletion was pending, finalize it immediately
    if (pendingArchive) {
      clearTimeout(pendingArchive.timerId);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      deleteMerchantProduct(storeSlug, pendingArchive.product.id).catch(console.error);
    }

    // Setup 5-second countdown timer
    let secondsLeft = 5;
    const interval = setInterval(() => {
      secondsLeft -= 1;
      setPendingArchive((prev) => (prev ? { ...prev, remainingSeconds: secondsLeft } : null));
      if (secondsLeft <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    countdownIntervalRef.current = interval;

    const timer = setTimeout(async () => {
      try {
        await deleteMerchantProduct(storeSlug, product.id);
      } catch (err) {
        console.error("Failed to archive product:", err);
      } finally {
        setPendingArchive(null);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        onRefresh();
      }
    }, 5000);

    setPendingArchive({
      product,
      timerId: timer,
      remainingSeconds: 5,
    });
  };

  const handleUndo = () => {
    if (!pendingArchive) return;
    clearTimeout(pendingArchive.timerId);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setPendingArchive(null);
  };

  if (displayedProducts.length === 0 && !pendingArchive) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center space-y-3">
        <div className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--secondary)] flex items-center justify-center mx-auto text-base">
          ▤
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[var(--foreground)]">
            No products in your catalog yet.
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Add your first item before your customers start asking on WhatsApp.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddNew}
          className="h-8 px-3 rounded bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
        >
          <span>+ Add Product</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Undo Notification Bar */}
      {pendingArchive && (
        <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-md flex items-center justify-between text-xs animate-in fade-in slide-in-from-top duration-150">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: "var(--st-cancelled)" }}
            />
            <span className="text-[var(--foreground)]">
              Product <span className="font-semibold">&quot;{pendingArchive.product.name}&quot;</span> archived.
            </span>
          </div>

          <button
            type="button"
            onClick={handleUndo}
            className="px-2.5 py-1 rounded font-mono text-[11px] font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 cursor-pointer"
          >
            Undo ({pendingArchive.remainingSeconds}s)
          </button>
        </div>
      )}

      {/* Product Table */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-[var(--muted-foreground)] font-medium">
                <th className="py-2.5 px-4 font-normal">Product</th>
                <th className="py-2.5 px-4 font-normal hidden sm:table-cell">Variants</th>
                <th className="py-2.5 px-4 font-normal">Price (NPR)</th>
                <th className="py-2.5 px-4 font-normal">Status</th>
                <th className="py-2.5 px-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {displayedProducts.map((p) => {
                const activeVariants = p.variants || [];
                const prices = activeVariants.map((v) => v.price_minor);
                let priceLabel = "No variants";
                if (prices.length === 1) {
                  priceLabel = formatNpr(prices[0]);
                } else if (prices.length > 1) {
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  priceLabel = `${formatNpr(min)} – ${formatNpr(max)}`;
                }

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-[var(--secondary)]/30 transition-colors group"
                  >
                    {/* Thumbnail & Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded border border-[var(--border)] overflow-hidden shrink-0 bg-[var(--background)] flex items-center justify-center">
                          {p.image_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={p.image_url}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="text-xs font-mono text-[var(--muted-foreground)]">
                              ▤
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <Link
                            href={`/merchant/${encodeURIComponent(storeSlug)}/products/${p.id}`}
                            className="font-medium text-[var(--foreground)] hover:underline truncate block"
                          >
                            {p.name}
                          </Link>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="font-mono text-[10px] text-[var(--muted-foreground)] truncate">
                              /{p.slug}
                            </span>
                            {p.allow_subscription && (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[var(--secondary)] text-[var(--muted-foreground)] border border-[var(--border)]">
                                ↻ Sub
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Variants Count */}
                    <td className="py-3 px-4 hidden sm:table-cell text-[var(--muted-foreground)] font-mono text-[11px]">
                      <Link
                        href={`/merchant/${encodeURIComponent(storeSlug)}/products/${p.id}`}
                        className="hover:text-[var(--foreground)] hover:underline"
                      >
                        {activeVariants.length} {activeVariants.length === 1 ? "variant" : "variants"} →
                      </Link>
                    </td>

                    {/* Price Range */}
                    <td className="py-3 px-4 font-mono tabular-nums text-[var(--foreground)]">
                      {priceLabel}
                    </td>

                    {/* Status Dot */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{
                            backgroundColor: p.is_active
                              ? "var(--st-delivered)"
                              : "var(--st-cancelled)",
                          }}
                        />
                        <span className="text-[11px] font-medium text-[var(--foreground)]">
                          {p.is_active ? "Active" : "Draft"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(p)}
                          className="px-2 py-1 rounded border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--secondary)] text-[11px] font-medium cursor-pointer transition-colors"
                        >
                          Edit
                        </button>
                        <Link
                          href={`/merchant/${encodeURIComponent(storeSlug)}/products/${p.id}`}
                          className="px-2 py-1 rounded border border-[var(--border)] bg-[var(--secondary)] hover:bg-[var(--accent)] text-[11px] font-medium cursor-pointer transition-colors"
                        >
                          Variants
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleArchiveClick(p)}
                          className="px-2 py-1 rounded hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)] text-[11px] text-[var(--muted-foreground)] cursor-pointer transition-colors"
                          title="Archive product"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
