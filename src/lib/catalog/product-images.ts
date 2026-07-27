import type { ProductKey } from "./types";
import manifest from "./product-images.json";
import { isBlockedImageSrc } from "./blocked-images";

export type GalleryImageSource = "product" | "project";

/** Máximo de fotos de producto (ángulos) en ficha pública y uploads. */
export const MAX_PRODUCT_GALLERY_IMAGES = 6;

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

/**
 * Upload admin reciente: `addProductImage` guarda `{base}-{Date.now()}{ext}`.
 * Esas sí son ángulos de producto; el resto del dump histórico son obras.
 */
export function isAdminProductUploadSrc(src: string): boolean {
  const normalized = src.replace(/\\/g, "/");
  return /\/gallery\/[^/]+\/[^/]+\/[^/]+-\d{13}\.[a-z0-9]+$/i.test(normalized);
}

export function resolveGalleryImageSource(
  image: Pick<ProductGalleryImage, "src" | "source">,
): GalleryImageSource {
  // Path de obra gana siempre (evita filas DB mal etiquetadas como product).
  if (isProjectReferenceSrc(image.src)) return "project";
  // Uploads del admin (timestamp) son producto aunque el dump vecino diga otra cosa.
  if (isAdminProductUploadSrc(image.src)) return "product";
  if (image.source === "project") return "project";
  if (image.source === "product") return "product";
  // Sin etiqueta: no asumir producto (el DEFAULT de Postgres envenenaba el límite de 6).
  return "product";
}

/** Tokens genéricos que no sirven para emparejar obras sueltas con referencias. */
const PROJECT_MATCH_STOPWORDS = new Set([
  "acero",
  "aluminio",
  "curtain",
  "cortina",
  "fachada",
  "image",
  "jpeg",
  "jpg",
  "muro",
  "panel",
  "png",
  "producto",
  "qph",
  "vidrio",
  "wall",
  "walls",
  "webp",
  "whatsapp",
]);

function significantCaptionTokens(caption: string): string[] {
  return caption
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !PROJECT_MATCH_STOPWORDS.has(token));
}

/**
 * Normaliza una galería completa:
 * - Paths /projects/ → source=project
 * - Uploads admin (`-Date.now()`) → source=product
 * - Dump histórico (>6 fotos sin timestamp) → source=project (no cuentan al límite Amazon)
 * - Captions que coinciden con obras → project
 * - Galería de producto → caption vacío (ángulos anónimos, estilo Amazon)
 */
export function normalizeProductGalleryList(
  images: ProductGalleryImage[],
): ProductGalleryImage[] {
  const pathProjectCount = images.filter(
    (image) => isProjectReferenceSrc(image.src) || image.source === "project",
  ).length;
  const adminProductCount = images.filter((image) =>
    isAdminProductUploadSrc(image.src),
  ).length;
  const nonAdminCount = images.length - adminProductCount;

  // Dump histórico: obras bajo gallery/{cat}/{sub}/ sin subcarpeta /projects/.
  // ≥6 no-admin ⇒ no son ángulos Amazon (libera el límite y el carrusel).
  const legacyDumpAsProject =
    nonAdminCount >= MAX_PRODUCT_GALLERY_IMAGES ||
    (pathProjectCount >= 10 && nonAdminCount > 0);

  const projectCaptionBlob = images
    .filter(
      (image) =>
        isProjectReferenceSrc(image.src) || image.source === "project",
    )
    .map((image) => (image.caption || "").toLowerCase())
    .join(" | ");

  return images.map((image) => {
    if (isProjectReferenceSrc(image.src) || image.source === "project") {
      return { ...image, source: "project" as const };
    }

    if (isAdminProductUploadSrc(image.src)) {
      return { ...image, source: "product" as const, caption: "" };
    }

    if (legacyDumpAsProject) {
      return { ...image, source: "project" as const };
    }

    const caption = (image.caption || "").trim();
    if (caption && projectCaptionBlob) {
      const tokens = significantCaptionTokens(caption);
      const looksLikeLooseProject =
        tokens.length > 0 &&
        tokens.some((token) => projectCaptionBlob.includes(token));
      if (looksLikeLooseProject) {
        return { ...image, source: "project" as const };
      }
    }

    // Galería Amazon pequeña (≤6): ángulos anónimos.
    return { ...image, source: "product" as const, caption: "" };
  });
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
  const items = normalizeProductGalleryList(
    (data.galleries?.[category]?.[subcategory] ?? []).filter(
      (item) => !isBlockedImageSrc(item.src),
    ),
  );

  const filtered = options.source
    ? items.filter((item) => item.source === options.source)
    : items;

  if (filtered.length > 0) {
    if (options.source === "product") {
      return filtered.slice(0, MAX_PRODUCT_GALLERY_IMAGES);
    }
    return filtered;
  }

  // Fallback de portada solo para la galería de producto.
  if (!options.source || options.source === "product") {
    const primary = getProductSubcategoryImage(category, subcategory);
    if (primary) {
      return [{ src: primary, caption: "", source: "product" }];
    }
  }

  return [];
}

/** Fotos del producto para el carrusel / vista previa (máx. 6). */
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
