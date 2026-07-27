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
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-200 px-3 text-center">
      <span className="text-sm font-semibold text-navy">Sin foto</span>
      <span className="text-xs text-grey-dark">{label}</span>
    </div>
  );
}

/**
 * Miniatura del panel admin: muestra la imagen real o un estado vacío claro
 * (sin el SVG "pages/products"). Cache-bust opcional tras subir/reemplazar.
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
      // Evita caer en otro SVG marcador; el onError muestra "Sin foto".
      fallbackSrc={withCacheBust(resolved, version)}
      onError={() => setLoadFailed(true)}
    />
  );
}
