import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "./Container";
import { ButtonLink } from "@/components/ui/Button";
import { buildNavItems } from "@/lib/nav";
import { NAV_PATHS, SITE } from "@/lib/constants";
import { getSiteContact, getSiteFooterCopy } from "@/lib/site-settings";
import { Logo } from "@/components/ui/Logo";

type FooterProps = {
  locale: string;
};

export async function Footer({ locale }: FooterProps) {
  const t = await getTranslations({ locale });
  const contact = getSiteContact();
  const footerCopy = getSiteFooterCopy(locale);
  const year = new Date().getFullYear();
  const navItems = buildNavItems((key) => t(key));

  return (
    <footer className="border-t border-gold/25 bg-navy text-white">
      <Container className="py-14 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo alt={t("common.logoAlt")} className="h-10 w-auto" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/75">
              {footerCopy.tagline}
            </p>
            <p className="mt-4 text-sm text-gold/90">{footerCopy.experience}</p>
          </div>

          <nav className="lg:col-span-2" aria-label={t("footer.nav")}>
            <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold/80">
              {t("footer.nav")}
            </p>
            <ul className="space-y-2.5">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/80 transition-colors hover:text-gold"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold/80">
              {t("footer.contact")}
            </p>
            <ul className="space-y-3 text-sm text-white/80">
              <li>
                <span className="block text-xs text-white/50">
                  {t("contactPage.info.email")}
                </span>
                <a href={`mailto:${contact.email}`} className="hover:text-gold">
                  {contact.email}
                </a>
              </li>
              <li>
                <span className="block text-xs text-white/50">
                  {t("contactPage.info.phone")}
                </span>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="hover:text-gold"
                >
                  {contact.phone}
                </a>
              </li>
              <li>
                <span className="block text-xs text-white/50">
                  {t("contactPage.info.address")}
                </span>
                {contact.address}
              </li>
              <li>
                <span className="block text-xs text-white/50">
                  {t("contactPage.info.hours")}
                </span>
                {contact.hours}
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold/80">
              {footerCopy.ctaTitle}
            </p>
            <p className="text-sm leading-relaxed text-white/75">{footerCopy.ctaText}</p>
            <ButtonLink
              href={NAV_PATHS.contact}
              variant="primary"
              className="mt-5 inline-block"
            >
              {t("common.quoteNow")}
            </ButtonLink>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-gold/15 pt-6 text-center text-xs text-white/50 sm:flex-row sm:text-left">
          <p>
            © {year} {SITE.name}. {t("footer.rights")}
          </p>
          <p>{footerCopy.location}</p>
        </div>
      </Container>
    </footer>
  );
}
