import Image from "next/image";
import { useTranslations } from "next-intl";
import { AppLink } from "@/components/ui/AppLink";
import { getProductImage } from "@/lib/assets";
import { getProductCategoryPath } from "@/lib/catalog";
import { CATALOG_NS } from "@/lib/i18n/namespaces";
import { type ProductKey } from "@/lib/catalog";

type CategoryCardProps = {
  category: ProductKey;
};

export function CategoryCard({ category }: CategoryCardProps) {
  const t = useTranslations(CATALOG_NS);
  const imageSrc = getProductImage(category);

  return (
    <AppLink
      href={getProductCategoryPath(category)}
      className="group block overflow-hidden rounded-lg border border-grey/30 bg-white transition-shadow hover:shadow-lg motion-reduce:transition-none"
    >
      {imageSrc ? (
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={imageSrc}
            alt={t(`categories.${category}.title`)}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent"
            aria-hidden="true"
          />
          <div className="absolute bottom-0 p-5">
            <h2 className="line-clamp-2 text-base font-semibold text-white sm:text-lg">
              {t(`categories.${category}.title`)}
            </h2>
          </div>
        </div>
      ) : (
        <div className="border-b border-grey/20 bg-navy px-5 py-4">
          <h2 className="text-lg font-semibold text-white">
            {t(`categories.${category}.title`)}
          </h2>
        </div>
      )}
      <div className="p-5">
        <p className="text-sm leading-relaxed text-grey-dark">
          {t(`categories.${category}.description`)}
        </p>
        <span className="mt-3 inline-block text-sm font-semibold text-cornflower-ink group-hover:text-action">
          {t("hub.viewCategory")} →
        </span>
      </div>
    </AppLink>
  );
}
