/** Claves de contenido compartidas — sincronizadas con messages/*.json */

export type { ProductKey } from "./catalog/types";

export const PROCESS_STEP_KEYS = [
  "consultation",
  "engineering",
  "fabrication",
  "installation",
] as const;

export const METRIC_KEYS = ["years", "projects", "cities"] as const;

export const PROJECT_CATEGORIES = [
  "commercial",
  "highRise",
  "institutional",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_SUBCATEGORIES = [
  "unitized",
  "curtainWall",
  "fenestration",
  "glazedEnvelope",
] as const;

export type ProjectSubcategory = (typeof PROJECT_SUBCATEGORIES)[number];

/** Alineado con categorías de producto + opción genérica */
export const PROJECT_TYPE_KEYS = [
  "facades",
  "aluminumWindows",
  "doorsAccess",
  "automaticDoors",
  "security",
  "coversExteriors",
  "acmLouvers",
  "corporateInteriors",
  "architecturalGlass",
  "stainlessSteel",
  "other",
] as const;

export type ProjectType = (typeof PROJECT_TYPE_KEYS)[number];

export const VALUE_KEYS = [
  "ethics",
  "responsibility",
  "precision",
  "excellence",
] as const;

export type ValueKey = (typeof VALUE_KEYS)[number];

export const CAPABILITY_KEYS = [
  "bim",
  "structural",
  "fabrication",
  "quality",
] as const;

export const CERTIFICATION_KEYS = [
  "iso",
  "ansi",
  "safety",
  "environment",
] as const;

export const PRODUCT_LIST_ITEM_KEYS = ["i1", "i2", "i3"] as const;

export const FORM_SUBMIT_DELAY_MS = 800;
