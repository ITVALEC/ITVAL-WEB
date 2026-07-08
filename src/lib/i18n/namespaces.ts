/** Namespaces de next-intl — evita strings mágicos en componentes. */
export const CATALOG_NS = "productsCatalog" as const;

export function categoryNamespace() {
  return `${CATALOG_NS}.categories` as const;
}

export function subcategoryNamespace(category: string) {
  return `${CATALOG_NS}.subcategories.${category}` as const;
}
