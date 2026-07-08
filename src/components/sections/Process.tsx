import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PROCESS_STEP_KEYS } from "@/lib/content-keys";

export function Process() {
  const t = useTranslations("process");

  return (
    <section className="bg-slate-50 py-16 lg:py-24" aria-labelledby="process-heading">
      <Container>
        <SectionHeading id="process-heading" title={t("title")} subtitle={t("subtitle")} />
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEP_KEYS.map((key, index) => (
            <li
              key={key}
              className="relative rounded-lg border border-grey/30 bg-white p-6"
            >
              <span
                className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-white"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <h3 className="text-base font-semibold text-navy">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-grey-dark">
                {t(`steps.${key}.description`)}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
