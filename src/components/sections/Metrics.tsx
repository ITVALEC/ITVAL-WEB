import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
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

function MetricIcon({ name }: { name: (typeof METRIC_KEYS)[number] }) {
  const common = {
    className: "h-6 w-6",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.35,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  if (name === "years") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M8.5 12.5 7 21l5-2 5 2-1.5-8.5" />
        <path d="M10 8h4" />
      </svg>
    );
  }
  if (name === "projects") {
    return (
      <svg {...common}>
        <path d="M3 21h18" />
        <path d="M5 21V9l7-5 7 5v12" />
        <path d="M9 21v-6h6v6" />
        <path d="M9 11h.01M15 11h.01" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 21s-7-4.5-7-10a7 7 0 1 1 14 0c0 5.5-7 10-7 10z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );
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
      className="relative z-20 -mt-10 scroll-mt-20 px-4 sm:-mt-14 sm:px-6 lg:-mt-16 lg:px-8"
      aria-labelledby="metrics-heading"
    >
      <h2 id="metrics-heading" className="sr-only">
        {t("title")}
      </h2>
      <Container className="relative">
        <ScrollReveal>
          <div className="rounded-card border border-gold/25 bg-navy-dark px-3 py-6 shadow-card-hover sm:px-8 sm:py-8 lg:px-10 lg:py-9">
            <dl className="relative grid grid-cols-1 gap-6 min-[420px]:grid-cols-3 min-[420px]:gap-0 min-[420px]:divide-x min-[420px]:divide-gold/20">
              {METRIC_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex flex-col items-center px-1 text-center min-[420px]:px-4 sm:px-6 lg:px-8"
                >
                  <dt className="sr-only">{t(`${key}.label`)}</dt>
                  <dd className="flex flex-col items-center">
                    <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/50 text-gold sm:mb-4 sm:h-12 sm:w-12">
                      <MetricIcon name={key} />
                    </span>
                    <span className="block font-display text-[clamp(1.75rem,1rem+2vw,3rem)] font-bold tracking-tight text-white">
                      {values[key]}
                    </span>
                    <span className="mt-2 block max-w-[10rem] text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white/65 sm:max-w-[12rem] sm:text-ds-caption sm:tracking-[0.16em]">
                      {t(`${key}.label`)}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
