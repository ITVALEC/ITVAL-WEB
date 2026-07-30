import fs from "node:fs";
import path from "node:path";

/** Prefer env (VPS shared), then public/images. */
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

/** All candidate roots (shared + public), de-duplicated. */
export function listImageRoots(): string[] {
  const roots: string[] = [];
  const push = (value: string) => {
    const resolved = path.resolve(value);
    if (!roots.includes(resolved)) roots.push(resolved);
  };

  const fromEnv = process.env.ITVAL_IMAGES_ROOT?.trim();
  if (fromEnv) push(fromEnv);

  const publicImages = path.join(process.cwd(), "public", "images");
  try {
    push(fs.realpathSync(publicImages));
  } catch {
    push(publicImages);
  }

  return roots;
}

function assertSafeRelative(relative: string): string {
  if (!relative || relative.includes("\0") || path.isAbsolute(relative)) {
    throw new Error("Ruta de imagen no permitida.");
  }
  if (relative.split(/[/\\]/).includes("..")) {
    throw new Error("Ruta fuera del directorio de imagenes.");
  }
  return relative;
}

function relativeFromSrc(src: string): string {
  const normalized = src.replace(/^\//, "").replace(/\\/g, "/");
  if (!normalized.startsWith("images/")) {
    throw new Error("Ruta de imagen no permitida.");
  }
  return assertSafeRelative(normalized.slice("images/".length));
}

/** Absolute path for writes (preferred root). */
export function resolveImageDiskPath(src: string): string {
  const relative = relativeFromSrc(src);
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

/** First existing readable file across shared + public. */
export function resolveExistingImageDiskPath(src: string): string | null {
  const relative = relativeFromSrc(src);
  for (const root of listImageRoots()) {
    const resolved = path.resolve(root, relative);
    const relativeToRoot = path.relative(root, resolved);
    if (
      relativeToRoot.startsWith("..") ||
      path.isAbsolute(relativeToRoot) ||
      relativeToRoot.split(/[/\\]/).includes("..")
    ) {
      continue;
    }
    try {
      if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
        return resolved;
      }
    } catch {
      /* try next root */
    }
  }
  return null;
}