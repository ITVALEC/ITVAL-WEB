/** Normalización de ciudad para carpetas de fotos PROYECTOS. */

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

const FOLDER_CITY_HINTS = [
  { city: "Quito", re: /quito|rumiñahui|ruminahui|chillos|aymesa|equivida|savani|ahcorp|\buce\b|icon|capitol|securitas|pifo|puembo|tumbaco|cumbaya|calacal|itulpark|provenzana|diners|aranjuez|finlandia|gangotena|pichincha|guayllabamba|agua(?:cate)?/i },
  { city: "Guayaquil", re: /guayaquil|banco de guayaquil/i },
  { city: "Ambato", re: /ambato/i },
  { city: "Loja", re: /\bloja\b/i },
  { city: "Latacunga", re: /latacunga/i },
  { city: "Atuntaqui", re: /atuntaqui|imbabura/i },
  { city: "Chone", re: /chone/i },
  { city: "Morona Santiago", re: /morona|lundin/i },
  { city: "Tabacundo", re: /tabacundo/i },
  { city: "Salcedo", re: /salcedo|plodis/i },
  { city: "El Coca", re: /el coca|coca/i },
  { city: "Santa Elena", re: /santa elena|encuentro/i },
  { city: "Cumbaya", re: /cumbaya/i },
];

function titleCase(value) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractSuffixCity(folderName) {
  const patterns = [
    /\s[-–—]\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)$/i,
    /[-–—]\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)$/i,
  ];

  for (const pattern of patterns) {
    const match = folderName.match(pattern);
    if (match?.[1]) {
      return match[1].trim().replace(/\s+/g, " ");
    }
  }

  return undefined;
}

function inferCityFromFolder(folderName) {
  for (const hint of FOLDER_CITY_HINTS) {
    if (hint.re.test(folderName)) {
      return hint.city;
    }
  }
  return undefined;
}

export function normalizeProjectCity(rawCity, folderName) {
  const metroQuito =
    /^(pifo quito|puembo quito|tumbaco quito|tumbaco|pifo|puembo|calacal[ií]|valle chillos)$/i;

  let city = rawCity?.trim().replace(/\s+/g, " ");

  if (city) {
  if (/^ecuador$/i.test(city)) city = undefined;
  else if (/^ahcorp$/i.test(city)) city = "Quito";
  else if (/^santa elenea$/i.test(city)) city = "Santa Elena";
  else if (metroQuito.test(city)) city = "Quito";
    else {
      const canonical = CANONICAL_CITIES.find(
        (known) => known.toLowerCase() === city.toLowerCase(),
      );
      if (canonical) return canonical;
      return titleCase(city);
    }
  }

  const inferred = inferCityFromFolder(folderName);
  if (inferred) return inferred;

  return "Quito";
}

export function parseProjectFolder(folderName) {
  const rawCity = extractSuffixCity(folderName);
  const city = normalizeProjectCity(rawCity, folderName);
  const project = folderName
    .replace(/\s[-–—]\s*[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+$/i, "")
    .replace(/[-–—]\s*[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+$/i, "")
    .trim();

  return { project, city };
}

export function buildCityFilterOptions(projects) {
  const counts = new Map();

  for (const project of projects) {
    counts.set(project.city, (counts.get(project.city) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([city, count]) => ({ city, count }));
}
