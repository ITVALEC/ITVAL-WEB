export function normalizePublicSrc(src: string): string {
  const trimmed = src.trim().replace(/\\/g, "/");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/** Marcadores SVG de plantilla; nunca en carrusel publico de producto. */
export function isCatalogPlaceholderSrc(src: string): boolean {
  const normalized = normalizePublicSrc(src);
  if (
    /^\/images\/(pages\/|site\/hero\.svg$|products\/[^/]+\.svg$|projects\/[^/]+\.svg$)/i.test(
      normalized,
    )
  ) {
    return true;
  }
  const lower = normalized.toLowerCase();
  return (
    lower.includes("reemplazar con foto propia") ||
    /\/pages\/(projects|products)(\.svg)?$/i.test(normalized)
  );
}

/** Alias historico del admin. */
export function isSharedPlaceholderSrc(src: string): boolean {
  return isCatalogPlaceholderSrc(src);
}
