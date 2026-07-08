/**
 * Exporta PostgreSQL → JSON para el sitio estático.
 * Ejecutar tras cambios en el panel admin.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { getDatabaseUrl } from "./db-config.mjs";
function resolveCover(gallery, coverIndex) {
  if (!gallery.length) return "/images/pages/projects.svg";
  if (
    coverIndex !== undefined &&
    coverIndex !== null &&
    coverIndex >= 0 &&
    coverIndex < gallery.length
  ) {
    return gallery[coverIndex];
  }
  return gallery[0];
}

const root = process.cwd();

function writeJson(relativePath, data) {
  const filePath = path.join(root, relativePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  const client = new pg.Client({ connectionString: getDatabaseUrl() });
  await client.connect();

  const { rows: projects } = await client.query(
    `SELECT * FROM projects ORDER BY year DESC NULLS LAST, name`,
  );

  const { rows: images } = await client.query(
    `SELECT project_id, src, sort_order FROM project_images ORDER BY project_id, sort_order`,
  );

  const galleryByProject = new Map();
  for (const row of images) {
    const list = galleryByProject.get(row.project_id) ?? [];
    list.push(row.src);
    galleryByProject.set(row.project_id, list);
  }

  const portfolioProjects = projects.map((row) => {
    const gallery = galleryByProject.get(row.id) ?? [];
    const coverIndex = row.cover_index ?? 0;
    const cover = resolveCover(gallery, coverIndex);
    return {
      id: row.id,
      name: row.name,
      city: row.city,
      location: row.location ?? `${row.city}, Ecuador`,
      year: row.year,
      folder: row.folder,
      productCategory: row.product_category,
      productSubcategory: row.product_subcategory,
      cover,
      gallery,
      imageCount: gallery.length,
      featured: row.featured,
      coverIndex: row.cover_index,
    };
  });

  const cities = [...new Set(portfolioProjects.map((p) => p.city))].sort();
  const categories = [
    ...new Set(portfolioProjects.map((p) => p.productCategory)),
  ].sort();

  writeJson("src/lib/catalog/project-portfolio.json", {
    generatedAt: new Date().toISOString(),
    source: "postgresql:itval_db",
    missionImage: "/images/about/mission.jpg",
    cities,
    categories,
    projects: portfolioProjects,
  });

  const { rows: productRows } = await client.query(
    `SELECT category, subcategory, src, caption, sort_order
     FROM product_gallery_images
     ORDER BY category, subcategory, sort_order`,
  );

  const existingProducts = JSON.parse(
    fs.readFileSync(path.join(root, "src/lib/catalog/product-images.json"), "utf8"),
  );

  const galleries = {};
  for (const row of productRows) {
    galleries[row.category] ??= {};
    galleries[row.category][row.subcategory] ??= [];
    galleries[row.category][row.subcategory].push({
      src: row.src,
      caption: row.caption ?? "",
    });
  }

  writeJson("src/lib/catalog/product-images.json", {
    ...existingProducts,
    galleries,
  });

  const { rows: settingsRows } = await client.query(
    `SELECT contact, footer FROM site_settings WHERE id = 1`,
  );
  if (settingsRows[0]) {
    writeJson("src/lib/catalog/site-settings.json", {
      contact: settingsRows[0].contact,
      footer: settingsRows[0].footer,
    });
  }

  const { rows: blockedRows } = await client.query(
    `SELECT filename FROM blocked_images ORDER BY filename`,
  );

  writeJson("src/lib/catalog/blocked-images.json", {
    description: "Imágenes que no deben publicarse (personas trabajando, IA, etc.).",
    files: blockedRows.map((r) => r.filename),
    patterns: ["^DSC0060[0-9]\\.(jpe?g|png)$"],
  });

  await client.end();
  console.log(`Exportado: ${portfolioProjects.length} proyectos, ${productRows.length} imágenes de producto.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
