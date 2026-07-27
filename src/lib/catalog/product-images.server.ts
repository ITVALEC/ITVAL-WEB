import "server-only";

import fs from "node:fs";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import { getDocument } from "@/lib/db/documents";
import { isDatabaseEnabled, query } from "@/lib/db/pool";
import { isBlockedImageSrc } from "./blocked-images";
import bundled from "./product-images.json";
import type { ProductKey } from "./types";
import {
  MAX_PRODUCT_GALLERY_IMAGES,
  isRealProductImageSrc,
  normalizeProductGalleryList,
  type GalleryImageSource,
  type ProductGalleryImage,
} from "./product-images";
import { isCatalogPlaceholderSrc } from "@/lib/media/placeholder-src";

export type ProductImageManifest = {
  categories?: Partial<Record<ProductKey, string>>;
  subcategories?: Partial<Record<ProductKey, Partial<Record<string, string>>>>;
  galleries?: Partial<
    Record<ProductKey, Partial<Record<string, ProductGalleryImage[]>>>
  >;
};

/** True si el archivo existe bajo public/ (o symlink de deploy shared/images). */
function publicImageFileExists(src: string): boolean {
  if (!src?.trim() || isCatalogPlaceholderSrc(src)) return false;
  try {
    const relative = src.replace(/\\/g, "/").replace(/^\//, "").split("?")[0];
    return fs.existsSync(path.join(process.cwd(), "public", relative));
  } catch {
    return false;
  }
}

function keepRenderableProductImages(
  images: ProductGalleryImage[],
): ProductGalleryImage[] {
  return images.filter(
    (image) =>
      isRealProductImageSrc(image.src) && publicImageFileExists(image.src),
  );
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
      galleries[category]![row.subcategory]!.push({
        src: row.src,
        caption: row.caption ?? "",
        source,
      });
    }

    for (const category of Object.keys(galleries) as ProductKey[]) {
      const subs = galleries[category];
      if (!subs) continue;
      for (const subcategory of Object.keys(subs)) {
        subs[subcategory] = normalizeProductGalleryList(subs[subcategory] ?? []);
      }
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
    if (!image || !isRealProductImageSrc(image) || !publicImageFileExists(image)) {
      return undefined;
    }
    return image;
  }
  const image = data.categories?.[category];
  if (!image || !isRealProductImageSrc(image) || !publicImageFileExists(image)) {
    return undefined;
  }
  return image;
}

export async function getProductGalleryLive(
  category: ProductKey,
  subcategory: string,
  options: { source?: GalleryImageSource } = {},
): Promise<ProductGalleryImage[]> {
  const data = await loadProductImagesManifest();
  const items = normalizeProductGalleryList(
    keepRenderableProductImages(
      (data.galleries?.[category]?.[subcategory] ?? []).filter(
        (item) => !isBlockedImageSrc(item.src),
      ),
    ),
  );

  const filtered = keepRenderableProductImages(
    options.source
      ? items.filter((item) => item.source === options.source)
      : items,
  );

  if (filtered.length > 0) {
    if (options.source === "product") {
      return filtered.slice(0, MAX_PRODUCT_GALLERY_IMAGES);
    }
    return filtered;
  }

  if (!options.source || options.source === "product") {
    const primary = data.subcategories?.[category]?.[subcategory];
    if (
      primary &&
      isRealProductImageSrc(primary) &&
      publicImageFileExists(primary)
    ) {
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
