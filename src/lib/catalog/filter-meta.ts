import { PRODUCT_CATALOG, PRODUCT_KEYS, type ProductKey } from "./types";
import filterConfig from "./filter-config.json";
import {
  APPLICATION_KEYS,
  MATERIAL_KEYS,
  PRIMARY_GROUPS,
  SECTOR_KEYS,
  SYSTEM_KEYS,
  type ApplicationKey,
  type MaterialKey,
  type PrimaryGroup,
  type SectorKey,
  type SystemKey,
} from "./filter-keys";

export type ProductFilterMeta = {
  primaryGroup: Exclude<PrimaryGroup, "all">;
  sectors: readonly SectorKey[];
  materials: readonly MaterialKey[];
  systems: readonly SystemKey[];
  applications: readonly ApplicationKey[];
  /** Tokens de búsqueda adicionales (minúsculas, sin acentos) */
  tags: readonly string[];
};

type CategoryFilterConfig = {
  primaryGroup?: string;
  sectors?: readonly string[];
  materials?: readonly string[];
  systems?: readonly string[];
  applications?: readonly string[];
};

type SubcategoryFilterConfig = CategoryFilterConfig & {
  tags?: readonly string[];
};

export type FilterConfigFile = {
  categories: Record<string, CategoryFilterConfig>;
  subcategories: Record<string, Record<string, SubcategoryFilterConfig>>;
};

const CONFIG = filterConfig as FilterConfigFile;

/** Filtros por defecto para categorías creadas desde el admin sin configuración propia. */
const DEFAULT_META: Omit<ProductFilterMeta, "tags"> = {
  primaryGroup: "other",
  sectors: ["corporate", "commercial", "institutional"],
  materials: ["aluminum", "temperedGlass", "laminatedGlass"],
  systems: ["structural"],
  applications: ["facade"],
};

function isKnownKey<T extends string>(
  keys: readonly T[],
  value: string,
): value is T {
  return (keys as readonly string[]).includes(value);
}

function sanitizeKeys<T extends string>(
  keys: readonly T[],
  values: readonly string[] | undefined,
): readonly T[] | undefined {
  if (!values) return undefined;
  const valid = values.filter((value): value is T => isKnownKey(keys, value));
  return valid.length > 0 ? valid : undefined;
}

function sanitizePrimaryGroup(
  value: string | undefined,
): Exclude<PrimaryGroup, "all"> | undefined {
  if (!value || value === "all") return undefined;
  return isKnownKey(PRIMARY_GROUPS, value)
    ? (value as Exclude<PrimaryGroup, "all">)
    : undefined;
}

export function getProductFilterMeta(
  category: ProductKey,
  subcategory: string,
  config: FilterConfigFile = CONFIG,
): ProductFilterMeta {
  const base = config.categories[category] ?? {};
  const override = config.subcategories[category]?.[subcategory] ?? {};

  return {
    primaryGroup:
      sanitizePrimaryGroup(override.primaryGroup) ??
      sanitizePrimaryGroup(base.primaryGroup) ??
      DEFAULT_META.primaryGroup,
    sectors:
      sanitizeKeys(SECTOR_KEYS, override.sectors) ??
      sanitizeKeys(SECTOR_KEYS, base.sectors) ??
      DEFAULT_META.sectors,
    materials:
      sanitizeKeys(MATERIAL_KEYS, override.materials) ??
      sanitizeKeys(MATERIAL_KEYS, base.materials) ??
      DEFAULT_META.materials,
    systems:
      sanitizeKeys(SYSTEM_KEYS, override.systems) ??
      sanitizeKeys(SYSTEM_KEYS, base.systems) ??
      DEFAULT_META.systems,
    applications:
      sanitizeKeys(APPLICATION_KEYS, override.applications) ??
      sanitizeKeys(APPLICATION_KEYS, base.applications) ??
      DEFAULT_META.applications,
    tags: override.tags ?? [],
  };
}

export function getPrimaryGroupForCategory(
  category: ProductKey,
  config: FilterConfigFile = CONFIG,
): Exclude<PrimaryGroup, "all"> {
  return (
    sanitizePrimaryGroup(config.categories[category]?.primaryGroup) ??
    DEFAULT_META.primaryGroup
  );
}

export const PRIMARY_GROUP_CATEGORIES: Record<
  Exclude<PrimaryGroup, "all">,
  readonly ProductKey[]
> = (() => {
  const map = Object.fromEntries(
    PRIMARY_GROUPS.filter((group) => group !== "all").map((group) => [
      group,
      [] as ProductKey[],
    ]),
  ) as Record<Exclude<PrimaryGroup, "all">, ProductKey[]>;

  for (const category of PRODUCT_KEYS) {
    map[getPrimaryGroupForCategory(category)].push(category);
  }

  return map;
})();

export function listAllProductEntries(): Array<{
  category: ProductKey;
  subcategory: string;
}> {
  return PRODUCT_KEYS.flatMap((category) =>
    PRODUCT_CATALOG[category].map((subcategory) => ({
      category,
      subcategory,
    })),
  );
}
