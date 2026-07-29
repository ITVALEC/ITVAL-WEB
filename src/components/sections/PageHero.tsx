import { type ReactNode } from "react";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/Breadcrumbs";
import { HeroMediaOverlay } from "@/components/sections/HeroMediaOverlay";
import { Link } from "@/i18n/navigation";
import { type Pathnames } from "@/i18n/routing";

type PageHeroBackLink = {
  href: Pathnames;
  label: string;
};

type PageHeroProps = {
  title: string;
  subtitle: string;
  image?: string;
  imageAlt?: string;
  breadcrumbs?: BreadcrumbItem[];
  breadcrumbAriaLabel?: string;
  /** Enlace de retorno bajo el título y la descripción (p. ej. categoría → hub). */
  backLink?: PageHeroBackLink;
  /** Acciones bajo el subtítulo (p. ej. chips de categoría). */
  actions?: ReactNode;
};

/**
 * Hero de páginas internas.
 * Degradado oscuro desde la izquierda → transparente a la derecha
 * (texto legible; foto visible a la derecha).
 */
export function PageHero({
  title,
  subtitle,
  image,
  imageAlt,
  breadcrumbs,
  breadcrumbAriaLabel,
  backLink,
  actions,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-navy py-16 lg:py-20">
      {image ? (
        <>
          <Image
            src={image}
            alt={imageAlt ?? title}
            fill
            className="object-cover object-[70%_center] saturate-[0.55]"
            sizes="(max-width: 1280px) 100vw, 1280px"
            loading="eager"
          />
          <HeroMediaOverlay variant="page" />
        </>
      ) : null}
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
        {backLink ? (
          <Link
            href={backLink.href}
            className="fade-up group mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-white transition-[color] duration-ds hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
            style={{ animationDelay: "0.12s" }}
          >
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-ds ease-out group-hover:-translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            >
              ←
            </span>
            <span className="transition-opacity duration-ds group-hover:opacity-90 motion-reduce:transition-none">
              {backLink.label}
            </span>
          </Link>
        ) : null}
        {actions ? <div className="relative z-10">{actions}</div> : null}
      </Container>
    </section>
  );
}
