/**
 * Unifica obras duplicadas creadas por carpetas casi iguales
 * (guion vs en-dash → mismo slug + sufijo -2/-3).
 *
 * También elimina filas de project_images cuyo archivo no existe en disco.
 *
 * Uso:
 *   node scripts/merge-duplicate-projects.mjs
 *   node scripts/merge-duplicate-projects.mjs --db
 *
 * En producción esto corre en el VPS durante el deploy (GitHub Actions),
 * no desde el PC de desarrollo.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { getDatabaseUrl } from "./db-config.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(
  root,
  "src",
  "lib",
  "catalog",
  "project-portfolio.json",
);
const publicImages = path.join(root, "public", "images");

function getImagesRoot() {
  try {
    return fs.realpathSync(publicImages);
  } catch {
    return publicImages;
  }
}

function publicPathFromSrc(src) {
  const normalized = String(src ?? "")
    .replace(/^\//, "")
    .replace(/\\/g, "/");
  if (!normalized.startsWith("images/")) return null;
  const relative = normalized.slice("images/".length);
  const full = path.resolve(getImagesRoot(), relative);
  const rootResolved = path.resolve(getImagesRoot());
  const rel = path.relative(rootResolved, full);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return full;
}

function fileExists(src) {
  const disk = publicPathFromSrc(src);
  if (!disk || !fs.existsSync(disk)) return false;
  try {
    const st = fs.statSync(disk);
    return st.isFile() && st.size >= 32;
  } catch {
    return false;
  }
}

/** base-2 / base-3 → base (solo sufijos de colisión de slug). */
function baseProjectId(id) {
  const match = String(id).match(/^(.*?)-(\d+)$/);
  if (!match) return null;
  const n = Number.parseInt(match[2], 10);
  if (n < 2 || n > 30) return null;
  return match[1];
}

function pickCover(gallery, coverIndex = 0) {
  if (!gallery.length) return "/images/pages/projects.svg";
  if (coverIndex >= 0 && coverIndex < gallery.length) return gallery[coverIndex];
  return gallery[0];
}

function mergeProjectGroup(keeper, duplicates) {
  const seen = new Set(keeper.gallery ?? []);
  const gallery = [...(keeper.gallery ?? [])];
  for (const dup of duplicates) {
    for (const src of dup.gallery ?? []) {
      if (!src || seen.has(src)) continue;
      seen.add(src);
      gallery.push(src);
    }
  }
  const coverIndex = Math.min(
    keeper.coverIndex ?? 0,
    Math.max(0, gallery.length - 1),
  );
  return {
    ...keeper,
    gallery,
    imageCount: gallery.length,
    cover: pickCover(gallery, coverIndex),
    coverIndex,
    featured: Boolean(keeper.featured || duplicates.some((d) => d.featured)),
    folder: keeper.folder || duplicates[0]?.folder || "",
  };
}

function mergeManifestProjects(projects) {
  const byId = new Map(projects.map((p) => [p.id, p]));
  const mergeInto = new Map();

  for (const project of projects) {
    const base = baseProjectId(project.id);
    if (!base || !byId.has(base)) continue;
    const list = mergeInto.get(base) ?? [];
    list.push(project.id);
    mergeInto.set(base, list);
  }

  if (mergeInto.size === 0) {
    return { projects, mergedGroups: 0, removedIds: [] };
  }

  const removed = new Set();
  for (const [keeperId, dupIds] of mergeInto) {
    const keeper = byId.get(keeperId);
    if (!keeper) continue;
    const duplicates = dupIds.map((id) => byId.get(id)).filter(Boolean);
    byId.set(keeperId, mergeProjectGroup(keeper, duplicates));
    for (const id of dupIds) {
      byId.delete(id);
      removed.add(id);
    }
  }

  return {
    projects: [...byId.values()],
    mergedGroups: mergeInto.size,
    removedIds: [...removed],
  };
}

function pruneGallery(projects) {
  let removedImages = 0;
  const next = [];
  for (const project of projects) {
    const gallery = (project.gallery ?? []).filter((src) => {
      const ok = fileExists(src);
      if (!ok) removedImages += 1;
      return ok;
    });
    if (gallery.length === 0) {
      next.push({
        ...project,
        gallery: [],
        imageCount: 0,
        cover: "/images/pages/projects.svg",
        coverIndex: 0,
      });
      continue;
    }
    const coverIndex = Math.min(project.coverIndex ?? 0, gallery.length - 1);
    next.push({
      ...project,
      gallery,
      imageCount: gallery.length,
      coverIndex,
      cover: pickCover(gallery, coverIndex),
    });
  }
  return { projects: next, removedImages };
}

