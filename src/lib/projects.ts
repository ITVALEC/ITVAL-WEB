import {
  filterPortfolioProjects,
  getFeaturedPortfolioProjects,
  getPortfolioProjectById,
  type PortfolioProject,
} from "./catalog/project-portfolio";

export type Project = PortfolioProject;

export const PROJECTS: readonly Project[] = filterPortfolioProjects({});

export function getProjectImage(project: Project | string): string {
  const entry =
    typeof project === "string" ? getPortfolioProjectById(project) : project;
  return entry?.cover ?? "/images/pages/projects.svg";
}

export function getProjectGallery(id: string): readonly string[] {
  return getPortfolioProjectById(id)?.gallery ?? [];
}

export function getFeaturedProjects(): readonly Project[] {
  return getFeaturedPortfolioProjects();
}

export function getProjectsByFilters(
  city?: string,
  category?: string,
): readonly Project[] {
  return filterPortfolioProjects({ city, category });
}

export {
  getPortfolioProjectById,
  isPortfolioProjectId as isPortfolioProjectId,
  PORTFOLIO_CITIES,
  PORTFOLIO_CITY_OPTIONS,
  PORTFOLIO_CATEGORIES,
  PORTFOLIO_MISSION_IMAGE,
} from "./catalog/project-portfolio";
