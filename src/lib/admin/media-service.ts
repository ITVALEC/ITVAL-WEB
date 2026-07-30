import "server-only";

import fs from "node:fs";
import path from "node:path";
import { resolveProjectCover } from "@/lib/catalog/project-cover";
import type { PortfolioProject } from "@/lib/catalog/project-portfolio";
import { isDatabaseEnabled, query } from "@/lib/db/pool";
import { getDocument, setDocument } from "@/lib/db/documents";
import { syncDatabaseToJson } from "@/lib/db/sync-json";
import {
  isSharedPlaceholderSrc,
  normalizePublicSrc,
} from "@/lib/admin/media-placeholder";
import { getImagesRoot, resolveImageDiskPath, resolveExistingImageDiskPath } from "@/lib/media/images-root";
import { MANIFEST_PATHS, readJsonFile, writeJsonFile } from "./manifests";
import { getProductCategoryLabel, getSubcategoryLabel } from "./product-labels";
import {
  MAX_PRODUCT_GALLERY_IMAGES,
  isCatalogPlaceholderSrc,
  normalizeProductGalleryList,
  type GalleryImageSource,
} from "@/lib/catalog/product-images";

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const MAX_BYTES = 20 * 1024 * 1024;

export { MAX_PRODUCT_GALLERY_IMAGES, getImagesRoot };

export type MediaKind = "project" | "product" | "hero" | "other";

export type AdminMediaItem = {
  id: string;
  kind: MediaKind;
  src: string;
  title: string;
  subtitle: string;
  caption: string;
  projectId?: string;
  galleryIndex?: number;
  category?: string;
  subcategory?: string;
  productIndex?: number;
  heroType?: "category" | "subcategory";
  /** Solo para entradas de galería de producto: producto vs obra/referencia. */
  gallerySource?: GalleryImageSource;
  /** True si el src es un placeholder compartido o el archivo no está en disco. */
  fileMissing?: boolean;
};

type ProjectManifest = { projects: PortfolioProject[]; [key: string]: unknown };
type GalleryImage = { src: string; caption: string; source?: GalleryImageSource };
type ProductManifest = {
  categories?: Record<string, string>;
  subcategories?: Record<string, Record<string, string>>;
  galleries?: Record<string, Record<string, GalleryImage[]>>;
  [key: string]: unknown;
};

function publicPathFromSrc(src: string): string {
  return resolveImageDiskPath(src);
}

function extFromName(name: string): string {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".heic" || ext === ".heif") {
    throw new Error("Formato HEIC/HEIF no soportado. Guarda o convierte la foto a JPG o PNG.");
  }
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error("Formato no permitido. Usa JPG, PNG, WebP o AVIF.");
  }
  return ext;
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "image/gif": ".gif",
  };
  const ext = map[mime];
  if (!ext) throw new Error("Tipo de archivo no permitido.");
  return ext;
}

function sanitizeBaseName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "imagen";
}

export function validateUpload(file: { size: number; type: string; name: string }): void {
  if (!file.size || file.size <= 0) {
    throw new Error("El archivo está vacío o no se pudo leer.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("La imagen supera el límite de 20 MB.");
  }

  const ext = extFromName(file.name);
  const mime = (file.type ?? "").trim().toLowerCase();

  // Algunos navegadores/Windows envían type vacío o octet-stream; confiar en la extensión.
  if (!mime || mime === "application/octet-stream") {
    return;
  }

  if (mime === "image/heic" || mime === "image/heif") {
    throw new Error("Formato HEIC/HEIF no soportado. Guarda o convierte la foto a JPG o PNG.");
  }

  try {
    const mimeExt = extFromMime(mime);
    // Permitir .jpg vs .jpeg mismatch; si MIME y extensión discrepan, confiar en la extensión.
    if (
      mimeExt === ext ||
      ((mimeExt === ".jpg" || mimeExt === ".jpeg") && (ext === ".jpg" || ext === ".jpeg"))
    ) {
      return;
    }
  } catch {
    // MIME desconocido: la extensión ya se validó arriba.
  }
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function isValidImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }
  // GIF
  if (buffer.toString("ascii", 0, 3) === "GIF") return true;
  // WEBP
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return true;
  }
  // AVIF / HEIF container
  if (buffer.toString("ascii", 4, 8) === "ftyp") return true;
  return false;
}

