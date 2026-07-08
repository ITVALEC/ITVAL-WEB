import fs from "node:fs";
import path from "node:path";

const base = path.join(
  "C:",
  "Users",
  "ITVAL",
  "Desktop",
  "Alejo",
  "FOTOS PRODUCTOS",
);

const dirs = fs.readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory());

for (const d of dirs) {
  const files = fs
    .readdirSync(path.join(base, d.name))
    .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f) && !/chatgpt/i.test(f));
  console.log(`\n[${d.name}] (${files.length})`);
  console.log(files.slice(0, 8).join(", "));
}
