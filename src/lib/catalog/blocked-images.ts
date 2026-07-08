import blockedConfigJson from "./blocked-images.json";

type BlockedImagesConfig = {
  description: string;
  files: string[];
  patterns: string[];
};

const blockedConfig = blockedConfigJson as BlockedImagesConfig;

const BLOCKED_FILES = new Set(
  blockedConfig.files.map((file) => file.toLowerCase()),
);

const BLOCKED_PATTERNS = blockedConfig.patterns.map(
  (pattern) => new RegExp(pattern, "i"),
);

export function getBlockedImageBasename(src: string): string {
  const normalized = src.replace(/\\/g, "/");
  const segment = normalized.split("/").pop() ?? normalized;
  return decodeURIComponent(segment);
}

export function isBlockedImageSrc(src: string): boolean {
  const basename = getBlockedImageBasename(src).toLowerCase();
  if (BLOCKED_FILES.has(basename)) return true;
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(basename));
}

export function filterImageSrcList<T extends string>(images: readonly T[]): T[] {
  return images.filter((src) => !isBlockedImageSrc(src));
}

export const BLOCKED_IMAGE_FILES = blockedConfig.files;
