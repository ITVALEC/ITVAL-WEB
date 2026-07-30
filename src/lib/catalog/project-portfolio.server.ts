import "server-only";

import fs from "node:fs";
import { unstable_noStore as noStore } from "next/cache";
import { isDatabaseEnabled } from "@/lib/db/pool";
import { listProjectsFromDb } from "@/lib/db/repositories/projects";
import { MANIFEST_PATHS } from "@/lib/admin/manifests";
import { isServablePublicImage } from "@/lib/admin/media-service";
import {
  PORTFOLIO_PROJECTS,
  type PortfolioProject,
} from "@/lib/catalog/project-portfolio";
import { filterImageSrcList, isBlockedImageSrc } from "@/lib/catalog/blocked-images";
import {
  buildPortfolioCityOptions,
  normalizePortfolioCity,
} from "@/lib/catalog/project-city";
import { pickProjectCoverIndex, resolveProjectCover } from "@/lib/catalog/project-cover";
import { isCatalogPlaceholderSrc } from "@/lib/media/placeholder-src";

const PUBLIC_COVER_FALLBACK = "/images/pages/products.jpg";

function sanitizeProject(project: PortfolioProject): PortfolioProject | null {
  const gallery = filterImageSrcList(project.gallery).filter(
    (src) =>
      !isCatalogPlaceholderSrc(src) &&
      !isBlockedImageSrc(src) &&
      isServablePublicImage(src),
  );
  if (gallery.length === 0) return null;

  const preferredIndex = project.coverIndex ?? pickProjectCoverIndex(gallery);
  // Recalcular índice sobre la galería filtrada (puede haber cambiado).
  let coverIndex = 0;
  const preferredSrc =
    project.coverIndex != null &&
    project.coverIndex >= 0 &&
    project.coverIndex < project.gallery.length
      ? project.gallery[project.coverIndex]
      : null;
  if (preferredSrc) {
    const idx = gallery.indexOf(preferredSrc);
    coverIndex = idx >= 0 ? idx : pickProjectCoverIndex(gallery);
  } else {
    coverIndex =
      preferredIndex >= 0 && preferredIndex < gallery.length
        ? preferredIndex
        : pickProjectCoverIndex(gallery);
  }

  const cover = resolveProjectCover(gallery, coverIndex);
  if (
    isCatalogPlaceholderSrc(cover) ||
    isBlockedImageSrc(cover) ||
    !isServablePublicImage(cover)
  ) {
    return null;
  }

  const city = normalizePortfolioCity(project.city, project.folder);
  return {
    ...project,
    city,
    location: `${city}, Ecuador`,
    coverIndex,
    cover: isServablePublicImage(cover) ? cover : PUBLIC_COVER_FALLBACK,
    gallery,
    imageCount: gallery.length,
  };
}

function sanitizeList(projects: PortfolioProject[]): PortfolioProject[] {
  return projects
    .map(sanitizeProject)
    .filter((project): project is PortfolioProject => project !== null);
}

function readManifestFromDisk(): PortfolioProject[] {
  try {
    const raw = JSON.parse(
      fs.readFileSync(MANIFEST_PATHS.projects, "utf8"),
    ) as { projects?: PortfolioProject[] };
    return sanitizeList(raw.projects ?? []);
  } catch {
    return [];
  }
}

/** Obras vivas: Postgres, JSON en disco o bundle del build. */
export async function loadPortfolioProjectsLive(): Promise<PortfolioProject[]> {
  noStore();

  if (isDatabaseEnabled()) {
    try {
      const fromDb = sanitizeList(await listProjectsFromDb());
      if (fromDb.length > 0) return fromDb;
    } catch {
      /* fallback */
    }
  }

  const fromDisk = readManifestFromDisk();
  if (fromDisk.length > 0) return fromDisk;

  return sanitizeList([...PORTFOLIO_PROJECTS]);
}

export async function loadFeaturedPortfolioProjectsLive(
  limit = 8,
): Promise<PortfolioProject[]> {
  const projects = await loadPortfolioProjectsLive();
  const featured = projects.filter((project) => project.featured);
  const list = featured.length > 0 ? featured : projects;
  return list.slice(0, Math.max(1, limit));
}

export async function getPortfolioProjectLive(
  id: string,
): Promise<PortfolioProject | undefined> {
  const projects = await loadPortfolioProjectsLive();
  return projects.find((project) => project.id === id);
}

export async function loadPortfolioMissionImageLive(): Promise<string | null> {
  noStore();
  try {
    const raw = JSON.parse(
      fs.readFileSync(MANIFEST_PATHS.projects, "utf8"),
    ) as { missionImage?: string | null };
    const src = raw.missionImage?.trim();
    if (
      src &&
      !isBlockedImageSrc(src) &&
      !isCatalogPlaceholderSrc(src) &&
      isServablePublicImage(src)
    ) {
      return src;
    }
  } catch {
    /* bundle */
  }
  return null;
}

export async function loadPortfolioCityOptionsLive() {
  const projects = await loadPortfolioProjectsLive();
  return buildPortfolioCityOptions(projects);
}
