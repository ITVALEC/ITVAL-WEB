import { IMAGES } from "./assets";
import manifest from "./catalog/product-images.json";
import { type ProductKey } from "./catalog/types";

/** Imágenes de fondo del hero — carrusel independiente del texto. */
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
  categories: Partial<Record<ProductKey, string>>;
};

const data = manifest as ProductImageManifest;

export function getHeroBackgroundSources(): string[] {
  const slides = HERO_SLIDE_CATEGORIES.flatMap(
    (category) => data.categories[category] ?? [],
  );

  return slides.length > 0 ? slides : [IMAGES.hero];
}
