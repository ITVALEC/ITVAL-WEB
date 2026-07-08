import { getProjectsByFilters } from "../projects";
import { type ProjectSubcategory, PROJECT_SUBCATEGORIES } from "../content-keys";

export {
  PRODUCT_CATALOG,
  PRODUCT_KEYS,
  type ProductKey,
  type ProductSubcategory,
} from "./types";
export {
  getProductCategories,
  getProductSubcategories,
  getPublishedProductSubcategories,
  listPublishedProductEntries,
  isProductCategory,
  isProductSubcategory,
  getAllProductStaticParams,
  getProjectById,
  isProjectId,
  getProjectsForProductSubcategory,
} from "./queries";
export {
  getProductCategoryPath,
  getProductSubcategoryPath,
  getProjectPath,
} from "./paths";
export {
  getProductFilterMeta,
  listAllProductEntries,
  PRIMARY_GROUP_CATEGORIES,
  getPrimaryGroupForCategory,
} from "./filter-meta";
export {
  getProductCategoryImage,
  getProductSubcategoryImage,
  getProductImage,
  getProductGallery,
  hasProductImage,
  type ProductGalleryImage,
} from "./product-images";
export {
  filterProductCatalog,
  matchesProductFilters,
  matchesSearchQuery,
  normalizeSearchText,
  tokenizeSearchQuery,
  type ProductFilterState,
} from "./filter-products";
export {
  PRIMARY_GROUPS,
  SECTOR_KEYS,
  MATERIAL_KEYS,
  SYSTEM_KEYS,
  APPLICATION_KEYS,
  type PrimaryGroup,
  type SectorKey,
  type MaterialKey,
  type SystemKey,
  type ApplicationKey,
} from "./filter-keys";

export { getProjectsByFilters };

export function isProjectSubcategory(
  value: string,
): value is ProjectSubcategory {
  return (PROJECT_SUBCATEGORIES as readonly string[]).includes(value);
}
