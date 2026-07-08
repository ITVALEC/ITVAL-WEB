import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
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
    <section className="bg-navy py-16 lg:py-20" aria-labelledby="metrics-heading">
      <Container>
        <SectionHeading id="metrics-heading" title={t("title")} subtitle={t("subtitle")} light />
        <dl className="mt-12 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {METRIC_KEYS.map((key) => (
            <div
              key={key}
              className="rounded-lg border border-white/10 bg-white/5 px-6 py-8 text-center"
            >
              <dt className="sr-only">{t(`${key}.label`)}</dt>
              <dd>
                <span className="block text-4xl font-bold text-cornflower sm:text-5xl">
                  {values[key]}
                </span>
                <span className="mt-2 block text-sm font-medium uppercase tracking-wider text-white/60">
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
