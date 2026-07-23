import Image from "next/image";
import { useTranslations } from "next-intl";
import { AppLink } from "@/components/ui/AppLink";
import { getProductImage } from "@/lib/assets";
import { getProductSubcategoryPath } from "@/lib/catalog";
import { CATALOG_NS } from "@/lib/i18n/namespaces";
import { type ProductKey } from "@/lib/catalog/types";

type ProductSolutionCardProps = {
  category: ProductKey;
  subcategory: string;
};

export function ProductSolutionCard({
  category,
  subcategory,
}: ProductSolutionCardProps) {
  const t = useTranslations(CATALOG_NS);
  const title = t(`subcategories.${category}.${subcategory}.title`);
  const description = t(
    `subcategories.${category}.${subcategory}.description`,
  );
  const categoryLabel = t(`categories.${category}.title`);
  const imageSrc = getProductImage(category, subcategory);

  return (
    <AppLink
      href={getProductSubcategoryPath(category, subcategory)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-grey/30 bg-white transition-shadow hover:border-cornflower/40 hover:shadow-lg motion-reduce:transition-none"
    >
      {imageSrc && (
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-navy/75 to-transparent"
            aria-hidden="true"
          />
          <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-navy/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm sm:left-4 sm:top-4 sm:max-w-[75%] sm:px-3 sm:text-xs">
            {categoryLabel}
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold text-navy group-hover:text-cornflower-ink sm:text-lg">
          {title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-grey-dark">
          {description}
        </p>
        <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-wider text-cornflower-ink">
          {t("hub.viewDetail")} →
        </span>
      </div>
    </AppLink>
  );
}
