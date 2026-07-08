import esCatalog from "../../../messages/products-catalog/es.json";
import enCatalog from "../../../messages/products-catalog/en.json";

export function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function getProductCategoryLabel(category: string): string {
  const title = (esCatalog as { categories?: Record<string, { title?: string }> }).categories?.[
    category
  ]?.title;
  return title ?? humanizeKey(category);
}

export function getSubcategoryLabel(_category: string, subcategory: string): string {
  const cats = (esCatalog as { subcategories?: Record<string, Record<string, { title?: string }>> })
    .subcategories;
  for (const subs of Object.values(cats ?? {})) {
    if (subs[subcategory]?.title) return subs[subcategory].title!;
  }
  return humanizeKey(subcategory);
}

export function getProductCategoryLabelEn(category: string): string {
  const title = (enCatalog as { categories?: Record<string, { title?: string }> }).categories?.[
    category
  ]?.title;
  return title ?? humanizeKey(category);
}

export function listProductTaxonomy(): {
  category: string;
  categoryLabel: string;
  subcategory: string;
  subcategoryLabel: string;
}[] {
  const subs = (esCatalog as { subcategories?: Record<string, Record<string, { title?: string }>> })
    .subcategories ?? {};
  const cats = (esCatalog as { categories?: Record<string, { title?: string }> }).categories ?? {};

  const items: {
    category: string;
    categoryLabel: string;
    subcategory: string;
    subcategoryLabel: string;
  }[] = [];

  for (const [category, subMap] of Object.entries(subs)) {
    for (const subcategory of Object.keys(subMap)) {
      items.push({
        category,
        categoryLabel: cats[category]?.title ?? humanizeKey(category),
        subcategory,
        subcategoryLabel: subMap[subcategory]?.title ?? humanizeKey(subcategory),
      });
    }
  }
  return items;
}
