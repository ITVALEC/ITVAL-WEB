import { getTranslations } from "next-intl/server";
import { type Metadata } from "next";
import { isLocale } from "@/lib/locale";
import { type Locale } from "@/i18n/routing";

export type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

type MetadataNamespace =
  | "metadata.home"
  | "metadata.projects"
  | "metadata.products"
  | "metadata.about"
  | "metadata.contact";

export async function createPageMetadata(
  locale: string,
  namespace: MetadataNamespace,
): Promise<Metadata> {
  const resolvedLocale: Locale = isLocale(locale) ? locale : "es";
  const t = await getTranslations({ locale: resolvedLocale, namespace });

  return {
    title: t("title"),
    description: t("description"),
  };
}
