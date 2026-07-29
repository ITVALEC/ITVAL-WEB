import "server-only";

import { isDatabaseEnabled, query } from "@/lib/db/pool";
import {
  catalogContentKey,
  getDocument,
  setDocument,
} from "@/lib/db/documents";
import {
  APPLICATION_KEYS,
  MATERIAL_KEYS,
  PRIMARY_GROUPS,
  SECTOR_KEYS,
  SYSTEM_KEYS,
} from "@/lib/catalog/filter-keys";
import { applyCatalogLabelMigrations } from "@/lib/catalog/migrate-catalog-labels";
import { mergeCatalogMessages } from "@/lib/catalog/merge-messages";
import { fillEnglishFromSpanish } from "@/lib/i18n/translate-es-to-en";
import esCatalogDefaults from "../../../messages/products-catalog/es.json";
import enCatalogDefaults from "../../../messages/products-catalog/en.json";

export type CatalogTranslationMeta = {
  warnings: string[];
  provider: string | null;
  translatedCount: number;
};

const PLACEHOLDER_IMAGE = "/images/pages/products.svg";

type Taxonomy = Record<string, string[]>;

type SubcategoryContent = {
  title: string;
  description: string;
  applications: { i1: string; i2: string; i3: string };
  benefits: { i1: string; i2: string; i3: string };
  materials: string;
  standards: string;
  options: string;
};

export type CatalogFilterSelection = {
  primaryGroup: string;
  sectors: string[];
  materials: string[];
  systems: string[];
  applications: string[];
};

type FilterConfigEntry = Partial<CatalogFilterSelection> & { tags?: string[] };

type FilterConfigFile = {
  categories: Record<string, FilterConfigEntry>;
  subcategories: Record<string, Record<string, FilterConfigEntry>>;
};

const DEFAULT_FILTERS: CatalogFilterSelection = {
  primaryGroup: "other",
  sectors: ["corporate", "commercial", "institutional"],
  materials: ["aluminum", "temperedGlass", "laminatedGlass"],
  systems: ["structural"],
  applications: ["facade"],
};

async function readFilterConfig(): Promise<FilterConfigFile> {
  const data = await getDocument<Partial<FilterConfigFile>>("filterConfig");
  return {
    categories: data.categories ?? {},
    subcategories: data.subcategories ?? {},
  };
}

async function writeFilterConfig(data: FilterConfigFile): Promise<void> {
  await setDocument("filterConfig", data);
}

function keepKnown(values: string[] | undefined, known: readonly string[]): string[] | undefined {
  if (!values) return undefined;
  const valid = values.filter((value) => known.includes(value));
  return valid.length > 0 ? valid : undefined;
}

function resolveFilters(
  base: FilterConfigEntry | undefined,
  override?: FilterConfigEntry,
): CatalogFilterSelection {
  const primaryCandidates = PRIMARY_GROUPS.filter((g) => g !== "all") as readonly string[];
  const pick = (value: string | undefined) =>
    value && primaryCandidates.includes(value) ? value : undefined;

  return {
    primaryGroup:
      pick(override?.primaryGroup) ?? pick(base?.primaryGroup) ?? DEFAULT_FILTERS.primaryGroup,
    sectors:
      keepKnown(override?.sectors, SECTOR_KEYS) ??
      keepKnown(base?.sectors, SECTOR_KEYS) ??
      DEFAULT_FILTERS.sectors,
    materials:
      keepKnown(override?.materials, MATERIAL_KEYS) ??
      keepKnown(base?.materials, MATERIAL_KEYS) ??
      DEFAULT_FILTERS.materials,
    systems:
      keepKnown(override?.systems, SYSTEM_KEYS) ??
      keepKnown(base?.systems, SYSTEM_KEYS) ??
      DEFAULT_FILTERS.systems,
    applications:
      keepKnown(override?.applications, APPLICATION_KEYS) ??
      keepKnown(base?.applications, APPLICATION_KEYS) ??
      DEFAULT_FILTERS.applications,
  };
}

export type CatalogFilterOptions = {
  primaryGroups: { value: string; label: string }[];
  sectors: { value: string; label: string }[];
  materials: { value: string; label: string }[];
  systems: { value: string; label: string }[];
  applications: { value: string; label: string }[];
};

