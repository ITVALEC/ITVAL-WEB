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
  /** URL viva desde el servidor; si falta, se usa el manifiesto del build. */
  imageSrc?: string;
};

export function ProductSolutionCard({
  category,
  subcategory,
  imageSrc: imageSrcProp,
}: ProductSolutionCardProps) {
  const t = useTranslations(CATALOG_NS);
  const title = t(`subcategories.${category}.${subcategory}.title`);
  const description = t(
    `subcategories.${category}.${subcategory}.description`,
  );
  const categoryLabel = t(`categories.${category}.title`);
  const imageSrc = imageSrcProp ?? getProductImage(category, subcategory);

  return (
    <AppLink
      href={getProductSubcategoryPath(category, subcategory)}
      className="group ds-card ds-card-hover flex h-full flex-col overflow-hidden"
    >
      {imageSrc ? (
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover transition-transform duration-ds group-hover:scale-105 motion-reduce:transform-none"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-navy-dark/75 via-navy-dark/15 to-transparent"
            aria-hidden="true"
          />
          <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-pill bg-navy px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white sm:left-4 sm:top-4 sm:max-w-[75%] sm:px-3 sm:text-xs">
            {categoryLabel}
          </span>
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <h3 className="line-clamp-2 font-display text-base font-bold text-white sm:text-lg">
              {title}
            </h3>
          </div>
        </div>
      ) : (
        <div className="border-b border-surface-muted bg-navy px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">
            {categoryLabel}
          </p>
          <h3 className="mt-1 font-display text-lg font-bold text-white">
            {title}
          </h3>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-3 flex-1 text-ds-caption leading-[1.5] text-ink/80">
          {description}
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-ds-caption font-semibold uppercase tracking-[0.12em] text-gold-deep transition-colors duration-ds group-hover:text-navy">
          {t("hub.viewDetail")}
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </AppLink>
  );
}
