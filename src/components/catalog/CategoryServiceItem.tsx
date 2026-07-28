import { useTranslations } from "next-intl";
import { AppLink } from "@/components/ui/AppLink";
import { CategoryServiceIcon } from "@/components/catalog/CategoryServiceIcon";
import { getProductCategoryPath, type ProductKey } from "@/lib/catalog";
import { CATALOG_NS } from "@/lib/i18n/namespaces";

type CategoryServiceItemProps = {
  category: ProductKey;
};

export function CategoryServiceItem({ category }: CategoryServiceItemProps) {
  const t = useTranslations(CATALOG_NS);

  return (
    <AppLink
      href={getProductCategoryPath(category)}
      className="group flex h-full flex-col items-start gap-3 rounded-card px-1 py-2 transition-colors duration-ds focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <CategoryServiceIcon category={category} />
      <h3 className="font-display text-lg font-bold text-navy transition-colors duration-ds group-hover:text-gold-deep">
        {t(`categories.${category}.title`)}
      </h3>
      <p className="text-ds-caption leading-[1.5] text-ink/80 line-clamp-3">
        {t(`categories.${category}.description`)}
      </p>
    </AppLink>
  );
}