/** Opciones de filtros con etiquetas en español, leídas del mismo i18n que ve el sitio. */
export async function listCatalogFilterOptions(): Promise<CatalogFilterOptions> {
  const full = await readFullCatalog("es");
  const explorer = (full.explorer ?? {}) as Record<string, Record<string, string>>;

  const withLabels = (
    keys: readonly string[],
    section: string,
  ): { value: string; label: string }[] =>
    keys.map((key) => ({ value: key, label: explorer[section]?.[key] ?? key }));

  return {
    primaryGroups: withLabels(
      PRIMARY_GROUPS.filter((g) => g !== "all"),
      "primary",
    ),
    sectors: withLabels(SECTOR_KEYS, "sectors"),
    materials: withLabels(MATERIAL_KEYS, "materials"),
    systems: withLabels(SYSTEM_KEYS, "systems"),
    applications: withLabels(APPLICATION_KEYS, "applications"),
  };
}

export async function updateCatalogFilters(patch: {
  type: "category" | "subcategory";
  categoryKey: string;
  subcategoryKey?: string;
  filters: Partial<CatalogFilterSelection>;
}): Promise<void> {
  const config = await readFilterConfig();
  const clean: FilterConfigEntry = {};

  const primaryCandidates = PRIMARY_GROUPS.filter((g) => g !== "all") as readonly string[];
  if (patch.filters.primaryGroup && primaryCandidates.includes(patch.filters.primaryGroup)) {
    clean.primaryGroup = patch.filters.primaryGroup;
  }
  const sectors = keepKnown(patch.filters.sectors, SECTOR_KEYS);
  const materials = keepKnown(patch.filters.materials, MATERIAL_KEYS);
  const systems = keepKnown(patch.filters.systems, SYSTEM_KEYS);
  const applications = keepKnown(patch.filters.applications, APPLICATION_KEYS);
  if (sectors) clean.sectors = sectors;
  if (materials) clean.materials = materials;
  if (systems) clean.systems = systems;
  if (applications) clean.applications = applications;

  if (patch.type === "category") {
    config.categories[patch.categoryKey] = {
      ...config.categories[patch.categoryKey],
      ...clean,
    };
  } else {
    if (!patch.subcategoryKey) throw new Error("Subcategoría requerida.");
    config.subcategories[patch.categoryKey] ??= {};
    config.subcategories[patch.categoryKey][patch.subcategoryKey] = {
      ...config.subcategories[patch.categoryKey][patch.subcategoryKey],
      ...clean,
    };
  }

  await writeFilterConfig(config);
}

async function readTaxonomy(): Promise<Taxonomy> {
  return getDocument<Taxonomy>("taxonomy");
}

async function writeTaxonomy(data: Taxonomy): Promise<void> {
  await setDocument("taxonomy", data);
}

async function readFullCatalog(locale: "es" | "en"): Promise<Record<string, unknown>> {
  const data = await getDocument<Record<string, unknown>>(catalogContentKey(locale));
  const defaults = (
    locale === "en" ? enCatalogDefaults : esCatalogDefaults
  ) as Record<string, unknown>;
  const merged = mergeCatalogMessages(defaults, data);
  if (applyCatalogLabelMigrations(locale, merged)) {
    await writeFullCatalog(locale, merged);
  }
  return merged;
}

async function writeFullCatalog(
  locale: "es" | "en",
  data: Record<string, unknown>,
): Promise<void> {
  await setDocument(catalogContentKey(locale), data);
}

type ProductImagesFile = {
  categories?: Record<string, string>;
  subcategories?: Record<string, Record<string, string>>;
  galleries?: Record<string, Record<string, unknown[]>>;
};

async function updateProductImages(
  categoryKey: string,
  subcategoryKey?: string,
): Promise<void> {
  const products = await getDocument<ProductImagesFile>("productImages");

  products.categories ??= {};
  products.subcategories ??= {};
  products.galleries ??= {};

  if (!products.categories[categoryKey]) {
    products.categories[categoryKey] = PLACEHOLDER_IMAGE;
  }

  if (subcategoryKey) {
    products.subcategories[categoryKey] ??= {};
    products.galleries[categoryKey] ??= {};
    if (!products.subcategories[categoryKey][subcategoryKey]) {
      products.subcategories[categoryKey][subcategoryKey] = PLACEHOLDER_IMAGE;
    }
    products.galleries[categoryKey][subcategoryKey] ??= [];
  }

  await setDocument("productImages", products);
}

