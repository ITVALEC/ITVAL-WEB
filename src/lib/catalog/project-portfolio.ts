import manifest from "./project-portfolio.json";
import type { ProductKey } from "./types";
import { filterImageSrcList, isBlockedImageSrc } from "./blocked-images";
import {
  buildPortfolioCityOptions,
  normalizePortfolioCity,
} from "./project-city";
import { pickProjectCoverIndex, resolveProjectCover } from "./project-cover";

export type PortfolioProject = {
  id: string;
  name: string;
  city: string;
  location: string;
  year: number | null;
  folder: string;
  productCategory: ProductKey;
  productSubcategory: string;
  cover: string;
  gallery: string[];
  imageCount: number;
  featured: boolean;
  coverIndex?: number | null;
};

type ProjectPortfolioManifest = {
  generatedAt: string;
  source: string;
  missionImage: string | null;
  cities: string[];
  categories: string[];
  projects: PortfolioProject[];
};

const data = manifest as ProjectPortfolioManifest;

function sanitizeProject(project: PortfolioProject): PortfolioProject | null {
  const gallery = filterImageSrcList(project.gallery);
  if (gallery.length === 0) return null;

  const coverIndex =
    project.coverIndex ?? pickProjectCoverIndex(gallery);
  const cover = resolveProjectCover(gallery, coverIndex);
  const city = normalizePortfolioCity(project.city, project.folder);
  const location = `${city}, Ecuador`;

  return {
    ...project,
    city,
    location,
    coverIndex,
    cover,
    gallery,
    imageCount: gallery.length,
  };
}

const sanitizedProjects = data.projects
  .map(sanitizeProject)
  .filter((project): project is PortfolioProject => project !== null);

export const PORTFOLIO_MISSION_IMAGE =
  data.missionImage && !isBlockedImageSrc(data.missionImage)
    ? data.missionImage
    : null;

export const PORTFOLIO_CITIES = buildPortfolioCityOptions(sanitizedProjects).map(
  (entry) => entry.city,
);

export const PORTFOLIO_CITY_OPTIONS = buildPortfolioCityOptions(
  sanitizedProjects,
);

export const PORTFOLIO_CATEGORIES = [
  ...new Set(sanitizedProjects.map((project) => project.productCategory)),
].sort();

export const PORTFOLIO_PROJECTS: readonly PortfolioProject[] = sanitizedProjects;

export function getPortfolioProjectById(
  id: string,
): PortfolioProject | undefined {
  return PORTFOLIO_PROJECTS.find((project) => project.id === id);
}

export function isPortfolioProjectId(id: string): boolean {
  return getPortfolioProjectById(id) !== undefined;
}

export function getFeaturedPortfolioProjects(): readonly PortfolioProject[] {
  return PORTFOLIO_PROJECTS.filter((project) => project.featured);
}

export function filterPortfolioProjects(options: {
  city?: string;
  category?: string;
}): readonly PortfolioProject[] {
  return PORTFOLIO_PROJECTS.filter((project) => {
    if (options.city && options.city !== "all" && project.city !== options.city) {
      return false;
    }
    if (
      options.category &&
      options.category !== "all" &&
      project.productCategory !== options.category
    ) {
      return false;
    }
    return true;
  });
}
