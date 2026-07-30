import { getLocale } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { PROCESS_STEP_KEYS } from "@/lib/content-keys";
import { getSiteHomeCopy, type SiteHomeCopy } from "@/lib/site-settings";

const PROCESS_STEP_FIELDS: Record<
  (typeof PROCESS_STEP_KEYS)[number],
  { title: keyof SiteHomeCopy; description: keyof SiteHomeCopy }
> = {
  consultation: {
    title: "processConsultationTitle",
    description: "processConsultationDescription",
  },
  engineering: {
    title: "processEngineeringTitle",
    description: "processEngineeringDescription",
  },
  fabrication: {
    title: "processFabricationTitle",
    description: "processFabricationDescription",
  },
  installation: {
    title: "processInstallationTitle",
    description: "processInstallationDescription",
  },
};

export async function Process() {
  const locale = await getLocale();
  const home = getSiteHomeCopy(locale);

  return (
    <section
      className="bg-surface-muted py-section"
      aria-labelledby="process-heading"
    >
      <Container>
        <ScrollReveal>
          <SectionHeading
            id="process-heading"
            title={home.processTitle}
            subtitle={home.processSubtitle}
            rule={false}
          />
        </ScrollReveal>
        <ol className="mt-14 grid gap-card-gap sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEP_KEYS.map((key, index) => {
            const fields = PROCESS_STEP_FIELDS[key];
            return (
              <ScrollReveal key={key} as="li" delayMs={index * 70}>
                <div className="ds-card ds-card-hover relative h-full p-6">
                  <span
                    className="mb-4 block font-display text-4xl font-bold leading-none text-gold"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-ds-h3 text-[1.25rem] font-bold text-navy lg:text-[1.5rem]">
                    {home[fields.title]}
                  </h3>
                  <p className="mt-2 text-ds-caption leading-[1.5] text-ink/80">
                    {home[fields.description]}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
