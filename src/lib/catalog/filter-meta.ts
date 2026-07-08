import { PRODUCT_CATALOG, PRODUCT_KEYS, type ProductKey } from "./types";
import {
  type ApplicationKey,
  type MaterialKey,
  type PrimaryGroup,
  type SectorKey,
  type SystemKey,
} from "./filter-keys";

export type ProductFilterMeta = {
  primaryGroup: Exclude<PrimaryGroup, "all">;
  sectors: readonly SectorKey[];
  materials: readonly MaterialKey[];
  systems: readonly SystemKey[];
  applications: readonly ApplicationKey[];
  /** Tokens de búsqueda adicionales (minúsculas, sin acentos) */
  tags: readonly string[];
};

const CATEGORY_PRIMARY: Record<ProductKey, Exclude<PrimaryGroup, "all">> = {
  facades: "facades",
  aluminumWindows: "windows",
  doorsAccess: "doors",
  automaticDoors: "doors",
  security: "security",
  coversExteriors: "exteriors",
  acmLouvers: "exteriors",
  corporateInteriors: "interiors",
  architecturalGlass: "interiors",
  stainlessSteel: "steel",
};

const CATEGORY_BASE: Record<ProductKey, Omit<ProductFilterMeta, "primaryGroup" | "tags">> = {
  facades: {
    sectors: ["corporate", "commercial", "institutional"],
    materials: ["aluminum", "laminatedGlass", "temperedGlass"],
    systems: ["structural", "rpt"],
    applications: ["facade"],
  },
  aluminumWindows: {
    sectors: ["corporate", "commercial", "residential", "institutional"],
    materials: ["aluminum", "temperedGlass", "laminatedGlass"],
    systems: ["sliding", "rpt"],
    applications: ["facade", "access"],
  },
  doorsAccess: {
    sectors: ["corporate", "commercial", "institutional"],
    materials: ["aluminum", "temperedGlass", "stainlessSteel"],
    systems: ["sliding", "hermetic", "structural"],
    applications: ["access"],
  },
  automaticDoors: {
    sectors: ["commercial", "corporate", "institutional", "pharmaceutical"],
    materials: ["aluminum", "temperedGlass", "laminatedGlass"],
    systems: ["automatic", "armored"],
    applications: ["access"],
  },
  security: {
    sectors: ["judicial", "institutional", "commercial", "corporate"],
    materials: ["laminatedGlass", "stainlessSteel", "temperedGlass"],
    systems: ["armored", "structural"],
    applications: ["protection", "division"],
  },
  coversExteriors: {
    sectors: ["commercial", "corporate", "residential", "institutional"],
    materials: ["aluminum", "temperedGlass", "laminatedGlass"],
    systems: ["structural", "sliding"],
    applications: ["roof", "protection", "facade"],
  },
  acmLouvers: {
    sectors: ["commercial", "corporate", "institutional"],
    materials: ["acm", "aluminum"],
    systems: ["structural"],
    applications: ["facade", "protection"],
  },
  corporateInteriors: {
    sectors: ["corporate", "commercial", "institutional"],
    materials: ["temperedGlass", "aluminum", "laminatedGlass"],
    systems: ["sliding", "structural"],
    applications: ["division", "decoration", "access"],
  },
  architecturalGlass: {
    sectors: ["corporate", "commercial", "residential", "institutional"],
    materials: ["temperedGlass", "laminatedGlass"],
    systems: ["structural"],
    applications: ["decoration", "division", "access"],
  },
  stainlessSteel: {
    sectors: ["corporate", "institutional", "pharmaceutical", "commercial"],
    materials: ["stainlessSteel"],
    systems: ["sliding", "structural"],
    applications: ["access", "division", "decoration"],
  },
};

/** Ajustes por subcategoría — solo donde difiere de la base de categoría */
const SUBCATEGORY_OVERRIDES: Partial<
  Record<ProductKey, Partial<Record<string, Partial<ProductFilterMeta>>>>
