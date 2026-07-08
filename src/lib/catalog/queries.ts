import {
  PORTFOLIO_PROJECTS,
  getPortfolioProjectById,
  isPortfolioProjectId,
  type PortfolioProject,
} from "./project-portfolio";
import {
  PRODUCT_CATALOG,
  PRODUCT_KEYS,
  type ProductKey,
} from "./types";
import { hasProductImage } from "./product-images";

export type Project = PortfolioProject;

export function getProductCategories(): readonly ProductKey[] {
  return PRODUCT_KEYS;
}

export function getProductSubcategories(
  category: ProductKey,
): readonly string[] {
  return PRODUCT_CATALOG[category];
}

export function getPublishedProductSubcategories(
  category: ProductKey,
): readonly string[] {
  return PRODUCT_CATALOG[category].filter((subcategory) =>
    hasProductImage(category, subcategory),
  );
}

export function listPublishedProductEntries(): Array<{
  category: ProductKey;
  subcategory: string;
}> {
  return PRODUCT_KEYS.flatMap((category) =>
    getPublishedProductSubcategories(category).map((subcategory) => ({
      category,
      subcategory,
    })),
  );
}

export function isProductCategory(value: string): value is ProductKey {
  return (PRODUCT_KEYS as readonly string[]).includes(value);
}

export function isProductSubcategory(
  category: ProductKey,
  subcategory: string,
): boolean {
  return (PRODUCT_CATALOG[category] as readonly string[]).includes(subcategory);
}

export function getAllProductStaticParams(): Array<{
  category: string;
  subcategory: string;
}> {
  return listPublishedProductEntries().map(({ category, subcategory }) => ({
    category,
    subcategory,
  }));
}

export function getProjectById(id: string): Project | undefined {
  return getPortfolioProjectById(id);
}

export function isProjectId(id: string): id is string {
  return isPortfolioProjectId(id);
}

export function getProjectsForProductSubcategory(
  subcategory: string,
): readonly Project[] {
  return PORTFOLIO_PROJECTS.filter(
    (project) => project.productSubcategory === subcategory,
  ).slice(0, 3);
}
