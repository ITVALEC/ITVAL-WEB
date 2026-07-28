import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { HeroCarousel } from "@/components/sections/HeroCarousel";
import { HeroTaglines } from "@/components/sections/HeroTaglines";
import { HeroScrollCue } from "@/components/sections/HeroScrollCue";
import { NAV_PATHS } from "@/lib/constants";
import { HERO_TAGLINE_KEYS } from "@/lib/content-keys";
import { getHeroBackgroundSources } from "@/lib/hero-images";

const heroTextShadow =
  "0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.55)";

export function Hero() {
  const t = useTranslations("hero");
  const tc = useTranslations("common");
  const tNav = useTranslations("nav");

  const backgroundImages = getHeroBackgroundSources().map((src) => ({
    src,
    alt: t("imageAlt"),
  }));

  const taglines = HERO_TAGLINE_KEYS.map((key) => ({
    key,
    lead: t(`taglines.items.${key}.lead`),
    body: t(`taglines.items.${key}.body`),
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

      {/* Overlay navy denso para contraste WCAG sobre la foto */}
      <div className="absolute inset-0 bg-navy/70" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-gradient-to-r from-navy/95 from-0% via-navy/80 via-45% to-navy/45 to-100%"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-navy/55"
        aria-hidden="true"
      />
      {/* Acento oro sutil en el borde inferior del hero */}
      <div
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
        aria-hidden="true"
      />

      <Container className="relative z-10 flex min-h-screen flex-col justify-center pb-24 pt-24 lg:pb-28 lg:pt-28">
        <div className="max-w-3xl">
          <h1
            className="hero-reveal font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl"
            style={{ textShadow: heroTextShadow }}
          >
            {t("title")}
          </h1>
          <p
            className="hero-reveal hero-reveal-delay-1 mt-6 max-w-2xl text-lg leading-relaxed text-white/95 sm:text-xl"
            style={{ textShadow: heroTextShadow }}
          >
            {t("subtitle")}
          </p>

          <HeroTaglines items={taglines} navLabel={t("taglines.navLabel")} />

          <div className="hero-reveal hero-reveal-delay-3 mt-10 flex flex-wrap gap-3">
            <ButtonLink href={NAV_PATHS.contact} variant="primary">
              {tc("quoteNow")}
            </ButtonLink>
            <ButtonLink href={NAV_PATHS.products} variant="secondary">
              {tNav("products")}
            </ButtonLink>
          </div>
        </div>
      </Container>

      <HeroScrollCue />
    </section>
  );
}
