import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FeaturedProjectsCarousel } from "@/components/sections/FeaturedProjectsCarousel";
import { accentLastWords } from "@/components/ui/AccentText";
import { getFeaturedProjects, NAV_PATHS } from "@/lib/constants";

export function FeaturedProjects() {
  const t = useTranslations("featuredProjects");
  const tc = useTranslations("common");
  const tProducts = useTranslations("products");
  const featured = getFeaturedProjects();
  const title = t("title");

  return (
    <section
      className="relative overflow-hidden bg-navy-dark py-section"
      aria-labelledby="featured-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(200,154,75,0.12),_transparent_55%)]"
        aria-hidden="true"
      />
      <Container className="relative">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            id="featured-heading"
            title={title}
            subtitle={t("subtitle")}
            light
            accent={accentLastWords(title, 1)}
            rule={false}
          />
          <Link
            href={NAV_PATHS.projects}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-pill border border-gold/40 px-5 py-2.5 text-ds-caption font-semibold uppercase tracking-[0.14em] text-gold transition-colors duration-ds hover:border-gold hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
          >
            {tc("viewAllProjects")}
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <FeaturedProjectsCarousel
          projects={featured}
          navLabel={t("title")}
          previousLabel={tProducts("previous")}
          nextLabel={tProducts("next")}
        />
      </Container>
    </section>
  );
}
