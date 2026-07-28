import { useTranslations } from "next-intl";
import { AppLink } from "@/components/ui/AppLink";
import { SafeImage } from "@/components/ui/SafeImage";
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
      className={`ds-card overflow-hidden ${
        interactive || linkToDetail ? "group ds-card-hover" : ""
      }`}
    >
      <div
        className={`relative aspect-[4/3] bg-surface-muted ${
          interactive || linkToDetail ? "overflow-hidden" : ""
        }`}
      >
        <SafeImage
          src={getProjectImage(project)}
          alt={project.name}
          fill
          className={
            interactive || linkToDetail
              ? "object-cover transition-transform duration-ds group-hover:scale-105 motion-reduce:transform-none"
              : "object-cover"
          }
          sizes={CARD_IMAGE_SIZES}
        />
      </div>
      <div className="p-5 sm:p-6">
        {solutionLabel ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">
            {solutionLabel}
          </p>
        ) : null}
        <Heading
          className={`font-display text-lg font-bold text-navy sm:text-xl ${
            solutionLabel ? "mt-1" : ""
          } group-hover:text-gold-deep`}
        >
          {project.name}
        </Heading>
        <p className="mt-1 text-ds-caption text-ink/80">{project.location}</p>
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
