import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { AccentText, accentAfterColon } from "@/components/ui/AccentText";
import { HeroCarousel } from "@/components/sections/HeroCarousel";
import { HeroMediaOverlay } from "@/components/sections/HeroMediaOverlay";
import { NAV_PATHS } from "@/lib/constants";
import { PROCESS_STEP_KEYS } from "@/lib/content-keys";
import { getHeroBackgroundSources } from "@/lib/hero-images";
import { loadProductImagesManifest } from "@/lib/catalog/product-images.server";
import type { ProductKey } from "@/lib/catalog/types";

const heroTextShadow =
  "0 2px 16px rgba(0,0,0,0.55), 0 0 28px rgba(0,0,0,0.25)";

/** Hero home: solo portadas del catálogo (DB / manifiesto), sin creatividades con texto. */
export async function Hero() {
  const t = await getTranslations("hero");
  const tc = await getTranslations("common");
  const tProcess = await getTranslations("process");

  let liveCategories: Partial<Record<ProductKey, string>> | undefined;
  try {
    const manifest = await loadProductImagesManifest();
    liveCategories = manifest.categories as Partial<Record<ProductKey, string>>;
  } catch {
    liveCategories = undefined;
  }

  const backgroundImages = getHeroBackgroundSources(liveCategories).map((src) => ({
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
      {backgroundImages.length > 0 ? (
        <HeroCarousel
          images={backgroundImages}
          navLabel={t("carousel.navLabel")}
          goToSlideLabels={backgroundImages.map((_, index) =>
            t("carousel.goToSlide", { index: index + 1 }),
          )}
          previousLabel={t("carousel.previous")}
          nextLabel={t("carousel.next")}
          overlay={<HeroMediaOverlay variant="home" />}
        />
      ) : (
        <div className="absolute inset-0 bg-navy-dark" aria-hidden="true" />
      )}

      <Container className="pointer-events-none relative z-10 flex min-h-[100svh] flex-col justify-center pb-28 pt-24 sm:pb-32 sm:pt-28 lg:pb-40 lg:pt-32">
        <div className="pointer-events-auto max-w-xl lg:max-w-2xl">
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
            className="hero-reveal hero-reveal-delay-1 mt-5 max-w-xl break-words text-base leading-[1.5] text-white/90 sm:mt-6 sm:text-ds-body"
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