/** True si el archivo existe, es un fichero real y tiene cabecera de imagen válida. */
export function isServablePublicImage(src: string): boolean {
  try {
    const diskPath = resolveExistingImageDiskPath(normalizePublicSrc(src));
    if (!diskPath) return false;
    const stat = fs.statSync(diskPath);
    if (!stat.isFile() || stat.size < 32) return false;
    const fd = fs.openSync(diskPath, "r");
    try {
      const header = Buffer.alloc(16);
      fs.readSync(fd, header, 0, 16, 0);
      return isValidImageBuffer(header);
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return false;
  }
}

export function writeImageFile(
  buffer: Buffer,
  destPublicSrc: string,
): string {
  try {
    if (!isValidImageBuffer(buffer)) {
      throw new Error(
        "El archivo no parece una imagen válida. Usa JPG, PNG, WebP o AVIF.",
      );
    }
    ensureDir(getImagesRoot());
    const diskPath = publicPathFromSrc(destPublicSrc);
    ensureDir(path.dirname(diskPath));
    // Si hay symlink roto o basura previa, bórralo antes de escribir.
    try {
      fs.lstatSync(diskPath);
      fs.unlinkSync(diskPath);
    } catch {
      /* no existía */
    }
    fs.writeFileSync(diskPath, buffer);
    // fsync-ish: reabrir y comprobar cabecera
    if (!isServablePublicImage(destPublicSrc)) {
      throw new Error("La imagen se guardó pero no se puede leer en el servidor.");
    }
    return destPublicSrc;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar";
    if (message.includes("EACCES") || message.includes("EPERM")) {
      throw new Error("Sin permiso para guardar la imagen en el servidor.");
    }
    if (message.includes("ENOSPC")) {
      throw new Error("No hay espacio en disco para guardar la imagen.");
    }
    if (
      message.includes("no parece una imagen") ||
      message.includes("no se puede leer")
    ) {
      throw error instanceof Error ? error : new Error(message);
    }
    throw new Error(`No se pudo guardar la imagen: ${message}`);
  }
}

export function replaceImageAtSrc(src: string, buffer: Buffer): string {
  return writeImageFile(buffer, src);
}

function mediaFileExists(src: string): boolean {
  return isServablePublicImage(src);
}

function withFilePresence(item: AdminMediaItem): AdminMediaItem {
  const src = normalizePublicSrc(item.src);
  const placeholder = isSharedPlaceholderSrc(src);
  return {
    ...item,
    src,
    fileMissing: placeholder || !mediaFileExists(src),
  };
}

/** Ruta estable y propia para portadas de catálogo (categoría o subcategoría). */
function dedicatedHeroSrc(item: AdminMediaItem, ext: string): string {
  if (!item.category) {
    throw new Error("Portada sin categoría.");
  }
  if (item.heroType === "category") {
    return `/images/products/${item.category}${ext}`;
  }
  if (!item.subcategory) {
    throw new Error("Portada de producto sin subcategoría.");
  }
  return `/images/products/${item.category}/${item.subcategory}${ext}`;
}

async function loadProductManifest(): Promise<ProductManifest> {
  return getDocument<ProductManifest>("productImages");
}

async function listProductGalleryFromManifest(
  products: ProductManifest,
): Promise<AdminMediaItem[]> {
  const items: AdminMediaItem[] = [];

  for (const [category, subs] of Object.entries(products.galleries ?? {})) {
    for (const [subcategory, images] of Object.entries(subs)) {
      const normalized = normalizeProductGalleryList(images);
      let productPhotoNumber = 0;

      normalized.forEach((image, index) => {
        if (image.source === "project") return;
        if (isCatalogPlaceholderSrc(image.src)) return;

        productPhotoNumber += 1;
        items.push({
          id: `product:${category}:${subcategory}:${index}`,
          kind: "product",
          src: image.src,
          title: `Foto ${productPhotoNumber}`,
          subtitle: `${getProductCategoryLabel(category)} · ${getSubcategoryLabel(category, subcategory)}`,
          caption: "",
          category,
          subcategory,
          productIndex: index,
          gallerySource: "product",
        });
      });
    }
  }

  return items;
}

function pushHeroItems(items: AdminMediaItem[], products: ProductManifest): void {
  for (const [category, src] of Object.entries(products.categories ?? {})) {
    items.push({
      id: `hero:category:${category}`,
      kind: "hero",
      src,
      title: getProductCategoryLabel(category),
      subtitle: "Imagen principal de categoría",
      caption: "",
      category,
      heroType: "category",
    });
  }

  for (const [category, subs] of Object.entries(products.subcategories ?? {})) {
    for (const [subcategory, src] of Object.entries(subs)) {
      items.push({
        id: `hero:subcategory:${category}:${subcategory}`,
        kind: "hero",
        src,
        title: getSubcategoryLabel(category, subcategory),
        subtitle: `${getProductCategoryLabel(category)} · ${getSubcategoryLabel(category, subcategory)}`,
        caption: "",
        category,
        subcategory,
        heroType: "subcategory",
      });
    }
  }
}

async function listFromJson(): Promise<AdminMediaItem[]> {
  const items: AdminMediaItem[] = [];
  const projects = readJsonFile<ProjectManifest>(MANIFEST_PATHS.projects);
  const products = await loadProductManifest();

  for (const project of projects.projects) {
    project.gallery.forEach((src, index) => {
      items.push({
        id: `project:${project.id}:${index}`,
        kind: "project",
        src,
        title: project.name,
        subtitle: `${project.city}${project.year ? ` · ${project.year}` : ""}`,
        caption: project.name,
        projectId: project.id,
        galleryIndex: index,
      });
    });
  }

  pushHeroItems(items, products);
  items.push(...(await listProductGalleryFromManifest(products)));

  return items.map(withFilePresence);
}

async function listFromDb(): Promise<AdminMediaItem[]> {
  const items: AdminMediaItem[] = [];

  // Una vez por proceso: corrige source=product en dumps históricos (DEFAULT Postgres).
  await ensureProductGallerySourcesReclassified();

  const { rows: projectRows } = await query<{
    id: string;
    name: string;
    city: string;
    year: number | null;
  }>(`SELECT id, name, city, year FROM projects ORDER BY name`);

  const projectMap = new Map(projectRows.map((r) => [r.id, r]));

  const { rows: projectImages } = await query<{
    project_id: string;
    src: string;
    sort_order: number;
    alt_text: string | null;
  }>(`SELECT project_id, src, sort_order, alt_text FROM project_images ORDER BY project_id, sort_order`);

  for (const row of projectImages) {
    const project = projectMap.get(row.project_id);
    items.push({
      id: `project:${row.project_id}:${row.sort_order}`,
      kind: "project",
      src: row.src,
      title: project?.name ?? row.project_id,
      subtitle: project
        ? `${project.city}${project.year ? ` · ${project.year}` : ""}`
        : "Proyecto",
      caption: row.alt_text ?? project?.name ?? "",
      projectId: row.project_id,
      galleryIndex: row.sort_order,
    });
  }

  const products = await loadProductManifest();
  pushHeroItems(items, products);

  const { rows: productRows } = await query<{
    category: string;
    subcategory: string;
    src: string;
    caption: string;
    sort_order: number;
    source: string | null;
  }>(
    `SELECT category, subcategory, src, caption, sort_order, source
     FROM product_gallery_images ORDER BY category, subcategory, sort_order`,
  );

  const fromDbRaw: GalleryImage[] = [];
  const fromDbMeta: {
    category: string;
    subcategory: string;
    sort_order: number;
  }[] = [];

  for (const row of productRows) {
    fromDbRaw.push({
      src: row.src,
      caption: row.caption ?? "",
      source:
        row.source === "product" || row.source === "project"
          ? row.source
          : undefined,
    });
    fromDbMeta.push({
      category: row.category,
      subcategory: row.subcategory,
      sort_order: row.sort_order,
    });
  }

  // Normalizar por subcategoría para reclasificar obras sueltas.
  const bySub = new Map<string, { images: GalleryImage[]; meta: typeof fromDbMeta }>();
  for (let i = 0; i < fromDbRaw.length; i += 1) {
    const meta = fromDbMeta[i];
    const key = `${meta.category}::${meta.subcategory}`;
    const bucket = bySub.get(key) ?? { images: [], meta: [] };
    bucket.images.push(fromDbRaw[i]);
    bucket.meta.push(meta);
    bySub.set(key, bucket);
  }

  const fromDb: AdminMediaItem[] = [];
  for (const bucket of bySub.values()) {
    const normalized = normalizeProductGalleryList(bucket.images);
    let productPhotoNumber = 0;
    normalized.forEach((image, index) => {
      if (image.source === "project") return;
      if (isCatalogPlaceholderSrc(image.src)) return;
      const meta = bucket.meta[index];
      productPhotoNumber += 1;
      fromDb.push({
        id: `product:${meta.category}:${meta.subcategory}:${meta.sort_order}`,
        kind: "product",
        src: image.src,
        title: `Foto ${productPhotoNumber}`,
        subtitle: `${getProductCategoryLabel(meta.category)} · ${getSubcategoryLabel(meta.category, meta.subcategory)}`,
        caption: "",
        category: meta.category,
        subcategory: meta.subcategory,
        productIndex: meta.sort_order,
        gallerySource: "product",
      });
    });
  }

  // Si la DB no tiene fotos de producto (vacía o solo referencias de obra),
  // usar el manifiesto JSON para no dejar el tab Productos vacío.
  if (fromDb.length > 0) {
    items.push(...fromDb);
  } else {
    items.push(...(await listProductGalleryFromManifest(products)));
  }

  return items.map(withFilePresence);
}

export async function listAllMedia(
  search = "",
  kind?: MediaKind,
  category?: string,
  subcategory?: string,
): Promise<AdminMediaItem[]> {
  let items = isDatabaseEnabled() ? await listFromDb() : await listFromJson();

  if (kind === "product") {
    // Productos = galería del producto + portadas de subcategoría (pertenecen a una categoría).
    items = items.filter(
      (item) =>
        item.kind === "product" ||
        (item.kind === "hero" && item.heroType === "subcategory"),
    );
  } else if (kind) {
    items = items.filter((item) => item.kind === kind);
  }

  if (category) {
    items = items.filter(
      (item) => item.category === category || item.projectId === category,
    );
  }

  if (subcategory) {
    items = items.filter((item) => item.subcategory === subcategory);
  }

  const q = search.toLowerCase().trim();
  if (q) {
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.caption.toLowerCase().includes(q) ||
        item.src.toLowerCase().includes(q) ||
        (item.category?.toLowerCase().includes(q) ?? false) ||
        (item.subcategory?.toLowerCase().includes(q) ?? false) ||
        (item.projectId?.toLowerCase().includes(q) ?? false),
    );
  }

  return items;
}

