"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  createMerchantProduct,
  ProductItem,
  ProductPayload,
  updateMerchantProduct,
} from "@/lib/api";

interface ProductSheetProps {
  storeSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductItem | null;
  onSaved: (product: ProductItem) => void;
}

export function ProductSheet({
  storeSlug,
  open,
  onOpenChange,
  product,
  onSaved,
}: ProductSheetProps) {
  // Use unique key in content to reset state on product change
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity" />
        <Dialog.Content className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md border-l border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto outline-none animate-in slide-in-from-right duration-200">
          <ProductForm
            key={product ? `edit-${product.id}` : "new"}
            storeSlug={storeSlug}
            product={product}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ProductForm({
  storeSlug,
  product,
  onClose,
  onSaved,
}: {
  storeSlug: string;
  product?: ProductItem | null;
  onClose: () => void;
  onSaved: (product: ProductItem) => void;
}) {
  const isEditing = Boolean(product);

  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [imageUrl, setImageUrl] = useState(product?.image_url || "");
  const [initialPriceRs, setInitialPriceRs] = useState("1200");
  const [allowOneTime, setAllowOneTime] = useState(product ? product.allow_one_time : true);
  const [allowSubscription, setAllowSubscription] = useState(
    product ? product.allow_subscription : false
  );
  const [isActive, setIsActive] = useState(product ? product.is_active : true);

  // Attributes: key-value pairs
  const [attributes, setAttributes] = useState<Array<{ key: string; value: string }>>(() => {
    if (product && product.attributes) {
      return Object.entries(product.attributes).map(([key, value]) => ({ key, value }));
    }
    return [
      { key: "origin", value: "Nepal" },
      { key: "batch", value: "Fresh" },
    ];
  });
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrVal, setNewAttrVal] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddAttribute = () => {
    if (!newAttrKey.trim() || !newAttrVal.trim()) return;
    setAttributes((prev) => [...prev, { key: newAttrKey.trim(), value: newAttrVal.trim() }]);
    setNewAttrKey("");
    setNewAttrVal("");
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const attrDict: Record<string, string> = {};
    attributes.forEach((attr) => {
      if (attr.key.trim()) attrDict[attr.key.trim()] = attr.value.trim();
    });

    try {
      if (isEditing && product) {
        const payload: Partial<ProductPayload> = {
          name: name.trim(),
          description: description.trim(),
          image_url: imageUrl.trim(),
          attributes: attrDict,
          allow_one_time: allowOneTime,
          allow_subscription: allowSubscription,
          is_active: isActive,
        };
        const updated = await updateMerchantProduct(storeSlug, product.id, payload);
        onSaved(updated);
        onClose();
      } else {
        const priceMinor = Math.max(0, Math.round((parseInt(initialPriceRs, 10) || 0) * 100));
        const payload: ProductPayload = {
          name: name.trim(),
          description: description.trim(),
          image_url: imageUrl.trim(),
          attributes: attrDict,
          allow_one_time: allowOneTime,
          allow_subscription: allowSubscription,
          is_active: isActive,
          initial_price_minor: priceMinor,
        };
        const created = await createMerchantProduct(storeSlug, payload);
        onSaved(created);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save product";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              {isEditing ? "Edit Product" : "New Catalog Product"}
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {isEditing ? `Modifying #${product?.id}` : "Add an offering to your store catalog"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono px-2 py-1 rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)] text-xs">
            {error}
          </div>
        )}

        {/* Product Name */}
        <div className="space-y-1">
          <label htmlFor="prod-name" className="text-xs font-medium text-[var(--foreground)]">
            Product Title
          </label>
          <input
            id="prod-name"
            type="text"
            required
            placeholder="e.g. Ilam Valley First Flush"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label htmlFor="prod-desc" className="text-xs font-medium text-[var(--foreground)]">
            Description
          </label>
          <textarea
            id="prod-desc"
            rows={3}
            placeholder="Origin, tasting notes, harvest season, or craft details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] resize-none"
          />
        </div>

        {/* Initial Price (only for new products) */}
        {!isEditing && (
          <div className="space-y-1">
            <label htmlFor="prod-price" className="text-xs font-medium text-[var(--foreground)]">
              Initial Price (Standard Variant)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-mono text-[var(--muted-foreground)]">
                Rs.
              </span>
              <input
                id="prod-price"
                type="number"
                min="0"
                step="5"
                required
                value={initialPriceRs}
                onChange={(e) => setInitialPriceRs(e.target.value)}
                className="w-full h-9 pl-10 pr-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs font-mono tabular-nums text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
              />
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              You can add more package sizes (250g, 500g, 1kg) in the variant editor.
            </p>
          </div>
        )}

        {/* Photo URL / Cloudinary Preview */}
        <div className="space-y-1.5">
          <label htmlFor="prod-image" className="text-xs font-medium text-[var(--foreground)]">
            Photo URL (Cloudinary or Direct Image)
          </label>
          <input
            id="prod-image"
            type="url"
            placeholder="https://res.cloudinary.com/... or https://..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs font-mono text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
          />

          {imageUrl && (
            <div className="mt-2 flex items-center gap-3 p-2 rounded border border-[var(--border)] bg-[var(--secondary)]/40">
              <div className="w-12 h-12 rounded border border-[var(--border)] overflow-hidden shrink-0 bg-[var(--background)] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div className="text-[11px] text-[var(--muted-foreground)] truncate">
                <span className="font-medium text-[var(--foreground)]">Image Preview Loaded</span>
                <p className="truncate text-[10px] font-mono">{imageUrl}</p>
              </div>
            </div>
          )}
        </div>

        {/* Custom Attributes Chips */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--foreground)]">
            Product Attributes &amp; Specifications
          </label>

          <div className="flex flex-wrap gap-1.5 min-h-6">
            {attributes.length === 0 ? (
              <span className="text-[11px] text-[var(--muted-foreground)] italic">
                No custom tags yet.
              </span>
            ) : (
              attributes.map((attr, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]"
                >
                  <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
                    {attr.key}:
                  </span>
                  <span>{attr.value}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttribute(idx)}
                    className="hover:text-[var(--destructive)] text-[10px] cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Key (e.g. Roast)"
              value={newAttrKey}
              onChange={(e) => setNewAttrKey(e.target.value)}
              className="w-1/3 h-8 px-2.5 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)]"
            />
            <input
              type="text"
              placeholder="Value (e.g. Medium-Dark)"
              value={newAttrVal}
              onChange={(e) => setNewAttrVal(e.target.value)}
              className="flex-1 h-8 px-2.5 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)]"
            />
            <button
              type="button"
              onClick={handleAddAttribute}
              className="h-8 px-3 rounded border border-[var(--border)] bg-[var(--secondary)] hover:bg-[var(--accent)] text-xs font-medium cursor-pointer"
            >
              + Tag
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium text-[var(--foreground)]">
              One-time purchase enabled
            </span>
            <input
              type="checkbox"
              checked={allowOneTime}
              onChange={(e) => setAllowOneTime(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border)] accent-[var(--primary)] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium text-[var(--foreground)]">
              Subscription delivery enabled
            </span>
            <input
              type="checkbox"
              checked={allowSubscription}
              onChange={(e) => setAllowSubscription(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border)] accent-[var(--primary)] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium text-[var(--foreground)]">
              Visible on Storefront (Active)
            </span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border)] accent-[var(--primary)] cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="pt-6 border-t border-[var(--border)] flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-9 px-4 rounded border border-[var(--border)] bg-[var(--secondary)] text-xs font-medium text-[var(--foreground)] hover:bg-[var(--accent)] cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="h-9 px-5 rounded bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
        >
          {submitting ? "Saving..." : isEditing ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
