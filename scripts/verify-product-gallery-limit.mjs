/**
 * Verifica que dumps históricos no bloqueen el límite de 6 fotos de producto
 * y que un upload admin (timestamp) sí cuente como product.
 * Lógica espejo de src/lib/catalog/product-images.ts (sin importar el módulo TS).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX_PRODUCT_GALLERY_IMAGES = 6;
const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function isProjectReferenceSrc(src) {
  const normalized = src.replace(/\\/g, "/").toLowerCase();
  return (
    normalized.includes("/gallery/") &&
    (normalized.includes("/projects/") || normalized.includes("/project/"))
  );
}

function isAdminProductUploadSrc(src) {
  const normalized = src.replace(/\\/g, "/");
  return /\/gallery\/[^/]+\/[^/]+\/[^/]+-\d{13}\.[a-z0-9]+$/i.test(normalized);
}

function normalizeProductGalleryList(images) {
  const pathProjectCount = images.filter(
    (image) => isProjectReferenceSrc(image.src) || image.source === "project",
  ).length;
  const adminProductCount = images.filter((image) =>
    isAdminProductUploadSrc(image.src),
  ).length;
  const nonAdminCount = images.length - adminProductCount;
  const legacyDumpAsProject =
    nonAdminCount >= MAX_PRODUCT_GALLERY_IMAGES ||
    (pathProjectCount >= 10 && nonAdminCount > 0);

  return images.map((image) => {
    if (isProjectReferenceSrc(image.src) || image.source === "project") {
      return { ...image, source: "project" };
    }
    if (isAdminProductUploadSrc(image.src)) {
      return { ...image, source: "product", caption: "" };
    }
    if (legacyDumpAsProject) {
      return { ...image, source: "project" };
    }
    return { ...image, source: "product", caption: "" };
  });
}

const data = JSON.parse(
  fs.readFileSync(path.join(repo, "src/lib/catalog/product-images.json"), "utf8"),
);

let blocked = 0;
let free = 0;

for (const cat of Object.keys(data.galleries ?? {})) {
  for (const sub of Object.keys(data.galleries[cat] ?? {})) {
    const raw = data.galleries[cat][sub];
    const poisoned = raw.map((img) => ({
      ...img,
      source: img.source === "project" ? "project" : "product",
    }));
    const productCount = normalizeProductGalleryList(poisoned).filter(
      (img) => img.source === "product",
    ).length;
    if (productCount >= MAX_PRODUCT_GALLERY_IMAGES) blocked += 1;
    else free += 1;
  }
}

const stamp = Date.now();
const adminSrc = `/images/products/gallery/coversExteriors/pergolas/angulo-${stamp}.jpg`;
if (!isAdminProductUploadSrc(adminSrc)) {
  console.error("FAIL: isAdminProductUploadSrc no reconoce upload admin");
  process.exit(1);
}

const pergolas = (data.galleries?.coversExteriors?.pergolas ?? []).map((img) => ({
  ...img,
  source: "product",
}));
const before = normalizeProductGalleryList(pergolas).filter(
  (img) => img.source === "product",
).length;
const after = normalizeProductGalleryList([
  ...pergolas,
  { src: adminSrc, caption: "", source: "product" },
]).filter((img) => img.source === "product").length;

console.log(
  JSON.stringify(
    {
      blockedAtLimit: blocked,
      freeSlots: free,
      pergolasProductBefore: before,
      pergolasProductAfterAdminUpload: after,
      canAddToPergolas: before < MAX_PRODUCT_GALLERY_IMAGES,
    },
    null,
    2,
  ),
);

if (blocked > 0) {
  console.error("FAIL: aún hay productos bloqueados por dumps históricos");
  process.exit(1);
}
if (before !== 0 || after !== 1) {
  console.error("FAIL: conteo de upload admin incorrecto", { before, after });
  process.exit(1);
}

console.log("OK: límite 6 solo cuenta fotos product reales; upload admin suma 1.");