async function afterMutation() {
  try {
    if (isDatabaseEnabled()) {
      await syncDatabaseToJson();
    }
    const { revalidatePublicCatalog } = await import("@/lib/catalog/revalidate-public");
    revalidatePublicCatalog();
  } catch (error) {
    // La imagen ya está en disco: no tumbar el upload por un fallo de sync/revalidate.
    console.error("[media] afterMutation failed:", error);
  }
}

function dedicatedProjectSrc(projectId: string, originalName: string, ext: string): string {
  const base = sanitizeBaseName(path.basename(originalName, ext));
  return `/images/projects/${projectId}/${base}-${Date.now()}${ext}`;
}

function dedicatedProductGallerySrc(
  category: string,
  subcategory: string,
  originalName: string,
  ext: string,
): string {
  const base = sanitizeBaseName(path.basename(originalName, ext));
  return `/images/products/gallery/${category}/${subcategory}/${base}-${Date.now()}${ext}`;
}

export async function updateMediaCaption(item: AdminMediaItem, caption: string): Promise<void> {
  if (item.kind === "project" && item.projectId != null && item.galleryIndex != null) {
    if (isDatabaseEnabled()) {
      await query(
        `UPDATE project_images SET alt_text = $3 WHERE project_id = $1 AND sort_order = $2`,
        [item.projectId, item.galleryIndex, caption.trim()],
      );
      await afterMutation();
      return;
    }

    const data = readJsonFile<ProjectManifest>(MANIFEST_PATHS.projects);
    const project = data.projects.find((p) => p.id === item.projectId);
    if (!project) throw new Error("Proyecto no encontrado.");
    if (caption.trim()) project.name = caption.trim();
    data.generatedAt = new Date().toISOString();
    writeJsonFile(MANIFEST_PATHS.projects, data);
    return;
  }

  if (item.kind === "product" && item.category && item.subcategory && item.productIndex != null) {
    if (isDatabaseEnabled()) {
      const result = await query(
        `UPDATE product_gallery_images SET caption = $4
         WHERE category = $1 AND subcategory = $2 AND sort_order = $3`,
        [item.category, item.subcategory, item.productIndex, caption.trim()],
      );
      if ((result.rowCount ?? 0) > 0) {
        await afterMutation();
        return;
      }
      // Sin fila en DB: el ítem vino del manifiesto JSON (fallback).
    }

    const data = readJsonFile<ProductManifest>(MANIFEST_PATHS.products);
    const gallery = data.galleries?.[item.category]?.[item.subcategory];
    if (!gallery?.[item.productIndex]) throw new Error("Imagen no encontrada.");
    gallery[item.productIndex].caption = caption.trim();
    writeJsonFile(MANIFEST_PATHS.products, data);
    const { revalidatePublicCatalog } = await import("@/lib/catalog/revalidate-public");
    revalidatePublicCatalog();
  }
}

