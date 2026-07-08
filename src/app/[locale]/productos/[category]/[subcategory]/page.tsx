import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductDetailView } from "@/components/catalog/ProductDetailView";
import {
  getAllProductStaticParams,
  isProductCategory,
  isProductSubcategory,
} from "@/lib/catalog";
import { subcategoryNamespace } from "@/lib/i18n/namespaces";
import { type ProductKey } from "@/lib/catalog";

type PageProps = {
  params: Promise<{ locale: string; category: string; subcategory: string }>;
};

export async function generateStaticParams() {
  return getAllProductStaticParams();
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, category, subcategory } = await params;
  if (!isProductCategory(category) || !isProductSubcategory(category, subcategory)) {
    return {};
  }

  const t = await getTranslations({
    locale,
    namespace: subcategoryNamespace(category),
  });

  return {
    title: `${t(`${subcategory}.title`)} — ITVAL`,
    description: t(`${subcategory}.description`),
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { locale, category: catParam, subcategory } = await params;

  if (!isProductCategory(catParam) || !isProductSubcategory(catParam, subcategory)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <ProductDetailView
      locale={locale}
      category={catParam as ProductKey}
      subcategory={subcategory}
    />
  );
}
