import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { AccentText, accentAfterColon } from "@/components/ui/AccentText";
import { HeroCarousel } from "@/components/sections/HeroCarousel";
import { HeroMediaOverlay } from "@/components/sections/HeroMediaOverlay";
import { NAV_PATHS } from "@/lib/constants";
import { getHeroBackgroundSources } from "@/lib/hero-images";
import { isServablePublicImage } from "@/lib/admin/media-service";
import { loadProductImagesManifest } from "@/lib/catalog/product-images.server";
import { getSiteHomeCopy } from "@/lib/site-settings";
import type { ProductKey } from "@/lib/catalog/types";

const heroTextShadow =
  "0 2px 16px rgba(0,0,0,0.55), 0 0 28px rgba(0,0,0,0.25)";

/** Hero home: solo portadas del catálogo (DB / manifiesto), sin creatividades con texto. */
export async function Hero() {
  const locale = await getLocale();
  const home = getSiteHomeCopy(locale);
  const t = await getTranslations("hero");
  const tc = await getTranslations("common");

  let liveCategories: Partial<Record<ProductKey, string>> | undefined;
  try {
    const manifest = await loadProductImagesManifest();
    liveCategories = manifest.categories as Partial<Record<ProductKey, string>>;
  } catch {
    liveCategories = undefined;
  }

  const backgroundImages = getHeroBackgroundSources(liveCategories)
    .filter((src) => isServablePublicImage(src))
    .map((src) => ({
      src,
      alt: t("imageAlt"),
    }));

  const title = home.heroTitle;
  const accent = accentAfterColon(title);

  const eyebrow = [
    home.processEngineeringTitle,
    home.processFabricationTitle,
    home.processInstallationTitle,
  ].join(" · ");

  return (
    <section className="relative min-h-svh overflow-hidden bg-navy-dark supports-[height:100dvh]:min-h-dvh">
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

      <Container className="pointer-events-none relative z-10 flex min-h-svh flex-col justify-center pb-[max(7rem,calc(5.5rem+env(safe-area-inset-bottom)))] pt-[max(5.5rem,calc(4.5rem+env(safe-area-inset-top)))] supports-[height:100dvh]:min-h-dvh sm:pb-32 sm:pt-28 lg:pb-40 lg:pt-32 [@media(max-height:560px)]:py-16 [@media(max-height:560px)]:pb-24">
        <div className="pointer-events-auto w-full max-w-xl lg:max-w-2xl">
          <p
            className="hero-reveal mb-3 max-w-[38ch] text-[0.65rem] font-semibold uppercase leading-relaxed tracking-[0.16em] text-gold sm:mb-5 sm:max-w-none sm:text-ds-caption sm:tracking-[0.28em]"
            style={{ textShadow: heroTextShadow }}
          >
            {eyebrow}
          </p>
          <h1
            className="hero-reveal break-words font-display text-[clamp(1.625rem,1rem+4.2vw,4rem)] font-bold leading-[1.12] tracking-tight text-white sm:leading-[1.15]"
            style={{ textShadow: heroTextShadow }}
          >
            <AccentText text={title} accent={accent} accentClassName="text-gold" />
          </h1>
          <p
            className="hero-reveal hero-reveal-delay-1 mt-4 max-w-xl break-words text-[0.9375rem] leading-[1.55] text-white/90 sm:mt-6 sm:text-ds-body sm:leading-[1.5] [@media(max-height:560px)]:mt-3 [@media(max-height:560px)]:line-clamp-3"
            style={{ textShadow: heroTextShadow }}
          >
            {home.heroSubtitle}
          </p>

          <div className="hero-reveal hero-reveal-delay-3 mt-7 flex w-full flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap [@media(max-height:560px)]:mt-5">
            <ButtonLink
              href={NAV_PATHS.contact}
              variant="primary"
              className="min-h-11 w-full sm:w-auto"
            >
              {tc("learnMore")}
              <span aria-hidden="true">→</span>
            </ButtonLink>
            <ButtonLink
              href={NAV_PATHS.projects}
              variant="secondary"
              className="min-h-11 w-full sm:w-auto"
            >
              {tc("viewAllProjects")}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
