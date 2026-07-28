import { type ReactNode } from "react";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/Breadcrumbs";
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
  /** Enlace de retorno encima del breadcrumb (p. ej. categoría → hub). */
  backLink?: PageHeroBackLink;
  /** Acciones bajo el subtítulo (p. ej. chips de categoría). */
  actions?: ReactNode;
};

/**
 * Hero de páginas internas.
 * Overlay navy denso (saturación baja) para contraste WCAG del texto blanco
 * incluso con fondos claros (cielo, vidrio, etc.).
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
          {/* Capa base navy desaturada — evita texto blanco ilegible sobre cielo claro */}
          <div className="absolute inset-0 bg-navy/70" aria-hidden="true" />
          <div
            className="absolute inset-0 bg-gradient-to-r from-navy/95 from-0% via-navy/85 via-50% to-navy/65 to-100%"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-navy/45"
            aria-hidden="true"
          />
        </>
      ) : null}
      <Container className="relative z-10">
        {backLink ? (
          <Link
            href={backLink.href}
            className="mb-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-white transition-colors duration-ds hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
          >
            <span aria-hidden="true">←</span>
            {backLink.label}
          </Link>
        ) : null}
        {breadcrumbs ? (
          <Breadcrumbs
            items={breadcrumbs}
            light
            ariaLabel={breadcrumbAriaLabel}
            className={backLink ? "mb-6 mt-0" : undefined}
          />
        ) : null}
        <SectionHeading as="h1" title={title} subtitle={subtitle} light />
        {actions ? <div className="relative z-10">{actions}</div> : null}
      </Container>
    </section>
  );
}
