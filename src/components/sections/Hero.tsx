import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { AccentText, accentAfterColon } from "@/components/ui/AccentText";
import { HeroCarousel } from "@/components/sections/HeroCarousel";
import { NAV_PATHS } from "@/lib/constants";
import { PROCESS_STEP_KEYS } from "@/lib/content-keys";
import { getHeroBackgroundSources } from "@/lib/hero-images";

const heroTextShadow =
  "0 2px 16px rgba(0,0,0,0.75), 0 0 32px rgba(0,0,0,0.4)";

export function Hero() {
  const t = useTranslations("hero");
  const tc = useTranslations("common");
  const tProcess = useTranslations("process");

  const backgroundImages = getHeroBackgroundSources().map((src) => ({
    src,
    alt: t("imageAlt"),
  }));

  const title = t("title");
  const accent = accentAfterColon(title);

  const eyebrow = [PROCESS_STEP_KEYS[1], PROCESS_STEP_KEYS[2], PROCESS_STEP_KEYS[3]]
    .map((key) => tProcess(`steps.${key}.title`))
    .join(" · ");

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-navy-dark">
      <HeroCarousel
        images={backgroundImages}
        navLabel={t("carousel.navLabel")}
        goToSlideLabels={backgroundImages.map((_, index) =>
          t("carousel.goToSlide", { index: index + 1 }),
        )}
      />

      {/* Overlay 35% (DS) + gradiente lateral para contraste de texto */}
      <div className="absolute inset-0 bg-navy-dark/35" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-gradient-to-r from-navy-dark/80 via-navy-dark/35 to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy-dark/70 via-transparent to-navy-dark/40"
        aria-hidden="true"
      />

      <Container className="relative z-10 flex min-h-[100svh] flex-col justify-center pb-28 pt-24 sm:pb-32 sm:pt-28 lg:pb-40 lg:pt-32">
        <div className="max-w-3xl">
          <p
            className="hero-reveal mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold sm:mb-5 sm:text-ds-caption sm:tracking-[0.28em]"
            style={{ textShadow: heroTextShadow }}
          >
            {eyebrow}
          </p>
          <h1
            className="hero-reveal break-words font-display text-[clamp(1.875rem,1.1rem+3.2vw,4rem)] font-bold leading-[1.15] tracking-tight text-white"
            style={{ textShadow: heroTextShadow }}
          >
            <AccentText text={title} accent={accent} accentClassName="text-gold" />
          </h1>
          <p
            className="hero-reveal hero-reveal-delay-1 mt-5 max-w-2xl break-words text-base leading-[1.5] text-white/90 sm:mt-6 sm:text-ds-body"
            style={{ textShadow: heroTextShadow }}
          >
            {t("subtitle")}
          </p>

          <div className="hero-reveal hero-reveal-delay-3 mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
            <ButtonLink href={NAV_PATHS.contact} variant="primary" className="w-full sm:w-auto">
              {tc("learnMore")}
              <span aria-hidden="true">→</span>
            </ButtonLink>
            <ButtonLink href={NAV_PATHS.projects} variant="secondary" className="w-full sm:w-auto">
              {tc("viewAllProjects")}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