export async function replaceMediaImage(
  item: AdminMediaItem,
  buffer: Buffer,
  originalName: string,
): Promise<string> {
  const ext = extFromName(originalName);
  const previousSrc = normalizePublicSrc(item.src);
  let targetSrc = previousSrc;

  const previousMissing =
    item.fileMissing === true ||
    isSharedPlaceholderSrc(previousSrc) ||
    !mediaFileExists(previousSrc);

  if (item.kind === "hero") {
    // Portadas: siempre ruta propia (nunca pages/products.svg ni otros marcadores).
    targetSrc = dedicatedHeroSrc(item, ext);
  } else if (item.kind === "project" && item.projectId) {
    // Siempre archivo nuevo bajo /projects/{id}/ — evita sobrescribir cover.jpeg corruptos.
    targetSrc = dedicatedProjectSrc(item.projectId, originalName, ext);
  } else if (item.kind === "product" && item.category && item.subcategory) {
    // Igual para galería de producto: ruta nueva dedicada.
    targetSrc = dedicatedProductGallerySrc(
      item.category,
      item.subcategory,
      originalName,
      ext,
    );
  } else if (isSharedPlaceholderSrc(previousSrc)) {
    throw new Error("No se puede reemplazar un marcador compartido sin destino propio.");
  } else if (path.extname(previousSrc).toLowerCase() !== ext || previousMissing) {
    const base = previousSrc.replace(/\.[^.]+$/, "");
    targetSrc = previousMissing
      ? `${base}-${Date.now()}${ext}`
      : `${base}${ext}`;
  }

  // 1) Escribir archivo primero (si falla, no tocamos DB/JSON).
  writeImageFile(buffer, targetSrc);

  // 2) Actualizar metadatos solo tras escritura exitosa.
  if (targetSrc !== previousSrc) {
    await updateMediaSrc(item, targetSrc);
    if (!isSharedPlaceholderSrc(previousSrc) && previousSrc !== targetSrc) {
      try {
        fs.unlinkSync(publicPathFromSrc(previousSrc));
      } catch {
        /* archivo anterior ausente */
      }
    }
  }

  await afterMutation();
  return targetSrc;
}

