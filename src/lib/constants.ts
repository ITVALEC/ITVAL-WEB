/** Barrel export — preferir imports directos desde módulos específicos */
export { SITE, CONTACT } from "./site";
export { NAV_PATHS } from "./routes";
export { NAV_ITEMS, buildNavItems, type NavLabelKey } from "./nav";
export {
  PROJECTS,
  getFeaturedProjects,
  getProjectImage,
  getProjectsByFilters,
  type Project,
} from "./projects";
export {
  PROCESS_STEP_KEYS,
  METRIC_KEYS,
  PROJECT_CATEGORIES,
  PROJECT_SUBCATEGORIES,
  PROJECT_TYPE_KEYS,
  CAPABILITY_KEYS,
  CERTIFICATION_KEYS,
  PRODUCT_LIST_ITEM_KEYS,
  FORM_SUBMIT_DELAY_MS,
  type ProjectCategory,
  type ProjectSubcategory,
  type ProjectType,
} from "./content-keys";
export { IMAGES, getProductImage } from "./assets";
export {
  PRODUCT_CATALOG,
  PRODUCT_KEYS,
  type ProductKey,
  getProductCategories,
  getProductSubcategories,
  getProjectById,
  getProjectsForProductSubcategory,
  getProductCategoryPath,
  getProductSubcategoryPath,
  getProjectPath,
  isProductCategory,
  isProductSubcategory,
  isProjectId,
  isProjectSubcategory,
} from "./catalog";
