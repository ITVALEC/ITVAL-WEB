"use client";

import { SafeImage } from "@/components/ui/SafeImage";

type AdminMediaImageProps = {
  src: string | null | undefined;
  alt?: string;
  /** Fuerza recarga tras reemplazo/subida (p. ej. Date.now()). */
  version?: number;
  className?: string;
  sizes?: string;
  fallbackSrc?: string;
};

function withCacheBust(src: string, version?: number): string {
  if (!version) return src;
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}v=${version}`;
}

/**
 * Miniatura del panel admin: usa SafeImage (fallback si el archivo falta)
 * y cache-bust opcional para ver cambios al instante tras subir/reemplazar.
 */
export function AdminMediaImage({
  src,
  alt = "",
  version,
  className = "object-cover",
  sizes = "96px",
  fallbackSrc = "/images/pages/products.svg",
}: AdminMediaImageProps) {
  const resolved = src?.trim();
  if (!resolved) {
    return (
      <SafeImage
        src={fallbackSrc}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        unoptimized
        fallbackSrc={fallbackSrc}
      />
    );
  }

  return (
    <SafeImage
      src={withCacheBust(resolved, version)}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      unoptimized
      fallbackSrc={fallbackSrc}
    />
  );
}
