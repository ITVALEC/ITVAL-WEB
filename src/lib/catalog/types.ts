import taxonomy from "./taxonomy.json";

export const PRODUCT_KEYS = Object.keys(taxonomy) as ProductKey[];

export type ProductKey = keyof typeof taxonomy;

export type ProductCatalog = typeof taxonomy;

export type ProductSubcategory<K extends ProductKey> =
  ProductCatalog[K][number];

export const PRODUCT_CATALOG: ProductCatalog = taxonomy;
