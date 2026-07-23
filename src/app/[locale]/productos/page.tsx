import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createPageMetadata, type LocalePageProps } from "@/lib/metadata";
import { PageHero } from "@/components/sections/PageHero";
import { ProductCatalogExplorer } from "@/components/catalog/ProductCatalogExplorer";
import { CatalogQuickLinks } from "@/components/catalog/CatalogQuickLinks";
import { IMAGES } from "@/lib/assets";
import { breadcrumbTrail } from "@/lib/breadcrumbs";
import { CATALOG_NS } from "@/lib/i18n/namespaces";

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale } = await params;
  return createPageMetadata(locale, "metadata.products");
}

type ProductsHubPageProps = LocalePageProps & {
  searchParams: Promise<{ primary?: string }>;
};

export default async function ProductsHubPage({
  params,
  searchParams,
}: ProductsHubPageProps) {
  const { locale } = await params;
  const { primary } = await searchParams;
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
        actions={<CatalogQuickLinks active={primary} />}
      />
      <Suspense fallback={null}>
        <ProductCatalogExplorer initialPrimary={primary} />
      </Suspense>
    </>
  );
}
