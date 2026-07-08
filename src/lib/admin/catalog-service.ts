import "server-only";

import fs from "node:fs";
import path from "node:path";
import taxonomy from "@/lib/catalog/taxonomy.json";
import { isDatabaseEnabled, query } from "@/lib/db/pool";
import { MANIFEST_PATHS, readJsonFile } from "./manifests";

const root = process.cwd();
const CATALOG_ES = path.join(root, "messages/products-catalog/es.json");
const CATALOG_EN = path.join(root, "messages/products-catalog/en.json");

type CatalogFile = {
  categories: Record<string, { title: string; description: string }>;
  subcategories: Record<string, Record<string, { title: string; description: string }>>;
};

export type CatalogSubcategoryItem = {
  key: string;
  categoryKey: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  imageCount: number;
  heroSrc: string | null;
};

export type CatalogCategoryItem = {
  key: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  imageCount: number;
  heroSrc: string | null;
  subcategories: CatalogSubcategoryItem[];
};

function readCatalog(locale: "es" | "en"): CatalogFile {
  const filePath = locale === "es" ? CATALOG_ES : CATALOG_EN;
  return readJsonFile<CatalogFile>(filePath);
}

function writeCatalog(locale: "es" | "en", data: CatalogFile): void {
  const filePath = locale === "es" ? CATALOG_ES : CATALOG_EN;
  const existing = readJsonFile<Record<string, unknown>>(filePath);
  fs.writeFileSync(
    filePath,
    `${JSON.stringify({ ...existing, categories: data.categories, subcategories: data.subcategories }, null, 2)}\n`,
    "utf8",
  );
}

async function loadImageCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  if (isDatabaseEnabled()) {
    const { rows } = await query<{ category: string; subcategory: string; count: string }>(
      `SELECT category, subcategory, COUNT(*)::text AS count
       FROM product_gallery_images GROUP BY category, subcategory`,
    );
    for (const row of rows) {
      counts.set(`${row.category}/${row.subcategory}`, Number.parseInt(row.count, 10));
    }
    return counts;
  }

  const products = readJsonFile<{
    galleries?: Record<string, Record<string, unknown[]>>;
  }>(MANIFEST_PATHS.products);

  for (const [category, subs] of Object.entries(products.galleries ?? {})) {
    for (const [subcategory, images] of Object.entries(subs)) {
      counts.set(`${category}/${subcategory}`, images.length);
    }
  }
  return counts;
}

function loadHeroImages(): {
  categories: Record<string, string>;
  subcategories: Record<string, Record<string, string>>;
} {
  const products = readJsonFile<{
    categories?: Record<string, string>;
    subcategories?: Record<string, Record<string, string>>;
  }>(MANIFEST_PATHS.products);
  return {
    categories: products.categories ?? {},
    subcategories: products.subcategories ?? {},
  };
}

export async function listCatalogTree(): Promise<CatalogCategoryItem[]> {
  const es = readCatalog("es");
  const en = readCatalog("en");
  const imageCounts = await loadImageCounts();
  const heroes = loadHeroImages();

  return Object.entries(taxonomy).map(([categoryKey, subs]) => {
    const subcategoryKeys = subs as string[];
    const subcategories: CatalogSubcategoryItem[] = subcategoryKeys.map((subKey) => ({
      key: subKey,
      categoryKey,
      titleEs: es.subcategories[categoryKey]?.[subKey]?.title ?? subKey,
      titleEn: en.subcategories[categoryKey]?.[subKey]?.title ?? subKey,
      descriptionEs: es.subcategories[categoryKey]?.[subKey]?.description ?? "",
      descriptionEn: en.subcategories[categoryKey]?.[subKey]?.description ?? "",
      imageCount: imageCounts.get(`${categoryKey}/${subKey}`) ?? 0,
      heroSrc: heroes.subcategories[categoryKey]?.[subKey] ?? null,
    }));

    const categoryImageCount = subcategories.reduce((sum, sub) => sum + sub.imageCount, 0);

    return {
      key: categoryKey,
      titleEs: es.categories[categoryKey]?.title ?? categoryKey,
      titleEn: en.categories[categoryKey]?.title ?? categoryKey,
      descriptionEs: es.categories[categoryKey]?.description ?? "",
      descriptionEn: en.categories[categoryKey]?.description ?? "",
      imageCount: categoryImageCount,
      heroSrc: heroes.categories[categoryKey] ?? null,
      subcategories,
    };
  });
}

export async function updateCatalogEntry(patch: {
  type: "category" | "subcategory";
  categoryKey: string;
  subcategoryKey?: string;
  titleEs?: string;
  titleEn?: string;
  descriptionEs?: string;
  descriptionEn?: string;
}): Promise<void> {
  const es = readCatalog("es");
  const en = readCatalog("en");

  if (patch.type === "category") {
    es.categories[patch.categoryKey] ??= { title: "", description: "" };
    en.categories[patch.categoryKey] ??= { title: "", description: "" };
    if (patch.titleEs != null) es.categories[patch.categoryKey].title = patch.titleEs.trim();
    if (patch.titleEn != null) en.categories[patch.categoryKey].title = patch.titleEn.trim();
    if (patch.descriptionEs != null) {
      es.categories[patch.categoryKey].description = patch.descriptionEs.trim();
    }
    if (patch.descriptionEn != null) {
      en.categories[patch.categoryKey].description = patch.descriptionEn.trim();
    }
  } else {
    if (!patch.subcategoryKey) throw new Error("Subcategoría requerida.");
    es.subcategories[patch.categoryKey] ??= {};
    en.subcategories[patch.categoryKey] ??= {};
    es.subcategories[patch.categoryKey][patch.subcategoryKey] ??= { title: "", description: "" };
    en.subcategories[patch.categoryKey][patch.subcategoryKey] ??= { title: "", description: "" };

    const esSub = es.subcategories[patch.categoryKey][patch.subcategoryKey];
    const enSub = en.subcategories[patch.categoryKey][patch.subcategoryKey];

    if (patch.titleEs != null) esSub.title = patch.titleEs.trim();
    if (patch.titleEn != null) enSub.title = patch.titleEn.trim();
    if (patch.descriptionEs != null) esSub.description = patch.descriptionEs.trim();
    if (patch.descriptionEn != null) enSub.description = patch.descriptionEn.trim();
  }

  writeCatalog("es", es);
  writeCatalog("en", en);
}

export function listProjectCategoryOptions(): { value: string; label: string }[] {
  const es = readCatalog("es");
  return Object.keys(taxonomy).map((key) => ({
    value: key,
    label: es.categories[key]?.title ?? key,
  }));
}
