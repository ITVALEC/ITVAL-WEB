import taxonomy from "../src/lib/catalog/taxonomy.json" with { type: "json" };
import {
  getProductFilterMeta,
  listAllProductEntries,
} from "../src/lib/catalog/filter-meta.ts";
import {
  filterProductCatalog,
  matchesSearchQuery,
  tokenizeSearchQuery,
  countByPrimaryGroup,
} from "../src/lib/catalog/filter-products.ts";

function buildMockItem(category, subcategory) {
  const meta = getProductFilterMeta(category, subcategory);
  const searchText = [
    subcategory,
    category,
    meta.primaryGroup,
    ...meta.sectors,
    ...meta.materials,
    ...meta.systems,
    ...meta.applications,
    ...meta.tags,
  ]
    .join(" ")
    .toLowerCase();

  return { category, subcategory, meta, searchText };
}

const catalog = listAllProductEntries().map(({ category, subcategory }) =>
  buildMockItem(category, subcategory),
);

let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error("FAIL:", message);
    failed += 1;
  }
}

// Total de soluciones
assert(catalog.length === 38, `Expected 38 products, got ${catalog.length}`);

// Pills principales — conteos esperados
const primaryCounts = countByPrimaryGroup(catalog);
assert(primaryCounts.facades === 4, `Facades: expected 4, got ${primaryCounts.facades}`);
assert(primaryCounts.windows === 4, `Windows: expected 4, got ${primaryCounts.windows}`);
assert(primaryCounts.doors === 7, `Doors: expected 7, got ${primaryCounts.doors}`);
assert(primaryCounts.security === 4, `Security: expected 4, got ${primaryCounts.security}`);
assert(primaryCounts.exteriors === 8, `Exteriors: expected 8, got ${primaryCounts.exteriors}`);
assert(primaryCounts.interiors === 8, `Interiors: expected 8, got ${primaryCounts.interiors}`);
assert(primaryCounts.steel === 3, `Steel: expected 3, got ${primaryCounts.steel}`);

// Filtro primary security
const securityOnly = filterProductCatalog(catalog, {
  query: "",
  primary: "security",
  sector: "all",
  material: "all",
  system: "all",
  application: "all",
});
assert(
  securityOnly.every((p) => p.category === "security"),
  "Security filter must only return security category",
);
assert(securityOnly.length === 4, `Security filter count: ${securityOnly.length}`);

// Filtro sector judicial
const judicial = filterProductCatalog(catalog, {
  query: "",
  primary: "all",
  sector: "judicial",
  material: "all",
  system: "all",
  application: "all",
});
assert(
  judicial.every((p) => p.meta.sectors.includes("judicial")),
  "Judicial filter must match meta.sectors",
);
assert(judicial.some((p) => p.subcategory === "gesellGlass"), "Gesell must be judicial");

// Filtro material acm
const acm = filterProductCatalog(catalog, {
  query: "",
  primary: "all",
  sector: "all",
  material: "acm",
  system: "all",
  application: "all",
});
assert(acm.every((p) => p.meta.materials.includes("acm")), "ACM material filter");
assert(acm.length >= 1, "ACM should match at least acmPanels");

// Filtro sistema automatic
const automatic = filterProductCatalog(catalog, {
  query: "",
  primary: "all",
  sector: "all",
  material: "all",
  system: "automatic",
  application: "all",
});
assert(
  automatic.every((p) => p.meta.systems.includes("automatic")),
  "Automatic system filter",
);
assert(automatic.length === 3, `Automatic doors subs: ${automatic.length}`);

// Filtro aplicación fachada
const facadeApp = filterProductCatalog(catalog, {
  query: "",
  primary: "all",
  sector: "all",
  material: "all",
  system: "all",
  application: "facade",
});
assert(
  facadeApp.every((p) => p.meta.applications.includes("facade")),
  "Facade application filter",
);

// Combinación AND: security + armored
const secArmored = filterProductCatalog(catalog, {
  query: "",
  primary: "security",
  sector: "all",
  material: "all",
  system: "armored",
  application: "all",
});
assert(secArmored.length >= 2, "Security + armored should match multiple");

// Búsqueda multi-término
assert(
  tokenizeSearchQuery("  muro   cortina  ").join(",") === "muro,cortina",
  "Tokenize query",
);
const muroCortina = filterProductCatalog(catalog, {
  query: "muro cortina",
  primary: "all",
  sector: "all",
  material: "all",
  system: "all",
  application: "all",
});
assert(
  muroCortina.some((p) => p.subcategory === "curtainWallStick"),
  "Search 'muro cortina' should find curtain wall stick",
);

// Búsqueda por tag gesell
const gesellSearch = filterProductCatalog(catalog, {
  query: "gesell",
  primary: "all",
  sector: "all",
  material: "all",
  system: "all",
  application: "all",
});
assert(
  gesellSearch.length === 1 && gesellSearch[0].subcategory === "gesellGlass",
  "Search gesell",
);

// Sin resultados imposibles
const empty = filterProductCatalog(catalog, {
  query: "",
  primary: "steel",
  sector: "judicial",
  material: "all",
  system: "all",
  application: "all",
});
assert(empty.length === 0, "Steel + judicial should be empty");

// matchesSearchQuery parcial
assert(
  matchesSearchQuery("puertas automaticas blindadas", "blindad"),
  "Partial token blindad matches blindadas",
);

if (failed === 0) {
  console.log("All", 15, "filter validation checks passed.");
  console.log("Primary counts:", primaryCounts);
} else {
  console.error(failed, "check(s) failed.");
  process.exit(1);
}
