"use client";

import { useTranslations } from "next-intl";
import { AppLink } from "@/components/ui/AppLink";
import { CATALOG_NS } from "@/lib/i18n/namespaces";
import { NAV_PATHS } from "@/lib/routes";
import {
  PRIMARY_GROUPS,
  type PrimaryGroup,
} from "@/lib/catalog/filter-keys";

const QUICK_GROUPS = PRIMARY_GROUPS.filter(
  (group): group is Exclude<PrimaryGroup, "all" | "other"> =>
    group !== "all" && group !== "other",
);

type CatalogQuickLinksProps = {
  /** Grupo activo (si viene de ?primary=). */
  active?: string;
};

/**
 * Atajos a líneas del catálogo en el hero de Productos.
 * Enlazan al explorador con el filtro primario ya aplicado (previsualización).
 */
export function CatalogQuickLinks({ active }: CatalogQuickLinksProps) {
  const t = useTranslations(`${CATALOG_NS}.explorer`);

  return (
    <nav aria-label={t("primaryLabel")} className="mt-6">
      <ul className="flex flex-wrap gap-2">
        {QUICK_GROUPS.map((group) => {
          const isActive = active === group;
          return (
            <li key={group}>
              <AppLink
                href={`${NAV_PATHS.products}?primary=${group}#catalog-explorer`}
                className={`inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy ${
                  isActive
                    ? "border-white bg-white text-navy"
                    : "border-white/45 bg-navy/70 text-white hover:border-white hover:bg-navy/90"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {t(`primary.${group}`)}
              </AppLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
