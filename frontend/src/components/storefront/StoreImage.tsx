"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  optimizeCloudinaryUrl,
  shouldBypassNextImageOptimization,
} from "@/lib/cloudinary";

export interface StoreImageProps {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Responsive storefront image backed by `next/image` and Cloudinary `f_auto,q_auto`.
 * Renders inside a `relative` parent container using `fill` layout and falls back
 * cleanly if the remote asset fails to load.
 */
export function StoreImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "object-cover",
  fallback = null,
}: StoreImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const normalizedSrc = optimizeCloudinaryUrl(src);
  if (!normalizedSrc || failedSrc === normalizedSrc) {
    return <>{fallback}</>;
  }

  const unoptimized = shouldBypassNextImageOptimization(normalizedSrc);

  return (
    <Image
      src={normalizedSrc}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
      onError={() => setFailedSrc(normalizedSrc)}
      className={className}
    />
  );
}