export function suggestCatalogKey(label: string): string {
  const words = label
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9\s]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "nuevaCategoria";

  const key = words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");

  return key.replace(/[^a-zA-Z0-9]/g, "").slice(0, 40) || "nuevaCategoria";
}

function validateKey(key: string): void {
  if (!/^[a-z][a-zA-Z0-9]*$/.test(key)) {
    throw new Error(
      "El código debe empezar en minúscula y usar solo letras y números (ej: nuevaLinea).",
    );
  }
}

function buildSubcategoryContent(
  title: string,
  description: string,
  locale: "es" | "en",
): SubcategoryContent {
  if (locale === "en") {
    return {
      title,
      description:
        description ||
        `${title}: ITVAL aluminum and glass solution with engineering, fabrication and certified installation.`,
      applications: {
        i1: "Corporate and commercial buildings",
        i2: "Institutional projects",
        i3: "Premium developments",
      },
      benefits: {
        i1: "Proven technical performance and durability",
        i2: "Architectural aesthetics and brand value",
        i3: "End-to-end support from quote to installation",
      },
      materials: "Aluminum, laminated/tempered glass, steel and hardware per specification.",
      standards: "NEC, ASTM, ASCE, AISC, AISI, Aluminum Design Manual.",
      options: "Custom finishes, dimensions and glass configurations per project.",
    };
  }

  return {
    title,
    description:
      description ||
      `${title}: solución ITVAL en aluminio y vidrio con ingeniería, fabricación e instalación certificada.`,
    applications: {
      i1: "Edificios corporativos y comerciales",
      i2: "Proyectos institucionales",
      i3: "Desarrollos residenciales premium",
    },
    benefits: {
      i1: "Desempeño técnico y durabilidad comprobada",
      i2: "Estética arquitectónica y valor de marca",
      i3: "Acompañamiento integral desde cotización a instalación",
    },
    materials: "Aluminio, vidrio laminado/templado, acero y herrajes según especificación.",
    standards: "NEC, ASTM, ASCE, AISC, AISI, Aluminum Design Manual.",
    options: "Acabados, dimensiones y configuraciones personalizadas según proyecto.",
  };
}

type CatalogSubcategoryRecord = {
  title: string;
  description: string;
  applications?: { i1: string; i2: string; i3: string };
  benefits?: { i1: string; i2: string; i3: string };
  materials?: string;
  standards?: string;
  options?: string;
};

export type CatalogSubcategoryItem = {
  key: string;
  categoryKey: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  materialsEs: string;
  materialsEn: string;
  standardsEs: string;
  standardsEn: string;
  optionsEs: string;
  optionsEn: string;
  imageCount: number;
  heroSrc: string | null;
  filters: CatalogFilterSelection;
};

export type CatalogCategoryItem = {
  key: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  imageCount: number;
  heroSrc: string | null;
  filters: CatalogFilterSelection;
  subcategories: CatalogSubcategoryItem[];
};

async function readCatalog(locale: "es" | "en"): Promise<{
  categories: Record<string, { title: string; description: string }>;
  subcategories: Record<string, Record<string, CatalogSubcategoryRecord>>;
}> {
  const full = await readFullCatalog(locale);
  return {
    categories: (full.categories ?? {}) as Record<string, { title: string; description: string }>,
    subcategories: (full.subcategories ?? {}) as Record<
      string,
      Record<string, CatalogSubcategoryRecord>
    >,
  };
}

async function writeCatalog(
  locale: "es" | "en",
  data: {
    categories: Record<string, { title: string; description: string }>;
    subcategories: Record<string, Record<string, CatalogSubcategoryRecord>>;
  },
): Promise<void> {
  const existing = await readFullCatalog(locale);
  await writeFullCatalog(locale, {
    ...existing,
    categories: data.categories,
    subcategories: {
      ...(existing.subcategories as Record<string, unknown>),
      ...data.subcategories,
    },
  });
}

