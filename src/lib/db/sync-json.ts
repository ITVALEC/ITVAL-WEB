import fs from "node:fs";
import path from "node:path";
import { isDatabaseEnabled, query } from "@/lib/db/pool";
import { listProjectsFromDb } from "@/lib/db/repositories/projects";
import { MANIFEST_PATHS } from "@/lib/admin/manifests";

const root = process.cwd();

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function exportAppDocument(key: string, filePath: string): Promise<void> {
  const { rows } = await query<{ data: unknown }>(
    `SELECT data FROM app_documents WHERE key = $1 LIMIT 1`,
    [key],
  );
  if (rows[0]?.data != null) {
    writeJson(filePath, rows[0].data);
  }
}

/** Sincroniza PostgreSQL → archivos JSON que usa el sitio estático. */
export async function syncDatabaseToJson(): Promise<void> {
  if (!isDatabaseEnabled()) return;

  const projects = await listProjectsFromDb();
  const cities = [...new Set(projects.map((p) => p.city))].sort();
  const categories = [...new Set(projects.map((p) => p.productCategory))].sort();

  if (projects.length > 0) {
    writeJson(MANIFEST_PATHS.projects, {
      generatedAt: new Date().toISOString(),
      source: "postgresql",
      missionImage: "/images/about/mission.jpg",
      cities,
      categories,
      projects,
    });
  }

  // Textos y config del catálogo (lo que edita el admin).
  await exportAppDocument(
    "catalogContentEs",
    path.join(root, "messages/products-catalog/es.json"),
  );
  await exportAppDocument(
    "catalogContentEn",
    path.join(root, "messages/products-catalog/en.json"),
  );
  await exportAppDocument("taxonomy", MANIFEST_PATHS.taxonomy);
  await exportAppDocument("filterConfig", MANIFEST_PATHS.filters);

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

  let existing: Record<string, unknown> = {};
  try {
    existing = JSON.parse(fs.readFileSync(MANIFEST_PATHS.products, "utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    existing = {};
  }

  // Preferir documento productImages de app_documents (portadas + estructura).
  const { rows: productDocRows } = await query<{ data: Record<string, unknown> }>(
    `SELECT data FROM app_documents WHERE key = 'productImages' LIMIT 1`,
  );
  if (productDocRows[0]?.data) {
    existing = { ...existing, ...productDocRows[0].data };
  }

  const galleriesFromDb: Record<
    string,
    Record<string, { src: string; caption: string; source?: string }[]>
  > = {};

  for (const row of productRows) {
    galleriesFromDb[row.category] ??= {};
    galleriesFromDb[row.category][row.subcategory] ??= [];
    const source =
      row.source === "project" || row.source === "product"
        ? row.source
        : row.src.includes("/projects/") || row.src.includes("/project/")
          ? "project"
          : "product";
    galleriesFromDb[row.category][row.subcategory].push({
      src: row.src,
      caption: row.caption ?? "",
      source,
    });
  }

  // Merge: no borrar galerías del JSON que aún no están en Postgres.
  // Solo sobrescribe cat/sub presentes en DB; el resto del manifiesto se conserva.
  const existingGalleries =
    (existing.galleries as
      | Record<string, Record<string, { src: string; caption: string; source?: string }[]>>
      | undefined) ?? {};
  const galleriesToWrite: typeof existingGalleries = { ...existingGalleries };
  for (const [category, subs] of Object.entries(galleriesFromDb)) {
    galleriesToWrite[category] = {
      ...(galleriesToWrite[category] ?? {}),
      ...subs,
    };
  }

  // Si Postgres no tiene filas de galería, no reescribir el manifiesto solo por eso
  // (igual que export-postgres-to-json.mjs); sí escribir si hay documento productImages.
  if (productRows.length > 0 || productDocRows[0]?.data) {
    writeJson(MANIFEST_PATHS.products, { ...existing, galleries: galleriesToWrite });
  }

  const { rows: settingsRows } = await query<{ contact: unknown; footer: unknown }>(
    `SELECT contact, footer FROM site_settings WHERE id = 1`,
  );
  if (settingsRows[0]) {
    writeJson(MANIFEST_PATHS.siteSettings, {
      contact: settingsRows[0].contact,
      footer: settingsRows[0].footer,
    });
  }

  const { rows: blockedRows } = await query<{ filename: string }>(
    `SELECT filename FROM blocked_images ORDER BY filename`,
  );

  writeJson(MANIFEST_PATHS.blocked, {
    description: "Imágenes que no deben publicarse (personas trabajando, IA, etc.).",
    files: blockedRows.map((r) => r.filename),
    patterns: ["^DSC0060[0-9]\\.(jpe?g|png)$"],
  });
}

export async function syncJsonToDatabaseIfEmpty(): Promise<boolean> {
  if (!isDatabaseEnabled()) return false;

  const { rows } = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM projects`,
  );
  if (Number.parseInt(rows[0]?.count ?? "0", 10) > 0) return false;

  const { execSync } = await import("node:child_process");
  execSync("node scripts/migrate-json-to-postgres.mjs", {
    cwd: root,
    stdio: "inherit",
  });
  return true;
}
