"use client";

import React, { useState, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";
import {
  createMerchantProduct,
  ProductItem,
  ProductPayload,
  updateMerchantProduct,
} from "@/lib/api";

const PRESET_IMAGES = [
  {
    category: "Coffee & Roastery",
    label: "Himalayan Typica Roast",
    url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80",
  },
  {
    category: "Coffee & Roastery",
    label: "Pour-Over Barista Beans",
    url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
  },
  {
    category: "Teas & Botanicals",
    label: "Ilam Valley Orthodox Tea",
    url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
  },
  {
    category: "Teas & Botanicals",
    label: "Himalayan Herbal Wellness",
    url: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=800&auto=format&fit=crop&q=80",
  },
  {
    category: "Streetwear & Apparel",
    label: "KTM Heavyweight Boxy Tee",
    url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
  },
  {
    category: "Streetwear & Apparel",
    label: "Cyberpunk Graphic Hoodie",
    url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
  },
  {
    category: "Pottery & Crafts",
    label: "Hand-Thrown Terracotta Vase",
    url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop&q=80",
  },
  {
    category: "Honey & Organics",
    label: "Raw Himalayan Cliff Honey",
    url: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80",
  },
];

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

  // Image upload state
  const [imageTab, setImageTab] = useState<"upload" | "presets" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUploadFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/merchant/stores/${encodeURIComponent(storeSlug)}/media/upload/`, {
        credentials: "include",
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      setImageUrl(data.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
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
            placeholder="e.g. Ilam Valley First Flush or Boxy Tee"
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
            placeholder="Origin, craft details, sizing specs, or tasting notes..."
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
              You can configure options (sizes, grinds, variants) after creating.
            </p>
          </div>
        )}

        {/* Product Image Section with 3 Options: Upload / Presets / URL */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--foreground)]">
              Product Photo
            </label>
            {imageUrl && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-800 dark:text-emerald-400">
                <Check className="w-3 h-3" />
                <span>Photo Selected</span>
              </span>
            )}
          </div>

          {/* Active Image Preview Card */}
          {imageUrl ? (
            <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-md border border-[var(--border)] overflow-hidden shrink-0 bg-[var(--background)] relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1 text-left">
                  <p className="text-xs font-semibold text-[var(--foreground)]">
                    Current Image
                  </p>
                  <p className="text-[10px] font-mono text-[var(--muted-foreground)] truncate max-w-[220px]">
                    {imageUrl}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="p-1.5 rounded text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]/60 text-[11px]">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-[var(--primary)] hover:underline cursor-pointer"
                >
                  Replace with new file
                </button>
                <span className="text-[var(--muted-foreground)]">·</span>
                <button
                  type="button"
                  onClick={() => setImageTab("presets")}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  Pick from Presets
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Option Mode Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setImageTab("upload")}
                  className={`py-1.5 px-2 rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    imageTab === "upload"
                      ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs font-semibold"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageTab("presets")}
                  className={`py-1.5 px-2 rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    imageTab === "presets"
                      ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs font-semibold"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Presets</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageTab("url")}
                  className={`py-1.5 px-2 rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    imageTab === "url"
                      ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs font-semibold"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Web Link</span>
                </button>
              </div>

              {/* Tab 1: Upload File from Device */}
              {imageTab === "upload" && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-5 rounded-lg border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                    dragActive
                      ? "border-[var(--primary)] bg-[var(--primary)]/5"
                      : "border-[var(--border)] hover:border-[var(--muted-foreground)] bg-[var(--background)]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {uploading ? (
                    <div className="py-2 flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                      <span className="text-xs font-mono text-[var(--muted-foreground)]">
                        Uploading image...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-full bg-[var(--secondary)] flex items-center justify-center text-[var(--foreground)]">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-[var(--foreground)]">
                          Click to browse or drag &amp; drop
                        </p>
                        <p className="text-[10px] text-[var(--muted-foreground)] font-mono">
                          JPG, PNG, WebP up to 5MB (stored on local server)
                        </p>
                      </div>
                    </>
                  )}

                  {uploadError && (
                    <p className="text-[11px] text-[var(--destructive)] pt-1">
                      {uploadError}
                    </p>
                  )}
                </div>
              )}

              {/* Tab 2: Nepali Presets Library */}
              {imageTab === "presets" && (
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] space-y-2">
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    Pick a production-ready Nepali product image:
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className="group flex items-center gap-2 p-1.5 rounded border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] text-left cursor-pointer transition-all"
                      >
                        <div className="w-9 h-9 rounded overflow-hidden shrink-0 bg-[var(--secondary)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium text-[var(--foreground)] truncate">
                            {preset.label}
                          </p>
                          <p className="text-[9px] text-[var(--muted-foreground)] uppercase font-mono truncate">
                            {preset.category}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Paste Direct URL */}
              {imageTab === "url" && (
                <div className="space-y-2">
                  <input
                    id="prod-image-url"
                    type="url"
                    placeholder="https://images.unsplash.com/... or Cloudinary URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--background)] text-xs font-mono text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                  />
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Paste any public image link from Cloudinary, Imgur, PostImages, or your website.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden fallback file input so user can replace anytime */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFileChange}
          className="hidden"
        />

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
              placeholder="Key (e.g. Sizing or Origin)"
              value={newAttrKey}
              onChange={(e) => setNewAttrKey(e.target.value)}
              className="w-1/3 h-8 px-2.5 rounded border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)]"
            />
            <input
              type="text"
              placeholder="Value (e.g. M, L or Gulmi)"
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