async function loadImageCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  if (isDatabaseEnabled()) {
    const { rows } = await query<{ category: string; subcategory: string; count: string }>(
      `SELECT category, subcategory, COUNT(*)::text AS count
       FROM product_gallery_images
       WHERE source = 'product'
         AND src NOT ILIKE '%/projects/%'
         AND src NOT ILIKE '%/project/%'
         AND src ~ '/gallery/[^/]+/[^/]+/[^/]+-[0-9]{13}\\.[a-zA-Z0-9]+$'
       GROUP BY category, subcategory`,
    );
    // Conteos por SQL estricto (solo uploads admin). Si hay filas product legacy
    // sin timestamp, caemos al normalize del manifiesto / filas completas abajo.
    const strict = new Map<string, number>();
    for (const row of rows) {
      strict.set(`${row.category}/${row.subcategory}`, Number.parseInt(row.count, 10));
    }

    const { rows: allRows } = await query<{
      category: string;
      subcategory: string;
      src: string;
      caption: string;
      source: string | null;
    }>(
      `SELECT category, subcategory, src, caption, source
       FROM product_gallery_images
       ORDER BY category, subcategory, sort_order`,
    );

    if (allRows.length > 0) {
      const { normalizeProductGalleryList, isCatalogPlaceholderSrc } = await import("@/lib/catalog/product-images");
      const bySub = new Map<
        string,
        { src: string; caption: string; source?: "product" | "project" }[]
      >();
      for (const row of allRows) {
        const key = `${row.category}/${row.subcategory}`;
        const bucket = bySub.get(key) ?? [];
        bucket.push({
          src: row.src,
          caption: row.caption ?? "",
          source:
            row.source === "product" || row.source === "project"
              ? row.source
              : undefined,
        });
        bySub.set(key, bucket);
      }
      for (const [key, images] of bySub) {
        const productOnly = normalizeProductGalleryList(images).filter(
          (image) =>
            image.source === "product" && !isCatalogPlaceholderSrc(image.src),
        );
        counts.set(key, productOnly.length);
      }
      return counts;
    }

    if (strict.size > 0) return strict;
  }

  const products = await getDocument<ProductImagesFile>("productImages");
  const { normalizeProductGalleryList, isCatalogPlaceholderSrc } = await import("@/lib/catalog/product-images");

  for (const [category, subs] of Object.entries(products.galleries ?? {})) {
    for (const [subcategory, images] of Object.entries(subs)) {
      const list = Array.isArray(images) ? images : [];
      const mapped: {
        src: string;
        caption: string;
        source?: "product" | "project";
      }[] = [];
      for (const image of list) {
        const row = image as { src?: string; caption?: string; source?: string };
        if (typeof row.src !== "string" || !row.src) continue;
        mapped.push({
          src: row.src,
          caption: typeof row.caption === "string" ? row.caption : "",
          source:
            row.source === "product" || row.source === "project"
              ? row.source
              : undefined,
        });
      }
      const productOnly = normalizeProductGalleryList(mapped).filter(
        (image) =>
          image.source === "product" && !isCatalogPlaceholderSrc(image.src),
      );
      counts.set(`${category}/${subcategory}`, productOnly.length);
    }
  }
  return counts;
}

async function loadHeroImages(): Promise<{
  categories: Record<string, string>;
  subcategories: Record<string, Record<string, string>>;
}> {
  const products = await getDocument<ProductImagesFile>("productImages");
  return {
    categories: products.categories ?? {},
    subcategories: products.subcategories ?? {},
  };
}

