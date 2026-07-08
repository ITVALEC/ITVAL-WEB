import type { ProductKey } from "./types";
import manifest from "./product-images.json";
import { isBlockedImageSrc } from "./blocked-images";

export type ProductGalleryImage = {
  src: string;
  caption: string;
  source?: "product" | "project";
};

type ProductImageManifest = {
  categories: Partial<Record<ProductKey, string>>;
  subcategories: Partial<Record<ProductKey, Partial<Record<string, string>>>>;
  galleries?: Partial<
    Record<ProductKey, Partial<Record<string, ProductGalleryImage[]>>>
  >;
};

const data = manifest as ProductImageManifest;

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

export function getProductGallery(
  category: ProductKey,
  subcategory: string,
): ProductGalleryImage[] {
  const items = (data.galleries?.[category]?.[subcategory] ?? []).filter(
    (item) => !isBlockedImageSrc(item.src),
  );
  const primary = getProductSubcategoryImage(category, subcategory);

  if (items.length > 0) return items;

  if (primary) {
    return [{ src: primary, caption: "", source: "product" }];
  }

  return [];
}