async function mergeAndPruneDatabase(client) {
  const { rows: projects } = await client.query(
    `SELECT id, name, city, cover_index, featured, cover_path FROM projects ORDER BY id`,
  );
  const byId = new Map(projects.map((p) => [p.id, p]));
  const mergeInto = new Map();

  for (const project of projects) {
    const base = baseProjectId(project.id);
    if (!base || !byId.has(base)) continue;
    const list = mergeInto.get(base) ?? [];
    list.push(project.id);
    mergeInto.set(base, list);
  }

  let mergedGroups = 0;
  let removedProjects = 0;

  for (const [keeperId, dupIds] of mergeInto) {
    const { rows: keeperImgs } = await client.query(
      `SELECT COALESCE(MAX(sort_order), -1)::int AS max FROM project_images WHERE project_id = $1`,
      [keeperId],
    );
    let nextOrder = (keeperImgs[0]?.max ?? -1) + 1;

    for (const dupId of dupIds) {
      const { rows: dupImages } = await client.query(
        `SELECT id, src FROM project_images WHERE project_id = $1 ORDER BY sort_order`,
        [dupId],
      );
      for (const img of dupImages) {
        await client.query(
          `UPDATE project_images SET project_id = $1, sort_order = $2 WHERE id = $3`,
          [keeperId, nextOrder, img.id],
        );
        nextOrder += 1;
      }

      const { rows: featuredRows } = await client.query(
        `SELECT featured FROM projects WHERE id = $1`,
        [dupId],
      );
      if (featuredRows[0]?.featured) {
        await client.query(`UPDATE projects SET featured = true WHERE id = $1`, [
          keeperId,
        ]);
      }

      await client.query(`DELETE FROM projects WHERE id = $1`, [dupId]);
      removedProjects += 1;
    }

    const { rows: gallery } = await client.query(
      `SELECT src FROM project_images WHERE project_id = $1 ORDER BY sort_order`,
      [keeperId],
    );
    const sources = gallery.map((r) => r.src);
    await client.query(
      `UPDATE projects SET cover_path = $2, cover_index = 0 WHERE id = $1`,
      [keeperId, pickCover(sources, 0)],
    );
    mergedGroups += 1;
  }

  const { rows: allImages } = await client.query(
    `SELECT id, project_id, src FROM project_images ORDER BY project_id, sort_order`,
  );
  let removedImages = 0;
  const touchedProjects = new Set();

  for (const row of allImages) {
    if (fileExists(row.src)) continue;
    await client.query(`DELETE FROM project_images WHERE id = $1`, [row.id]);
    removedImages += 1;
    touchedProjects.add(row.project_id);
  }

  for (const projectId of touchedProjects) {
    const { rows: remaining } = await client.query(
      `SELECT id FROM project_images WHERE project_id = $1 ORDER BY sort_order`,
      [projectId],
    );
    for (let i = 0; i < remaining.length; i += 1) {
      await client.query(`UPDATE project_images SET sort_order = $2 WHERE id = $1`, [
        remaining[i].id,
        i,
      ]);
    }
    const { rows: gallery } = await client.query(
      `SELECT src FROM project_images WHERE project_id = $1 ORDER BY sort_order`,
      [projectId],
    );
    const sources = gallery.map((r) => r.src);
    await client.query(
      `UPDATE projects SET cover_path = $2, cover_index = 0 WHERE id = $1`,
      [projectId, pickCover(sources, 0)],
    );
  }

  return { mergedGroups, removedProjects, removedImages };
}

async function main() {
  const withDb = process.argv.includes("--db");

  const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const before = (raw.projects ?? []).length;

  const merged = mergeManifestProjects(raw.projects ?? []);
  const pruned = pruneGallery(merged.projects);

  pruned.projects.sort((a, b) => {
    if ((b.year ?? 0) !== (a.year ?? 0)) return (b.year ?? 0) - (a.year ?? 0);
    return String(a.name).localeCompare(String(b.name), "es");
  });

  const next = {
    ...raw,
    generatedAt: new Date().toISOString(),
    projects: pruned.projects,
    cities: [...new Set(pruned.projects.map((p) => p.city))].sort((a, b) =>
      a.localeCompare(b, "es"),
    ),
    categories: [
      ...new Set(pruned.projects.map((p) => p.productCategory)),
    ].sort(),
  };

  fs.writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    `JSON: ${before} → ${next.projects.length} obras (grupos unidos: ${merged.mergedGroups}, ids eliminados: ${merged.removedIds.length}, fotos huérfanas quitadas: ${pruned.removedImages}).`,
  );
  if (merged.removedIds.length) {
    console.log(`Eliminados: ${merged.removedIds.join(", ")}`);
  }

  if (!withDb) {
    console.log("Sin --db: Postgres no se tocó.");
    return;
  }

  let databaseUrl;
  try {
    databaseUrl = getDatabaseUrl();
  } catch (error) {
    console.warn(
      `No hay DATABASE_URL (${error.message}). Solo JSON actualizado.`,
    );
    return;
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("BEGIN");
    const result = await mergeAndPruneDatabase(client);
    await client.query("COMMIT");
    console.log(
      `Postgres: grupos unidos=${result.mergedGroups}, obras eliminadas=${result.removedProjects}, fotos huérfanas borradas=${result.removedImages}.`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
