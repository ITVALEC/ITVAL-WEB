import { getTranslations, setRequestLocale } from "next-intl/server";
import { createPageMetadata, type LocalePageProps } from "@/lib/metadata";
import { PageHero } from "@/components/sections/PageHero";
import { Container } from "@/components/layout/Container";
import { ContactForm } from "@/components/sections/ContactForm";
import { getSiteContact } from "@/lib/site-settings";
import { IMAGES } from "@/lib/assets";
import { breadcrumbTrail } from "@/lib/breadcrumbs";

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale } = await params;
  return createPageMetadata(locale, "metadata.contact");
}

export default async function ContactPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "contactPage" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const contact = getSiteContact();

  return (
    <>
      <PageHero
        title={t("title")}
        subtitle={t("subtitle")}
        image={IMAGES.pages.contact}
        imageAlt={t("title")}
        breadcrumbAriaLabel={tCommon("breadcrumbNav")}
        breadcrumbs={breadcrumbTrail(tNav("home"), [{ label: tNav("contact") }])}
      />

      <section className="py-16 lg:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <ContactForm />
            </div>
            <aside className="lg:col-span-2" aria-labelledby="contact-info-heading">
              <h2
                id="contact-info-heading"
                className="text-xl font-bold text-navy"
              >
                {t("info.title")}
              </h2>
              <dl className="mt-6 space-y-5">
                <div>
                  <dt className="text-sm font-semibold uppercase tracking-wider text-grey">
                    {t("info.email")}
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${contact.email}`}
                      className="rounded-sm text-cornflower hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower"
                    >
                      {contact.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold uppercase tracking-wider text-grey">
                    {t("info.phone")}
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, "")}`}
                      className="rounded-sm text-navy hover:text-cornflower focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower"
                    >
                      {contact.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold uppercase tracking-wider text-grey">
                    {t("info.address")}
                  </dt>
                  <dd className="mt-1 text-grey-dark">{contact.address}</dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold uppercase tracking-wider text-grey">
                    {t("info.hours")}
                  </dt>
                  <dd className="mt-1 text-grey-dark">{contact.hours}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
