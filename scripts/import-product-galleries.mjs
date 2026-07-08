/**
 * Importa galerías completas desde FOTOS PRODUCTOS y fotos PROYECTOS.
 * Invocado por import-product-photos.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

import {
  isBlockedImageFile,
  isBlockedImagePath,
} from "./blocked-images.mjs";

const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;

/** Reglas para clasificar carpetas de proyectos → categoría/subcategoría */
const PROJECT_RULES = [
  {
    test: /judicat|judicial|fiscal|gesell|complejo judicial/i,
    category: "security",
    subcategory: "gesellGlass",
  },
  {
    test: /mampara blind|securitas|blindad/i,
    category: "security",
    subcategory: "armoredPartitions",
  },
  {
    test: /mcdonald|claraboya|cubierta|pergola/i,
    category: "coversExteriors",
    subcategory: "roofsSkylights",
  },
  {
    test: /marquesin|portal shopping/i,
    category: "coversExteriors",
    subcategory: "marquees",
  },
  {
    test: /cerramiento/i,
    category: "coversExteriors",
    subcategory: "glassEnclosures",
  },
  {
    test: /\bkia\b|hyundai|suzuki|automati/i,
    category: "automaticDoors",
    subcategory: "standardAuto",
  },
  {
    test: /puerta|lobby|ingreso|garita|cajero/i,
    category: "doorsAccess",
    subcategory: "slidingDoors",
  },
  {
    test: /mampara|division|oficina|interior/i,
    category: "corporateInteriors",
    subcategory: "glassPartitions",
  },
  {
    test: /louver|quiebrasol|panel|acm|revestimiento/i,
    category: "acmLouvers",
    subcategory: "acmPanels",
  },
  {
    test: /piso de vidrio|piso.*vidrio/i,
    category: "architecturalGlass",
    subcategory: "glassFloors",
  },
  {
    test: /pasaman|acero inox|inoxidable/i,
    category: "stainlessSteel",
    subcategory: "handrails",
  },
  {
    test: /ventana|proyectable|corrediz/i,
    category: "aluminumWindows",
    subcategory: "sliding",
  },
  {
    test: /laboratorio|hermet|hospital|farmaceut/i,
    category: "doorsAccess",
    subcategory: "hermeticDoors",
  },
];

const DEFAULT_PROJECT = {
  category: "facades",
  subcategory: "curtainWallStick",
};

export function findFolder(photosBase, contains) {
  if (!fs.existsSync(photosBase)) return null;
  const dirs = fs.readdirSync(photosBase, { withFileTypes: true });
  const match = dirs.find(
    (d) =>
      d.isDirectory() &&
      d.name.toLowerCase().includes(contains.toLowerCase()),
  );
  if (!match) return null;
  return path.join(photosBase, match.name);
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);
}

function isImageFile(name) {
  return IMAGE_EXT.test(name) && !isBlockedImageFile(name);
}

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(isImageFile)
    .map((file) => path.join(dir, file));
}

function extOf(filePath) {
  return path.extname(filePath).toLowerCase() || ".jpg";
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyTo(src, destPath) {
  ensureDir(path.dirname(destPath));
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(src, destPath);
  }
  return destPath.replace(path.join(root, "public"), "").replace(/\\/g, "/");
}

function galleryKey(category, subcategory) {
  return `${category}/${subcategory}`;
}

export { parseProjectFolder } from "./project-city.mjs";

export function classifyProject(folderName) {
  for (const rule of PROJECT_RULES) {
    if (rule.test.test(folderName)) {
      return { category: rule.category, subcategory: rule.subcategory };
    }
  }
  return DEFAULT_PROJECT;
}

function captionFromFilename(fileName) {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/[_-]+/g, " ")
    .trim();
}

function addGalleryItem(store, category, subcategory, item) {
  if (!store[category]) store[category] = {};
  if (!store[category][subcategory]) store[category][subcategory] = [];

  const exists = store[category][subcategory].some(
    (entry) => entry.src === item.src,
  );
  if (!exists) {
    store[category][subcategory].push(item);
  }
}

/**
 * @param {object} options
 * @param {string} options.photosBase - FOTOS PRODUCTOS
 * @param {string} options.projectsBase - fotos PROYECTOS
 * @param {string} options.destBase - public/images/products
 * @param {Array} options.map - MAP from import-product-photos
 */
export function buildProductGalleries({
  photosBase,
  projectsBase,
  destBase,
  map,
}) {
  const galleries = {};
  const folderToSubs = new Map();

  for (const entry of map) {
    if (entry.categoryOnly || !entry.subcategory) continue;
    const key = entry.folder.toLowerCase();
    if (!folderToSubs.has(key)) folderToSubs.set(key, []);
    const list = folderToSubs.get(key);
    const dup = list.find(
      (x) =>
        x.category === entry.category &&
        x.subcategory === entry.subcategory,
    );
    if (!dup) {
      list.push({
        category: entry.category,
        subcategory: entry.subcategory,
      });
    }
  }

  let productCount = 0;

  for (const [folderKey, subs] of folderToSubs) {
    const folder = findFolder(photosBase, folderKey);
    if (!folder) continue;

    for (const srcPath of listImages(folder)) {
      const baseName = path.basename(srcPath);
      const slug = slugify(baseName) || "imagen";

      for (const { category, subcategory } of subs) {
        const destPath = path.join(
          destBase,
          "gallery",
          category,
          subcategory,
          `${slug}${extOf(srcPath)}`,
        );
        const publicPath = copyTo(srcPath, destPath);
        addGalleryItem(galleries, category, subcategory, {
          src: publicPath,
          caption: captionFromFilename(baseName),
          source: "product",
        });
        productCount += 1;
      }
    }
  }

  let projectCount = 0;

  if (fs.existsSync(projectsBase)) {
    const projectDirs = fs
      .readdirSync(projectsBase, { withFileTypes: true })
      .filter((d) => d.isDirectory());

    for (const dir of projectDirs) {
      const { project, city } = parseProjectFolder(dir.name);
      const { category, subcategory } = classifyProject(dir.name);
      const captionBase = city ? `${project} — ${city}` : project;
      const folderPath = path.join(projectsBase, dir.name);
      const images = listImages(folderPath);

      images.forEach((srcPath, index) => {
        const baseName = path.basename(srcPath);
        const slug = slugify(`${dir.name}-${baseName}`) || `proyecto-${index}`;
        const destPath = path.join(
          destBase,
          "gallery",
          category,
          subcategory,
          "projects",
          `${slug}${extOf(srcPath)}`,
        );
        const publicPath = copyTo(srcPath, destPath);
        addGalleryItem(galleries, category, subcategory, {
          src: publicPath,
          caption: captionBase,
          source: "project",
        });
        projectCount += 1;
      });
    }
  }

  return { galleries, productCount, projectCount };
}
