import { getTranslations, setRequestLocale } from "next-intl/server";
import { createPageMetadata, type LocalePageProps } from "@/lib/metadata";
import { PageHero } from "@/components/sections/PageHero";
import {
  AboutMissionSection,
  AboutProfileValuesSection,
} from "@/components/sections/AboutSections";
import { getFeaturedProjects, PORTFOLIO_MISSION_IMAGE } from "@/lib/projects";
import { IMAGES } from "@/lib/assets";
import { breadcrumbTrail } from "@/lib/breadcrumbs";

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale } = await params;
  return createPageMetadata(locale, "metadata.about");
}

export default async function AboutPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "aboutPage" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const heroImage =
    PORTFOLIO_MISSION_IMAGE ??
    getFeaturedProjects()[0]?.cover ??
    IMAGES.pages.about;

  return (
    <>
      <PageHero
        title={t("title")}
        subtitle={t("subtitle")}
        image={heroImage}
        imageAlt={t("title")}
        breadcrumbAriaLabel={tCommon("breadcrumbNav")}
        breadcrumbs={breadcrumbTrail(tNav("home"), [{ label: tNav("about") }])}
      />

      <AboutMissionSection />
      <AboutProfileValuesSection />
    </>
  );
}
