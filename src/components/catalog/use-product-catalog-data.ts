import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { PRODUCT_LIST_ITEM_KEYS } from "@/lib/content-keys";
import { CATALOG_NS } from "@/lib/i18n/namespaces";
import {
  getProductFilterMeta,
  type ProductFilterMeta,
} from "@/lib/catalog/filter-meta";
import { listPublishedProductEntries } from "@/lib/catalog/queries";
import { normalizeSearchText } from "@/lib/catalog/filter-products";
import { type ProductKey } from "@/lib/catalog/types";

export type ProductIndexItem = {
  category: ProductKey;
  subcategory: string;
  meta: ProductFilterMeta;
  searchText: string;
};

export function useProductCatalogData(): ProductIndexItem[] {
  const t = useTranslations(CATALOG_NS);

  return useMemo(() => {
    return listPublishedProductEntries().map(({ category, subcategory }) => {
      const meta = getProductFilterMeta(category, subcategory);

      const title = t(`subcategories.${category}.${subcategory}.title`);
      const description = t(
        `subcategories.${category}.${subcategory}.description`,
      );
      const materials = t(`subcategories.${category}.${subcategory}.materials`);
      const categoryTitle = t(`categories.${category}.title`);

      const sectorLabels = meta.sectors.map((key) => t(`explorer.sectors.${key}`));
      const materialLabels = meta.materials.map((key) =>
        t(`explorer.materials.${key}`),
      );
      const systemLabels = meta.systems.map((key) => t(`explorer.systems.${key}`));
      const applicationLabels = meta.applications.map((key) =>
        t(`explorer.applications.${key}`),
      );
      const applicationItems = PRODUCT_LIST_ITEM_KEYS.map((key) =>
        t(`subcategories.${category}.${subcategory}.applications.${key}`),
      );

      const searchText = normalizeSearchText(
        [
          title,
          description,
          materials,
          categoryTitle,
          ...sectorLabels,
          ...materialLabels,
          ...systemLabels,
          ...applicationLabels,
          ...applicationItems,
          ...meta.tags,
          category,
          subcategory,
        ].join(" "),
      );

      return { category, subcategory, meta, searchText };
    });
  }, [t]);
}

export function productEntryId(item: Pick<ProductIndexItem, "category" | "subcategory">): string {
  return `${item.category}/${item.subcategory}`;
}