> = {
  facades: {
    curtainWallStick: { systems: ["structural"], tags: ["muro cortina", "stick", "curtain wall"] },
    stickRpt: { systems: ["rpt", "structural"], tags: ["rpt", "puente termico"] },
    structuralGlazing: {
      systems: ["structural"],
      tags: ["vidriado estructural", "structural glazing"],
    },
    glassSkin: { tags: ["piel de vidrio", "glass skin"] },
  },
  aluminumWindows: {
    projected: { systems: ["structural"], tags: ["proyectable", "abatible"] },
    sliding: { systems: ["sliding"], tags: ["corrediza", "corredizo"] },
    visusFemec: { tags: ["visus", "femec"] },
    thermalSolar: { tags: ["control solar", "termico", "dvH"] },
  },
  doorsAccess: {
    slidingDoors: { systems: ["sliding"] },
    hingedDoors: { systems: ["structural"] },
    foldingDoors: { tags: ["plegable", "folding"] },
    hermeticDoors: { systems: ["hermetic"], tags: ["hermetica", "hospital"] },
  },
  automaticDoors: {
    standardAuto: { systems: ["automatic"] },
    telescopicAuto: { systems: ["automatic", "sliding"], tags: ["telescopica"] },
    armoredAuto: { systems: ["automatic", "armored"], tags: ["blindada"] },
  },
  security: {
    armoredPartitions: {
      systems: ["armored"],
      tags: ["mampara blindada", "balistica"],
    },
    ballisticSteel: {
      materials: ["stainlessSteel"],
      systems: ["armored"],
      tags: ["acero balistico"],
    },
    gesellGlass: {
      sectors: ["judicial", "institutional"],
      tags: ["gesell", "judicial"],
    },
    guardBooths: { tags: ["garita", "caseta"] },
  },
  coversExteriors: {
    roofsSkylights: { applications: ["roof"], tags: ["claraboya", "cubierta"] },
    pergolas: { tags: ["pergola"] },
    marquees: { tags: ["marquesina"] },
    glassEnclosures: { tags: ["cerramiento"] },
  },
  acmLouvers: {
    acmPanels: { materials: ["acm"], tags: ["panel compuesto"] },
    louvers: { tags: ["louver", "celosia"] },
    sunBreakers: { tags: ["quiebrasol", "brise soleil"] },
    compositeFacades: { applications: ["facade"] },
  },
  corporateInteriors: {
    glassPartitions: { applications: ["division"] },
    officeDivision: { applications: ["division"] },
    lobbies: { applications: ["access", "decoration"] },
    signage: { applications: ["decoration"] },
  },
  architecturalGlass: {
    glassFloors: { tags: ["piso vidrio"] },
    handrailsMirrors: { tags: ["pasamanos", "espejo"] },
    decorativeGlass: { applications: ["decoration"] },
    wineCellars: { tags: ["cava", "vinoteca"] },
  },
  stainlessSteel: {
    handrails: { applications: ["access", "decoration"] },
    ssSlidingDoors: { systems: ["sliding"] },
    bathroomPartitions: { applications: ["division"], sectors: ["commercial", "institutional"] },
  },
};

function mergeMeta(
  base: Omit<ProductFilterMeta, "primaryGroup" | "tags">,
  override?: Partial<ProductFilterMeta>,
  primaryGroup?: Exclude<PrimaryGroup, "all">,
): ProductFilterMeta {
  return {
    primaryGroup: primaryGroup ?? "facades",
    sectors: override?.sectors ?? base.sectors,
    materials: override?.materials ?? base.materials,
    systems: override?.systems ?? base.systems,
    applications: override?.applications ?? base.applications,
    tags: override?.tags ?? [],
  };
}

export function getProductFilterMeta(
  category: ProductKey,
  subcategory: string,
): ProductFilterMeta {
  const base = CATEGORY_BASE[category];
  const override = SUBCATEGORY_OVERRIDES[category]?.[subcategory];
  return mergeMeta(base, override, CATEGORY_PRIMARY[category]);
}

export const PRIMARY_GROUP_CATEGORIES: Record<
  Exclude<PrimaryGroup, "all">,
  readonly ProductKey[]
> = {
  facades: ["facades"],
  windows: ["aluminumWindows"],
  doors: ["doorsAccess", "automaticDoors"],
  security: ["security"],
  exteriors: ["coversExteriors", "acmLouvers"],
  interiors: ["corporateInteriors", "architecturalGlass"],
  steel: ["stainlessSteel"],
};

export function getPrimaryGroupForCategory(
  category: ProductKey,
): Exclude<PrimaryGroup, "all"> {
  return CATEGORY_PRIMARY[category];
}

export function listAllProductEntries(): Array<{
  category: ProductKey;
  subcategory: string;
}> {
  return PRODUCT_KEYS.flatMap((category) =>
    PRODUCT_CATALOG[category].map((subcategory) => ({
      category,
      subcategory,
    })),
  );
}
