/**
 * Normalización de ciudades para el portafolio de proyectos (runtime).
 * Mantener alineado con scripts/project-city.mjs
 */

const CANONICAL_CITIES = [
  "Quito",
  "Guayaquil",
  "Ambato",
  "Loja",
  "Latacunga",
  "Atuntaqui",
  "Chone",
  "Morona Santiago",
  "Tabacundo",
  "Salcedo",
  "El Coca",
  "Santa Elena",
  "Cumbaya",
];

const FOLDER_CITY_HINTS: Array<{ city: string; re: RegExp }> = [
  {
    city: "Quito",
    re: /quito|rumiñahui|ruminahui|chillos|aymesa|equivida|savani|ahcorp|\buce\b|icon|capitol|securitas|pifo|puembo|tumbaco|cumbaya|calacal|itulpark|provenzana|diners|aranjuez|finlandia|gangotena|pichincha|guayllabamba|aguacate/i,
  },
  { city: "Guayaquil", re: /guayaquil|banco de guayaquil/i },
  { city: "Ambato", re: /ambato/i },
  { city: "Loja", re: /\bloja\b/i },
  { city: "Latacunga", re: /latacunga/i },
  { city: "Atuntaqui", re: /atuntaqui|imbabura/i },
  { city: "Chone", re: /chone/i },
  { city: "Morona Santiago", re: /morona|lundin/i },
  { city: "Tabacundo", re: /tabacundo/i },
  { city: "Salcedo", re: /salcedo|plodis/i },
  { city: "El Coca", re: /el coca|\bcoca\b/i },
  { city: "Santa Elena", re: /santa elena|encuentro/i },
  { city: "Cumbaya", re: /cumbaya/i },
];

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function inferCityFromFolder(folderName: string): string | undefined {
  for (const hint of FOLDER_CITY_HINTS) {
    if (hint.re.test(folderName)) {
      return hint.city;
    }
  }
  return undefined;
}

export function normalizePortfolioCity(
  rawCity: string,
  folderName: string,
): string {
  const metroQuito =
    /^(pifo quito|puembo quito|tumbaco quito|tumbaco|pifo|puembo|calacal[ií]|valle chillos)$/i;

  let city = rawCity.trim().replace(/\s+/g, " ");

  if (/^ecuador$/i.test(city)) {
    city = "";
  } else if (/^ahcorp$/i.test(city)) {
    return "Quito";
  } else if (/^santa elenea$/i.test(city)) {
    return "Santa Elena";
  } else if (metroQuito.test(city)) {
    return "Quito";
  } else {
    const canonical = CANONICAL_CITIES.find(
      (known) => known.toLowerCase() === city.toLowerCase(),
    );
    if (canonical) return canonical;
    if (city) return titleCase(city);
  }

  return inferCityFromFolder(folderName) ?? "Quito";
}

export function buildPortfolioCityOptions(
  projects: ReadonlyArray<{ city: string }>,
): Array<{ city: string; count: number }> {
  const counts = new Map<string, number>();

  for (const project of projects) {
    counts.set(project.city, (counts.get(project.city) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([city, count]) => ({ city, count }));
}
