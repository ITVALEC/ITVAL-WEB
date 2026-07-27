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
import { MANIFEST_PATHS, readJsonFile, writeJsonFile } from "./manifests";
import { getProductCategoryLabel, getSubcategoryLabel } from "./product-labels";
import {
  resolveGalleryImageSource,
  type GalleryImageSource,
} from "@/lib/catalog/product-images";

const root = process.cwd();
const PUBLIC_IMAGES = path.join(root, "public", "images");
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const MAX_BYTES = 20 * 1024 * 1024;

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
  const normalized = src.replace(/^\//, "").replace(/\\/g, "/");
  if (!normalized.startsWith("images/")) {
    throw new Error("Ruta de imagen no permitida.");
  }
  const full = path.join(root, "public", normalized);
  const resolved = path.resolve(full);
  const imagesRoot = path.resolve(PUBLIC_IMAGES);
  const relative = path.relative(imagesRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Ruta fuera del directorio de imágenes.");
  }
  return resolved;
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

export function writeImageFile(
  buffer: Buffer,
  destPublicSrc: string,
): string {
  try {
    const diskPath = publicPathFromSrc(destPublicSrc);
    ensureDir(path.dirname(diskPath));
    fs.writeFileSync(diskPath, buffer);
    return destPublicSrc;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar";
    if (message.includes("EACCES") || message.includes("EPERM")) {
      throw new Error("Sin permiso para guardar la imagen en el servidor.");
    }
    if (message.includes("ENOSPC")) {
      throw new Error("No hay espacio en disco para guardar la imagen.");
    }
    throw new Error(`No se pudo guardar la imagen: ${message}`);
  }
}

export function replaceImageAtSrc(src: string, buffer: Buffer): string {
  const diskPath = publicPathFromSrc(src);
  ensureDir(path.dirname(diskPath));
  fs.writeFileSync(diskPath, buffer);
  return src;
}

function mediaFileExists(src: string): boolean {
  try {
    return fs.existsSync(publicPathFromSrc(normalizePublicSrc(src)));
  } catch {
    return false;
  }
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
      images.forEach((image, index) => {
        const gallerySource = resolveGalleryImageSource(image);
        if (gallerySource === "project") return;

        items.push({
          id: `product:${category}:${subcategory}:${index}`,
          kind: "product",
          src: image.src,
          title: image.caption || getSubcategoryLabel(category, subcategory),
          subtitle: `${getProductCategoryLabel(category)} · ${getSubcategoryLabel(category, subcategory)}`,
          caption: image.caption ?? "",
          category,
          subcategory,
          productIndex: index,
          gallerySource,
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

  const fromDb: AdminMediaItem[] = [];
  for (const row of productRows) {
    const gallerySource = resolveGalleryImageSource({
      src: row.src,
      source:
        row.source === "product" || row.source === "project"
          ? row.source
          : undefined,
    });
    if (gallerySource === "project") continue;

    fromDb.push({
      id: `product:${row.category}:${row.subcategory}:${row.sort_order}`,
      kind: "product",
      src: row.src,
      title: row.caption || getSubcategoryLabel(row.category, row.subcategory),
      subtitle: `${getProductCategoryLabel(row.category)} · ${getSubcategoryLabel(row.category, row.subcategory)}`,
      caption: row.caption ?? "",
      category: row.category,
      subcategory: row.subcategory,
      productIndex: row.sort_order,
      gallerySource,
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
  if (isDatabaseEnabled()) {
    await syncDatabaseToJson();
  }
  const { revalidatePublicCatalog } = await import("@/lib/catalog/revalidate-public");
  revalidatePublicCatalog();
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

  if (item.kind === "hero") {
    // Portadas: siempre ruta propia (nunca pages/products.svg ni otros marcadores).
    targetSrc = dedicatedHeroSrc(item, ext);
  } else if (isSharedPlaceholderSrc(previousSrc)) {
    // Galería apuntando a un marcador compartido: crear archivo dedicado.
    if (item.kind === "product" && item.category && item.subcategory) {
      const base = sanitizeBaseName(path.basename(originalName, ext));
      targetSrc = `/images/products/gallery/${item.category}/${item.subcategory}/${base}-${Date.now()}${ext}`;
    } else if (item.kind === "project" && item.projectId) {
      const base = sanitizeBaseName(path.basename(originalName, ext));
      targetSrc = `/images/projects/${item.projectId}/${base}-${Date.now()}${ext}`;
    } else {
      throw new Error("No se puede reemplazar un marcador compartido sin destino propio.");
    }
  } else if (path.extname(previousSrc).toLowerCase() !== ext) {
    const base = previousSrc.replace(/\.[^.]+$/, "");
    targetSrc = `${base}${ext}`;
  }

  if (targetSrc !== previousSrc) {
    await updateMediaSrc(item, targetSrc);
    if (!isSharedPlaceholderSrc(previousSrc)) {
      try {
        fs.unlinkSync(publicPathFromSrc(previousSrc));
      } catch {
        /* archivo anterior ausente */
      }
    }
  }

  writeImageFile(buffer, targetSrc);
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
      await query(
        `UPDATE product_gallery_images SET src = $4
         WHERE category = $1 AND subcategory = $2 AND sort_order = $3`,
        [item.category, item.subcategory, item.productIndex, newSrc],
      );
      return;
    }

    const data = readJsonFile<ProductManifest>(MANIFEST_PATHS.products);
    const gallery = data.galleries?.[item.category]?.[item.subcategory];
    if (!gallery?.[item.productIndex]) throw new Error("Imagen no encontrada.");
    gallery[item.productIndex].src = newSrc;
    writeJsonFile(MANIFEST_PATHS.products, data);
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

  return {
    id: `project:${projectId}:${project.gallery.length - 1}`,
    kind: "project",
    src: publicSrc,
    title: project.name,
    subtitle: project.city,
    caption: project.name,
    projectId,
    galleryIndex: project.gallery.length - 1,
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
  const ext = extFromName(originalName);
  const base = sanitizeBaseName(path.basename(originalName, ext));
  const fileName = `${base}-${Date.now()}${ext}`;
  const publicSrc = `/images/products/gallery/${category}/${subcategory}/${fileName}`;

  writeImageFile(buffer, publicSrc);

  if (isDatabaseEnabled()) {
    await seedProductGalleryFromJsonIfEmpty(category, subcategory);

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
    return {
      id: `product:${category}:${subcategory}:${sortOrder}`,
      kind: "product",
      src: publicSrc,
      title: caption || getSubcategoryLabel(category, subcategory),
      subtitle: `${getProductCategoryLabel(category)} · ${getSubcategoryLabel(category, subcategory)}`,
      caption: caption.trim(),
      category,
      subcategory,
      productIndex: sortOrder,
      gallerySource: "product",
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

  return {
    id: `product:${category}:${subcategory}:${index}`,
    kind: "product",
    src: publicSrc,
    title: caption || getSubcategoryLabel(category, subcategory),
    subtitle: `${getProductCategoryLabel(category)} · ${getSubcategoryLabel(category, subcategory)}`,
    caption: caption.trim(),
    category,
    subcategory,
    productIndex: index,
    gallerySource: "product",
  };
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
  const images = data.galleries?.[category]?.[subcategory] ?? [];
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const source = resolveGalleryImageSource(image);
    await query(
      `INSERT INTO product_gallery_images (category, subcategory, src, caption, sort_order, source)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (category, subcategory, sort_order) DO NOTHING`,
      [category, subcategory, image.src, image.caption ?? "", index, source],
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
