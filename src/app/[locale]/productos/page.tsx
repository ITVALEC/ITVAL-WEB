import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { createPageMetadata, type LocalePageProps } from "@/lib/metadata";
import { PageHero } from "@/components/sections/PageHero";
import { ProductCatalogExplorer } from "@/components/catalog/ProductCatalogExplorer";
import { IMAGES } from "@/lib/assets";
import { breadcrumbTrail } from "@/lib/breadcrumbs";
import { CATALOG_NS } from "@/lib/i18n/namespaces";
import { loadFilterConfig } from "@/lib/catalog/filter-config.server";
import { loadProductImagesManifest } from "@/lib/catalog/product-images.server";

const BENEFIT_KEYS = ["quality", "precision", "efficiency"] as const;

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

  const [filterConfig, imageManifest] = await Promise.all([
    loadFilterConfig(),
    loadProductImagesManifest(),
  ]);

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
        actions={
          <ul className="relative z-10 mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
            {BENEFIT_KEYS.map((key) => (
              <li key={key} className="min-w-0">
                <p className="break-words text-ds-caption font-semibold text-gold">
                  {t(`benefits.${key}.title`)}
                </p>
                <p className="mt-2 break-words text-ds-caption leading-[1.5] text-white/80">
                  {t(`benefits.${key}.body`)}
                </p>
              </li>
            ))}
          </ul>
        }
      />
      <Suspense fallback={null}>
        <ProductCatalogExplorer
          initialPrimary={primary}
          filterConfig={filterConfig}
          imageManifest={{
            categories: imageManifest.categories,
            subcategories: imageManifest.subcategories,
          }}
        />
      </Suspense>
    </>
  );
}
