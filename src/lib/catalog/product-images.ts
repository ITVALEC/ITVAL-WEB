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

export function resolveGalleryImageSource(
  image: Pick<ProductGalleryImage, "src" | "source">,
): GalleryImageSource {
  // Path de obra gana siempre (evita filas DB mal etiquetadas como product).
  if (isProjectReferenceSrc(image.src)) return "project";
  if (image.source === "product" || image.source === "project") {
    return image.source;
  }
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
 * - Fotos sueltas cuyo caption coincide con obras de la misma galería → project
 * - Si la galería es casi toda obras (/projects/) y quedan pocas sueltas → también project
 * - Galería de producto → caption vacío (ángulos anónimos, estilo Amazon)
 */
export function normalizeProductGalleryList(
  images: ProductGalleryImage[],
): ProductGalleryImage[] {
  const base = images.map((image) => ({
    ...image,
    source: resolveGalleryImageSource(image),
  }));

  const projectCount = base.filter((image) => image.source === "project").length;
  const looseCount = base.length - projectCount;

  // Import histórico: thumbs de obra fuera de /projects/ junto a un bloque grande de referencias.
  const treatAllLooseAsProject =
    projectCount >= 10 && looseCount > 0 && looseCount <= 12;

  const projectCaptionBlob = base
    .filter((image) => image.source === "project")
    .map((image) => (image.caption || "").toLowerCase())
    .join(" | ");

  return base.map((image) => {
    if (image.source === "project") {
      return image;
    }

    if (treatAllLooseAsProject) {
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

    // Galería Amazon: sin nombre de obra sobre el ángulo del producto.
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
