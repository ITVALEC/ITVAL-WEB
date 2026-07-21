import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { getFeaturedProjects, NAV_PATHS } from "@/lib/constants";

export function FeaturedProjects() {
  const t = useTranslations("featuredProjects");
  const tc = useTranslations("common");
  const featured = getFeaturedProjects();

  return (
    <section className="bg-white py-16 lg:py-24" aria-labelledby="featured-heading">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading id="featured-heading" title={t("title")} subtitle={t("subtitle")} />
          <Link
            href={NAV_PATHS.projects}
            className="shrink-0 rounded-sm text-sm font-semibold text-cornflower-ink transition-colors hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower"
          >
            {tc("viewAllProjects")} →
          </Link>
        </div>

        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((project) => (
            <li key={project.id}>
                <ProjectCard project={project} interactive linkToDetail />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
