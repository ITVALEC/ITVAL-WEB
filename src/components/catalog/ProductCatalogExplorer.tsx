"use client";

import { useEffect, useMemo, useRef, useState, useId } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { ProductSolutionCard } from "@/components/catalog/ProductSolutionCard";
import { useProductCatalogData } from "@/components/catalog/use-product-catalog-data";
import { CATALOG_NS } from "@/lib/i18n/namespaces";
import { filterProductCatalog } from "@/lib/catalog/filter-products";
import { CATALOG_PAGE_SIZE, paginateItems } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";
import {
  APPLICATION_KEYS,
  MATERIAL_KEYS,
  PRIMARY_GROUPS,
  SECTOR_KEYS,
  SYSTEM_KEYS,
  type ApplicationKey,
  type MaterialKey,
  type PrimaryGroup,
  type SectorKey,
  type SystemKey,
} from "@/lib/catalog/filter-keys";

type SecondaryFilter = "all" | string;

function pillClass(active: boolean): string {
  return `shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2 motion-reduce:transition-none sm:px-4 sm:text-sm ${
    active
      ? "bg-navy text-white shadow-sm"
      : "border border-grey/40 bg-white text-grey-dark hover:border-navy hover:text-navy"
  }`;
}

const selectClass =
  "mt-1 block w-full rounded-md border border-grey/40 bg-white px-3 py-2.5 text-sm text-navy focus:border-cornflower focus:outline-none focus:ring-2 focus:ring-cornflower/30";

function isPrimaryGroup(value: string | null | undefined): value is PrimaryGroup {
  return Boolean(value && (PRIMARY_GROUPS as readonly string[]).includes(value));
}

type ProductCatalogExplorerProps = {
  initialPrimary?: string;
};

