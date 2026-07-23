"use client";

import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/Breadcrumbs";

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
      <Image
        src={image}
        alt={imageAlt}
        fill
        className="object-cover object-[70%_center] saturate-[0.55]"
        sizes="(max-width: 1280px) 100vw, 1280px"
        loading="eager"
      />
      <div className="absolute inset-0 bg-navy/70" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-gradient-to-r from-navy/95 from-0% via-navy/85 via-50% to-navy/65 to-100%"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-navy/45"
        aria-hidden="true"
      />
      <Container className="relative z-10">
        {breadcrumbs ? (
          <Breadcrumbs
            items={breadcrumbs}
            light
            ariaLabel={breadcrumbAriaLabel}
          />
        ) : null}
        <SectionHeading as="h1" title={title} subtitle={subtitle} light />
      </Container>
    </section>
  );
}
