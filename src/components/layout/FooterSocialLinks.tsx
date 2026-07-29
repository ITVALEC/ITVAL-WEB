import { SocialIcon } from "@/components/ui/SocialIcon";
import { SOCIAL_ICON_LABELS, type SiteSocialLink } from "@/lib/social";

type FooterSocialLinksProps = {
  sectionLabel: string;
  links: SiteSocialLink[];
};

/** Fallback visual si la lista llega vacía (defaults de datos viven en site-settings). */
const FALLBACK_SOCIAL_LINKS: SiteSocialLink[] = [
  { id: "default-facebook", url: "#", icon: "facebook" },
  { id: "default-instagram", url: "#", icon: "instagram" },
  { id: "default-whatsapp", url: "#", icon: "whatsapp" },
  { id: "default-linkedin", url: "#", icon: "linkedin" },
];

export function FooterSocialLinks({ sectionLabel, links }: FooterSocialLinksProps) {
  const displayLinks = links.length > 0 ? links : FALLBACK_SOCIAL_LINKS;

  return (
    <div className="lg:col-span-3">
      <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold/80">
        {sectionLabel}
      </p>
      <ul className="flex flex-wrap items-center gap-3">
        {displayLinks.map((link) => {
          const href = link.url.trim() || "#";
          const label =
            (link.label ?? "").trim() || SOCIAL_ICON_LABELS[link.icon] || link.icon;
          const isPlaceholder = href === "#";
          const isMailOrTel = /^(mailto:|tel:)/i.test(href);

          return (
            <li key={link.id}>
              <a
                href={href}
                aria-label={label}
                {...(isPlaceholder
                  ? { "aria-disabled": true }
                  : isMailOrTel
                    ? {}
                    : {
                        target: "_blank",
                        rel: "noopener noreferrer",
                      })}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/35 text-white/85 transition-colors duration-ds hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
              >
                <SocialIcon icon={link.icon} />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}