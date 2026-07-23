import fs from "node:fs";
import taxonomy from "../src/lib/catalog/taxonomy.json" with { type: "json" };

const categories = {
  facades: {
    es: {
      title: "Fachadas arquitectónicas",
      description:
        "Muro cortina, piel de vidrio y sistemas estructurales para edificios corporativos, comerciales e institucionales.",
    },
    en: {
      title: "Architectural facades",
      description:
        "Curtain wall, structural glazing and glass skin systems for corporate, commercial and institutional buildings.",
    },
  },
  aluminumWindows: {
    es: {
      title: "Ventanas y sistemas de aluminio",
      description:
        "Proyectables, corredizas y sistemas de alto desempeño térmico para confort, ventilación y eficiencia energética.",
    },
    en: {
      title: "Aluminum windows & systems",
      description:
        "Projected, sliding and high thermal-performance systems for comfort, ventilation and energy efficiency.",
    },
  },
  doorsAccess: {
    es: {
      title: "Puertas y accesos",
      description:
        "Corredizas, batientes, plegables y herméticas para edificios, locales comerciales e industria.",
    },
    en: {
      title: "Doors & access",
      description:
        "Sliding, hinged, folding and hermetic doors for buildings, retail and industrial facilities.",
    },
  },
  automaticDoors: {
    es: {
      title: "Puertas automáticas",
      description:
        "Sistemas estándar, telescópicos y blindados para accesibilidad, alto tráfico y seguridad.",
    },
    en: {
      title: "Automatic doors",
      description:
        "Standard, telescopic and armored systems for accessibility, high traffic and security.",
    },
  },
  security: {
    es: {
      title: "Seguridad especializada",
      description:
        "Mamparas blindadas, acero balístico, vidrios Gesell, garitas y soluciones institucionales.",
    },
    en: {
      title: "Specialized security",
      description:
        "Armored partitions, ballistic steel, Gesell glass, guard booths and institutional solutions.",
    },
  },
  coversExteriors: {
    es: {
      title: "Cubiertas, pérgolas y marquesinas",
      description:
        "Protección solar, claraboyas y cerramientos exteriores con diseño arquitectónico.",
    },
    en: {
      title: "Roofs, pergolas & marquees",
      description:
        "Sun protection, skylights and exterior enclosures with architectural design.",
    },
  },
  acmLouvers: {
    es: {
      title: "Revestimientos ACM y quiebrasoles",
      description:
        "Paneles compuestos, louvers y sistemas de control solar para fachadas contemporáneas.",
    },
    en: {
      title: "ACM cladding & sun breakers",
      description:
        "Composite panels, louvers and solar control systems for contemporary facades.",
    },
  },
  corporateInteriors: {
    es: {
      title: "Interiores corporativos",
      description:
        "Mamparas, divisiones de oficina, lobbies, recepción y señalética para espacios de trabajo.",
    },
    en: {
      title: "Corporate interiors",
      description:
        "Partitions, office divisions, lobbies, reception and signage for workspaces.",
    },
  },
  architecturalGlass: {
    es: {
      title: "Vidrio arquitectónico",
      description:
        "Pisos, pasamanos, espejos, repisas y soluciones decorativas de alto valor estético.",
    },
    en: {
      title: "Architectural glass",
      description:
        "Floors, handrails, mirrors, shelves and high-aesthetic decorative solutions.",
    },
  },
  stainlessSteel: {
    es: {
      title: "Acero inoxidable",
      description:
        "Pasamanos, puertas y divisiones con durabilidad, higiene y acabado premium.",
    },
    en: {
      title: "Stainless steel",
      description:
        "Handrails, doors and partitions with durability, hygiene and premium finish.",
    },
  },
};

