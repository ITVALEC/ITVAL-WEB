import { useTranslations } from "next-intl";
import { AppLink } from "@/components/ui/AppLink";import { SafeImage } from "@/components/ui/SafeImage";
import { getProjectImage, type Project } from "@/lib/projects";
import { getProjectPath } from "@/lib/catalog";
import { getProjectSolutionGroup } from "@/lib/catalog/project-filters";

const CARD_IMAGE_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

type ProjectCardProps = {
  project: Project;
  headingLevel?: "h2" | "h3";
  showYear?: boolean;
  interactive?: boolean;
  linkToDetail?: boolean;
};

export function ProjectCard({
  project,
  headingLevel: Heading = "h3",
  showYear = false,
  interactive = false,
  linkToDetail = false,
}: ProjectCardProps) {
  const t = useTranslations("projectsPage");
  const solutionGroup = getProjectSolutionGroup(project);
  const solutionLabel = solutionGroup
    ? t(`filters.solutions.${solutionGroup}`)
    : null;

  const card = (
    <article
      className={`overflow-hidden rounded-lg border border-grey/30 bg-white transition-shadow hover:shadow-lg motion-reduce:transition-none ${
        interactive || linkToDetail ? "group" : ""
      }`}
    >
      <div
        className={`relative aspect-[4/3] bg-slate-100 ${
          interactive || linkToDetail ? "overflow-hidden" : ""
        }`}
      >
        <SafeImage
          src={getProjectImage(project)}
          alt={project.name}
          fill
          className={
            interactive || linkToDetail
              ? "object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
              : "object-cover"
          }
          sizes={CARD_IMAGE_SIZES}
        />
      </div>
      <div className="p-4 sm:p-5">
        {solutionLabel ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-cornflower">
            {solutionLabel}
          </p>
        ) : null}
        <Heading
          className={`text-base font-semibold text-navy sm:text-lg ${
            solutionLabel ? "mt-1" : ""
          } group-hover:text-cornflower`}
        >
          {project.name}
        </Heading>
        <p className="mt-1 text-sm text-grey-dark">{project.location}</p>
        {showYear && project.year ? (
          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-grey">
            {project.year}
          </p>
        ) : null}
      </div>
    </article>
  );

  if (linkToDetail) {
    return (
      <AppLink href={getProjectPath(project.id)} className="block">
        {card}
      </AppLink>
    );
  }

  return card;
}
