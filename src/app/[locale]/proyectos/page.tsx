import { setRequestLocale } from "next-intl/server";
import { createPageMetadata, type LocalePageProps } from "@/lib/metadata";
import { ProjectGrid } from "@/components/sections/ProjectGrid";
import { loadPortfolioProjectsLive } from "@/lib/catalog/project-portfolio.server";

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale } = await params;
  return createPageMetadata(locale, "metadata.projects");
}

export default async function ProjectsPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const projects = await loadPortfolioProjectsLive();

  return <ProjectGrid projects={projects} />;
}
