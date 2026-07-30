"use client";

import { useEffect, useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { isSharedPlaceholderSrc } from "@/lib/admin/media-placeholder";

type AdminMediaImageProps = {
  src: string | null | undefined;
  alt?: string;
  /** Fuerza recarga tras reemplazo/subida (p. ej. Date.now()). */
  version?: number;
  className?: string;
  sizes?: string;
  /** @deprecated Ya no se usa; el estado vacío es un mensaje, no un SVG marcador. */
  fallbackSrc?: string;
  /** Si el archivo no está en disco o es un marcador compartido. */
  fileMissing?: boolean;
  emptyLabel?: string;
};

function withCacheBust(src: string, version?: number): string {
  if (!version) return src;
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}v=${version}`;
}

function MissingPreview({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-surface-muted px-3 text-center">
      <span className="text-sm font-semibold text-navy">Sin foto</span>
      <span className="text-xs text-ink/80">{label}</span>
    </div>
  );
}

/**
 * Miniatura del panel admin: muestra la imagen real o un estado vacío claro
 * (sin el SVG "pages/products"). Cache-bust opcional tras subir/reemplazar.
 * Nunca reintenta la misma URL rota (eso duplicaba 404 en consola).
 */
export function AdminMediaImage({
  src,
  alt = "",
  version,
  className = "object-cover",
  sizes = "96px",
  fallbackSrc: _fallbackSrc,
  fileMissing,
  emptyLabel = "Sube o reemplaza una imagen propia",
}: AdminMediaImageProps) {
  const resolved = src?.trim();
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [resolved, version]);

  const treatAsMissing =
    fileMissing || !resolved || isSharedPlaceholderSrc(resolved) || loadFailed;

  if (treatAsMissing) {
    return <MissingPreview label={emptyLabel} />;
  }

  return (
    <SafeImage
      src={withCacheBust(resolved, version)}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      unoptimized
      // No reintentar la misma URL: un 404 basta para mostrar "Sin foto".
      fallbackSrc={false}
      onError={() => setLoadFailed(true)}
    />
  );
}