const subLabels = {
  curtainWallStick: { es: "Muro cortina Stick", en: "Stick curtain wall" },
  stickRpt: { es: "Stick RPT", en: "Stick RPT (thermal break)" },
  structuralGlazing: { es: "Vidriado estructural", en: "Structural glazing" },
  glassSkin: { es: "Piel de vidrio", en: "Glass skin" },
  projected: { es: "Ventanas proyectables", en: "Projected windows" },
  sliding: { es: "Ventanas corredizas", en: "Sliding windows" },
  visusFemec: { es: "Sistema Visus Femec", en: "Visus Femec system" },
  thermalSolar: { es: "Control térmico y solar", en: "Thermal & solar control" },
  slidingDoors: { es: "Puertas corredizas", en: "Sliding doors" },
  hingedDoors: { es: "Puertas batientes", en: "Hinged doors" },
  foldingDoors: { es: "Puertas plegables", en: "Folding doors" },
  hermeticDoors: { es: "Puertas herméticas", en: "Hermetic doors" },
  standardAuto: { es: "Puertas automáticas estándar", en: "Standard automatic doors" },
  telescopicAuto: { es: "Puertas telescópicas", en: "Telescopic doors" },
  armoredAuto: { es: "Puertas automáticas blindadas", en: "Armored automatic doors" },
  highTrafficAuto: { es: "Alto tráfico", en: "High-traffic systems" },
  armoredPartitions: { es: "Mamparas blindadas", en: "Armored partitions" },
  ballisticSteel: { es: "Acero balístico", en: "Ballistic steel" },
  gesellGlass: { es: "Vidrios Gesell", en: "Gesell glass" },
  guardBooths: { es: "Garitas y cajas", en: "Guard booths" },
  roofsSkylights: { es: "Cubiertas y claraboyas", en: "Roofs & skylights" },
  pergolas: { es: "Pérgolas", en: "Pergolas" },
  marquees: { es: "Marquesinas", en: "Marquees" },
  glassEnclosures: { es: "Cerramientos de vidrio", en: "Glass enclosures" },
  acmPanels: { es: "Paneles ACM", en: "ACM panels" },
  louvers: { es: "Louvers", en: "Louvers" },
  sunBreakers: { es: "Quiebrasoles", en: "Sun breakers" },
  compositeFacades: { es: "Fachadas compuestas", en: "Composite facades" },
  glassPartitions: { es: "Mamparas de vidrio", en: "Glass partitions" },
  officeDivision: { es: "Divisiones de oficina", en: "Office divisions" },
  lobbies: { es: "Lobbies e ingresos", en: "Lobbies & entrances" },
  signage: { es: "Letreros y señalética", en: "Signage" },
  glassFloors: { es: "Pisos de vidrio", en: "Glass floors" },
  handrailsMirrors: { es: "Pasamanos y espejos", en: "Handrails & mirrors" },
  decorativeGlass: { es: "Vidrio decorativo", en: "Decorative glass" },
  wineCellars: { es: "Cavas y repisas", en: "Wine cellars & shelves" },
  handrails: { es: "Pasamanos", en: "Handrails" },
  ssHingedDoors: { es: "Puertas batientes", en: "Hinged doors" },
  ssSlidingDoors: { es: "Puertas corredizas", en: "Sliding doors" },
  bathroomPartitions: { es: "Divisiones para baños", en: "Bathroom partitions" },
};

