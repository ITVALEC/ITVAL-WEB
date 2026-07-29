import { IMAGES } from "./assets";
import manifest from "./catalog/product-images.json";
import { isCatalogPlaceholderSrc } from "@/lib/media/placeholder-src";
import { type ProductKey } from "./catalog/types";

/**
 * Fondos del hero home.
 * Prioridad: fotos dedicadas en site/hero → portadas reales de categorías → nunca SVG solo.
 */
export const HERO_DEDICATED_SLIDES = [
  "/images/site/hero/design-build.png",
  "/images/site/hero/experience.png",
  "/images/site/hero/innovative.png",
] as const;

/** Categorías cuyas portadas refuerzan el carrusel si las dedicadas faltan. */
export const HERO_SLIDE_CATEGORIES = [
  "facades",
  "aluminumWindows",
  "doorsAccess",
  "security",
  "coversExteriors",
  "corporateInteriors",
] as const satisfies readonly ProductKey[];

export type HeroSlideCategory = (typeof HERO_SLIDE_CATEGORIES)[number];

type ProductImageManifest = {
  categories?: Partial<Record<ProductKey, string>>;
};

function isRasterPublicSrc(src: string): boolean {
  const value = src.trim();
  if (!value || isCatalogPlaceholderSrc(value)) return false;
  return /\.(jpe?g|png|webp|avif|gif)$/i.test(value.split("?")[0] ?? value);
}

/** Fuentes de fondo del hero (carrusel). Sin placeholders SVG. */
export function getHeroBackgroundSources(
  liveCategories?: Partial<Record<ProductKey, string>> | null,
): string[] {
  const data = (liveCategories
    ? { categories: liveCategories }
    : (manifest as ProductImageManifest)) as ProductImageManifest;

  const dedicated = HERO_DEDICATED_SLIDES.filter(isRasterPublicSrc);

  const fromCategories = HERO_SLIDE_CATEGORIES.map(
    (category) => data.categories?.[category],
  ).filter((src): src is string => typeof src === "string" && isRasterPublicSrc(src));

  const slides: string[] = [...dedicated];
  for (const src of fromCategories) {
    if (!slides.includes(src)) slides.push(src);
  }

  if (slides.length > 0) return slides;

  // Último recurso raster de páginas (no SVG).
  if (isRasterPublicSrc(IMAGES.pages.products)) {
    return [IMAGES.pages.products];
  }

  return [];
}