export async function listCatalogTree(): Promise<CatalogCategoryItem[]> {
  const [es, en, imageCounts, heroes, tax, filterConfig] = await Promise.all([
    readCatalog("es"),
    readCatalog("en"),
    loadImageCounts(),
    loadHeroImages(),
    readTaxonomy(),
    readFilterConfig(),
  ]);

  return Object.entries(tax).map(([categoryKey, subs]) => {
    const subcategoryKeys = subs as string[];
    const categoryFilters = filterConfig.categories[categoryKey];
    const subcategories: CatalogSubcategoryItem[] = subcategoryKeys.map((subKey) => {
      const esSub = es.subcategories[categoryKey]?.[subKey];
      const enSub = en.subcategories[categoryKey]?.[subKey];
      return {
        key: subKey,
        categoryKey,
        titleEs: esSub?.title ?? subKey,
        titleEn: enSub?.title ?? subKey,
        descriptionEs: esSub?.description ?? "",
        descriptionEn: enSub?.description ?? "",
        materialsEs: esSub?.materials ?? "",
        materialsEn: enSub?.materials ?? "",
        standardsEs: esSub?.standards ?? "",
        standardsEn: enSub?.standards ?? "",
        optionsEs: esSub?.options ?? "",
        optionsEn: enSub?.options ?? "",
        imageCount: imageCounts.get(`${categoryKey}/${subKey}`) ?? 0,
        heroSrc: heroes.subcategories[categoryKey]?.[subKey] ?? null,
        filters: resolveFilters(
          categoryFilters,
          filterConfig.subcategories[categoryKey]?.[subKey],
        ),
      };
    });

    const categoryImageCount = subcategories.reduce((sum, sub) => sum + sub.imageCount, 0);

    return {
      key: categoryKey,
      titleEs: es.categories[categoryKey]?.title ?? categoryKey,
      titleEn: en.categories[categoryKey]?.title ?? categoryKey,
      descriptionEs: es.categories[categoryKey]?.description ?? "",
      descriptionEn: en.categories[categoryKey]?.description ?? "",
      imageCount: categoryImageCount,
      heroSrc: heroes.categories[categoryKey] ?? null,
      filters: resolveFilters(categoryFilters),
      subcategories,
    };
  });
}

function applySubcategoryTextFields(
  sub: CatalogSubcategoryRecord,
  patch: {
    title?: string;
    description?: string;
    materials?: string;
    standards?: string;
    options?: string;
  },
): void {
  if (patch.title != null) sub.title = patch.title.trim();
  if (patch.description != null) sub.description = patch.description.trim();
  if (patch.materials != null) sub.materials = patch.materials.trim();
  if (patch.standards != null) sub.standards = patch.standards.trim();
  if (patch.options != null) sub.options = patch.options.trim();
}

