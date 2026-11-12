"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, AlertCircle, RefreshCw, Trash2, CheckCircle2 } from "lucide-react";
import { uploadThemeMedia } from "@/lib/api";

interface ThemeMediaUploadProps {
  label: string;
  description?: string;
  assetType: "hero" | "logo";
  storeSlug: string;
  value: string;
  onChange: (url: string) => void;
  error?: string | null;
}

export function ThemeMediaUpload({
  label,
  description,
  assetType,
  storeSlug,
  value,
  onChange,
  error,
}: ThemeMediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  const maxSizeBytes = assetType === "hero" ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
  const maxMb = assetType === "hero" ? 5 : 2;

  const handleFile = async (file: File) => {
    setLocalError(null);

    // 1. Rejection of SVG
    const nameLower = file.name.toLowerCase();
    if (file.type === "image/svg+xml" || nameLower.endsWith(".svg")) {
      setLocalError("SVG files are not supported. Please upload JPEG, PNG, or WebP.");
      return;
    }

    // 2. Strict format whitelist
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
    const hasValidExt = allowedExts.some((ext) => nameLower.endsWith(ext));
    if (!allowedTypes.includes(file.type) && !hasValidExt) {
      setLocalError("Unsupported image format. Please upload JPG, PNG, or WebP.");
      return;
    }

    // 3. Size check
    if (file.size > maxSizeBytes) {
      setLocalError(`${assetType === "hero" ? "Hero" : "Logo"} image exceeds ${maxMb}MB limit.`);
      return;
    }

    setUploading(true);
    setImageLoadError(false);

    try {
      const res = await uploadThemeMedia(storeSlug, file, assetType);
      onChange(res.url);
      setLocalError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image.";
      setLocalError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
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
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const activeError = localError || error;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[var(--foreground)] block">
          {label}
        </label>
        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
          {assetType === "hero" ? "5MB max · JPG/PNG/WebP" : "2MB max · JPG/PNG/WebP"}
        </span>
      </div>

      {description && (
        <p className="text-[11px] text-[var(--muted-foreground)] leading-snug">
          {description}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Preview & Upload container */}
      {value ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 space-y-3">
          <div className="relative group overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--secondary)]/30 flex items-center justify-center">
            {imageLoadError ? (
              <div className="py-8 px-4 text-center space-y-1">
                <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                <p className="text-xs font-medium text-[var(--foreground)]">Image Preview Unavailable</p>
                <p className="text-[10px] text-[var(--muted-foreground)] font-mono break-all max-w-xs line-clamp-2">
                  {value}
                </p>
              </div>
            ) : assetType === "hero" ? (
              <div className="w-full aspect-[21/9] max-h-48 relative overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={value}
                  alt={label}
                  className="w-full h-full object-cover"
                  onError={() => setImageLoadError(true)}
                />
              </div>
            ) : (
              <div className="w-full py-4 flex items-center justify-center bg-black/5 dark:bg-white/5">
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-[var(--border)] shadow-xs bg-[var(--background)] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={value}
                    alt={label}
                    className="w-full h-full object-contain"
                    onError={() => setImageLoadError(true)}
                  />
                </div>
              </div>
            )}

            {/* Uploading overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-xs font-semibold">Uploading to CDN...</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border)]/50">
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate max-w-[200px]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Cloudinary CDN Synced</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-2.5 py-1 text-xs font-semibold rounded border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--secondary)] text-[var(--foreground)] transition-colors cursor-pointer disabled:opacity-50"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setImageLoadError(false);
                  setLocalError(null);
                }}
                disabled={uploading}
                className="p-1 text-xs rounded text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20"
              : activeError
              ? "border-red-500/40 bg-red-500/5 hover:border-red-500/60"
              : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--border)]/80 hover:bg-[var(--secondary)]/20"
          }`}
        >
          {uploading ? (
            <div className="space-y-2 py-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
              <p className="text-xs font-semibold text-[var(--foreground)]">Uploading &amp; optimizing...</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">Processing signed upload with Cloudinary</p>
            </div>
          ) : (
            <div className="space-y-2 py-1">
              <div className="w-10 h-10 rounded-full bg-[var(--secondary)] flex items-center justify-center mx-auto text-[var(--muted-foreground)]">
                {assetType === "hero" ? <ImageIcon className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--foreground)]">
                  Click to upload or drag &amp; drop
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  JPEG, PNG, or WebP up to {maxMb}MB (SVG not allowed)
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--foreground)] border border-[var(--border)] transition-colors pointer-events-none"
              >
                Choose File
              </button>
            </div>
          )}
        </div>
      )}

      {/* Field-level error */}
      {activeError && (
        <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 font-medium pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{activeError}</span>
        </div>
      )}
    </div>
  );
}
