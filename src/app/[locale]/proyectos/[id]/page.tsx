import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { ProjectGallery } from "@/components/projects/ProjectGallery";
import { PROJECTS } from "@/lib/projects";
import { NAV_PATHS } from "@/lib/routes";
import { breadcrumbTrail } from "@/lib/breadcrumbs";
import { getProjectSolutionGroup } from "@/lib/catalog/project-filters";
import {
  getPortfolioProjectLive,
  loadPortfolioProjectsLive,
} from "@/lib/catalog/project-portfolio.server";
import { isCatalogPlaceholderSrc } from "@/lib/media/placeholder-src";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateStaticParams() {
  return PROJECTS.map((project) => ({ id: project.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, id } = await params;
  const project = await getPortfolioProjectLive(id);
  if (!project) return {};

  const t = await getTranslations({ locale, namespace: "projectDetail" });

  return {
    title: `${project.name} — ITVAL`,
    description: t("metaDescription", {
      name: project.name,
      location: project.location,
    }),
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const project = await getPortfolioProjectLive(id);
  if (!project) notFound();

  setRequestLocale(locale);

  const tPage = await getTranslations({ locale, namespace: "projectsPage" });
  const tDetail = await getTranslations({ locale, namespace: "projectDetail" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const gallery = project.gallery.filter((src) => !isCatalogPlaceholderSrc(src));
  const cover =
    project.cover && !isCatalogPlaceholderSrc(project.cover)
      ? project.cover
      : gallery[0] ?? "/images/pages/products.jpg";
  const solutionGroup = getProjectSolutionGroup(project);
  const solutionLabel = solutionGroup
    ? tPage(`filters.solutions.${solutionGroup}`)
    : project.productCategory;

  // Prefetch list so related static params stay warm after admin edits.
  void loadPortfolioProjectsLive();

  return (
    <>
      <section className="relative bg-navy-dark py-section">
        <Container className="relative z-10">
          <Breadcrumbs
            light
            ariaLabel={tCommon("breadcrumbNav")}
            items={breadcrumbTrail(tNav("home"), [
              { label: tNav("projects"), href: NAV_PATHS.projects },
              { label: project.name },
            ])}
          />
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-ds-caption font-semibold uppercase tracking-[0.14em] text-gold">
                {solutionLabel}
                {project.year ? ` · ${project.year}` : ""}
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl lg:text-ds-h2">
                {project.name}
              </h1>
              <p className="mt-2 text-ds-body text-white/80">{project.location}</p>
              <p className="mt-4 text-xs uppercase tracking-wider text-white/55">
                {tDetail("photos")}: {gallery.length}
              </p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-card shadow-card">
              <Image
                src={cover}
                alt={project.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="eager"
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-surface py-section">
        <Container>
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="font-display text-2xl font-bold text-navy">
                {tDetail("about")}
              </h2>
              <p className="mt-4 text-ds-body leading-[1.5] text-ink/80">
                {tDetail("description", {
                  name: project.name,
                  location: project.location,
                  type: solutionLabel,
                })}
              </p>
            </div>
            <aside className="rounded-card border border-navy/10 bg-white p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold text-navy">
                {tDetail("details")}
              </h2>
              <dl className="mt-4 space-y-3 text-sm text-ink/80">
                <div>
                  <dt className="font-medium text-navy">{tDetail("location")}</dt>
                  <dd>{project.location}</dd>
                </div>
                {project.year ? (
                  <div>
                    <dt className="font-medium text-navy">{tDetail("year")}</dt>
                    <dd>{project.year}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="font-medium text-navy">{tDetail("system")}</dt>
                  <dd>{solutionLabel}</dd>
                </div>
              </dl>
              <ButtonLink
                href={NAV_PATHS.contact}
                variant="primary"
                className="mt-6 w-full text-center"
              >
                {tDetail("requestQuote")}
              </ButtonLink>
            </aside>
          </div>

          {gallery.length > 1 ? (
            <div className="mt-16">
              <ProjectGallery
                images={gallery}
                title={tDetail("gallery")}
                altPrefix={project.name}
              />
            </div>
          ) : null}
        </Container>
      </section>
    </>
  );
}