export async function updateCatalogEntry(patch: {
  type: "category" | "subcategory";
  categoryKey: string;
  subcategoryKey?: string;
  titleEs?: string;
  descriptionEs?: string;
  materialsEs?: string;
  standardsEs?: string;
  optionsEs?: string;
}): Promise<CatalogTranslationMeta> {
  const es = await readCatalog("es");
  const en = await readCatalog("en");

  if (patch.type === "category") {
    es.categories[patch.categoryKey] ??= { title: "", description: "" };
    en.categories[patch.categoryKey] ??= { title: "", description: "" };
    const prevEs = es.categories[patch.categoryKey];
    const prevEn = en.categories[patch.categoryKey];

    const nextTitleEs =
      patch.titleEs != null ? patch.titleEs.trim() || prevEs.title : prevEs.title;
    const nextDescEs =
      patch.descriptionEs != null ? patch.descriptionEs.trim() : prevEs.description;

    const translated = await fillEnglishFromSpanish({
      title: { es: nextTitleEs, previousEs: prevEs.title, previousEn: prevEn.title },
      description: {
        es: nextDescEs,
        previousEs: prevEs.description,
        previousEn: prevEn.description,
      },
    });

    es.categories[patch.categoryKey].title = nextTitleEs;
    es.categories[patch.categoryKey].description = nextDescEs;
    en.categories[patch.categoryKey].title = translated.values.title ?? prevEn.title;
    en.categories[patch.categoryKey].description =
      translated.values.description ?? prevEn.description;

    await writeCatalog("es", es);
    await writeCatalog("en", en);
    return {
      warnings: translated.warnings,
      provider: translated.provider,
      translatedCount: translated.translatedCount,
    };
  }

  if (!patch.subcategoryKey) throw new Error("Subcategoría requerida.");
  es.subcategories[patch.categoryKey] ??= {};
  en.subcategories[patch.categoryKey] ??= {};
  es.subcategories[patch.categoryKey][patch.subcategoryKey] ??= {
    title: "",
    description: "",
  };
  en.subcategories[patch.categoryKey][patch.subcategoryKey] ??= {
    title: "",
    description: "",
  };

  const prevEs = es.subcategories[patch.categoryKey][patch.subcategoryKey];
  const prevEn = en.subcategories[patch.categoryKey][patch.subcategoryKey];

  const nextTitleEs = patch.titleEs != null ? patch.titleEs.trim() || prevEs.title : prevEs.title;
  const nextDescEs =
    patch.descriptionEs != null ? patch.descriptionEs.trim() : prevEs.description;
  const nextMaterialsEs =
    patch.materialsEs != null ? patch.materialsEs.trim() : (prevEs.materials ?? "");
  const nextStandardsEs =
    patch.standardsEs != null ? patch.standardsEs.trim() : (prevEs.standards ?? "");
  const nextOptionsEs =
    patch.optionsEs != null ? patch.optionsEs.trim() : (prevEs.options ?? "");

  const translated = await fillEnglishFromSpanish({
    title: { es: nextTitleEs, previousEs: prevEs.title, previousEn: prevEn.title },
    description: {
      es: nextDescEs,
      previousEs: prevEs.description,
      previousEn: prevEn.description,
    },
    materials: {
      es: nextMaterialsEs,
      previousEs: prevEs.materials ?? "",
      previousEn: prevEn.materials ?? "",
    },
    standards: {
      es: nextStandardsEs,
      previousEs: prevEs.standards ?? "",
      previousEn: prevEn.standards ?? "",
    },
    options: {
      es: nextOptionsEs,
      previousEs: prevEs.options ?? "",
      previousEn: prevEn.options ?? "",
    },
  });

  applySubcategoryTextFields(prevEs, {
    title: nextTitleEs,
    description: nextDescEs,
    materials: nextMaterialsEs,
    standards: nextStandardsEs,
    options: nextOptionsEs,
  });
  applySubcategoryTextFields(prevEn, {
    title: translated.values.title,
    description: translated.values.description,
    materials: translated.values.materials,
    standards: translated.values.standards,
    options: translated.values.options,
  });

  await writeCatalog("es", es);
  await writeCatalog("en", en);
  return {
    warnings: translated.warnings,
    provider: translated.provider,
    translatedCount: translated.translatedCount,
  };
}

export type CatalogHubTexts = {
  titleEs: string;
  titleEn: string;
  subtitleEs: string;
  subtitleEn: string;
};

export async function getCatalogHub(): Promise<CatalogHubTexts> {
  const es = await readFullCatalog("es");
  const en = await readFullCatalog("en");
  const hubEs = (es.hub ?? {}) as { title?: string; subtitle?: string };
  const hubEn = (en.hub ?? {}) as { title?: string; subtitle?: string };
  return {
    titleEs: hubEs.title ?? "Productos",
    titleEn: hubEn.title ?? "Products",
    subtitleEs: hubEs.subtitle ?? "",
    subtitleEn: hubEn.subtitle ?? "",
  };
}

export async function updateCatalogHub(
  patch: Partial<Pick<CatalogHubTexts, "titleEs" | "subtitleEs">>,
): Promise<CatalogTranslationMeta> {
  const esFull = await readFullCatalog("es");
  const enFull = await readFullCatalog("en");
  const hubEs = {
    ...((esFull.hub ?? {}) as Record<string, unknown>),
  };
  const hubEn = {
    ...((enFull.hub ?? {}) as Record<string, unknown>),
  };

  const nextTitleEs =
    patch.titleEs != null ? patch.titleEs.trim() || String(hubEs.title ?? "") : String(hubEs.title ?? "");
  const nextSubtitleEs =
    patch.subtitleEs != null
      ? patch.subtitleEs.trim()
      : String(hubEs.subtitle ?? "");

  const translated = await fillEnglishFromSpanish({
    title: {
      es: nextTitleEs,
      previousEs: String(hubEs.title ?? ""),
      previousEn: String(hubEn.title ?? ""),
    },
    subtitle: {
      es: nextSubtitleEs,
      previousEs: String(hubEs.subtitle ?? ""),
      previousEn: String(hubEn.subtitle ?? ""),
    },
  });

  await writeFullCatalog("es", {
    ...esFull,
    hub: { ...hubEs, title: nextTitleEs, subtitle: nextSubtitleEs },
  });
  await writeFullCatalog("en", {
    ...enFull,
    hub: {
      ...hubEn,
      title: translated.values.title ?? hubEn.title ?? "",
      subtitle: translated.values.subtitle ?? hubEn.subtitle ?? "",
    },
  });

  return {
    warnings: translated.warnings,
    provider: translated.provider,
    translatedCount: translated.translatedCount,
  };
}

