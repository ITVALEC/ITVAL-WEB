/**
 * Importa fotos ITVAL desde FOTOS PRODUCTOS → public/images/products/
 * Genera src/lib/catalog/product-images.json
 *
 * Uso: node scripts/import-product-photos.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildProductGalleries } from "./import-product-galleries.mjs";
import { isBlockedImageFile } from "./blocked-images.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const photosBase = path.join(
  "C:",
  "Users",
  "ITVAL",
  "Desktop",
  "Alejo",
  "FOTOS PRODUCTOS",
);
const projectsBase = path.join(
  "C:",
  "Users",
  "ITVAL",
  "Desktop",
  "Alejo",
  "fotos PROYECTOS",
);
const destBase = path.join(root, "public", "images", "products");
const manifestPath = path.join(root, "src", "lib", "catalog", "product-images.json");

/** category → subcategory → { folderContains, file } */
const MAP = [
  // —— Fachadas ——
  {
    category: "facades",
    subcategory: "curtainWallStick",
    folder: "1 MURO CORTINA - STICK",
    file: "curtain wall.jpeg",
  },
  {
    category: "facades",
    subcategory: "stickRpt",
    folder: "1 MURO CORTINA - SISTEMA RPT",
    file: "UNIANDES TISALEO.jpg",
  },
  {
    category: "facades",
    subcategory: "structuralGlazing",
    folder: "1 MURO CORITNA - GRAMPONES Y ROTULAS",
    file: "DSC02836.JPG",
  },
  {
    category: "facades",
    subcategory: "glassSkin",
    folder: "1 MURO CORITNA - PIEL DE VIDRIO",
    file: "DSC02825.JPG",
  },
  {
    category: "facades",
    categoryOnly: true,
    folder: "1 MURO CORTINA - STICK",
    file: "QPH Curtain Wall ACERO.JPG",
  },

  // —— Ventanas ——
  {
    category: "aluminumWindows",
    subcategory: "projected",
    folder: "4 VENTANAS - Proyectables",
    file: "Ventanas proyectables.jpg",
  },
  {
    category: "aluminumWindows",
    subcategory: "sliding",
    folder: "4 VENTANAS - Corrediza",
    file: "Ventanas corredizas.jpg",
  },
  {
    category: "aluminumWindows",
    subcategory: "visusFemec",
    folder: "4 VENTANAS - Corrediza",
    file: "visus corredizo.jpeg",
  },
  {
    category: "aluminumWindows",
    subcategory: "thermalSolar",
    folder: "4 VENTANAS - Corrediza",
    file: "t45.jpeg",
  },
  {
    category: "aluminumWindows",
    categoryOnly: true,
    folder: "4 VENTANAS - Proyectables",
    file: "Ventanas proyectables.jpg",
  },

  // —— Puertas ——
  {
    category: "doorsAccess",
    subcategory: "slidingDoors",
    folder: "5 PUERTAS - Corredizas",
    file: "QPH Puertas Corredizas.JPG",
  },
  {
    category: "doorsAccess",
    subcategory: "hingedDoors",
    folder: "5 PUERTAS - Batientes de alumino",
    file: "DSC02905.JPG",
  },
  {
    category: "doorsAccess",
    subcategory: "foldingDoors",
    folder: "5 PUERTAS - Plegables",
    file: "20150827_173308.jpg",
  },
  {
    category: "doorsAccess",
    subcategory: "hermeticDoors",
    folder: "ESTRUCTURAS Y REVESTIMIENTO - PUERTAS BATIENTES HERMETICAS",
    file: "WhatsApp Image 2026-04-02 at 09.47.29.jpeg",
  },
  {
    category: "doorsAccess",
    categoryOnly: true,
    folder: "5 PUERTAS - Corredizas",
    file: "QPH Puertas Corredizas.JPG",
  },

  // —— Puertas automáticas ——
  {
    category: "automaticDoors",
    subcategory: "standardAuto",
    folder: "CARPINTERIA DE ALUMINIO - PUERTA AUTOMATICAS ESTANDAR",
    file: "PUERTA FACE.jpeg",
  },
  {
    category: "automaticDoors",
    subcategory: "telescopicAuto",
    folder: "CARPINTERIA DE ALUMINIO - PUERTA AUTOMATICAS ESTANDAR",
    file: "WhatsApp Image 2026-04-13 at 09.31.46.jpeg",
  },
  {
    category: "automaticDoors",
    subcategory: "armoredAuto",
    folder: "CARPINTERIA DE ALUMINIO - PUERTA AUTOMATICA BLINDADA",
    file: "KIA 1.jpeg",
  },
  {
    category: "automaticDoors",
    categoryOnly: true,
    folder: "CARPINTERIA DE ALUMINIO - PUERTA AUTOMATICAS ESTANDAR",
    file: "PUERTA FACE.jpeg",
  },

  // —— Seguridad ——
  {
    category: "security",
    subcategory: "armoredPartitions",
    folder: "3 MAMPARAS BLINDADAS",
    file: "2.jpeg",
  },
  {
    category: "security",
    subcategory: "ballisticSteel",
    folder: "3 MAMPARAS BLINDADAS",
    file: "3.jpeg",
  },
  {
    category: "security",
    subcategory: "gesellGlass",
    folder: "CARPINTERIA DE ALUMINIO - VIDRIO GESELL",
    file: "GESELL LOJA.jpeg",
  },
  {
    category: "security",
    subcategory: "guardBooths",
    folder: "12 LOBBY",
    file: "QPH Cajero.JPG",
  },
  {
    category: "security",
    categoryOnly: true,
    folder: "3 MAMPARAS BLINDADAS",
    file: "2.jpeg",
  },

  // —— Cubiertas y exteriores ——
  {
    category: "coversExteriors",
    subcategory: "roofsSkylights",
    folder: "8 CUBIERTAS",
    file: "Claraboya McDonald.jpg",
  },
  {
    category: "coversExteriors",
    subcategory: "pergolas",
    folder: "8 CUBIERTAS",
    file: "20150831_091400.jpg",
  },
  {
    category: "coversExteriors",
    subcategory: "marquees",
    folder: "9 MARQUESINAS",
    file: "Aranjuez Marquesina.jpg",
  },
  {
    category: "coversExteriors",
    subcategory: "glassEnclosures",
    folder: "21 CERRAMIENTOS DE VIDRIO",
    file: "cerramiento kia.jpeg",
  },
  {
    category: "coversExteriors",
    categoryOnly: true,
    folder: "8 CUBIERTAS",
    file: "Claraboya McDonald.jpg",
  },

  // —— ACM y louvers ——
  {
    category: "acmLouvers",
    subcategory: "acmPanels",
    folder: "10 REVESTIMIENTO EN PANEL COMPUESTO",
    file: "ABN Panel Blanco.jpg",
  },
  {
    category: "acmLouvers",
    subcategory: "louvers",
    folder: "11 LOUVERS",
    file: "FACHADA SUR NORTE.jpg",
  },
  {
    category: "acmLouvers",
    subcategory: "sunBreakers",
    folder: "11 LOUVERS",
    file: "AYEMSA.jpeg",
  },
  {
    category: "acmLouvers",
    subcategory: "compositeFacades",
    folder: "10 REVESTIMIENTO EN PANEL COMPUESTO",
    file: "DSC02814.JPG",
  },
  {
    category: "acmLouvers",
    categoryOnly: true,
    folder: "10 REVESTIMIENTO EN PANEL COMPUESTO",
    file: "ABN Panel Blanco.jpg",
  },

  // —— Interiores corporativos ——
  {
    category: "corporateInteriors",
    subcategory: "glassPartitions",
    folder: "2 MAMPARAS, DIVISIONES DE OFICINA",
    file: "_DSC0044.jpg",
  },
  {
    category: "corporateInteriors",
    subcategory: "officeDivision",
    folder: "2 MAMPARAS DE ALUMINIO, VIDRIO",
    file: "Mp #1.jpg",
  },
  {
    category: "corporateInteriors",
    subcategory: "lobbies",
    folder: "2 MAMPARAS DE ALUMINIO, VIDRIO",
    file: "QPH Divisiones interiores (2).JPG",
  },
  {
    category: "corporateInteriors",
    subcategory: "signage",
    folder: "12 LOBBY",
    file: "QPH Letreros.JPG",
  },
  {
    category: "corporateInteriors",
    categoryOnly: true,
    folder: "2 MAMPARAS DE ALUMINIO, VIDRIO",
    file: "Maparas#2.png",
  },

  // —— Vidrio arquitectónico ——
  {
    category: "architecturalGlass",
    subcategory: "glassFloors",
    folder: "13 PISOS DE VIDRIO",
    file: "PISO DE VIDRIO Edificio Aranjuez.JPG",
  },
  {
    category: "architecturalGlass",
    subcategory: "handrailsMirrors",
    folder: "16 ESPEJOS",
    file: "_DSC0133.jpg",
  },
  {
    category: "architecturalGlass",
    subcategory: "decorativeGlass",
    folder: "15 CASCADA DE VIDRIO",
    file: "WhatsApp Image 2026-04-02 at 17.13.24.jpeg",
  },
  {
    category: "architecturalGlass",
    subcategory: "wineCellars",
    folder: "18 CAVAS, REPISAS DE VIDRIO",
    file: "Mueble-botellas-3-1.jpg",
  },
  {
    category: "architecturalGlass",
    categoryOnly: true,
    folder: "13 PISOS DE VIDRIO",
    file: "PISO DE VIDRIO Edificio Aranjuez.JPG",
  },

  // —— Acero inoxidable ——
  {
    category: "stainlessSteel",
    subcategory: "handrails",
    folder: "20 PASAMANOS EN ACERO INOX",
    file: "20150904_161619.jpg",
  },
  {
    category: "stainlessSteel",
    subcategory: "ssSlidingDoors",
    folder: "ACERO INOXIDABLE CORREDIZAS",
    file: "WhatsApp Image 2026-04-01 at 16.21.35.jpeg",
  },
  {
    category: "stainlessSteel",
    subcategory: "bathroomPartitions",
    folder: "23 DIVISIONES INOXIDABLES",
    file: "_DSC0179.jpg",
  },
  {
    category: "stainlessSteel",
    categoryOnly: true,
    folder: "20 PASAMANOS EN ACERO INOX",
    file: "20150904_161619.jpg",
  },
];

