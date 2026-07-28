/**
 * Falla si falta alguna clave i18n del hub de productos usada en el codigo.
 * Uso: node scripts/validate-catalog-hub-keys.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

/** Keys relativas a `productsCatalog.hub` usadas por page + ProductCatalogExplorer + cards. */
const HUB_KEYS_USED = [
  "title",
  "subtitle",
  "viewCategory",
  "viewDetail",
  "categoriesNav",
  "allProducts",
  "backToProducts",
  "benefits.quality.title",
  "benefits.quality.body",
  "benefits.precision.title",
  "benefits.precision.body",
  "benefits.efficiency.title",
  "benefits.efficiency.body",
];

function getAt(obj, dotted) {
  return dotted.split(".").reduce((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return acc[key];
  }, obj);
}

function mergeCatalogMessages(defaults, override) {
  const result = { ...defaults };
  for (const [key, value] of Object.entries(override ?? {})) {
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

function loadJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function assertHub(locale, hub) {
  const missing = [];
  for (const key of HUB_KEYS_USED) {
    const value = getAt(hub, key);
    if (typeof value !== "string" || value.trim() === "") {
      missing.push(`productsCatalog.hub.${key}`);
    }
  }
  if (missing.length) {
    console.error(`[${locale}] Faltan keys del hub:`);
    for (const key of missing) console.error(`  - ${key}`);
    return false;
  }
  console.log(
    `[${locale}] OK hub (${HUB_KEYS_USED.length} keys). allProducts="${hub.allProducts}"`,
  );
  return true;
}

function main() {
  let ok = true;

  for (const locale of ["es", "en"]) {
    const bundled = loadJson(`messages/products-catalog/${locale}.json`);
    if (!assertHub(locale, bundled.hub ?? {})) ok = false;

    const staleDb = {
      hub: {
        title: bundled.hub?.title ?? "",
        subtitle: bundled.hub?.subtitle ?? "",
        viewCategory: bundled.hub?.viewCategory ?? "",
        viewDetail: bundled.hub?.viewDetail ?? "",
      },
    };
    const merged = mergeCatalogMessages(bundled, staleDb);
    if (!assertHub(`${locale}+merge`, merged.hub ?? {})) ok = false;
  }

  for (const locale of ["es", "en"]) {
    const hub = loadJson(`messages/products-catalog/${locale}.json`).hub ?? {};
    if (Object.prototype.hasOwnProperty.call(hub, "allProductos")) {
      console.error(`[${locale}] Typo allProductos presente; usar allProducts.`);
      ok = false;
    }
  }

  if (!ok) process.exit(1);
  console.log("validate-catalog-hub-keys: OK");
}

main();