function buildSub(key, locale, catTitle) {
  const label = subLabels[key]?.[locale] ?? key;
  const isEs = locale === "es";
  const context = catTitle.toLowerCase();

  return {
    title: label,
    description: isEs
      ? `${label}: solución ITVAL en aluminio y vidrio para ${context}, con ingeniería, fabricación e instalación certificada.`
      : `${label}: ITVAL aluminum and glass solution for ${context}, with engineering, fabrication and certified installation.`,
    applications: {
      i1: isEs
        ? "Edificios corporativos y comerciales"
        : "Corporate and commercial buildings",
      i2: isEs
        ? "Proyectos institucionales y de salud"
        : "Institutional and healthcare projects",
      i3: isEs
        ? "Desarrollos residenciales premium"
        : "Premium residential developments",
    },
    benefits: {
      i1: isEs
        ? "Desempeño técnico y durabilidad comprobada"
        : "Proven technical performance and durability",
      i2: isEs
        ? "Estética arquitectónica y valor de marca"
        : "Architectural aesthetics and brand value",
      i3: isEs
        ? "Acompañamiento integral desde cotización a instalación"
        : "End-to-end support from quote to installation",
    },
    materials: isEs
      ? "Aluminio, vidrio laminado/templado, acero, herrajes y sellantes estructurales según especificación."
      : "Aluminum, laminated/tempered glass, steel, hardware and structural sealants per specification.",
    standards: isEs
      ? "NEC, ASTM, ASCE, AISC, AISI, Aluminum Design Manual; NIJ 0108.04 cuando aplica."
      : "NEC, ASTM, ASCE, AISC, AISI, Aluminum Design Manual; NIJ 0108.04 where applicable.",
    options: isEs
      ? "Acabados, dimensiones, tipos de vidrio y configuraciones personalizadas según proyecto."
      : "Finishes, dimensions, glass types and custom configurations per project.",
  };
}

