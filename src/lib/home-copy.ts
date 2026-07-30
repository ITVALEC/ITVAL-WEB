/** Textos editables de la página de inicio (ES/EN vía admin). */

export type SiteHomeCopy = {
  heroTitle: string;
  heroSubtitle: string;
  productsTitle: string;
  productsSubtitle: string;
  featuredTitle: string;
  featuredSubtitle: string;
  processTitle: string;
  processSubtitle: string;
  processConsultationTitle: string;
  processConsultationDescription: string;
  processEngineeringTitle: string;
  processEngineeringDescription: string;
  processFabricationTitle: string;
  processFabricationDescription: string;
  processInstallationTitle: string;
  processInstallationDescription: string;
};

export const HOME_COPY_FIELD_KEYS = [
  "heroTitle",
  "heroSubtitle",
  "productsTitle",
  "productsSubtitle",
  "featuredTitle",
  "featuredSubtitle",
  "processTitle",
  "processSubtitle",
  "processConsultationTitle",
  "processConsultationDescription",
  "processEngineeringTitle",
  "processEngineeringDescription",
  "processFabricationTitle",
  "processFabricationDescription",
  "processInstallationTitle",
  "processInstallationDescription",
] as const satisfies readonly (keyof SiteHomeCopy)[];

export type HomeCopyFieldKey = (typeof HOME_COPY_FIELD_KEYS)[number];

export const DEFAULT_HOME_COPY: { es: SiteHomeCopy; en: SiteHomeCopy } = {
  es: {
    heroTitle: "Proyectos emblemáticos y complejos: ingeniería de escala",
    heroSubtitle:
      "Diseñamos, fabricamos e instalamos soluciones en aluminio y vidrio para estructuras de gran envergadura: fachadas unitizadas, muro cortina y cancelería arquitectónica de alto desempeño.",
    productsTitle: "Soluciones por categoría",
    productsSubtitle:
      "Explore fachadas, cancelería, seguridad, exteriores y más — con ingeniería, fabricación e instalación ITVAL.",
    featuredTitle: "Proyectos destacados",
    featuredSubtitle: "Referentes en fachadas y cancelería para el sector empresarial.",
    processTitle: "Nuestro proceso",
    processSubtitle:
      "Metodología probada para proyectos complejos con plazos y presupuestos definidos.",
    processConsultationTitle: "Consultoría técnica",
    processConsultationDescription:
      "Análisis de requerimientos, visita a sitio y propuesta preliminar de sistemas.",
    processEngineeringTitle: "Ingeniería y diseño",
    processEngineeringDescription:
      "Desarrollo de planos, especificaciones y modelado BIM para aprobación.",
    processFabricationTitle: "Fabricación",
    processFabricationDescription:
      "Producción en planta con control dimensional y pruebas de calidad.",
    processInstallationTitle: "Instalación y entrega",
    processInstallationDescription:
      "Montaje en obra, pruebas de estanqueidad y acta de entrega.",
  },
  en: {
    heroTitle: "Landmark and complex projects: engineering at scale",
    heroSubtitle:
      "We design, manufacture and install aluminum and glass solutions for large-scale structures: unitized facades, curtain walls and high-performance architectural fenestration.",
    productsTitle: "Solutions by category",
    productsSubtitle:
      "Explore facades, fenestration, security, exteriors and more — with ITVAL engineering, fabrication and installation.",
    featuredTitle: "Featured projects",
    featuredSubtitle: "Benchmark facades and fenestration for the corporate sector.",
    processTitle: "Our process",
    processSubtitle:
      "Proven methodology for complex projects with defined timelines and budgets.",
    processConsultationTitle: "Technical consultation",
    processConsultationDescription:
      "Requirements analysis, site visit and preliminary system proposal.",
    processEngineeringTitle: "Engineering and design",
    processEngineeringDescription:
      "Drawing development, specifications and BIM modeling for approval.",
    processFabricationTitle: "Fabrication",
    processFabricationDescription:
      "In-plant production with dimensional control and quality testing.",
    processInstallationTitle: "Installation and delivery",
    processInstallationDescription:
      "On-site assembly, watertightness testing and delivery certificate.",
  },
};

export function normalizeHomeCopy(
  locale: "es" | "en",
  raw?: Partial<SiteHomeCopy> | null,
): SiteHomeCopy {
  const defaults = DEFAULT_HOME_COPY[locale];
  const source = raw && typeof raw === "object" ? raw : {};
  const out = { ...defaults };
  for (const key of HOME_COPY_FIELD_KEYS) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      out[key] = value.trim();
    }
  }
  return out;
}

export function mergeHomeCopyEs(
  current: SiteHomeCopy,
  patch?: Partial<SiteHomeCopy> | null,
): SiteHomeCopy {
  if (!patch || typeof patch !== "object") return current;
  const next = { ...current };
  for (const key of HOME_COPY_FIELD_KEYS) {
    if (typeof patch[key] === "string") {
      next[key] = patch[key]!.trim();
    }
  }
  return next;
}
