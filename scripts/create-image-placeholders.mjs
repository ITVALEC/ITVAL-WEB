import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const imagesRoot = path.join(root, "public", "images");

/** @type {Array<[string, string, number, number]>} */
const SLOTS = [
  ["site", "hero", 1920, 1080],
  ["pages", "projects", 1920, 1080],
  ["pages", "products", 1920, 1080],
  ["pages", "about", 1920, 1080],
  ["pages", "contact", 1920, 1080],
  ["about", "history", 1200, 900],
  ["about", "capabilities", 1200, 900],
  ["products", "facades", 1200, 750],
  ["products", "aluminumWindows", 1200, 750],
  ["products", "doorsAccess", 1200, 750],
  ["products", "automaticDoors", 1200, 750],
  ["products", "security", 1200, 750],
  ["products", "coversExteriors", 1200, 750],
  ["products", "acmLouvers", 1200, 750],
  ["products", "corporateInteriors", 1200, 750],
  ["products", "architecturalGlass", 1200, 750],
  ["products", "stainlessSteel", 1200, 750],
  ["projects", "torre-horizonte", 1200, 900],
  ["projects", "centro-logistico-norte", 1200, 900],
  ["projects", "residencial-alta-vista", 1200, 900],
  ["projects", "torre-pacifico", 1200, 900],
  ["projects", "campus-universitario", 1200, 900],
  ["projects", "hospital-metropolitano", 1200, 900],
];

function placeholderSvg(label, width, height) {
  const titleSize = Math.max(20, Math.round(width / 40));
  const hintSize = Math.max(12, Math.round(width / 80));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">
  <rect width="100%" height="100%" fill="#1A2E44"/>
  <rect x="${width * 0.08}" y="${height * 0.12}" width="${width * 0.84}" height="${height * 0.76}" rx="12" fill="none" stroke="#6495ED" stroke-width="3" stroke-dasharray="12 8"/>
  <text x="50%" y="46%" text-anchor="middle" fill="#6495ED" font-family="Arial,sans-serif" font-size="${titleSize}" font-weight="700">ITVAL</text>
  <text x="50%" y="54%" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-size="${hintSize}">${label}</text>
  <text x="50%" y="62%" text-anchor="middle" fill="#A6A9AB" font-family="Arial,sans-serif" font-size="${hintSize}">Reemplazar con foto propia</text>
</svg>
`;
}

for (const [folder, name, width, height] of SLOTS) {
  const dir = path.join(imagesRoot, folder);
  fs.mkdirSync(dir, { recursive: true });
  const label = `${folder}/${name}`;
  fs.writeFileSync(
    path.join(dir, `${name}.svg`),
    placeholderSvg(label, width, height),
    "utf8",
  );
}

console.log(`Placeholders creados: ${SLOTS.length} archivos en public/images/`);
