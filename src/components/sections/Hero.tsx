import { type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { HeroCarousel } from "@/components/sections/HeroCarousel";
import { NAV_PATHS } from "@/lib/constants";
import { getHeroBackgroundSources } from "@/lib/hero-images";

const heroTextShadow =
  "0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.55)";

export function Hero() {
  const t = useTranslations("hero");
  const tc = useTranslations("common");

  const backgroundImages = getHeroBackgroundSources().map((src) => ({
    src,
    alt: t("imageAlt"),
  }));

  return (
    <section className="relative min-h-screen overflow-hidden bg-navy">
      <HeroCarousel
        images={backgroundImages}
        navLabel={t("carousel.navLabel")}
        goToSlideLabels={backgroundImages.map((_, index) =>
          t("carousel.goToSlide", { index: index + 1 }),
        )}
      />

      <div
        className="absolute inset-0 bg-gradient-to-r from-navy/95 from-0% via-navy/80 via-45% to-navy/35 to-100%"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy/75 via-transparent to-navy/35"
        aria-hidden="true"
      />

      <Container className="relative z-10 flex min-h-screen flex-col justify-center pb-16 pt-24 lg:pb-24 lg:pt-28">
        <div className="max-w-3xl">
          <h1
            className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
            style={{ textShadow: heroTextShadow }}
          >
            {t("title")}
          </h1>
          <p
            className="mt-6 max-w-2xl text-lg leading-relaxed text-white/95 sm:text-xl"
            style={{ textShadow: heroTextShadow }}
          >
            {t("subtitle")}
          </p>
          <div className="mt-8">
            <ButtonLink href={NAV_PATHS.contact} variant="primary">
              {tc("quoteNow")}
            </ButtonLink>
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:max-w-4xl">
          <TechnicalBox
            title={t("technicalBox1Title")}
            description={t("technicalBox1Desc")}
          >
            <FacadeDiagram />
          </TechnicalBox>
          <TechnicalBox
            title={t("technicalBox2Title")}
            description={t("technicalBox2Desc")}
          >
            <CurtainWallDiagram />
          </TechnicalBox>
        </div>
      </Container>
    </section>
  );
}

function TechnicalBox({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/20 bg-navy/40 p-5 shadow-lg backdrop-blur-md">
      <div className="mb-3 flex h-24 items-center justify-center rounded border border-cornflower/40 bg-navy/60">
        {children}
      </div>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-cornflower">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-white/80">{description}</p>
    </div>
  );
}

function FacadeDiagram() {
  return (
    <svg
      viewBox="0 0 120 80"
      className="h-16 w-24 text-cornflower/70"
      aria-hidden="true"
    >
      <rect x="10" y="10" width="100" height="60" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="30" x2="110" y2="30" stroke="currentColor" strokeWidth="1" />
      <line x1="10" y1="50" x2="110" y2="50" stroke="currentColor" strokeWidth="1" />
      <line x1="40" y1="10" x2="40" y2="70" stroke="currentColor" strokeWidth="1" />
      <line x1="80" y1="10" x2="80" y2="70" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function CurtainWallDiagram() {
  return (
    <svg
      viewBox="0 0 120 80"
      className="h-16 w-24 text-cornflower/70"
      aria-hidden="true"
    >
      <polygon points="60,8 110,72 10,72" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="35" y1="72" x2="85" y2="72" stroke="currentColor" strokeWidth="1" />
      <line x1="60" y1="8" x2="60" y2="72" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 2" />
    </svg>
  );
}
