import { useTranslations } from "next-intl";
import { AppLink } from "@/components/ui/AppLink";
import { getProductSubcategoryPath } from "@/lib/catalog";
import { CATALOG_NS } from "@/lib/i18n/namespaces";
import { type ProductKey } from "@/lib/catalog";

type SubcategoryCardProps = {
  category: ProductKey;
  subcategory: string;
};

export function SubcategoryCard({ category, subcategory }: SubcategoryCardProps) {
  const t = useTranslations(CATALOG_NS);
  const tSub = useTranslations(`${CATALOG_NS}.subcategories.${category}`);

  return (
    <AppLink
      href={getProductSubcategoryPath(category, subcategory)}
      className="group block rounded-lg border border-grey/30 bg-white p-6 transition-shadow hover:border-cornflower/40 hover:shadow-md motion-reduce:transition-none"
    >
      <h3 className="text-base font-semibold text-navy group-hover:text-cornflower">
        {tSub(`${subcategory}.title`)}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-grey-dark">
        {tSub(`${subcategory}.description`)}
      </p>
      <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-wider text-cornflower">
        {t("hub.viewDetail")} →
      </span>
    </AppLink>
  );
}