async function updateMediaSrc(item: AdminMediaItem, newSrc: string): Promise<void> {
  if (item.kind === "project" && item.projectId != null && item.galleryIndex != null) {
    if (isDatabaseEnabled()) {
      await query(
        `UPDATE project_images SET src = $3 WHERE project_id = $1 AND sort_order = $2`,
        [item.projectId, item.galleryIndex, newSrc],
      );
      const { rows } = await query<{ cover_index: number }>(
        `SELECT cover_index FROM projects WHERE id = $1`,
        [item.projectId],
      );
      const { rows: imgs } = await query<{ src: string; sort_order: number }>(
        `SELECT src, sort_order FROM project_images WHERE project_id = $1 ORDER BY sort_order`,
        [item.projectId],
      );
      const gallery = imgs.map((i) => i.src);
      const cover = resolveProjectCover(gallery, rows[0]?.cover_index ?? 0);
      await query(`UPDATE projects SET cover_path = $2 WHERE id = $1`, [item.projectId, cover]);
      return;
    }

    const data = readJsonFile<ProjectManifest>(MANIFEST_PATHS.projects);
    const project = data.projects.find((p) => p.id === item.projectId);
    if (!project) throw new Error("Proyecto no encontrado.");
    project.gallery[item.galleryIndex] = newSrc;
    project.cover = resolveProjectCover(project.gallery, project.coverIndex ?? 0);
    project.imageCount = project.gallery.length;
    data.generatedAt = new Date().toISOString();
    writeJsonFile(MANIFEST_PATHS.projects, data);
    return;
  }

  if (item.kind === "product" && item.category && item.subcategory && item.productIndex != null) {
    if (isDatabaseEnabled()) {
      const result = await query(
        `UPDATE product_gallery_images SET src = $4
         WHERE category = $1 AND subcategory = $2 AND sort_order = $3`,
        [item.category, item.subcategory, item.productIndex, newSrc],
      );
      if ((result.rowCount ?? 0) > 0) {
        return;
      }
      // Sin fila en DB: el ítem vino del manifiesto JSON (fallback). Seed + update doc.
      await seedProductGalleryFromJsonIfEmpty(item.category, item.subcategory);
      const retry = await query(
        `UPDATE product_gallery_images SET src = $4
         WHERE category = $1 AND subcategory = $2 AND sort_order = $3`,
        [item.category, item.subcategory, item.productIndex, newSrc],
      );
      if ((retry.rowCount ?? 0) > 0) {
        return;
      }
    }

    const data = await loadProductManifest();
    data.galleries ??= {};
    data.galleries[item.category] ??= {};
    data.galleries[item.category][item.subcategory] ??= [];
    const gallery = data.galleries[item.category][item.subcategory];
    if (!gallery[item.productIndex]) {
      throw new Error("Imagen no encontrada.");
    }
    gallery[item.productIndex] = {
      ...gallery[item.productIndex],
      src: newSrc,
    };
    await setDocument("productImages", data);
    return;
  }

  if (item.kind === "hero" && item.category) {
    // Persist via documents layer so Postgres app_documents keeps the cover path.
    // Writing only the JSON file is reverted by syncDatabaseToJson from the old DB doc.
    const data = await loadProductManifest();
    if (item.heroType === "category") {
      data.categories ??= {};
      data.categories[item.category] = newSrc;
    } else if (item.subcategory) {
      data.subcategories ??= {};
      data.subcategories[item.category] ??= {};
      data.subcategories[item.category][item.subcategory] = newSrc;
    } else {
      throw new Error("Portada de producto incompleta.");
    }
    await setDocument("productImages", data);
  }
}

export async function addProjectImage(
  projectId: string,
  buffer: Buffer,
  originalName: string,
): Promise<AdminMediaItem> {
  const ext = extFromName(originalName);
  const base = sanitizeBaseName(path.basename(originalName, ext));
  const fileName = `${base}-${Date.now()}${ext}`;
  const publicSrc = `/images/projects/${projectId}/${fileName}`;

  writeImageFile(buffer, publicSrc);

  if (isDatabaseEnabled()) {
    await ensureProjectExistsInDb(projectId);

    const { rows } = await query<{ max: number | null }>(
      `SELECT MAX(sort_order) AS max FROM project_images WHERE project_id = $1`,
      [projectId],
    );
    const sortOrder = (rows[0]?.max ?? -1) + 1;
    const { rows: projectRows } = await query<{ name: string; city: string }>(
      `SELECT name, city FROM projects WHERE id = $1`,
      [projectId],
    );
    if (!projectRows[0]) throw new Error("Proyecto no encontrado.");
    await query(
      `INSERT INTO project_images (project_id, src, sort_order, alt_text)
       VALUES ($1, $2, $3, $4)`,
      [projectId, publicSrc, sortOrder, projectRows[0].name],
    );

    // Mantener también el manifiesto JSON alineado.
    appendProjectImageToJson(projectId, publicSrc);
    await afterMutation();
    return {
      id: `project:${projectId}:${sortOrder}`,
      kind: "project",
      src: publicSrc,
      title: projectRows[0].name,
      subtitle: projectRows[0].city || "Obra",
      caption: projectRows[0].name,
      projectId,
      galleryIndex: sortOrder,
      fileMissing: false,
    };
  }

  const data = readJsonFile<ProjectManifest>(MANIFEST_PATHS.projects);
  const project = data.projects.find((p) => p.id === projectId);
  if (!project) throw new Error("Proyecto no encontrado.");
  project.gallery.push(publicSrc);
  project.imageCount = project.gallery.length;
  if (!project.cover) {
    project.cover = publicSrc;
  }
  data.generatedAt = new Date().toISOString();
  writeJsonFile(MANIFEST_PATHS.projects, data);

  const { revalidatePublicCatalog } = await import("@/lib/catalog/revalidate-public");
  revalidatePublicCatalog();

  return {
    id: `project:${projectId}:${project.gallery.length - 1}`,
    kind: "project",
    src: publicSrc,
    title: project.name,
    subtitle: project.city,
    caption: project.name,
    projectId,
    galleryIndex: project.gallery.length - 1,
    fileMissing: false,
  };
}

