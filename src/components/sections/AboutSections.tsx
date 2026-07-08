import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { PORTFOLIO_MISSION_IMAGE } from "@/lib/projects";
import { VALUE_KEYS } from "@/lib/content-keys";

export async function AboutMissionSection() {
  const t = await getTranslations("aboutPage.mission");
  const missionImage =
    PORTFOLIO_MISSION_IMAGE ?? "/images/pages/about.svg";

  return (
    <section className="py-16 lg:py-24" aria-labelledby="mission-heading">
      <Container>
        <div className="grid items-stretch gap-0 lg:grid-cols-2">
          <div className="relative min-h-[320px] lg:min-h-[480px]">
            <Image
              src={missionImage}
              alt={t("imageAlt")}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 bg-white px-6 py-5 sm:px-8 sm:py-6">
              <p className="text-center text-sm font-bold uppercase leading-snug tracking-wide text-navy sm:text-base">
                {t("banner")}
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center bg-white px-6 py-10 sm:px-10 lg:px-14 lg:py-16">
            <h2
              id="mission-heading"
              className="text-2xl font-bold uppercase tracking-wide text-grey sm:text-3xl"
            >
              {t("title")}
            </h2>
            <p className="mt-6 text-base leading-relaxed text-grey-dark sm:text-lg">
              {t("body")}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function ValueIcon({ valueKey }: { valueKey: (typeof VALUE_KEYS)[number] }) {
  const icons: Record<(typeof VALUE_KEYS)[number], string> = {
    ethics: "M4 6h16v12H4V6zm2 2v8h12V8H6zm2 2h8v4H8v-4z",
    responsibility:
      "M12 3l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4zm0 2.2L6 8.1v4.9c0 3.8 2.6 6.7 6 8 3.4-1.3 6-4.2 6-8V8.1l-6-2.9z",
    precision:
      "M9 18h6v2H9v-2zm3-16a7 7 0 017 7c0 2.7-1.5 5-3.8 6.2L15 22H9l-1.2-2.8A7 7 0 019 9a7 7 0 017-7zm0 2a5 5 0 00-5 5c0 1.9 1.1 3.6 2.7 4.5l.3.2.8 1.8h3.4l.8-1.8.3-.2A5 5 0 0014 9a5 5 0 00-5-5z",
    excellence:
      "M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.3L12 14.8 7.2 16.8l.9-5.3L4.2 7.7l5.4-.8L12 2z",
  };

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 shrink-0 fill-current"
      aria-hidden="true"
    >
      <path d={icons[valueKey]} />
    </svg>
  );
}

export async function AboutProfileValuesSection() {
  const t = await getTranslations("aboutPage");

  return (
    <section className="py-16 lg:py-24" aria-labelledby="profile-heading">
      <Container>
        <div className="grid overflow-hidden rounded-lg border border-grey/20 lg:grid-cols-2">
          <div className="bg-white px-6 py-10 sm:px-10 lg:px-14 lg:py-16">
            <h2
              id="profile-heading"
              className="sr-only"
            >
              {t("profile.title")}
            </h2>
            <p className="text-base leading-relaxed text-grey-dark sm:text-lg">
              {t("profile.body")}
            </p>
          </div>

          <div className="bg-navy px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-16">
            <h3 className="text-xl font-bold uppercase tracking-wide">
              {t("values.title")}
            </h3>
            <ul className="mt-8 space-y-8">
              {VALUE_KEYS.map((key) => (
                <li key={key} className="flex gap-4">
                  <ValueIcon valueKey={key} />
                  <div>
                    <p className="font-bold uppercase tracking-wide">
                      {t(`values.items.${key}.title`)}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-white/85 sm:text-base">
                      {t(`values.items.${key}.body`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
