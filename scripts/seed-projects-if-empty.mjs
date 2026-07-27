/**
 * Si `projects` está vacío, importa el portafolio desde project-portfolio.json
 * sin truncar catálogo, ajustes ni otras tablas.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { getDatabaseUrl } from "./db-config.mjs";

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

async function main() {
  const client = new pg.Client({ connectionString: getDatabaseUrl() });
  await client.connect();

  const { rows } = await client.query(`SELECT COUNT(*)::text AS count FROM projects`);
  const count = Number.parseInt(rows[0]?.count ?? "0", 10);
  if (count > 0) {
    console.log(`Obras ya presentes en Postgres: ${count}. Nada que importar.`);
    await client.end();
    return;
  }

  const portfolio = readJson("src/lib/catalog/project-portfolio.json");
  const projects = portfolio.projects ?? [];
  if (projects.length === 0) {
    console.warn("project-portfolio.json no tiene obras. Abortando seed.");
    await client.end();
    process.exitCode = 1;
    return;
  }

  console.log(`Importando ${projects.length} obras (solo tabla projects)…`);

  for (const project of projects) {
    await client.query(
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
      await client.query(
        `INSERT INTO project_images (project_id, src, sort_order, alt_text)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (project_id, sort_order) DO NOTHING`,
        [project.id, gallery[index], index, project.name],
      );
    }
  }

  await client.end();
  console.log(`Seed de obras completado: ${projects.length} instalaciones.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
