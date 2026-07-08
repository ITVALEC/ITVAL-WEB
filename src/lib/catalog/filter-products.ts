import type { ProductIndexItem } from "@/components/catalog/use-product-catalog-data";
import type {
  ApplicationKey,
  MaterialKey,
  PrimaryGroup,
  SectorKey,
  SystemKey,
} from "./filter-keys";

export type ProductFilterState = {
  query: string;
  primary: PrimaryGroup;
  sector: SectorKey | "all";
  material: MaterialKey | "all";
  system: SystemKey | "all";
  application: ApplicationKey | "all";
};

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** Cada término de la búsqueda debe aparecer en el texto (AND). */
export function tokenizeSearchQuery(query: string): string[] {
  return normalizeSearchText(query)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

export function matchesSearchQuery(
  searchText: string,
  rawQuery: string,
): boolean {
  const tokens = tokenizeSearchQuery(rawQuery);
  if (tokens.length === 0) return true;

  const normalized = normalizeSearchText(searchText);
  return tokens.every((token) => normalized.includes(token));
}

export function matchesProductFilters(
  item: ProductIndexItem,
  filters: ProductFilterState,
): boolean {
  if (filters.primary !== "all" && item.meta.primaryGroup !== filters.primary) {
    return false;
  }

  if (
    filters.sector !== "all" &&
    !item.meta.sectors.includes(filters.sector)
  ) {
    return false;
  }

  if (
    filters.material !== "all" &&
    !item.meta.materials.includes(filters.material)
  ) {
    return false;
  }

  if (
    filters.system !== "all" &&
    !item.meta.systems.includes(filters.system)
  ) {
    return false;
  }

  if (
    filters.application !== "all" &&
    !item.meta.applications.includes(filters.application)
  ) {
    return false;
  }

  if (!matchesSearchQuery(item.searchText, filters.query)) {
    return false;
  }

  return true;
}

export function filterProductCatalog(
  items: readonly ProductIndexItem[],
  filters: ProductFilterState,
): ProductIndexItem[] {
  return items.filter((item) => matchesProductFilters(item, filters));
}

export function countByPrimaryGroup(
  items: readonly ProductIndexItem[],
): Record<Exclude<PrimaryGroup, "all">, number> {
  const counts = {
    facades: 0,
    windows: 0,
    doors: 0,
    security: 0,
    exteriors: 0,
    interiors: 0,
    steel: 0,
  };

  for (const item of items) {
    counts[item.meta.primaryGroup] += 1;
  }

  return counts;
}
