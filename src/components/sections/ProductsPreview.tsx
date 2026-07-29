import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { CategoryCarousel } from "@/components/catalog/CategoryCarousel";
import { AppLink } from "@/components/ui/AppLink";
import { PRODUCT_KEYS, type ProductKey } from "@/lib/catalog";
import { NAV_PATHS } from "@/lib/routes";
import { accentLastWords } from "@/components/ui/AccentText";
import { getProductImageLive } from "@/lib/catalog/product-images.server";

/** Home: carrusel de categorías con fotos reales (no solo iconos). */
export async function ProductsPreview() {
  const t = await getTranslations("products");
  const tc = await getTranslations("common");
  const title = t("title");

  const categoryImages = Object.fromEntries(
    await Promise.all(
      PRODUCT_KEYS.map(async (key) => {
        const src = await getProductImageLive(key);
        return [key, src] as const;
      }),
    ),
  ) as Partial<Record<ProductKey, string>>;

  return (
    <section
      className="bg-surface py-section"
      aria-labelledby="products-heading"
    >
      <Container>
        <ScrollReveal className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            id="products-heading"
            title={title}
            subtitle={t("subtitle")}
            accent={accentLastWords(title, 1)}
            rule={false}
          />
          <AppLink
            href={NAV_PATHS.products}
            className="inline-flex min-h-11 shrink-0 items-center rounded-pill text-ds-caption font-semibold uppercase tracking-[0.14em] text-gold-deep transition-colors duration-ds hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {tc("viewProducts")} →
          </AppLink>
        </ScrollReveal>
        <ScrollReveal delayMs={80} className="mt-0">
          <CategoryCarousel
            categories={PRODUCT_KEYS}
            categoryImages={categoryImages}
            navLabel={t("carouselNav")}
            previousLabel={t("previous")}
            nextLabel={t("next")}
            variant="card"
          />
        </ScrollReveal>
      </Container>
    </section>
  );
}
