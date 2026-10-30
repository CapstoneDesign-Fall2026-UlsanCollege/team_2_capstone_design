"use client";

import React, { useState } from "react";
import {
  createProductVariant,
  deleteProductVariant,
  ProductVariant,
  updateProductVariant,
  VariantPayload,
} from "@/lib/api";

const QUICK_ADD_PRESETS = [
  { label: "Weight: 250g · 500g · 1kg", items: ["250g", "500g", "1kg"] },
  { label: "Apparel: S · M · L · XL", items: ["S", "M", "L", "XL"] },
  { label: "Volume: 100ml · 250ml · 500ml", items: ["100ml", "250ml", "500ml"] },
];

interface VariantGridEditorProps {
  storeSlug: string;
  productId: number;
  initialVariants: ProductVariant[];
  allowSubscriptionMaster: boolean;
}

export function VariantGridEditor({
  storeSlug,
  productId,
  initialVariants,
  allowSubscriptionMaster,
}: VariantGridEditorProps) {
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newPriceRs, setNewPriceRs] = useState("");
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleUpdate = async (variant: ProductVariant, patch: Partial<VariantPayload>) => {
    setSavingId(variant.id);
    try {
      const updated = await updateProductVariant(storeSlug, productId, variant.id, patch);
      setVariants((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      showFeedback("Changes saved");
    } catch (err) {
      console.error("Failed to update variant:", err);
      alert("Failed to save variant changes.");
    } finally {
      setSavingId(null);
    }
  };

  const handlePriceBlur = (variant: ProductVariant, rawVal: string) => {
    const num = parseInt(rawVal.replace(/\D/g, ""), 10) || 0;
    const priceMinor = num * 100;
    if (priceMinor !== variant.price_minor) {
      handleUpdate(variant, { price_minor: priceMinor });
    }
  };

  const handleCreate = async (label: string, priceMinor: number = 100000) => {
    if (!label.trim()) return;
    setCreating(true);
    try {
      const created = await createProductVariant(storeSlug, productId, {
        label: label.trim(),
        price_minor: priceMinor,
        in_stock: true,
        allow_one_time: true,
        allow_subscription: allowSubscriptionMaster,
      });
      setVariants((prev) => [...prev, created]);
      setNewLabel("");
      setNewPriceRs("");
      showFeedback(`Added variant "${label}"`);
    } catch (err) {
      console.error("Failed to create variant:", err);
      alert("Failed to create variant.");
    } finally {
      setCreating(false);
    }
  };

  const handleQuickAdd = async (items: string[]) => {
    const existingLabels = new Set(variants.map((v) => v.label.toLowerCase()));
    const missing = items.filter((item) => !existingLabels.has(item.toLowerCase()));
    if (missing.length === 0) {
      alert("All variants in this preset already exist.");
      return;
    }

    setCreating(true);
    try {
      const basePrice = variants.length > 0 ? variants[variants.length - 1].price_minor : 100000;
      for (const item of missing) {
        const created = await createProductVariant(storeSlug, productId, {
          label: item,
          price_minor: basePrice,
          in_stock: true,
          allow_one_time: true,
          allow_subscription: allowSubscriptionMaster,
        });
        setVariants((prev) => [...prev, created]);
      }
      showFeedback(`Added ${missing.length} variants`);
    } catch (err) {
      console.error("Failed quick-add:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (variantId: number) => {
    if (!confirm("Remove this variant?")) return;
    try {
      await deleteProductVariant(storeSlug, productId, variantId, true);
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      showFeedback("Variant removed");
    } catch (err) {
      console.error("Failed to delete variant:", err);
      alert("Failed to remove variant.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Add Presets Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--foreground)]">Quick Add:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {QUICK_ADD_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                disabled={creating}
                onClick={() => handleQuickAdd(p.items)}
                className="px-2 py-1 rounded text-[11px] font-medium border border-[var(--border)] bg-[var(--secondary)] hover:bg-[var(--accent)] text-[var(--foreground)] transition-colors cursor-pointer disabled:opacity-50"
              >
                + {p.label}
              </button>
            ))}
          </div>
        </div>

        {feedback && (
          <span className="text-[11px] font-mono text-[var(--st-delivered)] font-medium animate-in fade-in duration-150">
            ✓ {feedback}
          </span>
        )}
      </div>

      {/* Spreadsheet Table (Desktop & Tablet) */}
      <div className="hidden sm:block rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-[var(--muted-foreground)] font-medium">
              <th className="py-2.5 px-3 font-normal w-1/4">Variant Label</th>
              <th className="py-2.5 px-3 font-normal w-1/4">Price (NPR)</th>
              <th className="py-2.5 px-3 font-normal text-center">In Stock</th>
              <th className="py-2.5 px-3 font-normal text-center">Subscription</th>
              <th className="py-2.5 px-3 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {variants.map((v) => (
              <tr key={v.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                {/* Variant Label */}
                <td className="py-2 px-3">
                  <input
                    type="text"
                    defaultValue={v.label}
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value.trim() !== v.label) {
                        handleUpdate(v, { label: e.target.value.trim() });
                      }
                    }}
                    className="w-full h-8 px-2 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                  />
                </td>

                {/* Price in Rs. */}
                <td className="py-2 px-3">
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-mono text-[var(--muted-foreground)]">
                      Rs.
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      defaultValue={Math.round(v.price_minor / 100)}
                      onBlur={(e) => handlePriceBlur(v, e.target.value)}
                      className="w-full h-8 pl-9 pr-2 rounded border border-[var(--border)] bg-[var(--background)] text-xs font-mono tabular-nums text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                    />
                  </div>
                </td>

                {/* In Stock */}
                <td className="py-2 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={v.in_stock}
                    onChange={(e) => handleUpdate(v, { in_stock: e.target.checked })}
                    className="w-4 h-4 rounded border-[var(--border)] accent-[var(--primary)] cursor-pointer"
                  />
                </td>

                {/* Allow Subscription */}
                <td className="py-2 px-3 text-center">
                  <input
                    type="checkbox"
                    disabled={!allowSubscriptionMaster}
                    checked={allowSubscriptionMaster && v.allow_subscription}
                    onChange={(e) => handleUpdate(v, { allow_subscription: e.target.checked })}
                    className="w-4 h-4 rounded border-[var(--border)] accent-[var(--primary)] cursor-pointer disabled:opacity-40"
                    title={
                      allowSubscriptionMaster
                        ? "Available for recurring delivery"
                        : "Enable subscription on product first"
                    }
                  />
                </td>

                {/* Actions */}
                <td className="py-2 px-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    {savingId === v.id && (
                      <span className="text-[10px] font-mono text-[var(--muted-foreground)] mr-1">
                        saving...
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id)}
                      className="px-2 py-1 rounded text-[11px] text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10 cursor-pointer transition-colors"
                      title="Remove variant"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Quick Add Bottom Row */}
            <tr className="bg-[var(--secondary)]/20">
              <td className="py-2 px-3">
                <input
                  type="text"
                  placeholder="+ Add size / variant..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const num = parseInt(newPriceRs.replace(/\D/g, ""), 10) || 1000;
                      handleCreate(newLabel, num * 100);
                    }
                  }}
                  className="w-full h-8 px-2 rounded border border-dashed border-[var(--border)] bg-transparent text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)] focus:border-solid"
                />
              </td>
              <td className="py-2 px-3">
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-mono text-[var(--muted-foreground)]">
                    Rs.
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="1000"
                    value={newPriceRs}
                    onChange={(e) => setNewPriceRs(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const num = parseInt(newPriceRs.replace(/\D/g, ""), 10) || 1000;
                        handleCreate(newLabel, num * 100);
                      }
                    }}
                    className="w-full h-8 pl-9 pr-2 rounded border border-dashed border-[var(--border)] bg-transparent text-xs font-mono tabular-nums text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)] focus:border-solid"
                  />
                </div>
              </td>
              <td colSpan={3} className="py-2 px-3 text-right">
                <button
                  type="button"
                  disabled={creating || !newLabel.trim()}
                  onClick={() => {
                    const num = parseInt(newPriceRs.replace(/\D/g, ""), 10) || 1000;
                    handleCreate(newLabel, num * 100);
                  }}
                  className="h-8 px-3 rounded bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
                >
                  {creating ? "Adding..." : "+ Add Row"}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile Card Stepper (Phones) */}
      <div className="sm:hidden space-y-3">
        {variants.map((v) => (
          <div
            key={v.id}
            className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[var(--foreground)]">{v.label}</span>
              <button
                type="button"
                onClick={() => handleDelete(v.id)}
                className="text-[11px] text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
              >
                ✕ Remove
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[var(--muted-foreground)] block mb-1">
                  Label
                </label>
                <input
                  type="text"
                  defaultValue={v.label}
                  onBlur={(e) => {
                    if (e.target.value.trim() && e.target.value.trim() !== v.label) {
                      handleUpdate(v, { label: e.target.value.trim() });
                    }
                  }}
                  className="w-full h-8 px-2 rounded border border-[var(--border)] bg-[var(--background)] text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-[var(--muted-foreground)] block mb-1">
                  Price (Rs.)
                </label>
                <div className="relative">
                  <span className="absolute left-2 top-2 text-xs font-mono text-[var(--muted-foreground)]">
                    Rs.
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    defaultValue={Math.round(v.price_minor / 100)}
                    onBlur={(e) => handlePriceBlur(v, e.target.value)}
                    className="w-full h-8 pl-8 pr-2 rounded border border-[var(--border)] bg-[var(--background)] text-xs font-mono tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[var(--border)] text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={v.in_stock}
                  onChange={(e) => handleUpdate(v, { in_stock: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--border)] accent-[var(--primary)]"
                />
                <span>In Stock</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!allowSubscriptionMaster}
                  checked={allowSubscriptionMaster && v.allow_subscription}
                  onChange={(e) => handleUpdate(v, { allow_subscription: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--border)] accent-[var(--primary)] disabled:opacity-40"
                />
                <span>Subscribe</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