const PAGES_MAP = [
  {
    dest: path.join(root, "public", "images", "pages", "products.jpg"),
    folder: "FOTOS INICIO DE PRODUCTOS",
    file: "20.jpg",
  },
];

function findFolder(contains) {
  const dirs = fs.readdirSync(photosBase, { withFileTypes: true });
  const match = dirs.find(
    (d) => d.isDirectory() && d.name.toLowerCase().includes(contains.toLowerCase()),
  );
  if (!match) return null;
  return path.join(photosBase, match.name);
}

function resolveSource(folderKey, fileName) {
  const folder = findFolder(folderKey);
  if (!folder) return null;

  const files = fs.readdirSync(folder);
  const exact = files.find(
    (f) => f.toLowerCase() === fileName.toLowerCase(),
  );
  if (exact && !isBlockedImageFile(exact)) {
    return path.join(folder, exact);
  }

  const partial = files.find(
    (f) =>
      f.toLowerCase().includes(fileName.toLowerCase()) &&
      !isBlockedImageFile(f) &&
      /\.(jpe?g|png|webp|avif)$/i.test(f),
  );
  if (partial) return path.join(folder, partial);

  return null;
}

function extOf(filePath) {
  return path.extname(filePath).toLowerCase() || ".jpg";
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyTo(src, destPath) {
  ensureDir(path.dirname(destPath));
  fs.copyFileSync(src, destPath);
  return destPath.replace(path.join(root, "public"), "").replace(/\\/g, "/");
}

const categories = {};
const subcategories = {};
let copied = 0;
let skipped = 0;

for (const entry of MAP) {
  const src = resolveSource(entry.folder, entry.file);
  if (!src) {
    console.warn("SKIP (no encontrado):", entry.category, entry.subcategory ?? "category", entry.file);
    skipped += 1;
    continue;
  }

  const ext = extOf(src);
  let destPath;
  let publicPath;

  if (entry.categoryOnly) {
    destPath = path.join(destBase, `${entry.category}${ext}`);
    publicPath = copyTo(src, destPath);
    categories[entry.category] = publicPath;
  } else {
    destPath = path.join(destBase, entry.category, `${entry.subcategory}${ext}`);
    publicPath = copyTo(src, destPath);
    if (!subcategories[entry.category]) subcategories[entry.category] = {};
    subcategories[entry.category][entry.subcategory] = publicPath;
  }

  console.log("OK:", publicPath, "←", path.basename(src));
  copied += 1;
}

for (const page of PAGES_MAP) {
  const src = resolveSource(page.folder, page.file);
  if (src) {
    const ext = extOf(src);
    const dest = page.dest.replace(/\.[^.]+$/, ext);
    const publicPath = copyTo(src, dest);
    console.log("PAGE:", publicPath);
    copied += 1;
  }
}

const { galleries, productCount, projectCount } = buildProductGalleries({
  photosBase,
  projectsBase,
  destBase,
  map: MAP,
});

const manifest = { categories, subcategories, galleries };
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(`\nImportadas: ${copied} | Omitidas: ${skipped}`);
console.log(`Galería productos: ${productCount} | Galería proyectos: ${projectCount}`);
console.log("Manifest:", manifestPath);