/** Si la obra solo está en JSON, crearla en Postgres antes de subir fotos. */
async function ensureProjectExistsInDb(projectId: string): Promise<void> {
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM projects WHERE id = $1`,
    [projectId],
  );
  if (rows[0]) return;

  const data = readJsonFile<ProjectManifest>(MANIFEST_PATHS.projects);
  const project = data.projects.find((p) => p.id === projectId);
  if (!project) {
    throw new Error(
      "Esta obra no está en la base de datos. Espera el próximo deploy o avisa a soporte.",
    );
  }

  await query(
    `INSERT INTO projects (
      id, name, city, location, year, folder,
      product_category, product_subcategory, cover_path, cover_index, featured
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (id) DO NOTHING`,
    [
      project.id,
      project.name,
      project.city,
      project.location ?? `${project.city}, Ecuador`,
      project.year,
      project.folder ?? null,
      project.productCategory,
      project.productSubcategory ?? null,
      project.cover,
      project.coverIndex ?? 0,
      Boolean(project.featured),
    ],
  );

  const gallery = project.gallery ?? [];
  for (let index = 0; index < gallery.length; index += 1) {
    await query(
      `INSERT INTO project_images (project_id, src, sort_order, alt_text)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (project_id, sort_order) DO NOTHING`,
      [project.id, gallery[index], index, project.name],
    );
  }
}

function appendProjectImageToJson(projectId: string, publicSrc: string): void {
  try {
    const data = readJsonFile<ProjectManifest>(MANIFEST_PATHS.projects);
    const project = data.projects.find((p) => p.id === projectId);
    if (!project) return;
    if (!project.gallery.includes(publicSrc)) {
      project.gallery.push(publicSrc);
      project.imageCount = project.gallery.length;
      if (!project.cover) project.cover = publicSrc;
      data.generatedAt = new Date().toISOString();
      writeJsonFile(MANIFEST_PATHS.projects, data);
    }
  } catch {
    /* manifiesto ausente: sync posterior */
  }
}

export async function addProductImage(
  category: string,
  subcategory: string,
  buffer: Buffer,
  originalName: string,
  caption = "",
): Promise<AdminMediaItem> {
  const productCount = await countProductGalleryImages(category, subcategory);
  if (productCount >= MAX_PRODUCT_GALLERY_IMAGES) {
    throw new Error(
      `Máximo ${MAX_PRODUCT_GALLERY_IMAGES} fotos del producto (ángulos). Elimina una antes de subir otra.`,
    );
  }

  const ext = extFromName(originalName);
  const base = sanitizeBaseName(path.basename(originalName, ext));
  const fileName = `${base}-${Date.now()}${ext}`;
  const publicSrc = `/images/products/gallery/${category}/${subcategory}/${fileName}`;

  writeImageFile(buffer, publicSrc);

  if (isDatabaseEnabled()) {
    await seedProductGalleryFromJsonIfEmpty(category, subcategory);
    // Reclasificar dumps históricos mal etiquetados como product (DEFAULT de Postgres).
    await reclassifyProductGallerySources(category, subcategory);

    // Recontar tras seed/reclasificación por si el JSON ya tenía 6+ ángulos reales.
    const afterSeed = await countProductGalleryImages(category, subcategory);
    if (afterSeed >= MAX_PRODUCT_GALLERY_IMAGES) {
      try {
        fs.unlinkSync(publicPathFromSrc(publicSrc));
      } catch {
        /* ok */
      }
      throw new Error(
        `Máximo ${MAX_PRODUCT_GALLERY_IMAGES} fotos del producto (ángulos). Elimina una antes de subir otra.`,
      );
    }

    const { rows } = await query<{ max: number | null }>(
      `SELECT MAX(sort_order) AS max FROM product_gallery_images
       WHERE category = $1 AND subcategory = $2`,
      [category, subcategory],
    );
    const sortOrder = (rows[0]?.max ?? -1) + 1;
    await query(
      `INSERT INTO product_gallery_images (category, subcategory, src, caption, sort_order, source)
       VALUES ($1, $2, $3, $4, $5, 'product')`,
      [category, subcategory, publicSrc, caption.trim(), sortOrder],
    );

    appendProductImageToJson(category, subcategory, publicSrc, caption.trim());
    await afterMutation();
    const photoNumber = afterSeed + 1;
    return {
      id: `product:${category}:${subcategory}:${sortOrder}`,
      kind: "product",
      src: publicSrc,
      title: `Foto ${photoNumber}`,
      subtitle: `${getProductCategoryLabel(category)} · ${getSubcategoryLabel(category, subcategory)}`,
      caption: "",
      category,
      subcategory,
      productIndex: sortOrder,
      gallerySource: "product",
      fileMissing: false,
    };
  }

  const data = readJsonFile<ProductManifest>(MANIFEST_PATHS.products);
  data.galleries ??= {};
  data.galleries[category] ??= {};
  data.galleries[category][subcategory] ??= [];
  const index = data.galleries[category][subcategory].length;
  data.galleries[category][subcategory].push({
    src: publicSrc,
    caption: caption.trim(),
    source: "product",
  });
  writeJsonFile(MANIFEST_PATHS.products, data);

  const { revalidatePublicCatalog } = await import("@/lib/catalog/revalidate-public");
  revalidatePublicCatalog();

  return {
    id: `product:${category}:${subcategory}:${index}`,
    kind: "product",
    src: publicSrc,
    title: `Foto ${productCount + 1}`,
    subtitle: `${getProductCategoryLabel(category)} · ${getSubcategoryLabel(category, subcategory)}`,
    caption: "",
    category,
    subcategory,
    productIndex: index,
    gallerySource: "product",
    fileMissing: false,
  };
}

/** Cuenta solo fotos source=product reales (no obras/referencias ni dumps históricos). */
export async function countProductGalleryImages(
  category: string,
  subcategory: string,
): Promise<number> {
  if (isDatabaseEnabled()) {
    try {
      const { rows } = await query<{
        src: string;
        caption: string;
        source: string | null;
      }>(
        `SELECT src, caption, source FROM product_gallery_images
         WHERE category = $1 AND subcategory = $2
         ORDER BY sort_order`,
        [category, subcategory],
      );
      if (rows.length > 0) {
        const normalized = normalizeProductGalleryList(
          rows.map((row) => ({
            src: row.src,
            caption: row.caption ?? "",
            source:
              row.source === "product" || row.source === "project"
                ? row.source
                : undefined,
          })),
        );
        return normalized.filter(
          (image) =>
            image.source === "product" && !isCatalogPlaceholderSrc(image.src),
        ).length;
      }
    } catch {
      /* fallback JSON */
    }
  }

  const data = readJsonFile<ProductManifest>(MANIFEST_PATHS.products);
  const images = normalizeProductGalleryList(
    data.galleries?.[category]?.[subcategory] ?? [],
  );
  return images.filter(
    (image) =>
      image.source === "product" && !isCatalogPlaceholderSrc(image.src),
  ).length;
}

/**
 * Reescribe `source` en Postgres según normalizeProductGalleryList.
 * Evita que el DEFAULT 'product' bloquee uploads y filtre mal el front.
 */
export async function reclassifyProductGallerySources(
  category?: string,
  subcategory?: string,
): Promise<number> {
  if (!isDatabaseEnabled()) return 0;

  const params: string[] = [];
  let where = "";
  if (category && subcategory) {
    where = "WHERE category = $1 AND subcategory = $2";
    params.push(category, subcategory);
  }

  const { rows } = await query<{
    id: number;
    category: string;
    subcategory: string;
    src: string;
    caption: string;
    source: string | null;
    sort_order: number;
  }>(
    `SELECT id, category, subcategory, src, caption, source, sort_order
     FROM product_gallery_images ${where}
     ORDER BY category, subcategory, sort_order`,
    params,
  );

  if (rows.length === 0) return 0;

  const bySub = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = `${row.category}::${row.subcategory}`;
    const bucket = bySub.get(key) ?? [];
    bucket.push(row);
    bySub.set(key, bucket);
  }

  let updated = 0;
  for (const bucket of bySub.values()) {
    const normalized = normalizeProductGalleryList(
      bucket.map((row) => ({
        src: row.src,
        caption: row.caption ?? "",
        source:
          row.source === "product" || row.source === "project"
            ? row.source
            : undefined,
      })),
    );

    for (let i = 0; i < bucket.length; i += 1) {
      const next = normalized[i]?.source ?? "project";
      const current =
        bucket[i].source === "product" || bucket[i].source === "project"
          ? bucket[i].source
          : "product";
      if (next !== current) {
        await query(`UPDATE product_gallery_images SET source = $2 WHERE id = $1`, [
          bucket[i].id,
          next,
        ]);
        updated += 1;
      }
    }
  }

  return updated;
}

let productGalleryReclassified = false;

async function ensureProductGallerySourcesReclassified(): Promise<void> {
  if (productGalleryReclassified || !isDatabaseEnabled()) return;
  try {
    await reclassifyProductGallerySources();
    productGalleryReclassified = true;
  } catch {
    /* listar/contar igual con normalize en memoria */
  }
}

/**
 * Si Postgres no tiene aún la galería de este producto, copiarla desde el JSON
 * para no pisar decenas de fotos al sincronizar tras el primer upload.
 */
async function seedProductGalleryFromJsonIfEmpty(
  category: string,
  subcategory: string,
): Promise<void> {
  const { rows } = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM product_gallery_images
     WHERE category = $1 AND subcategory = $2`,
    [category, subcategory],
  );
  if (Number.parseInt(rows[0]?.count ?? "0", 10) > 0) return;

  const data = readJsonFile<ProductManifest>(MANIFEST_PATHS.products);
  const images = normalizeProductGalleryList(
    data.galleries?.[category]?.[subcategory] ?? [],
  );
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    await query(
      `INSERT INTO product_gallery_images (category, subcategory, src, caption, sort_order, source)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (category, subcategory, sort_order) DO NOTHING`,
      [
        category,
        subcategory,
        image.src,
        image.source === "product" ? "" : (image.caption ?? ""),
        index,
        image.source ?? "project",
      ],
    );
  }
}

