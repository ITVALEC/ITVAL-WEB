import "server-only";

import fs from "node:fs";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import { getDocument } from "@/lib/db/documents";
import { isDatabaseEnabled, query } from "@/lib/db/pool";
import { isBlockedImageSrc } from "./blocked-images";
import bundled from "./product-images.json";
import { PORTFOLIO_PROJECTS } from "./project-portfolio";
import type { ProductKey } from "./types";
import {
  MAX_PRODUCT_GALLERY_IMAGES,
  isAdminProductUploadSrc,
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

function isRasterSrc(src: string): boolean {
  return /\.(jpe?g|png|webp|avif|gif)$/i.test(
    (src.split("?")[0] ?? src).trim(),
  );
}

/**
 * Foto publicable: no placeholder SVG.
 * Si el archivo aún no está en disco (symlink/NFS), igual servimos rutas raster
 * para que Next Image / el static file server las resuelvan en runtime.
 */
function isRenderableProductSrc(src: string): boolean {
  if (!isRealProductImageSrc(src)) return false;
  if (publicImageFileExists(src)) return true;
  return isRasterSrc(src);
}

function keepRenderableProductImages(
  images: ProductGalleryImage[],
): ProductGalleryImage[] {
  return images.filter((image) => isRenderableProductSrc(image.src));
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
    if (!image || !isRenderableProductSrc(image)) {
      return undefined;
    }
    return image;
  }
  const image = data.categories?.[category];
  if (!image || !isRenderableProductSrc(image)) {
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
    if (primary && isRenderableProductSrc(primary)) {
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

/**
 * Mini-carrusel del listado de categoría: obras/referencias del producto
 * (source=project), complementadas con galería del portfolio si hace falta.
 * Si no hay obras, cae a la portada del producto (nunca placeholders SVG).
 */
export async function getSubcategoryWorksPreviewLive(
  category: ProductKey,
  subcategory: string,
  limit = MAX_PRODUCT_GALLERY_IMAGES,
): Promise<ProductGalleryImage[]> {
  const max = Math.max(1, Math.min(limit, MAX_PRODUCT_GALLERY_IMAGES));
  const seen = new Set<string>();
  const out: ProductGalleryImage[] = [];

  const push = (image: ProductGalleryImage) => {
    const src = image.src?.trim();
    if (!src || seen.has(src) || !isRenderableProductSrc(src)) return;
    seen.add(src);
    out.push({ ...image, src, source: image.source ?? "project" });
  };

  for (const image of await getProjectReferenceGalleryLive(
    category,
    subcategory,
  )) {
    if (out.length >= max) break;
    push(image);
  }

  if (out.length < Math.min(2, max)) {
    for (const project of PORTFOLIO_PROJECTS) {
      if (project.productSubcategory !== subcategory) continue;
      for (const src of [project.cover, ...project.gallery]) {
        if (out.length >= max) break;
        push({ src, caption: project.name, source: "project" });
      }
      if (out.length >= max) break;
    }
  }

  // Fotos sueltas históricas en gallery/ (p. ej. 1 obra con caption de proyecto)
  // que normalize marca como product por no llegar al umbral del dump.
  if (out.length === 0) {
    const loose = await getProductGalleryLive(category, subcategory);
    for (const image of loose) {
      if (out.length >= max) break;
      if (isAdminProductUploadSrc(image.src)) continue;
      // Evitar el fallback de portada que inyecta getProductGalleryLive.
      if (image.source === "product" && !image.caption?.trim()) continue;
      push({ ...image, source: "project" });
    }
  }

  if (out.length === 0) {
    const cover = await getProductImageLive(category, subcategory);
    if (cover) {
      return [{ src: cover, caption: "", source: "product" }];
    }
  }

  return out.slice(0, max);
}
