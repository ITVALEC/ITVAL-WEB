import { type ProductKey } from "./types";

export function getProductCategoryPath(category: ProductKey): string {
  return `/productos/${category}`;
}

export function getProductSubcategoryPath(
  category: ProductKey,
  subcategory: string,
): string {
  return `/productos/${category}/${subcategory}`;
}

export function getProjectPath(id: string): string {
  return `/proyectos/${id}`;
}