export type PrimaryGroupLabelItem = {
  key: string;
  labelEs: string;
  labelEn: string;
};

const PRIMARY_GROUP_KEYS = PRIMARY_GROUPS.filter((g) => g !== "all");

/** Nombres visibles de las líneas (Fachadas, Ventanas, Cubiertas, …). La clave interna no cambia. */
export async function getPrimaryGroupLabels(): Promise<PrimaryGroupLabelItem[]> {
  const [es, en] = await Promise.all([readFullCatalog("es"), readFullCatalog("en")]);
  const primaryEs =
    ((es.explorer as Record<string, unknown> | undefined)?.primary as Record<string, string>) ?? {};
  const primaryEn =
    ((en.explorer as Record<string, unknown> | undefined)?.primary as Record<string, string>) ?? {};

  return PRIMARY_GROUP_KEYS.map((key) => ({
    key,
    labelEs: primaryEs[key] ?? key,
    labelEn: primaryEn[key] ?? key,
  }));
}

export async function updatePrimaryGroupLabels(
  labels: { key: string; labelEs?: string }[],
): Promise<CatalogTranslationMeta> {
  const allowed = new Set<string>(PRIMARY_GROUP_KEYS);
  const byKey = new Map(
    labels.filter((row) => allowed.has(row.key)).map((row) => [row.key, row]),
  );
  if (byKey.size === 0) {
    return { warnings: [], provider: null, translatedCount: 0 };
  }

  const [esFull, enFull] = await Promise.all([readFullCatalog("es"), readFullCatalog("en")]);
  const explorerEs = {
    ...((esFull.explorer ?? {}) as Record<string, unknown>),
  };
  const explorerEn = {
    ...((enFull.explorer ?? {}) as Record<string, unknown>),
  };
  const primaryEs = {
    ...((explorerEs.primary ?? {}) as Record<string, string>),
  };
  const primaryEn = {
    ...((explorerEn.primary ?? {}) as Record<string, string>),
  };

  const fields: Record<string, { es: string; previousEs?: string; previousEn?: string }> = {};
  for (const [key, row] of byKey) {
    if (row.labelEs == null) continue;
    const nextEs = row.labelEs.trim();
    if (!nextEs) continue;
    fields[key] = {
      es: nextEs,
      previousEs: primaryEs[key] ?? "",
      previousEn: primaryEn[key] ?? "",
    };
    primaryEs[key] = nextEs;
  }

  const translated = await fillEnglishFromSpanish(fields);
  for (const key of Object.keys(fields)) {
    primaryEn[key] = translated.values[key] ?? primaryEn[key] ?? fields[key].es;
  }

  explorerEs.primary = primaryEs;
  explorerEn.primary = primaryEn;
  await writeFullCatalog("es", { ...esFull, explorer: explorerEs });
  await writeFullCatalog("en", { ...enFull, explorer: explorerEn });

  return {
    warnings: translated.warnings,
    provider: translated.provider,
    translatedCount: translated.translatedCount,
  };
}

export async function listProjectCategoryOptions(): Promise<{ value: string; label: string }[]> {
  const [es, tax] = await Promise.all([readCatalog("es"), readTaxonomy()]);
  return Object.keys(tax).map((key) => ({
    value: key,
    label: es.categories[key]?.title ?? key,
  }));
}

