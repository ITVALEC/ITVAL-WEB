"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { PageHeroImage } from "@/components/sections/PageHeroImage";
import { PROJECTS, type Project } from "@/lib/projects";
import {
  buildProjectFilterOptions,
  filterProjectsByState,
  getActiveProjectFilterChips,
  isValidCityForFilters,
  isValidPeriodForFilters,
  type ProjectFilterState,
  type ProjectPeriod,
  type ProjectSolutionGroup,
} from "@/lib/catalog/project-filters";
import { breadcrumbTrail } from "@/lib/breadcrumbs";
import { isCatalogPlaceholderSrc } from "@/lib/media/placeholder-src";

const PAGE_SIZE = 9;

const selectClass =
  "mt-1 block w-full rounded-card border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";

function pillClass(active: boolean): string {
  return `inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-pill px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition-colors duration-ds focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 motion-reduce:transition-none sm:px-4 sm:text-ds-caption ${
    active
      ? "bg-navy text-white"
      : "border border-navy/15 bg-white text-ink/80 hover:border-gold hover:text-navy"
  }`;
}

type ProjectGridProps = {
  /** Obras vivas desde servidor; si falta, usa el manifiesto del build. */
  projects?: readonly Project[];
};

export function ProjectGrid({ projects: projectsProp }: ProjectGridProps) {
  const projects = projectsProp ?? PROJECTS;
  const t = useTranslations("projectsPage");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  const [filters, setFilters] = useState<ProjectFilterState>({
    solution: "all",
    city: "all",
    period: "all",
  });
  const [page, setPage] = useState(1);

  const filterOptions = useMemo(
    () => buildProjectFilterOptions(projects, filters),
    [filters, projects],
  );

  const filtered = useMemo(
    () => filterProjectsByState(projects, filters),
    [filters, projects],
  );

  const activeChips = useMemo(
    () => getActiveProjectFilterChips(filters),
    [filters],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const hasActiveFilters = activeChips.length > 0;

  function updateSolution(solution: ProjectSolutionGroup | "all") {
    setFilters((current) => {
      const next: ProjectFilterState = { ...current, solution };
      if (!isValidCityForFilters(projects, next, next.city)) next.city = "all";
      if (!isValidPeriodForFilters(projects, next, next.period)) {
        next.period = "all";
      }
      return next;
    });
    setPage(1);
  }

  function updateCity(city: string) {
    setFilters((current) => {
      const next = { ...current, city };
      if (!isValidPeriodForFilters(projects, next, next.period)) {
        next.period = "all";
      }
      return next;
    });
    setPage(1);
  }

  function clearFilters() {
    setFilters({ solution: "all", city: "all", period: "all" });
    setPage(1);
  }

  const featuredCover = projects.find((p) => p.featured)?.cover ?? projects[0]?.cover;
  const heroImage =
    featuredCover && !isCatalogPlaceholderSrc(featuredCover)
      ? featuredCover
      : "/images/pages/products.jpg";

  return (
    <>
      <PageHeroImage
        title={t("title")}
        subtitle={t("subtitle")}
        image={heroImage}
        imageAlt={t("title")}
        breadcrumbAriaLabel={tCommon("breadcrumbNav")}
        breadcrumbs={breadcrumbTrail(tNav("home"), [
          { label: tNav("projects") },
        ])}
      />
      <section className="bg-surface py-section" aria-labelledby="projects-grid-heading">
        <Container>
          <h2 id="projects-grid-heading" className="sr-only">
            {t("title")}
          </h2>

          <div className="rounded-card border border-navy/10 bg-white p-4 shadow-card sm:p-6 lg:p-8">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-navy">
                  {t("filters.solutionLabel")}
                </p>
                <div
                  className="mt-3 -mx-1 flex gap-2 overflow-x-auto pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible"
                  role="group"
                  aria-label={t("filters.solutionLabel")}
                >
                  <button
                    type="button"
                    onClick={() => updateSolution("all")}
                    aria-pressed={filters.solution === "all"}
                    className={pillClass(filters.solution === "all")}
                  >
                    {t("filters.allSolutions")}{" "}
                    <span className="opacity-80">({filterOptions.total})</span>
                  </button>
                  {filterOptions.solutionOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateSolution(option.value)}
                      aria-pressed={filters.solution === option.value}
                      className={pillClass(filters.solution === option.value)}
                    >
                      {t(`filters.solutions.${option.value}`)}{" "}
                      <span className="opacity-80">({option.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid items-end gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label
                    htmlFor="project-city-filter"
                    className="block text-sm font-semibold text-navy"
                  >
                    {t("filters.cityLabel")}
                  </label>
                  <p className="mt-1 min-h-4 text-xs text-grey">
                    {filters.solution !== "all"
                      ? t("filters.cityHintForSolution", {
                          solution: t(`filters.solutions.${filters.solution}`),
                        })
                      : "\u00a0"}
                  </p>
                  <select
                    id="project-city-filter"
                    value={filters.city}
                    onChange={(e) => updateCity(e.target.value)}
                    className={selectClass}
                  >
                    <option value="all">{t("filters.allCities")}</option>
                    {filterOptions.cityOptions.map(({ value, count }) => (
                      <option key={value} value={value}>
                        {t("filters.cityOption", { city: value, count })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label
                    htmlFor="project-period-filter"
                    className="block text-sm font-semibold text-navy"
                  >
                    {t("filters.periodLabel")}
                  </label>
                  <p className="mt-1 min-h-4 text-xs text-grey">
                    {t("filters.periodHint")}
                  </p>
                  <select
                    id="project-period-filter"
                    value={filters.period}
                    onChange={(e) => {
                      setFilters((c) => ({
                        ...c,
                        period: e.target.value as ProjectPeriod,
                      }));
                      setPage(1);
                    }}
                    className={selectClass}
                  >
                    <option value="all">{t("filters.allPeriods")}</option>
                    {filterOptions.periodOptions.map(({ value, count }) => (
                      <option key={value} value={value}>
                        {t("filters.periodOption", {
                          period: t(`filters.periods.${value}`),
                          count,
                        })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-navy/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div aria-live="polite">
                  <p className="text-sm font-medium text-navy">
                    {hasActiveFilters
                      ? t("resultsFiltered", {
                          count: filtered.length,
                          total: projects.length,
                        })
                      : t("resultsAll", { total: projects.length })}
                  </p>
                  {paginated.length > 0 && filtered.length > PAGE_SIZE ? (
                    <p className="mt-1 text-xs text-ink/70">
                      {t("resultsPageRange", {
                        from: (currentPage - 1) * PAGE_SIZE + 1,
                        to: Math.min(currentPage * PAGE_SIZE, filtered.length),
                        total: filtered.length,
                      })}
                    </p>
                  ) : null}
                </div>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="self-start rounded-card text-sm font-semibold text-gold-deep hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 sm:self-auto"
                  >
                    {t("filters.clear")}
                  </button>
                ) : null}
              </div>

              {activeChips.length > 0 ? (
                <div
                  className="flex flex-wrap items-center gap-2"
                  role="list"
                  aria-label={t("filters.activeLabel")}
                >
                  {activeChips.map((chip) => {
                    const label = chip.labelValues
                      ? t(chip.labelKey, chip.labelValues)
                      : t(chip.labelKey);
                    return (
                      <button
                        key={chip.key}
                        type="button"
                        role="listitem"
                        onClick={() => {
                          if (chip.key === "solution") updateSolution("all");
                          else if (chip.key === "city") updateCity("all");
                          else if (chip.key === "period") {
                            setFilters((c) => ({ ...c, period: "all" }));
                            setPage(1);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-pill border border-gold/35 bg-gold/10 px-3 py-1.5 text-xs font-medium text-navy hover:bg-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                        aria-label={t("filters.removeFilter", { filter: label })}
                      >
                        <span>{label}</span>
                        <span aria-hidden="true">×</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {paginated.length === 0 ? (
            <div
              className="mt-8 rounded-card border border-dashed border-navy/20 bg-white px-6 py-12 text-center sm:mt-10"
              role="status"
            >
              <p className="font-display text-lg font-semibold text-navy">{t("empty")}</p>
              <p className="mt-2 text-ds-caption text-ink/80">{t("emptyHint")}</p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-pill bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-mid"
                >
                  {t("filters.clear")}
                </button>
              ) : null}
            </div>
          ) : (
            <ul className="mt-8 grid gap-card-gap sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
              {paginated.map((project) => (
                <li key={project.id}>
                  <ProjectCard
                    project={project}
                    headingLevel="h3"
                    showYear
                    interactive
                    linkToDetail
                  />
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 ? (
            <nav
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
              aria-label={t("pagination.label")}
            >
              <button
                type="button"
                onClick={() => setPage((v) => Math.max(1, v - 1))}
                disabled={currentPage <= 1}
                className="rounded-pill border border-navy/15 bg-white px-4 py-2 text-sm font-medium text-ink/80 transition-colors hover:border-gold hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("pagination.previous")}
              </button>
              <span className="text-sm text-ink/80">
                {t("pagination.page", {
                  current: currentPage,
                  total: totalPages,
                })}
              </span>
              <button
                type="button"
                onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-pill border border-navy/15 bg-white px-4 py-2 text-sm font-medium text-ink/80 transition-colors hover:border-gold hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("pagination.next")}
              </button>
            </nav>
          ) : null}
        </Container>
      </section>
    </>
  );
}
