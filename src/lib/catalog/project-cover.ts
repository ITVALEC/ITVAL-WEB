import { isBlockedImageSrc } from "./blocked-images";

/** Elige portada: evita la primera si hay varias (suele ser obra en proceso). */
export function pickProjectCoverIndex(gallery: readonly string[]): number {
  const allowed = gallery
    .map((src, index) => ({ src, index }))
    .filter(({ src }) => !isBlockedImageSrc(src));

  if (allowed.length === 0) return 0;
  if (allowed.length === 1) return allowed[0].index;
  if (allowed.length === 2) return allowed[1].index;

  const mid = allowed[Math.floor(allowed.length / 2)];
  return mid.index;
}

export function resolveProjectCover(
  gallery: readonly string[],
  coverIndex?: number | null,
): string {
  if (gallery.length === 0) return "/images/pages/projects.svg";

  if (
    coverIndex !== undefined &&
    coverIndex !== null &&
    coverIndex >= 0 &&
    coverIndex < gallery.length &&
    !isBlockedImageSrc(gallery[coverIndex])
  ) {
    return gallery[coverIndex];
  }

  return gallery[pickProjectCoverIndex(gallery)] ?? gallery[0];
}
