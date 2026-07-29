import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { PROCESS_STEP_KEYS } from "@/lib/content-keys";

export function Process() {
  const t = useTranslations("process");

  return (
    <section
      className="bg-surface-muted py-section"
      aria-labelledby="process-heading"
    >
      <Container>
        <ScrollReveal>
          <SectionHeading
            id="process-heading"
            title={t("title")}
            subtitle={t("subtitle")}
            rule={false}
          />
        </ScrollReveal>
        <ol className="mt-14 grid gap-card-gap sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEP_KEYS.map((key, index) => (
            <ScrollReveal key={key} as="li" delayMs={index * 70}>
              <div className="ds-card ds-card-hover relative h-full p-6">
                <span
                  className="mb-4 block font-display text-4xl font-bold leading-none text-gold"
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
              </div>
            </ScrollReveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
