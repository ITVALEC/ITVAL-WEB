import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { METRIC_KEYS } from "@/lib/content-keys";
import { PROJECTS } from "@/lib/projects";

function getPortfolioMetrics() {
  const projectCount = PROJECTS.length;
  const cityCount = new Set(PROJECTS.map((project) => project.city)).size;

  return {
    projects: String(projectCount),
    cities: String(cityCount),
  } as const;
}

export function Metrics() {
  const t = useTranslations("metrics");
  const portfolio = getPortfolioMetrics();

  const values: Record<(typeof METRIC_KEYS)[number], string> = {
    years: t("years.value"),
    projects: portfolio.projects,
    cities: portfolio.cities,
  };

  return (
    <section
      id="home-content"
      className="relative scroll-mt-20 border-y border-gold/20 bg-navy py-12 lg:py-14"
      aria-labelledby="metrics-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,162,39,0.08),_transparent_55%)]"
        aria-hidden="true"
      />
      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="metrics-heading"
            className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl"
          >
            {t("title")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">
            {t("subtitle")}
          </p>
        </div>
        <dl className="mt-10 grid gap-8 border-t border-gold/20 pt-10 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-gold/25">
          {METRIC_KEYS.map((key) => (
            <div key={key} className="fade-up px-2 text-center sm:px-8">
              <dt className="sr-only">{t(`${key}.label`)}</dt>
              <dd>
                <span className="block font-display text-4xl font-semibold tracking-tight text-gold sm:text-5xl lg:text-[3.25rem]">
                  {values[key]}
                </span>
                <span className="mt-2 block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/65">
                  {t(`${key}.label`)}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
