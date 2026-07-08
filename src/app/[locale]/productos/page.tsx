import { getTranslations, setRequestLocale } from "next-intl/server";
import { createPageMetadata, type LocalePageProps } from "@/lib/metadata";
import { PageHero } from "@/components/sections/PageHero";
import { ProductCatalogExplorer } from "@/components/catalog/ProductCatalogExplorer";
import { IMAGES } from "@/lib/assets";
import { breadcrumbTrail } from "@/lib/breadcrumbs";
import { CATALOG_NS } from "@/lib/i18n/namespaces";

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale } = await params;
  return createPageMetadata(locale, "metadata.products");
}

export default async function ProductsHubPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: `${CATALOG_NS}.hub` });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <>
      <PageHero
        title={t("title")}
        subtitle={t("subtitle")}
        image={IMAGES.pages.products}
        imageAlt={t("title")}
        breadcrumbAriaLabel={tCommon("breadcrumbNav")}
        breadcrumbs={breadcrumbTrail(tNav("home"), [
          { label: tNav("products") },
        ])}
      />
      <ProductCatalogExplorer />
    </>
  );
}
