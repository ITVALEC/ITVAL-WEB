import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { ProjectGallery } from "@/components/projects/ProjectGallery";
import {
  getProjectById,
  isProjectId,
} from "@/lib/catalog";
import {
  getProjectGallery,
  getProjectImage,
  PROJECTS,
} from "@/lib/projects";
import { NAV_PATHS } from "@/lib/routes";
import { breadcrumbTrail } from "@/lib/breadcrumbs";
import { getProjectSolutionGroup } from "@/lib/catalog/project-filters";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateStaticParams() {
  return PROJECTS.map((project) => ({ id: project.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, id } = await params;
  if (!isProjectId(id)) return {};

  const project = getProjectById(id)!;
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
  if (!isProjectId(id)) notFound();

  const project = getProjectById(id)!;
  setRequestLocale(locale);

  const tPage = await getTranslations({ locale, namespace: "projectsPage" });
  const tDetail = await getTranslations({ locale, namespace: "projectDetail" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const gallery = getProjectGallery(id);
  const solutionGroup = getProjectSolutionGroup(project);
  const solutionLabel = solutionGroup
    ? tPage(`filters.solutions.${solutionGroup}`)
    : project.productCategory;

  return (
    <>
      <section className="relative bg-navy py-12 lg:py-16">
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
              <p className="text-sm font-semibold uppercase tracking-wider text-cornflower">
                {solutionLabel}
                {project.year ? ` · ${project.year}` : ""}
              </p>
              <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                {project.name}
              </h1>
              <p className="mt-2 text-lg text-white/80">{project.location}</p>
              <p className="mt-4 text-sm uppercase tracking-wider text-grey">
                {tDetail("photos")}: {project.imageCount}
              </p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src={getProjectImage(project)}
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

      <section className="py-16 lg:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-navy">{tDetail("about")}</h2>
              <p className="mt-4 text-lg leading-relaxed text-grey-dark">
                {tDetail("description", {
                  name: project.name,
                  location: project.location,
                  type: solutionLabel,
                })}
              </p>
            </div>
            <aside className="rounded-lg border border-grey/30 bg-slate-50 p-6">
              <h2 className="text-lg font-semibold text-navy">
                {tDetail("details")}
              </h2>
              <dl className="mt-4 space-y-3 text-sm text-grey-dark">
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
