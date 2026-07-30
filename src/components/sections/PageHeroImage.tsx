"use client";

import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/Breadcrumbs";
import { HeroMediaOverlay } from "@/components/sections/HeroMediaOverlay";
import { SafeImage } from "@/components/ui/SafeImage";

type PageHeroImageProps = {
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
  breadcrumbs?: BreadcrumbItem[];
  breadcrumbAriaLabel?: string;
};

/** Variante client del PageHero para secciones con estado (p. ej. ProjectGrid) */
export function PageHeroImage({
  title,
  subtitle,
  image,
  imageAlt,
  breadcrumbs,
  breadcrumbAriaLabel,
}: PageHeroImageProps) {
  return (
    <section className="relative overflow-hidden bg-navy py-16 lg:py-20">
      <SafeImage
        src={image}
        alt={imageAlt}
        fill
        className="object-cover object-[70%_center] saturate-[0.55]"
        sizes="(max-width: 1280px) 100vw, 1280px"
        loading="eager"
        fallbackSrc="/images/pages/products.jpg"
      />
      <HeroMediaOverlay variant="page" />
      <Container className="relative z-10">
        {breadcrumbs ? (
          <div className="fade-up">
            <Breadcrumbs
              items={breadcrumbs}
              light
              ariaLabel={breadcrumbAriaLabel}
            />
          </div>
        ) : null}
        <div className="fade-up" style={{ animationDelay: "0.06s" }}>
          <SectionHeading as="h1" title={title} subtitle={subtitle} light />
        </div>
      </Container>
    </section>
  );
}
