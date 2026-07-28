import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryCarousel } from "@/components/catalog/CategoryCarousel";
import { AppLink } from "@/components/ui/AppLink";
import { PRODUCT_KEYS } from "@/lib/catalog";
import { NAV_PATHS } from "@/lib/routes";
import { accentLastWords } from "@/components/ui/AccentText";

export function ProductsPreview() {
  const t = useTranslations("products");
  const tc = useTranslations("common");
  const title = t("title");

  return (
    <section
      className="bg-surface py-section"
      aria-labelledby="products-heading"
    >
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            id="products-heading"
            title={title}
            subtitle={t("subtitle")}
            accent={accentLastWords(title, 1)}
            rule={false}
          />
          <AppLink
            href={NAV_PATHS.products}
            className="shrink-0 rounded-pill text-ds-caption font-semibold uppercase tracking-[0.14em] text-gold-deep transition-colors duration-ds hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {tc("viewProducts")} →
          </AppLink>
        </div>
        <CategoryCarousel
          categories={PRODUCT_KEYS}
          navLabel={t("carouselNav")}
          previousLabel={t("previous")}
          nextLabel={t("next")}
          variant="service"
        />
      </Container>
    </section>
  );
}
