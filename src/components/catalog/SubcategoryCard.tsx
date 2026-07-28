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
    <article className="group ds-card ds-card-hover flex h-full flex-col overflow-hidden">
      {worksImages.length > 0 ? (
        <SubcategoryWorksCarousel images={worksImages} label={title} />
      ) : null}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <AppLink href={href} className="flex flex-1 flex-col outline-none">
          <h3 className="font-display text-base font-semibold text-navy transition-colors duration-ds group-hover:text-gold-deep sm:text-lg">
            {title}
          </h3>
          <p className="mt-2 line-clamp-4 flex-1 text-ds-caption leading-[1.5] text-ink/80">
            {description}
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-ds-caption font-semibold uppercase tracking-[0.12em] text-gold-deep transition-colors duration-ds group-hover:text-navy">
            {t("hub.viewDetail")}
            <span aria-hidden="true">→</span>
          </span>
        </AppLink>
      </div>
    </article>
  );
}