function appendProductImageToJson(
  category: string,
  subcategory: string,
  publicSrc: string,
  caption: string,
): void {
  try {
    const data = readJsonFile<ProductManifest>(MANIFEST_PATHS.products);
    data.galleries ??= {};
    data.galleries[category] ??= {};
    data.galleries[category][subcategory] ??= [];
    if (!data.galleries[category][subcategory].some((img) => img.src === publicSrc)) {
      data.galleries[category][subcategory].push({
        src: publicSrc,
        caption,
        source: "product",
      });
      writeJsonFile(MANIFEST_PATHS.products, data);
    }
  } catch {
    /* sync posterior */
  }
}

async function reindexProjectGallery(projectId: string): Promise<void> {
  const { rows } = await query<{ id: number; sort_order: number }>(
    `SELECT id, sort_order FROM project_images WHERE project_id = $1 ORDER BY sort_order`,
    [projectId],
  );
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i].sort_order !== i) {
      await query(`UPDATE project_images SET sort_order = $2 WHERE id = $1`, [rows[i].id, i]);
    }
  }
}

async function reindexProductGallery(category: string, subcategory: string): Promise<void> {
  const { rows } = await query<{ id: number; sort_order: number }>(
    `SELECT id, sort_order FROM product_gallery_images
     WHERE category = $1 AND subcategory = $2 ORDER BY sort_order`,
    [category, subcategory],
  );
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i].sort_order !== i) {
      await query(`UPDATE product_gallery_images SET sort_order = $2 WHERE id = $1`, [rows[i].id, i]);
    }
  }
}

