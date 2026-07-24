import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { getDocument } from "@/lib/db/documents";
import { isDatabaseEnabled, query } from "@/lib/db/pool";
import { isBlockedImageSrc } from "./blocked-images";
import bundled from "./product-images.json";
import type { ProductKey } from "./types";
import {
  resolveGalleryImageSource,
  type GalleryImageSource,
  type ProductGalleryImage,
} from "./product-images";

export type ProductImageManifest = {
  categories?: Partial<Record<ProductKey, string>>;
  subcategories?: Partial<Record<ProductKey, Partial<Record<string, string>>>>;
  galleries?: Partial<
    Record<ProductKey, Partial<Record<string, ProductGalleryImage[]>>>
  >;
};

function normalizeGalleryImage(image: ProductGalleryImage): ProductGalleryImage {
  return {
    ...image,
    source: resolveGalleryImageSource(image),
  };
}

/** Manifiesto vivo (DB / disco), no el snapshot del build. */
export async function loadProductImagesManifest(): Promise<ProductImageManifest> {
  noStore();
  try {
    const fromDocs = await getDocument<ProductImageManifest>("productImages");
    if (fromDocs && typeof fromDocs === "object") {
      return await mergeGalleryRowsFromDb(fromDocs);
    }
  } catch {
    /* fallback */
  }
  return mergeGalleryRowsFromDb(bundled as ProductImageManifest);
}

async function mergeGalleryRowsFromDb(
  base: ProductImageManifest,
): Promise<ProductImageManifest> {
  if (!isDatabaseEnabled()) return base;

  try {
    const { rows } = await query<{
      category: string;
      subcategory: string;
      src: string;
      caption: string;
      sort_order: number;
      source: string | null;
    }>(
      `SELECT category, subcategory, src, caption, sort_order, source
       FROM product_gallery_images
       ORDER BY category, subcategory, sort_order`,
    );

    if (rows.length === 0) return base;

    const galleries: NonNullable<ProductImageManifest["galleries"]> = {
      ...(base.galleries ?? {}),
    };

    // Reconstruir cada subcategoría presente en DB para no mezclar índices viejos.
    const seen = new Set<string>();
    for (const row of rows) {
      const key = `${row.category}::${row.subcategory}`;
      if (!seen.has(key)) {
        seen.add(key);
        const category = row.category as ProductKey;
        galleries[category] ??= {};
        galleries[category]![row.subcategory] = [];
      }
    }

    for (const row of rows) {
      const category = row.category as ProductKey;
      const source =
        row.source === "product" || row.source === "project"
          ? row.source
          : undefined;
      galleries[category]![row.subcategory]!.push(
        normalizeGalleryImage({
          src: row.src,
          caption: row.caption ?? "",
          source,
        }),
      );
    }

    return { ...base, galleries };
  } catch {
    return base;
  }
}

export async function getProductImageLive(
  category: ProductKey,
  subcategory?: string,
): Promise<string | undefined> {
  const data = await loadProductImagesManifest();
  if (subcategory) {
    const image = data.subcategories?.[category]?.[subcategory];
    if (!image || isBlockedImageSrc(image)) return undefined;
    return image;
  }
  const image = data.categories?.[category];
  if (!image || isBlockedImageSrc(image)) return undefined;
  return image;
}

export async function getProductGalleryLive(
  category: ProductKey,
  subcategory: string,
  options: { source?: GalleryImageSource } = {},
): Promise<ProductGalleryImage[]> {
  const data = await loadProductImagesManifest();
  const items = (data.galleries?.[category]?.[subcategory] ?? [])
    .filter((item) => !isBlockedImageSrc(item.src))
    .map(normalizeGalleryImage);

  const filtered = options.source
    ? items.filter((item) => item.source === options.source)
    : items;

  if (filtered.length > 0) return filtered;

  if (!options.source || options.source === "product") {
    const primary = data.subcategories?.[category]?.[subcategory];
    if (primary && !isBlockedImageSrc(primary)) {
      return [{ src: primary, caption: "", source: "product" }];
    }
  }

  return [];
}

export async function getProductOnlyGalleryLive(
  category: ProductKey,
  subcategory: string,
): Promise<ProductGalleryImage[]> {
  return getProductGalleryLive(category, subcategory, { source: "product" });
}

export async function getProjectReferenceGalleryLive(
  category: ProductKey,
  subcategory: string,
): Promise<ProductGalleryImage[]> {
  return getProductGalleryLive(category, subcategory, { source: "project" });
}
