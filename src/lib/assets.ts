/** Imágenes de páginas y secciones (no catálogo de productos). */
function img(...segments: string[]): string {
  return `/images/${segments.join("/")}`;
}

export const IMAGES = {
  hero: img("site", "hero.svg"),
  site: {
    logoWhite: img("site", "logo-white.png"),
    logoColor: img("site", "logo-color.png"),
  },
  pages: {
    projects: img("pages", "projects.svg"),
    products: img("pages", "products.jpg"),
    about: img("pages", "about.svg"),
    contact: img("pages", "contact.svg"),
  },
  about: {
    history: img("about", "history.svg"),
    capabilities: img("about", "capabilities.svg"),
  },
} as const;

export {
  getProductImage,
  getProductCategoryImage,
  getProductSubcategoryImage,
  getProductGallery,
  hasProductImage,
  type ProductGalleryImage,
} from "./catalog/product-images";
