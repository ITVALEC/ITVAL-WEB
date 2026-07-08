/** Claves de filtros del explorador de productos — sincronizadas con i18n `productsCatalog.explorer` */

export const PRIMARY_GROUPS = [
  "all",
  "facades",
  "windows",
  "doors",
  "security",
  "exteriors",
  "interiors",
  "steel",
] as const;

export type PrimaryGroup = (typeof PRIMARY_GROUPS)[number];

export const SECTOR_KEYS = [
  "corporate",
  "commercial",
  "judicial",
  "pharmaceutical",
  "residential",
  "institutional",
] as const;

export type SectorKey = (typeof SECTOR_KEYS)[number];

export const MATERIAL_KEYS = [
  "temperedGlass",
  "laminatedGlass",
  "aluminum",
  "stainlessSteel",
  "acm",
] as const;

export type MaterialKey = (typeof MATERIAL_KEYS)[number];

export const SYSTEM_KEYS = [
  "automatic",
  "armored",
  "hermetic",
  "rpt",
  "structural",
  "sliding",
] as const;

export type SystemKey = (typeof SYSTEM_KEYS)[number];

export const APPLICATION_KEYS = [
  "facade",
  "access",
  "division",
  "roof",
  "protection",
  "decoration",
] as const;

export type ApplicationKey = (typeof APPLICATION_KEYS)[number];
