import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/sections/PageHero";
import { Container } from "@/components/layout/Container";
import { SubcategoryCard } from "@/components/catalog/SubcategoryCard";
import {
  getProductCategories,
  getPublishedProductSubcategories,
  isProductCategory,
} from "@/lib/catalog";
import { NAV_PATHS } from "@/lib/routes";
import { getProductImage } from "@/lib/assets";
import { breadcrumbTrail } from "@/lib/breadcrumbs";
import { CATALOG_NS } from "@/lib/i18n/namespaces";
import { type ProductKey } from "@/lib/catalog";

type PageProps = {
  params: Promise<{ locale: string; category: string }>;
};

export async function generateStaticParams() {
  return getProductCategories().map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, category } = await params;
  if (!isProductCategory(category)) return {};

  const t = await getTranslations({
    locale,
    namespace: `${CATALOG_NS}.categories`,
  });

  return {
    title: `${t(`${category}.title`)} — ITVAL`,
    description: t(`${category}.description`),
  };
}

export default async function ProductCategoryPage({ params }: PageProps) {
  const { locale, category: categoryParam } = await params;
  if (!isProductCategory(categoryParam)) notFound();

  const category = categoryParam as ProductKey;
  setRequestLocale(locale);

  const tCat = await getTranslations({
    locale,
    namespace: `${CATALOG_NS}.categories`,
  });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const subcategories = getPublishedProductSubcategories(category);

  return (
    <>
      <PageHero
        title={tCat(`${category}.title`)}
        subtitle={tCat(`${category}.description`)}
        image={getProductImage(category) ?? undefined}
        imageAlt={tCat(`${category}.title`)}
        breadcrumbAriaLabel={tCommon("breadcrumbNav")}
        breadcrumbs={breadcrumbTrail(tNav("home"), [
          { label: tNav("products"), href: NAV_PATHS.products },
          { label: tCat(`${category}.title`) },
        ])}
      />
      <section className="py-16 lg:py-24" aria-labelledby="subcategories-heading">
        <Container>
          <h2 id="subcategories-heading" className="sr-only">
            {tCat(`${category}.title`)}
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subcategories.map((sub) => (
              <li key={sub}>
                <SubcategoryCard category={category} subcategory={sub} />
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
