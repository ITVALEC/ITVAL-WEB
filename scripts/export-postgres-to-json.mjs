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

/**
 * Une defaults del archivo del release con el documento de Postgres.
 * Evita que un hub/detalle atrasado en BD borre claves nuevas del repo
 * antes del `next build` (si no, el bundle queda sin hub.allProducts, etc.).
 */
function mergeCatalogMessages(defaults, override) {
  const result = { ...defaults };
  for (const [key, value] of Object.entries(override)) {
    const base = result[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base &&
      typeof base === "object" &&
      !Array.isArray(base)
    ) {
      result[key] = mergeCatalogMessages(base, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function readJsonIfExists(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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

  // Si la DB no tiene obras, NO pisar el manifiesto del repo (evita “0 obras” en el sitio).
  if (portfolioProjects.length === 0) {
    console.warn(
      "AVISO: projects en Postgres está vacío. Se conserva project-portfolio.json del release.",
    );
  } else {
    writeJson("src/lib/catalog/project-portfolio.json", {
      generatedAt: new Date().toISOString(),
      source: "postgresql:itval_db",
      missionImage: "/images/about/mission.jpg",
      cities,
      categories,
      projects: portfolioProjects,
    });
  }

  const { rows: productRows } = await client.query(
    `SELECT category, subcategory, src, caption, sort_order, source
     FROM product_gallery_images
     ORDER BY category, subcategory, sort_order`,
  );

  const existingProducts = JSON.parse(
    fs.readFileSync(path.join(root, "src/lib/catalog/product-images.json"), "utf8"),
  );

  const galleriesFromDb = {};
  for (const row of productRows) {
    galleriesFromDb[row.category] ??= {};
    galleriesFromDb[row.category][row.subcategory] ??= [];
    galleriesFromDb[row.category][row.subcategory].push({
      src: row.src,
      caption: row.caption ?? "",
      source:
        row.source === "project" || row.source === "product"
          ? row.source
          : String(row.src).includes("/projects/") || String(row.src).includes("/project/")
            ? "project"
            : "product",
    });
  }

  // Merge por categoría/producto: no borrar galerías que solo existen en el JSON.
  const existingGalleries = existingProducts.galleries ?? {};
  const galleriesMerged = { ...existingGalleries };
  for (const [category, subs] of Object.entries(galleriesFromDb)) {
    galleriesMerged[category] = {
      ...(galleriesMerged[category] ?? {}),
      ...subs,
    };
  }

  if (productRows.length > 0) {
    writeJson("src/lib/catalog/product-images.json", {
      ...existingProducts,
      galleries: galleriesMerged,
    });
  } else {
    console.warn(
      "AVISO: product_gallery_images vacío. Se conserva product-images.json del release.",
    );
  }

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

  for (const { key, file, mergeWithRepo } of [
    {
      key: "catalogContentEs",
      file: "messages/products-catalog/es.json",
      mergeWithRepo: true,
    },
    {
      key: "catalogContentEn",
      file: "messages/products-catalog/en.json",
      mergeWithRepo: true,
    },
    { key: "taxonomy", file: "src/lib/catalog/taxonomy.json", mergeWithRepo: false },
    {
      key: "filterConfig",
      file: "src/lib/catalog/filter-config.json",
      mergeWithRepo: false,
    },
  ]) {
    const { rows: docRows } = await client.query(
      `SELECT data FROM app_documents WHERE key = $1 LIMIT 1`,
      [key],
    );
    if (docRows[0]?.data == null) continue;

    let payload = docRows[0].data;
    if (mergeWithRepo) {
      const repoDefaults = readJsonIfExists(file);
      if (
        repoDefaults &&
        typeof repoDefaults === "object" &&
        !Array.isArray(repoDefaults) &&
        typeof payload === "object" &&
        payload &&
        !Array.isArray(payload)
      ) {
        payload = mergeCatalogMessages(repoDefaults, payload);
        // Persistir merge en Postgres para que la BD deje de estar atrasada.
        await client.query(
          `INSERT INTO app_documents (key, data, updated_at)
           VALUES ($1, $2::jsonb, now())
           ON CONFLICT (key) DO UPDATE
             SET data = EXCLUDED.data, updated_at = now()`,
          [key, JSON.stringify(payload)],
        );
        const hub = payload.hub ?? {};
        console.log(
          `[catalog] ${key} merge hub keys: ${Object.keys(hub).join(", ")}` +
            (hub.allProducts ? ` | allProducts="${hub.allProducts}"` : " | FALTA allProducts"),
        );
      }
    }

    writeJson(file, payload);
  }

  await client.end();
  console.log(
    `Exportado: ${portfolioProjects.length} proyectos` +
      (portfolioProjects.length === 0 ? " (manifiesto conservado)" : "") +
      `, ${productRows.length} imágenes de producto, catálogo i18n.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
