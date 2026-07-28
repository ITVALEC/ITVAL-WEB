import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { NAV_PATHS } from "@/lib/constants";

export function CtaBanner() {
  const t = useTranslations("cta");

  return (
    <section
      className="relative overflow-hidden bg-navy py-16 lg:py-24"
      aria-labelledby="cta-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(201,162,39,0.14),_transparent_60%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent"
        aria-hidden="true"
      />
      <Container className="relative text-center">
        <h2
          id="cta-heading"
          className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl"
        >
          {t("title")}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">
          {t("subtitle")}
        </p>
        <ButtonLink
          href={NAV_PATHS.contact}
          variant="primary"
          className="mt-10 px-8 py-3"
        >
          {t("button")}
        </ButtonLink>
      </Container>
    </section>
  );
}