export async function addCategory(input: {
  key: string;
  titleEs: string;
  descriptionEs?: string;
  subcategoryKey: string;
  subTitleEs: string;
  subDescriptionEs?: string;
  primaryGroup?: string;
}): Promise<CatalogTranslationMeta> {
  const key = input.key.trim();
  validateKey(key);

  const tax = await readTaxonomy();
  if (tax[key]) throw new Error("Ya existe una categoría con ese código.");

  const subKey = input.subcategoryKey.trim();
  validateKey(subKey);

  const titleEs = input.titleEs.trim();
  const descriptionEs = (input.descriptionEs ?? "").trim();
  const subTitleEs = input.subTitleEs.trim();
  const subDescriptionEs = (input.subDescriptionEs ?? "").trim();

  const translated = await fillEnglishFromSpanish({
    title: { es: titleEs },
    description: { es: descriptionEs },
    subTitle: { es: subTitleEs },
    subDescription: { es: subDescriptionEs },
  });

  tax[key] = [subKey];
  await writeTaxonomy(tax);

  const titleEn = translated.values.title || titleEs;
  const descriptionEn = translated.values.description || descriptionEs;
  const subTitleEn = translated.values.subTitle || subTitleEs;
  const subDescriptionEn = translated.values.subDescription || subDescriptionEs;

  for (const locale of ["es", "en"] as const) {
    const full = await readFullCatalog(locale);
    const categories = (full.categories ?? {}) as Record<string, { title: string; description: string }>;
    const subcategories = (full.subcategories ?? {}) as Record<string, Record<string, unknown>>;

    categories[key] = {
      title: locale === "es" ? titleEs : titleEn,
      description: locale === "es" ? descriptionEs : descriptionEn,
    };

    subcategories[key] ??= {};
    subcategories[key][subKey] = buildSubcategoryContent(
      locale === "es" ? subTitleEs : subTitleEn,
      locale === "es" ? subDescriptionEs : subDescriptionEn,
      locale,
    );

    await writeFullCatalog(locale, { ...full, categories, subcategories });
  }

  const filterConfig = await readFilterConfig();
  const primaryCandidates = PRIMARY_GROUPS.filter((g) => g !== "all") as readonly string[];
  filterConfig.categories[key] = {
    ...DEFAULT_FILTERS,
    primaryGroup:
      input.primaryGroup && primaryCandidates.includes(input.primaryGroup)
        ? input.primaryGroup
        : DEFAULT_FILTERS.primaryGroup,
  };
  await writeFilterConfig(filterConfig);

  await updateProductImages(key, subKey);

  return {
    warnings: translated.warnings,
    provider: translated.provider,
    translatedCount: translated.translatedCount,
  };
}

export async function addSubcategory(input: {
  categoryKey: string;
  key: string;
  titleEs: string;
  descriptionEs?: string;
}): Promise<CatalogTranslationMeta> {
  const categoryKey = input.categoryKey.trim();
  const subKey = input.key.trim();
  validateKey(subKey);

  const tax = await readTaxonomy();
  if (!tax[categoryKey]) throw new Error("Categoría no encontrada.");
  if (tax[categoryKey].includes(subKey)) throw new Error("Ya existe esa subcategoría.");

  const titleEs = input.titleEs.trim();
  const descriptionEs = (input.descriptionEs ?? "").trim();

  const translated = await fillEnglishFromSpanish({
    title: { es: titleEs },
    description: { es: descriptionEs },
  });

  tax[categoryKey] = [...tax[categoryKey], subKey];
  await writeTaxonomy(tax);

  const titleEn = translated.values.title || titleEs;
  const descriptionEn = translated.values.description || descriptionEs;

  for (const locale of ["es", "en"] as const) {
    const full = await readFullCatalog(locale);
    const subcategories = (full.subcategories ?? {}) as Record<string, Record<string, unknown>>;
    subcategories[categoryKey] ??= {};
    subcategories[categoryKey][subKey] = buildSubcategoryContent(
      locale === "es" ? titleEs : titleEn,
      locale === "es" ? descriptionEs : descriptionEn,
      locale,
    );
    await writeFullCatalog(locale, { ...full, subcategories });
  }

  await updateProductImages(categoryKey, subKey);

  return {
    warnings: translated.warnings,
    provider: translated.provider,
    translatedCount: translated.translatedCount,
  };
}
