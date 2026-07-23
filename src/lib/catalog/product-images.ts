import type { ProductKey } from "./types";
import manifest from "./product-images.json";
import { isBlockedImageSrc } from "./blocked-images";

export type GalleryImageSource = "product" | "project";

export type ProductGalleryImage = {
  src: string;
  caption: string;
  source?: GalleryImageSource;
};

type ProductImageManifest = {
  categories: Partial<Record<ProductKey, string>>;
  subcategories: Partial<Record<ProductKey, Partial<Record<string, string>>>>;
  galleries?: Partial<
    Record<ProductKey, Partial<Record<string, ProductGalleryImage[]>>>
  >;
};

const data = manifest as ProductImageManifest;

/** Fotos de obras/referencias importadas históricamente bajo .../gallery/.../projects/ */
export function isProjectReferenceSrc(src: string): boolean {
  const normalized = src.replace(/\\/g, "/").toLowerCase();
  return (
    normalized.includes("/gallery/") &&
    (normalized.includes("/projects/") || normalized.includes("/project/"))
  );
}

export function resolveGalleryImageSource(
  image: Pick<ProductGalleryImage, "src" | "source">,
): GalleryImageSource {
  if (image.source === "product" || image.source === "project") {
    return image.source;
  }
  return isProjectReferenceSrc(image.src) ? "project" : "product";
}

function normalizeGalleryImage(image: ProductGalleryImage): ProductGalleryImage {
  return {
    ...image,
    source: resolveGalleryImageSource(image),
  };
}

export function getProductCategoryImage(
  category: ProductKey,
): string | undefined {
  const image = data.categories[category];
  if (!image || isBlockedImageSrc(image)) return undefined;
  return image;
}

export function getProductSubcategoryImage(
  category: ProductKey,
  subcategory: string,
): string | undefined {
  const image = data.subcategories[category]?.[subcategory];
  if (!image || isBlockedImageSrc(image)) return undefined;
  return image;
}

export function getProductImage(
  category: ProductKey,
  subcategory?: string,
): string | undefined {
  if (subcategory) {
    return getProductSubcategoryImage(category, subcategory);
  }
  return getProductCategoryImage(category);
}

export function hasProductImage(
  category: ProductKey,
  subcategory?: string,
): boolean {
  return Boolean(getProductImage(category, subcategory));
}

export type GetProductGalleryOptions = {
  /** Si se omite, devuelve todas las fotos (producto + referencias). */
  source?: GalleryImageSource;
};

/**
 * Galería asociada a una subcategoría.
 * - source: "product" → solo fotos del producto (carrusel / vista previa)
 * - source: "project" → solo obras y referencias
 */
export function getProductGallery(
  category: ProductKey,
  subcategory: string,
  options: GetProductGalleryOptions = {},
): ProductGalleryImage[] {
  const items = (data.galleries?.[category]?.[subcategory] ?? [])
    .filter((item) => !isBlockedImageSrc(item.src))
    .map(normalizeGalleryImage);

  const filtered = options.source
    ? items.filter((item) => item.source === options.source)
    : items;

  if (filtered.length > 0) return filtered;

  // Fallback de portada solo para la galería de producto.
  if (!options.source || options.source === "product") {
    const primary = getProductSubcategoryImage(category, subcategory);
    if (primary) {
      return [{ src: primary, caption: "", source: "product" }];
    }
  }

  return [];
}

/** Fotos del producto para el carrusel / vista previa. */
export function getProductOnlyGallery(
  category: ProductKey,
  subcategory: string,
): ProductGalleryImage[] {
  return getProductGallery(category, subcategory, { source: "product" });
}

/** Fotos de obras y referencias vinculadas al producto. */
export function getProjectReferenceGallery(
  category: ProductKey,
  subcategory: string,
): ProductGalleryImage[] {
  return getProductGallery(category, subcategory, { source: "project" });
}
