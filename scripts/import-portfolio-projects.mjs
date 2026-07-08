/**
 * Importa fotos desde fotos PROYECTOS → public/images/projects/
 * Genera src/lib/catalog/project-portfolio.json
 *
 * Uso: node scripts/import-portfolio-projects.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyProject,
  parseProjectFolder,
} from "./import-product-galleries.mjs";
import {
  filterAllowedImages,
  isBlockedImageFile,
  pickAllowedCover,
} from "./blocked-images.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectsBase = path.join(
  "C:",
  "Users",
  "ITVAL",
  "Desktop",
  "Alejo",
  "fotos PROYECTOS",
);
const destBase = path.join(root, "public", "images", "projects");
const aboutDest = path.join(root, "public", "images", "about");
const manifestPath = path.join(
  root,
  "src",
  "lib",
  "catalog",
  "project-portfolio.json",
);

const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);
}

function titleCase(value) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isImageFile(name) {
  return IMAGE_EXT.test(name) && !isBlockedImageFile(name);
}

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(isImageFile)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((file) => path.join(dir, file));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyTo(src, destPath) {
  ensureDir(path.dirname(destPath));
  fs.copyFileSync(src, destPath);
  return destPath.replace(path.join(root, "public"), "").replace(/\\/g, "/");
}

function parseYear(folderName) {
  const match = folderName.match(/^(\d{4})/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function uniqueSlug(base, used) {
  let slug = slugify(base) || "proyecto";
  let counter = 2;
  while (used.has(slug)) {
    slug = `${slugify(base)}-${counter}`;
    counter += 1;
  }
  used.add(slug);
  return slug;
}

function markFeatured(projects) {
  const candidates = [...projects]
    .filter((project) => project.imageCount >= 2)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

  const featuredIds = new Set(
    candidates.slice(0, 6).map((project) => project.id),
  );

  for (const project of projects) {
    project.featured = featuredIds.has(project.id);
  }
}

function pickMissionImage(projects) {
  const preferred = projects.find(
    (project) =>
      /icon|banco|hotel|muro|curtain|fachada/i.test(project.folder) &&
      project.imageCount >= 1,
  );
  return preferred?.cover ?? projects.find((p) => p.imageCount >= 1)?.cover;
}

function main() {
  if (!fs.existsSync(projectsBase)) {
    console.error(`No se encontró la carpeta: ${projectsBase}`);
    process.exit(1);
  }

  ensureDir(destBase);
  ensureDir(aboutDest);

  const usedSlugs = new Set();
  const projects = [];

  const projectDirs = fs
    .readdirSync(projectsBase, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  for (const dir of projectDirs) {
    const folderPath = path.join(projectsBase, dir.name);
    const images = listImages(folderPath);
    if (images.length === 0) continue;

    const { project, city } = parseProjectFolder(dir.name);
    const { category, subcategory } = classifyProject(dir.name);
    const year = parseYear(dir.name);
    const id = uniqueSlug(dir.name, usedSlugs);
    const name = titleCase(project || dir.name);
    const cityLabel = city;
    const projectDest = path.join(destBase, id);

    const gallery = images.map((srcPath, index) => {
      const ext = path.extname(srcPath).toLowerCase() || ".jpg";
      const fileName = index === 0 ? `cover${ext}` : `${String(index).padStart(2, "0")}${ext}`;
      const destPath = path.join(projectDest, fileName);
      return copyTo(srcPath, destPath);
    });

    projects.push({
      id,
      name,
      city: cityLabel,
      location: `${cityLabel}, Ecuador`,
      year,
      folder: dir.name,
      productCategory: category,
      productSubcategory: subcategory,
      cover: gallery[0],
      gallery,
      imageCount: gallery.length,
      featured: false,
    });
  }

  projects.sort((a, b) => {
    if ((b.year ?? 0) !== (a.year ?? 0)) {
      return (b.year ?? 0) - (a.year ?? 0);
    }
    return a.name.localeCompare(b.name, "es");
  });

  markFeatured(projects);

  const cities = [...new Set(projects.map((project) => project.city))].sort(
    (a, b) => a.localeCompare(b, "es"),
  );

  const categories = [
    ...new Set(projects.map((project) => project.productCategory)),
  ].sort();

  const missionCover = pickMissionImage(projects);
  if (missionCover) {
    const missionSrc = path.join(root, "public", missionCover.replace(/^\//, ""));
    if (fs.existsSync(missionSrc)) {
      const ext = path.extname(missionSrc).toLowerCase() || ".jpg";
      copyTo(missionSrc, path.join(aboutDest, `mission${ext}`));
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: projectsBase,
    missionImage: missionCover
      ? `/images/about/mission${path.extname(missionCover).toLowerCase() || ".jpg"}`
      : null,
    cities,
    categories,
    projects,
  };

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    `Importados ${projects.length} proyectos (${projects.reduce((sum, p) => sum + p.imageCount, 0)} imágenes).`,
  );
  console.log(`Manifest: ${manifestPath}`);
}

main();
