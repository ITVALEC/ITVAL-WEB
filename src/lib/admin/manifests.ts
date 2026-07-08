import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

export const MANIFEST_PATHS = {
  projects: path.join(root, "src/lib/catalog/project-portfolio.json"),
  products: path.join(root, "src/lib/catalog/product-images.json"),
  blocked: path.join(root, "src/lib/catalog/blocked-images.json"),
  taxonomy: path.join(root, "src/lib/catalog/taxonomy.json"),
  siteSettings: path.join(root, "src/lib/catalog/site-settings.json"),
} as const;

export function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function writeJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function fileExists(publicPath: string): boolean {
  const normalized = publicPath.replace(/^\//, "").replace(/\\/g, "/");
  return fs.existsSync(path.join(root, "public", normalized));
}
