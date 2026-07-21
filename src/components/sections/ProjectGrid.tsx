"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { PageHeroImage } from "@/components/sections/PageHeroImage";
import { PROJECTS, getFeaturedProjects } from "@/lib/projects";
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

const PAGE_SIZE = 9;

const selectClass =
  "mt-1.5 block w-full rounded-lg border border-grey/40 bg-white px-3 py-2.5 text-sm text-navy focus:border-cornflower focus:outline-none focus:ring-2 focus:ring-cornflower/30";

function pillClass(active: boolean): string {
  return `rounded-full px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2 motion-reduce:transition-none sm:px-4 sm:text-sm ${
    active
      ? "bg-navy text-white shadow-sm"
      : "border border-grey/40 bg-white text-grey-dark hover:border-navy hover:text-navy"
  }`;
}

export function ProjectGrid() {
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
    () => buildProjectFilterOptions(PROJECTS, filters),
    [filters],
  );

  const filtered = useMemo(
    () => filterProjectsByState(PROJECTS, filters),
    [filters],
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
      if (!isValidCityForFilters(PROJECTS, next, next.city)) next.city = "all";
      if (!isValidPeriodForFilters(PROJECTS, next, next.period)) {
        next.period = "all";
      }
      return next;
    });
    setPage(1);
  }

  function updateCity(city: string) {
    setFilters((current) => {
      const next = { ...current, city };
      if (!isValidPeriodForFilters(PROJECTS, next, next.period)) {
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

  const heroImage =
    getFeaturedProjects()[0]?.cover ?? "/images/pages/projects.svg";

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
      <section className="py-12 lg:py-20" aria-labelledby="projects-grid-heading">
        <Container>
          <h2 id="projects-grid-heading" className="sr-only">
            {t("title")}
          </h2>

          <div className="rounded-2xl border border-grey/25 bg-gradient-to-b from-slate-50 to-white p-4 shadow-sm sm:p-6 lg:p-8">
            <div className="space-y-5 lg:space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-grey-dark">
                  {t("filters.solutionLabel")}
                </p>
                <div
                  className="-mx-1 mt-2 flex gap-2 overflow-x-auto pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible"
                  role="group"
                  aria-label={t("filters.solutionLabel")}
                >
                  <button
                    type="button"
                    onClick={() => updateSolution("all")}
                    aria-pressed={filters.solution === "all"}
                    className={`shrink-0 ${pillClass(filters.solution === "all")}`}
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
                      className={`shrink-0 ${pillClass(filters.solution === option.value)}`}
                    >
                      {t(`filters.solutions.${option.value}`)}{" "}
                      <span className="opacity-80">({option.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="project-city-filter"
                    className="block text-xs font-semibold uppercase tracking-wider text-grey-dark"
                  >
                    {t("filters.cityLabel")}
                  </label>
                  {filters.solution !== "all" ? (
                    <p className="mt-1 text-xs text-grey">
                      {t("filters.cityHintForSolution", {
                        solution: t(`filters.solutions.${filters.solution}`),
                      })}
                    </p>
                  ) : null}
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
                <div>
                  <label
                    htmlFor="project-period-filter"
                    className="block text-xs font-semibold uppercase tracking-wider text-grey-dark"
                  >
                    {t("filters.periodLabel")}
                  </label>
                  <p className="mt-1 text-xs text-grey">{t("filters.periodHint")}</p>
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

              <div className="rounded-xl border border-grey/20 bg-white px-4 py-3 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div aria-live="polite">
                    <p className="text-sm font-semibold text-navy">
                      {hasActiveFilters
                        ? t("resultsFiltered", {
                            count: filtered.length,
                            total: PROJECTS.length,
                          })
                        : t("resultsAll", { total: PROJECTS.length })}
                    </p>
                    {paginated.length > 0 && filtered.length > PAGE_SIZE ? (
                      <p className="mt-1 text-xs text-grey-dark">
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
                      className="self-start text-sm font-semibold text-cornflower-ink hover:text-action sm:self-auto"
                    >
                      {t("filters.clear")}
                    </button>
                  ) : null}
                </div>

                {activeChips.length > 0 ? (
                  <div
                    className="mt-3 flex flex-wrap gap-2 border-t border-grey/15 pt-3"
                    role="list"
                    aria-label={t("filters.activeLabel")}
                  >
                    {activeChips.map((chip) => (
                      <span
                        key={chip.key}
                        role="listitem"
                        className="inline-flex rounded-full bg-cornflower/10 px-3 py-1 text-xs font-medium text-navy"
                      >
                        {chip.labelValues
                          ? t(chip.labelKey, chip.labelValues)
                          : t(chip.labelKey)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {paginated.length === 0 ? (
            <div
              className="mt-8 rounded-xl border border-dashed border-grey/40 bg-white px-6 py-12 text-center sm:mt-10"
              role="status"
            >
              <p className="text-lg font-semibold text-navy">{t("empty")}</p>
              <p className="mt-2 text-sm text-grey-dark">{t("emptyHint")}</p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90"
                >
                  {t("filters.clear")}
                </button>
              ) : null}
            </div>
          ) : (
            <ul className="mt-8 grid gap-6 sm:mt-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
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
                className="rounded-full border border-grey/40 bg-white px-4 py-2 text-sm font-medium text-grey-dark transition-colors hover:border-navy hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("pagination.previous")}
              </button>
              <span className="text-sm text-grey-dark">
                {t("pagination.page", {
                  current: currentPage,
                  total: totalPages,
                })}
              </span>
              <button
                type="button"
                onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-full border border-grey/40 bg-white px-4 py-2 text-sm font-medium text-grey-dark transition-colors hover:border-navy hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
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
