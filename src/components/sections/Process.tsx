import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PROCESS_STEP_KEYS } from "@/lib/content-keys";

export function Process() {
  const t = useTranslations("process");

  return (
    <section
      className="bg-surface-muted py-16 lg:py-24"
      aria-labelledby="process-heading"
    >
      <Container>
        <SectionHeading id="process-heading" title={t("title")} subtitle={t("subtitle")} />
        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {PROCESS_STEP_KEYS.map((key, index) => (
            <li key={key} className="relative">
              <span
                className="mb-4 block font-display text-4xl font-semibold leading-none text-gold/40"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-base font-semibold text-navy">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-grey-dark">
                {t(`steps.${key}.description`)}
              </p>
              {index < PROCESS_STEP_KEYS.length - 1 ? (
                <span
                  className="absolute right-0 top-5 hidden h-px w-8 bg-gold/40 lg:block"
                  aria-hidden="true"
                  style={{ transform: "translateX(calc(100% + 0.75rem))" }}
                />
              ) : null}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