export function ProductCatalogExplorer({
  initialPrimary,
}: ProductCatalogExplorerProps) {
  const t = useTranslations(`${CATALOG_NS}.explorer`);
  const products = useProductCatalogData();
  const searchParams = useSearchParams();

  const primaryFromUrl = searchParams.get("primary");
  const resolvedInitial: PrimaryGroup = isPrimaryGroup(primaryFromUrl)
    ? primaryFromUrl
    : isPrimaryGroup(initialPrimary)
      ? initialPrimary
      : "all";

  const [query, setQuery] = useState("");
  const [primary, setPrimary] = useState<PrimaryGroup>(resolvedInitial);
  const [sector, setSector] = useState<SecondaryFilter>("all");
  const [material, setMaterial] = useState<SecondaryFilter>("all");
  const [system, setSystem] = useState<SecondaryFilter>("all");
  const [application, setApplication] = useState<SecondaryFilter>("all");
  const [page, setPage] = useState(1);

  const searchId = useId();
  const resultsId = useId();
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPrimaryGroup(primaryFromUrl) && primaryFromUrl !== primary) {
      setPrimary(primaryFromUrl);
      setPage(1);
    }
  }, [primaryFromUrl, primary]);

  const trimmedQuery = query.trim();

  const filtered = useMemo(
    () =>
      filterProductCatalog(products, {
        query: trimmedQuery,
        primary,
        sector: sector as SectorKey | "all",
        material: material as MaterialKey | "all",
        system: system as SystemKey | "all",
        application: application as ApplicationKey | "all",
      }),
    [products, primary, sector, material, system, application, trimmedQuery],
  );

  useEffect(() => {
    setPage(1);
  }, [primary, sector, material, system, application, trimmedQuery]);

  const paginated = useMemo(
    () => paginateItems(filtered, page, CATALOG_PAGE_SIZE),
    [filtered, page],
  );

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const hasActiveFilters =
    primary !== "all" ||
    sector !== "all" ||
    material !== "all" ||
    system !== "all" ||
    application !== "all" ||
    trimmedQuery.length > 0;

  const clearFilters = () => {
    setQuery("");
    setPrimary("all");
    setSector("all");
    setMaterial("all");
    setSystem("all");
    setApplication("all");
    setPage(1);
  };

  type ActiveChip = { key: string; label: string; onRemove: () => void };

  const activeChips: ActiveChip[] = [];

  if (primary !== "all") {
    activeChips.push({
      key: `primary-${primary}`,
      label: t(`primary.${primary}`),
      onRemove: () => setPrimary("all"),
    });
  }
  if (sector !== "all") {
    activeChips.push({
      key: `sector-${sector}`,
      label: t(`sectors.${sector}`),
      onRemove: () => setSector("all"),
    });
  }
  if (material !== "all") {
    activeChips.push({
      key: `material-${material}`,
      label: t(`materials.${material}`),
      onRemove: () => setMaterial("all"),
    });
  }
  if (system !== "all") {
    activeChips.push({
      key: `system-${system}`,
      label: t(`systems.${system}`),
      onRemove: () => setSystem("all"),
    });
  }
  if (application !== "all") {
    activeChips.push({
      key: `application-${application}`,
      label: t(`applications.${application}`),
      onRemove: () => setApplication("all"),
    });
  }
  if (trimmedQuery) {
    activeChips.push({
      key: "query",
      label: `“${trimmedQuery}”`,
      onRemove: () => setQuery(""),
    });
  }

  // Solo se ofrecen grupos y opciones presentes en el catálogo publicado,
  // para que los filtros siempre sean coherentes con las categorías reales.
  const available = useMemo(() => {
    const groups = new Set<Exclude<PrimaryGroup, "all">>();
    const sectors = new Set<SectorKey>();
    const materials = new Set<MaterialKey>();
    const systems = new Set<SystemKey>();
    const applications = new Set<ApplicationKey>();

    for (const item of products) {
      groups.add(item.meta.primaryGroup);
      for (const key of item.meta.sectors) sectors.add(key);
      for (const key of item.meta.materials) materials.add(key);
      for (const key of item.meta.systems) systems.add(key);
      for (const key of item.meta.applications) applications.add(key);
    }

    return {
      primaryGroups: PRIMARY_GROUPS.filter(
        (group): group is Exclude<PrimaryGroup, "all"> =>
          group !== "all" && groups.has(group as Exclude<PrimaryGroup, "all">),
      ),
      sectors: SECTOR_KEYS.filter((key) => sectors.has(key)),
      materials: MATERIAL_KEYS.filter((key) => materials.has(key)),
      systems: SYSTEM_KEYS.filter((key) => systems.has(key)),
      applications: APPLICATION_KEYS.filter((key) => applications.has(key)),
    };
  }, [products]);

  const primaryGroups = available.primaryGroups;

  const advancedFilters = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <FilterSelect
        id={`${searchId}-sector`}
        label={t("sectorLabel")}
        value={sector}
        onChange={setSector}
        options={available.sectors.map((key) => ({
          value: key,
          label: t(`sectors.${key}`),
        }))}
        allLabel={t("allOption")}
      />
      <FilterSelect
        id={`${searchId}-material`}
        label={t("materialLabel")}
        value={material}
        onChange={setMaterial}
        options={available.materials.map((key) => ({
          value: key,
          label: t(`materials.${key}`),
        }))}
        allLabel={t("allOption")}
      />
      <FilterSelect
        id={`${searchId}-system`}
        label={t("systemLabel")}
        value={system}
        onChange={setSystem}
        options={available.systems.map((key) => ({
          value: key,
          label: t(`systems.${key}`),
        }))}
        allLabel={t("allOption")}
      />
      <FilterSelect
        id={`${searchId}-application`}
        label={t("applicationLabel")}
        value={application}
        onChange={setApplication}
        options={available.applications.map((key) => ({
          value: key,
          label: t(`applications.${key}`),
        }))}
        allLabel={t("allOption")}
      />
    </div>
  );

  return (
    <section
      id="catalog-explorer"
      className="scroll-mt-24 py-12 lg:py-16"
      aria-labelledby="catalog-explorer-heading"
    >
      <Container>
        <h2 id="catalog-explorer-heading" className="sr-only">
          {t("sectionTitle")}
        </h2>

        <div className="rounded-xl border border-grey/30 bg-slate-50/80 p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor={searchId} className="block text-sm font-semibold text-navy">
                {t("searchLabel")}
              </label>
              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="mt-2 block w-full rounded-lg border border-grey/40 bg-white px-4 py-3 text-navy placeholder:text-grey focus:border-cornflower focus:outline-none focus:ring-2 focus:ring-cornflower/30"
                autoComplete="off"
                enterKeyHint="search"
              />
            </div>

            <div className="-mx-1 overflow-x-auto pb-1 sm:mx-0 sm:overflow-visible sm:pb-0">
              <div
                role="group"
                aria-label={t("primaryLabel")}
                className="flex w-max gap-2 sm:w-auto sm:flex-wrap"
              >
              <button
                type="button"
                onClick={() => setPrimary("all")}
                aria-pressed={primary === "all"}
                className={pillClass(primary === "all")}
              >
                {t("primary.all")}
              </button>
              {primaryGroups.map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setPrimary(group)}
                  aria-pressed={primary === group}
                  className={pillClass(primary === group)}
                >
                  {t(`primary.${group}`)}
                </button>
              ))}
              </div>
            </div>

            <details className="group rounded-lg border border-grey/30 bg-white lg:hidden">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  {t("advancedFilters")}
                  <span
                    className="text-cornflower-ink transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </span>
              </summary>
              <div className="border-t border-grey/20 px-4 pb-4 pt-3">
                {advancedFilters}
              </div>
            </details>

            <div className="hidden lg:block">{advancedFilters}</div>

            <div
              className="flex flex-col gap-3 border-t border-grey/20 pt-4 sm:flex-row sm:items-center sm:justify-between"
              aria-live="polite"
              aria-atomic="true"
            >
              <p id={resultsId} className="text-sm font-medium text-navy">
                {t("resultsCount", { count: filtered.length })}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="self-start rounded-md text-sm font-semibold text-cornflower-ink hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2 sm:self-auto"
                >
                  {t("clearFilters")}
                </button>
              )}
            </div>

            {activeChips.length > 0 && (
              <div
                className="flex flex-wrap items-center gap-2"
                role="list"
                aria-label={t("activeFilters")}
              >
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    role="listitem"
                    onClick={chip.onRemove}
                    className="inline-flex items-center gap-1.5 rounded-full border border-cornflower/40 bg-cornflower/10 px-3 py-1.5 text-xs font-medium text-navy hover:bg-cornflower/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2"
                    aria-label={t("removeFilter", { filter: chip.label })}
                  >
                    <span>{chip.label}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10" ref={resultsRef} aria-describedby={resultsId}>
          {filtered.length === 0 ? (
            <div
              className="rounded-lg border border-dashed border-grey/40 bg-white px-6 py-16 text-center"
              role="status"
            >
              <p className="text-lg font-semibold text-navy">{t("emptyTitle")}</p>
              <p className="mt-2 text-sm text-grey-dark">{t("emptyHint")}</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2"
                >
                  {t("clearFilters")}
                </button>
              )}
            </div>
          ) : (
            <>
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginated.items.map((item) => (
                  <li key={`${item.category}-${item.subcategory}`}>
                    <ProductSolutionCard
                      category={item.category}
                      subcategory={item.subcategory}
                    />
                  </li>
                ))}
              </ul>
              <Pagination
                page={paginated.page}
                totalPages={paginated.totalPages}
                onPageChange={goToPage}
                labels={{
                  navLabel: t("paginationNav"),
                  previous: t("previousPage"),
                  next: t("nextPage"),
                  pageStatus: t("pageStatus", {
                    page: paginated.page,
                    totalPages: paginated.totalPages,
                  }),
                  goToPage: (p) => t("goToPage", { page: p }),
                  showingRange: t("showingRange", {
                    from: paginated.from,
                    to: paginated.to,
                    total: paginated.totalItems,
                  }),
                }}
              />
            </>
          )}
        </div>
      </Container>
    </section>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  id: string;
  label: string;
  value: SecondaryFilter;
  onChange: (value: SecondaryFilter) => void;
  options: { value: string; label: string }[];
  allLabel: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-grey-dark">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        <option value="all">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
