import { useTranslations } from "next-intl";
import { AppLink } from "@/components/ui/AppLink";
import {
  SubcategoryWorksCarousel,
  type WorksPreviewImage,
} from "@/components/catalog/SubcategoryWorksCarousel";
import { getProductSubcategoryPath } from "@/lib/catalog";
import { CATALOG_NS } from "@/lib/i18n/namespaces";
import { type ProductKey } from "@/lib/catalog";

type SubcategoryCardProps = {
  category: ProductKey;
  subcategory: string;
  /** Obras / referencias (o portada de producto como fallback). */
  worksImages?: WorksPreviewImage[];
};

export function SubcategoryCard({
  category,
  subcategory,
  worksImages = [],
}: SubcategoryCardProps) {
  const t = useTranslations(CATALOG_NS);
  const tSub = useTranslations(`${CATALOG_NS}.subcategories.${category}`);
  const title = tSub(`${subcategory}.title`);
  const description = tSub(`${subcategory}.description`);
  const href = getProductSubcategoryPath(category, subcategory);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-grey/30 bg-white transition-shadow hover:border-cornflower/40 hover:shadow-md motion-reduce:transition-none">
      {worksImages.length > 0 ? (
        <SubcategoryWorksCarousel images={worksImages} label={title} />
      ) : null}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <AppLink href={href} className="flex flex-1 flex-col outline-none">
          <h3 className="text-base font-semibold text-navy transition-colors group-hover:text-cornflower-ink">
            {title}
          </h3>
          <p className="mt-2 line-clamp-4 flex-1 text-sm leading-relaxed text-grey-dark">
            {description}
          </p>
          <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-wider text-cornflower-ink">
            {t("hub.viewDetail")} →
          </span>
        </AppLink>
      </div>
    </article>
  );
}
