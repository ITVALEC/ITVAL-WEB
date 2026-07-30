"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

const DEFAULT_FALLBACK = "/images/pages/products.jpg";

type SafeImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt: string;
  /**
   * Imagen de respaldo si `src` falla.
   * - string: usa esa ruta (por defecto pages/products.jpg)
   * - false: no sustituir; deja de intentar (el caller puede ocultar el slide)
   */
  fallbackSrc?: string | false;
};

export function SafeImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  className,
  onError,
  ...props
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setFailed(false);
  }, [src]);

  const effectiveFallback =
    typeof fallbackSrc === "string" && fallbackSrc.trim() && fallbackSrc !== src
      ? fallbackSrc.trim()
      : false;

  if (failed && effectiveFallback === false) {
    return null;
  }

  const resolvedSrc =
    failed && typeof effectiveFallback === "string" ? effectiveFallback : currentSrc;

  return (
    <Image
      {...props}
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={(event) => {
        if (!failed) {
          setFailed(true);
          if (typeof effectiveFallback === "string" && currentSrc !== effectiveFallback) {
            setCurrentSrc(effectiveFallback);
          }
        }
        onError?.(event);
      }}
    />
  );
}
