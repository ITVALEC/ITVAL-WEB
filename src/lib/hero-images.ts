import { IMAGES } from "./assets";
import manifest from "./catalog/product-images.json";
import { isCatalogPlaceholderSrc } from "@/lib/media/placeholder-src";
import { PRODUCT_KEYS, type ProductKey } from "./catalog/types";

/**
 * Fondos del hero home: solo portadas reales del catálogo (manifiesto / DB).
 * No usar creatividades con texto embebido.
 */
type ProductImageManifest = {
  categories?: Partial<Record<ProductKey, string>>;
};

function isRasterPublicSrc(src: string): boolean {
  const value = src.trim();
  if (!value || isCatalogPlaceholderSrc(value)) return false;
  return /\.(jpe?g|png|webp|avif|gif)$/i.test(value.split("?")[0] ?? value);
}

/** Fuentes de fondo del hero (carrusel). Solo rasters del catálogo, sin placeholders SVG. */
export function getHeroBackgroundSources(
  liveCategories?: Partial<Record<ProductKey, string>> | null,
): string[] {
  const data = (liveCategories
    ? { categories: liveCategories }
    : (manifest as ProductImageManifest)) as ProductImageManifest;

  const slides = PRODUCT_KEYS.map((category) => data.categories?.[category]).filter(
    (src): src is string => typeof src === "string" && isRasterPublicSrc(src),
  );

  // Deduplicar por si dos categorías apuntan a la misma ruta.
  const unique = [...new Set(slides)];
  if (unique.length > 0) return unique;

  // Último recurso raster de páginas (no SVG).
  if (isRasterPublicSrc(IMAGES.pages.products)) {
    return [IMAGES.pages.products];
  }

  return [];
}
