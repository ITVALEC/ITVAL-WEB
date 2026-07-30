import fs from "node:fs";
import path from "node:path";

/**
 * Disk root for uploaded/site images.
 * VPS: ITVAL_IMAGES_ROOT=/var/www/itval/shared/images
 * Local: public/images
 */
export function getImagesRoot(): string {
  const fromEnv = process.env.ITVAL_IMAGES_ROOT?.trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }

  const publicImages = path.join(process.cwd(), "public", "images");
  try {
    return fs.realpathSync(publicImages);
  } catch {
    return path.resolve(publicImages);
  }
}

/** Maps `/images/...` to an absolute path under getImagesRoot(). */
export function resolveImageDiskPath(src: string): string {
  const normalized = src.replace(/^\//, "").replace(/\\/g, "/");
  if (!normalized.startsWith("images/")) {
    throw new Error("Ruta de imagen no permitida.");
  }
  const relative = normalized.slice("images/".length);
  if (!relative || relative.includes("\0") || path.isAbsolute(relative)) {
    throw new Error("Ruta de imagen no permitida.");
  }

  const imagesRoot = getImagesRoot();
  const resolved = path.resolve(imagesRoot, relative);
  const relativeToRoot = path.relative(imagesRoot, resolved);
  if (
    relativeToRoot.startsWith("..") ||
    path.isAbsolute(relativeToRoot) ||
    relativeToRoot.split(/[/\\]/).includes("..")
  ) {
    throw new Error("Ruta fuera del directorio de imagenes.");
  }
  return resolved;
}