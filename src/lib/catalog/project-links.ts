import { type ProjectSubcategory } from "../content-keys";

/** Relación producto → tipo de sistema en portafolio (cuando aplica). */
const PRODUCT_SUB_TO_PROJECT_SUB: Partial<
  Record<string, ProjectSubcategory>
> = {
  curtainWallStick: "curtainWall",
  stickRpt: "curtainWall",
  structuralGlazing: "curtainWall",
  glassSkin: "glazedEnvelope",
  projected: "fenestration",
  sliding: "fenestration",
  visusFemec: "fenestration",
  thermalSolar: "fenestration",
  slidingDoors: "fenestration",
  hingedDoors: "fenestration",
  foldingDoors: "fenestration",
  hermeticDoors: "fenestration",
  glassPartitions: "fenestration",
  officeDivision: "fenestration",
  lobbies: "fenestration",
  roofsSkylights: "glazedEnvelope",
  glassEnclosures: "glazedEnvelope",
  compositeFacades: "glazedEnvelope",
  acmPanels: "glazedEnvelope",
  standardAuto: "fenestration",
  telescopicAuto: "fenestration",
  armoredAuto: "fenestration",
};

export function resolveProjectSubcategory(
  productSubcategory: string,
): ProjectSubcategory | undefined {
  return PRODUCT_SUB_TO_PROJECT_SUB[productSubcategory];
}
