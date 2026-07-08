import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "lib",
  "catalog",
  "blocked-images.json",
);

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

export const BLOCKED_FILES = new Set(
  config.files.map((file) => file.toLowerCase()),
);

export const BLOCKED_PATTERNS = config.patterns.map(
  (pattern) => new RegExp(pattern, "i"),
);

export function isBlockedImageFile(fileName) {
  const basename = fileName.toLowerCase();
  if (BLOCKED_FILES.has(basename)) return true;
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(fileName));
}

export function isBlockedImagePath(filePath) {
  return isBlockedImageFile(path.basename(filePath));
}

export function isBlockedPublicSrc(src) {
  return isBlockedImageFile(path.basename(src.replace(/\\/g, "/")));
}

export function filterAllowedImages(images) {
  return images.filter((src) => !isBlockedPublicSrc(src));
}

export function pickAllowedCover(images) {
  return filterAllowedImages(images)[0] ?? null;
}
