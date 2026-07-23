import fs from "node:fs";
import { isDatabaseEnabled, query } from "@/lib/db/pool";
import { listProjectsFromDb } from "@/lib/db/repositories/projects";
import { MANIFEST_PATHS } from "@/lib/admin/manifests";

const root = process.cwd();

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

/** Sincroniza PostgreSQL → archivos JSON que usa el sitio estático. */
export async function syncDatabaseToJson(): Promise<void> {
  if (!isDatabaseEnabled()) return;

  const projects = await listProjectsFromDb();
  const cities = [...new Set(projects.map((p) => p.city))].sort();
  const categories = [...new Set(projects.map((p) => p.productCategory))].sort();

  writeJson(MANIFEST_PATHS.projects, {
    generatedAt: new Date().toISOString(),
    source: "postgresql",
    missionImage: "/images/about/mission.jpg",
    cities,
    categories,
    projects,
  });

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

  const existing = JSON.parse(
    fs.readFileSync(MANIFEST_PATHS.products, "utf8"),
  ) as Record<string, unknown>;

  const galleries: Record<
    string,
    Record<string, { src: string; caption: string; source?: string }[]>
  > = {};

  let productSourceCount = 0;
  for (const row of productRows) {
    galleries[row.category] ??= {};
    galleries[row.category][row.subcategory] ??= [];
    const source =
      row.source === "project" || row.source === "product"
        ? row.source
        : row.src.includes("/projects/") || row.src.includes("/project/")
          ? "project"
          : "product";
    if (source === "product") productSourceCount += 1;
    galleries[row.category][row.subcategory].push({
      src: row.src,
      caption: row.caption ?? "",
      source,
    });
  }

  // Si la DB no tiene fotos de producto (solo refs de obra), no pisar el manifiesto JSON.
  const galleriesToWrite =
    productSourceCount > 0
      ? galleries
      : ((existing.galleries as typeof galleries | undefined) ?? galleries);

  writeJson(MANIFEST_PATHS.products, { ...existing, galleries: galleriesToWrite });

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
