import type { ProductKey } from "./types";
import type { PortfolioProject } from "./project-portfolio";

/** Grupos de solución alineados al negocio ITVAL (no IDs técnicos del catálogo). */
export const PROJECT_SOLUTION_GROUPS = [
  "facades",
  "doors",
  "security",
  "exteriors",
] as const;

export type ProjectSolutionGroup = (typeof PROJECT_SOLUTION_GROUPS)[number];

export type ProjectPeriod = "all" | "2020s" | "2015s" | "2010s" | "legacy";

const GROUP_CATEGORIES: Record<
  ProjectSolutionGroup,
  readonly ProductKey[]
> = {
  facades: ["facades"],
  doors: ["doorsAccess", "automaticDoors"],
  security: ["security"],
  exteriors: ["coversExteriors"],
};

export function projectMatchesSolutionGroup(
  project: PortfolioProject,
  group: ProjectSolutionGroup | "all",
): boolean {
  if (group === "all") return true;
  return GROUP_CATEGORIES[group].includes(project.productCategory);
}

export function projectMatchesPeriod(
  project: PortfolioProject,
  period: ProjectPeriod,
): boolean {
  if (period === "all" || project.year === null) return period === "all";
  if (period === "2020s") return project.year >= 2020;
  if (period === "2015s") return project.year >= 2015 && project.year <= 2019;
  if (period === "2010s") return project.year >= 2010 && project.year <= 2014;
  return project.year < 2010;
}

export type ProjectFilterState = {
  solution: ProjectSolutionGroup | "all";
  city: string;
  period: ProjectPeriod;
};

export function filterProjectsByState(
  projects: readonly PortfolioProject[],
  filters: ProjectFilterState,
): PortfolioProject[] {
  return projects.filter((project) => {
    if (!projectMatchesSolutionGroup(project, filters.solution)) {
      return false;
    }
    if (filters.city !== "all" && project.city !== filters.city) {
      return false;
    }
    if (!projectMatchesPeriod(project, filters.period)) {
      return false;
    }
    return true;
  });
}

function countBy<T extends string>(
  items: readonly PortfolioProject[],
  getKey: (project: PortfolioProject) => T | null,
): Array<{ value: T; count: number }> {
  const map = new Map<T, number>();
  for (const item of items) {
    const key = getKey(item);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([value, count]) => ({ value, count }));
}

export function buildProjectFilterOptions(
  projects: readonly PortfolioProject[],
  filters: ProjectFilterState,
) {
  const baseForSolution = projects.filter((project) =>
    projectMatchesSolutionGroup(project, filters.solution),
  );

  const baseForCity =
    filters.city === "all"
      ? baseForSolution
      : baseForSolution.filter((project) => project.city === filters.city);

  const solutionOptions = PROJECT_SOLUTION_GROUPS.map((group) => ({
    value: group,
    count: projects.filter((project) =>
      projectMatchesSolutionGroup(project, group),
    ).length,
  })).filter((option) => option.count > 0);

  const cityOptions = countBy(baseForSolution, (project) => project.city);

  const periodOptions: Array<{ value: Exclude<ProjectPeriod, "all">; count: number }> =
    [];

  for (const period of ["2020s", "2015s", "2010s", "legacy"] as const) {
    const count = baseForCity.filter((project) =>
      projectMatchesPeriod(project, period),
    ).length;
    if (count > 0) {
      periodOptions.push({ value: period, count });
    }
  }

  return {
    solutionOptions,
    cityOptions,
    periodOptions,
    total: projects.length,
  };
}

export function isValidCityForFilters(
  projects: readonly PortfolioProject[],
  filters: ProjectFilterState,
  city: string,
): boolean {
  if (city === "all") return true;
  return buildProjectFilterOptions(projects, {
    ...filters,
    city: "all",
  }).cityOptions.some((option) => option.value === city);
}

export function getProjectSolutionGroup(
  project: PortfolioProject,
): ProjectSolutionGroup | null {
  for (const group of PROJECT_SOLUTION_GROUPS) {
    if (projectMatchesSolutionGroup(project, group)) {
      return group;
    }
  }
  return null;
}

export function isValidPeriodForFilters(
  projects: readonly PortfolioProject[],
  filters: ProjectFilterState,
  period: ProjectPeriod,
): boolean {
  if (period === "all") return true;
  const base = filterProjectsByState(projects, {
    ...filters,
    period: "all",
  });
  return base.some((project) => projectMatchesPeriod(project, period));
}

export type ActiveFilterChip = {
  key: string;
  labelKey: string;
  labelValues?: Record<string, string | number>;
};

export function getActiveProjectFilterChips(
  filters: ProjectFilterState,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.solution !== "all") {
    chips.push({
      key: "solution",
      labelKey: "filters.solutions." + filters.solution,
    });
  }
  if (filters.city !== "all") {
    chips.push({
      key: "city",
      labelKey: "filters.chipCity",
      labelValues: { city: filters.city },
    });
  }
  if (filters.period !== "all") {
    chips.push({
      key: "period",
      labelKey: "filters.periods." + filters.period,
    });
  }

  return chips;
}