export async function deleteMediaItem(item: AdminMediaItem): Promise<void> {
  if (item.kind === "project" && item.projectId != null && item.galleryIndex != null) {
    if (isDatabaseEnabled()) {
      const { rows: countRows } = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM project_images WHERE project_id = $1`,
        [item.projectId],
      );
      if (Number.parseInt(countRows[0]?.count ?? "0", 10) <= 1) {
        throw new Error("No puedes eliminar la única foto del proyecto. Sube otra antes o reemplázala.");
      }

      await query(
        `DELETE FROM project_images WHERE project_id = $1 AND sort_order = $2`,
        [item.projectId, item.galleryIndex],
      );
      await reindexProjectGallery(item.projectId);

      const { rows: imgs } = await query<{ src: string }>(
        `SELECT src FROM project_images WHERE project_id = $1 ORDER BY sort_order`,
        [item.projectId],
      );
      const { rows: proj } = await query<{ cover_index: number }>(
        `SELECT cover_index FROM projects WHERE id = $1`,
        [item.projectId],
      );
      const gallery = imgs.map((i) => i.src);
      const coverIndex = Math.min(proj[0]?.cover_index ?? 0, Math.max(0, gallery.length - 1));
      const cover = resolveProjectCover(gallery, coverIndex);
      await query(
        `UPDATE projects SET cover_path = $2, cover_index = $3 WHERE id = $1`,
        [item.projectId, cover, coverIndex],
      );
      try {
        fs.unlinkSync(publicPathFromSrc(item.src));
      } catch {
        /* archivo ya ausente */
      }
      await afterMutation();
      return;
    }

    const data = readJsonFile<ProjectManifest>(MANIFEST_PATHS.projects);
    const project = data.projects.find((p) => p.id === item.projectId);
    if (!project) throw new Error("Proyecto no encontrado.");
    if (project.gallery.length <= 1) {
      throw new Error("No puedes eliminar la única foto del proyecto. Sube otra antes o reemplázala.");
    }
    project.gallery.splice(item.galleryIndex, 1);
    project.imageCount = project.gallery.length;
    project.coverIndex = Math.min(project.coverIndex ?? 0, Math.max(0, project.gallery.length - 1));
    project.cover = resolveProjectCover(project.gallery, project.coverIndex);
    data.generatedAt = new Date().toISOString();
    writeJsonFile(MANIFEST_PATHS.projects, data);
    try {
      fs.unlinkSync(publicPathFromSrc(item.src));
    } catch {
      /* ok */
    }
    await afterMutation();
    return;
  }

  if (item.kind === "product" && item.category && item.subcategory && item.productIndex != null) {
    if (isDatabaseEnabled()) {
      await query(
        `DELETE FROM product_gallery_images
         WHERE category = $1 AND subcategory = $2 AND sort_order = $3`,
        [item.category, item.subcategory, item.productIndex],
      );
      await reindexProductGallery(item.category, item.subcategory);
      try {
        fs.unlinkSync(publicPathFromSrc(item.src));
      } catch {
        /* ok */
      }
      await afterMutation();
      return;
    }

    const data = readJsonFile<ProductManifest>(MANIFEST_PATHS.products);
    const gallery = data.galleries?.[item.category]?.[item.subcategory];
    if (!gallery) throw new Error("Imagen no encontrada.");
    gallery.splice(item.productIndex, 1);
    writeJsonFile(MANIFEST_PATHS.products, data);
    try {
      fs.unlinkSync(publicPathFromSrc(item.src));
    } catch {
      /* ok */
    }
    await afterMutation();
  }
}

export function findMediaItem(items: AdminMediaItem[], id: string): AdminMediaItem | undefined {
  return items.find((item) => item.id === id);
}

export async function listProjectOptions(): Promise<{ id: string; name: string; city: string }[]> {
  if (isDatabaseEnabled()) {
    const { rows } = await query<{ id: string; name: string; city: string }>(
      `SELECT id, name, city FROM projects ORDER BY name`,
    );
    return rows;
  }
  const data = readJsonFile<ProjectManifest>(MANIFEST_PATHS.projects);
  return data.projects.map((p) => ({ id: p.id, name: p.name, city: p.city }));
}
