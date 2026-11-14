// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * A picture through next/image (resized, WebP/AVIF, lazy-loaded), with a placeholder when
 * there's no URL or it fails to load. Pictures from outside the Storage bucket (e.g. a
 * pasted link) are shown as they are, since next/image only resizes allowed sources.
 */
export default function SafeImage({
  src,
  alt,
  className,
  fallbackClassName,
  fallbackText = "Image unavailable",
  width = 1600,
  height = 1000,
  sizes = "(max-width: 768px) 100vw, 768px",
  priority = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  fallbackText?: string;
  /** Intrinsic size, only used for the aspect ratio while loading. */
  width?: number;
  height?: number;
  /** How wide the image is shown, so the browser picks the right size. */
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);

  if (!src || failed === src) {
    return (
      <div
        className={
          fallbackClassName ??
          "flex h-48 items-center justify-center rounded-lg border border-dashed border-border font-mono text-sm text-gray-400"
        }
      >
        {fallbackText}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      unoptimized={!src.includes("/storage/v1/object/public/portfolio-media/")}
      className={className}
      style={{ height: "auto" }}
      onError={() => setFailed(src)}
    />
  );
}
