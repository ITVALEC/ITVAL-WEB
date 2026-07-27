/** Marcadores compartidos: nunca sobrescribir ni borrar al reemplazar una portada. */
const SHARED_PLACEHOLDER_RE =
  /^\/images\/(pages\/|site\/hero\.svg$|products\/[^/]+\.svg$|projects\/[^/]+\.svg$)/i;

export function normalizePublicSrc(src: string): string {
  const trimmed = src.trim().replace(/\\/g, "/");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/** Rutas compartidas de marcador (p. ej. pages/products.svg). */
export function isSharedPlaceholderSrc(src: string): boolean {
  return SHARED_PLACEHOLDER_RE.test(normalizePublicSrc(src));
}
