import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { getDatabaseUrl } from "./db-config.mjs";

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

/** Documentos JSON que viven en `app_documents` (espejo de documents.ts). */
const APP_DOCUMENTS = [
  { key: "taxonomy", file: "src/lib/catalog/taxonomy.json" },
  { key: "filterConfig", file: "src/lib/catalog/filter-config.json" },
  { key: "productImages", file: "src/lib/catalog/product-images.json" },
  { key: "siteSettings", file: "src/lib/catalog/site-settings.json" },
  { key: "blockedImages", file: "src/lib/catalog/blocked-images.json" },
  { key: "portfolio", file: "src/lib/catalog/project-portfolio.json" },
  { key: "catalogContentEs", file: "messages/products-catalog/es.json" },
  { key: "catalogContentEn", file: "messages/products-catalog/en.json" },
];

async function upsertDocument(client, key, data) {
  await client.query(
    `INSERT INTO app_documents (key, data, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE
       SET data = EXCLUDED.data, updated_at = now()`,
    [key, JSON.stringify(data)],
  );
}

async function main() {
  const client = new pg.Client({ connectionString: getDatabaseUrl() });
  await client.connect();

  // Asegura la tabla en VPSs que ya tenían el esquema anterior.
  await client.query(`
    CREATE TABLE IF NOT EXISTS app_documents (
      key TEXT PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const portfolio = readJson("src/lib/catalog/project-portfolio.json");
  const products = readJson("src/lib/catalog/product-images.json");
  const settings = readJson("src/lib/catalog/site-settings.json");
  const blocked = readJson("src/lib/catalog/blocked-images.json");

  console.log("Limpiando tablas relacionales…");
  await client.query(
    "TRUNCATE project_images, projects, product_gallery_images, site_settings, blocked_images RESTART IDENTITY CASCADE",
  );

  console.log(`Importando ${portfolio.projects.length} proyectos…`);
  for (const project of portfolio.projects) {
    await client.query(
      `INSERT INTO projects (
        id, name, city, location, year, folder,
        product_category, product_subcategory, cover_path, cover_index, featured
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
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
      await client.query(
        `INSERT INTO project_images (project_id, src, sort_order, alt_text)
         VALUES ($1, $2, $3, $4)`,
        [project.id, gallery[index], index, project.name],
      );
    }
  }

  let productCount = 0;
  const galleries = products.galleries ?? {};
  for (const [category, subs] of Object.entries(galleries)) {
    for (const [subcategory, images] of Object.entries(subs)) {
      for (let index = 0; index < images.length; index += 1) {
        const image = images[index];
        await client.query(
          `INSERT INTO product_gallery_images (category, subcategory, src, caption, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [category, subcategory, image.src, image.caption ?? "", index],
        );
        productCount += 1;
      }
    }
  }
  console.log(`Importando ${productCount} imágenes de productos…`);

  await client.query(
    `INSERT INTO site_settings (id, contact, footer) VALUES (1, $1::jsonb, $2::jsonb)`,
    [JSON.stringify(settings.contact), JSON.stringify(settings.footer)],
  );

  for (const filename of blocked.files ?? []) {
    await client.query(
      `INSERT INTO blocked_images (filename, reason) VALUES ($1, $2) ON CONFLICT (filename) DO NOTHING`,
      [filename, blocked.description ?? null],
    );
  }
  console.log(`Importando ${(blocked.files ?? []).length} imágenes bloqueadas…`);

  console.log("Importando documentos del catálogo en app_documents…");
  for (const { key, file } of APP_DOCUMENTS) {
    const data = readJson(file);
    await upsertDocument(client, key, data);
    console.log(`  ✓ ${key} <- ${file}`);
  }

  await client.end();
  console.log("Migración completada.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
