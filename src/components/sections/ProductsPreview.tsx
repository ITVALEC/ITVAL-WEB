import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryCarousel } from "@/components/catalog/CategoryCarousel";
import { AppLink } from "@/components/ui/AppLink";
import { PRODUCT_KEYS } from "@/lib/catalog";
import { NAV_PATHS } from "@/lib/routes";
import { CATALOG_NS } from "@/lib/i18n/namespaces";

export function ProductsPreview() {
  const t = useTranslations("products");
  const tHub = useTranslations(`${CATALOG_NS}.hub`);

  return (
    <section className="bg-white py-16 lg:py-24" aria-labelledby="products-heading">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            id="products-heading"
            title={t("title")}
            subtitle={t("subtitle")}
          />
          <AppLink
            href={NAV_PATHS.products}
            className="shrink-0 rounded-sm text-sm font-semibold text-cornflower-ink transition-colors hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower"
          >
            {tHub("viewCategory")} →
          </AppLink>
        </div>
        <CategoryCarousel
          categories={PRODUCT_KEYS}
          navLabel={t("carouselNav")}
          previousLabel={t("previous")}
          nextLabel={t("next")}
        />
      </Container>
    </section>
  );
}
