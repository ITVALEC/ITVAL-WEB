import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { NAV_PATHS } from "@/lib/constants";

export function CtaBanner() {
  const t = useTranslations("cta");

  return (
    <section className="bg-navy py-16 lg:py-20" aria-labelledby="cta-heading">
      <Container className="text-center">
        <h2
          id="cta-heading"
          className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
          {t("subtitle")}
        </p>
        <ButtonLink
          href={NAV_PATHS.contact}
          variant="primary"
          className="mt-8 px-8 py-3"
        >
          {t("button")}
        </ButtonLink>
      </Container>
    </section>
  );
}
