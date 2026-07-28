import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PROCESS_STEP_KEYS } from "@/lib/content-keys";

export function Process() {
  const t = useTranslations("process");

  return (
    <section
      className="bg-surface-muted py-section"
      aria-labelledby="process-heading"
    >
      <Container>
        <SectionHeading
          id="process-heading"
          title={t("title")}
          subtitle={t("subtitle")}
          rule={false}
        />
        <ol className="mt-14 grid gap-card-gap sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEP_KEYS.map((key, index) => (
            <li
              key={key}
              className="ds-card ds-card-hover relative p-6"
            >
              <span
                className="mb-4 block font-display text-4xl font-bold leading-none text-gold/40"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-ds-h3 text-[1.25rem] font-bold text-navy lg:text-[1.5rem]">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="mt-2 text-ds-caption leading-[1.5] text-ink/80">
                {t(`steps.${key}.description`)}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
