import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { AccentText, accentLastWords } from "@/components/ui/AccentText";
import { NAV_PATHS } from "@/lib/constants";

export function CtaBanner() {
  const t = useTranslations("cta");
  const title = t("title");

  return (
    <section
      className="relative overflow-hidden bg-navy-dark py-section"
      aria-labelledby="cta-heading"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold/35"
        aria-hidden="true"
      />
      <Container className="relative">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <h2
              id="cta-heading"
              className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-ds-h2"
            >
              <AccentText
                text={title}
                accent={accentLastWords(title, 2)}
                accentClassName="text-gold"
              />
            </h2>
            <p className="mt-4 max-w-2xl text-ds-body text-white/75">
              {t("subtitle")}
            </p>
          </div>
          <ButtonLink
            href={NAV_PATHS.contact}
            variant="primary"
            className="shrink-0"
          >
            {t("button")}
            <span aria-hidden="true">→</span>
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