function buildLocale(locale) {
  const isEs = locale === "es";

  const out = {
    hub: {
      title: isEs ? "Productos" : "Products",
      subtitle: isEs
        ? "Elija una línea para previsualizar soluciones: fachadas, ventanas, puertas y más."
        : "Choose a line to preview solutions: facades, windows, doors and more.",
      viewCategory: isEs ? "Ver categoría" : "View category",
      viewDetail: isEs ? "Ver ficha" : "View details",
    },
    detail: {
      applications: isEs ? "Aplicaciones" : "Applications",
      benefits: isEs ? "Beneficios" : "Benefits",
      materials: isEs ? "Materiales" : "Materials",
      standards: isEs ? "Normas técnicas" : "Technical standards",
      options: isEs ? "Opciones y variantes" : "Options & variants",
      relatedProjects: isEs ? "Proyectos relacionados" : "Related projects",
      projectGallery: isEs
        ? "Galería de obras y referencias"
        : "Project gallery & references",
      closeGallery: isEs ? "Cerrar imagen" : "Close image",
      galleryPaginationNav: isEs
        ? "Paginación de la galería"
        : "Gallery pagination",
      galleryPreviousPage: isEs ? "Anterior" : "Previous",
      galleryNextPage: isEs ? "Siguiente" : "Next",
      galleryPageStatus: isEs
        ? "Página {page} de {totalPages}"
        : "Page {page} of {totalPages}",
      galleryGoToPage: isEs ? "Ir a la página {page}" : "Go to page {page}",
      galleryShowingRange: isEs
        ? "Mostrando {from}–{to} de {total} imágenes"
        : "Showing {from}–{to} of {total} images",
      requestQuote: isEs ? "Solicitar cotización" : "Request a quote",
    },
    explorer: {
      sectionTitle: isEs ? "Explorador de soluciones" : "Solution explorer",
      searchLabel: isEs ? "Buscar soluciones" : "Search solutions",
      searchPlaceholder: isEs
        ? "Buscar producto, sistema o solución..."
        : "Search product, system or solution...",
      primaryLabel: isEs ? "Filtrar por línea" : "Filter by line",
      primary: {
        all: isEs ? "Todos" : "All",
        facades: isEs ? "Fachadas" : "Facades",
        windows: isEs ? "Ventanas" : "Windows",
        doors: isEs ? "Puertas" : "Doors",
        security: isEs ? "Seguridad" : "Security",
        exteriors: isEs ? "Exteriores" : "Exteriors",
        interiors: isEs ? "Interiores" : "Interiors",
        steel: isEs ? "Acero" : "Steel",
        other: isEs ? "Otros" : "Other",
      },
      sectorLabel: isEs ? "Sector" : "Sector",
      materialLabel: isEs ? "Material" : "Material",
      systemLabel: isEs ? "Sistema" : "System",
      applicationLabel: isEs ? "Aplicación" : "Application",
      allOption: isEs ? "Todos" : "All",
      sectors: {
        corporate: isEs ? "Corporativo" : "Corporate",
        commercial: isEs ? "Comercial" : "Commercial",
        judicial: isEs ? "Judicial" : "Judicial",
        pharmaceutical: isEs ? "Farmacéutico" : "Pharmaceutical",
        residential: isEs ? "Residencial" : "Residential",
        institutional: isEs ? "Institucional" : "Institutional",
      },
      materials: {
        temperedGlass: isEs ? "Vidrio templado" : "Tempered glass",
        laminatedGlass: isEs ? "Vidrio laminado" : "Laminated glass",
        aluminum: isEs ? "Aluminio" : "Aluminum",
        stainlessSteel: isEs ? "Acero inoxidable" : "Stainless steel",
        acm: isEs ? "ACM" : "ACM",
      },
      systems: {
        automatic: isEs ? "Automático" : "Automatic",
        armored: isEs ? "Blindado" : "Armored",
        hermetic: isEs ? "Hermético" : "Hermetic",
        rpt: isEs ? "RPT" : "RPT",
        structural: isEs ? "Estructural" : "Structural",
        sliding: isEs ? "Corredizo" : "Sliding",
      },
      applications: {
        facade: isEs ? "Fachada" : "Facade",
        access: isEs ? "Acceso" : "Access",
        division: isEs ? "División" : "Division",
        roof: isEs ? "Cubierta" : "Roof",
        protection: isEs ? "Protección" : "Protection",
        decoration: isEs ? "Decoración" : "Decoration",
      },
      resultsCount: isEs
        ? "{count} soluciones encontradas"
        : "{count} solutions found",
      clearFilters: isEs ? "Limpiar filtros" : "Clear filters",
      activeFilters: isEs ? "Filtros activos" : "Active filters",
      removeFilter: isEs ? "Quitar filtro: {filter}" : "Remove filter: {filter}",
      advancedFilters: isEs ? "Filtros avanzados" : "Advanced filters",
      emptyTitle: isEs
        ? "No encontramos soluciones con esos filtros."
        : "No solutions match those filters.",
      emptyHint: isEs
        ? "Sugerencia: intenta buscar por material, sector o tipo de sistema."
        : "Tip: try searching by material, sector or system type.",
      showingRange: isEs
        ? "Mostrando {from}–{to} de {total} soluciones"
        : "Showing {from}–{to} of {total} solutions",
      paginationNav: isEs ? "Paginación de resultados" : "Results pagination",
      previousPage: isEs ? "Anterior" : "Previous",
      nextPage: isEs ? "Siguiente" : "Next",
      pageStatus: isEs
        ? "Página {page} de {totalPages}"
        : "Page {page} of {totalPages}",
      goToPage: isEs ? "Ir a la página {page}" : "Go to page {page}",
    },
    categories: {},
    subcategories: {},
  };

  for (const [catKey, catMeta] of Object.entries(categories)) {
    out.categories[catKey] = catMeta[locale];
    out.subcategories[catKey] = {};
    for (const subKey of taxonomy[catKey]) {
      out.subcategories[catKey][subKey] = buildSub(
        subKey,
        locale,
        catMeta[locale].title,
      );
    }
  }

  return out;
}

fs.mkdirSync("messages/products-catalog", { recursive: true });
fs.writeFileSync(
  "messages/products-catalog/es.json",
  JSON.stringify(buildLocale("es"), null, 2),
);
fs.writeFileSync(
  "messages/products-catalog/en.json",
  JSON.stringify(buildLocale("en"), null, 2),
);

console.log("Generated messages/products-catalog/{es,en}.json");
