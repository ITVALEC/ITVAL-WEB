import { SocialIcon } from "@/components/ui/SocialIcon";
import {
  SOCIAL_ICON_LABELS,
  type SiteSocialLink,
  type SocialIconKey,
} from "@/lib/social";

type FooterSocialLinksProps = {
  sectionLabel: string;
  links: SiteSocialLink[];
};

/** Las 4 redes minimas: siempre visibles, aunque settings/DB vengan vacios. */
const REQUIRED_SOCIAL: { icon: SocialIconKey; id: string }[] = [
  { icon: "facebook", id: "default-facebook" },
  { icon: "instagram", id: "default-instagram" },
  { icon: "whatsapp", id: "default-whatsapp" },
  { icon: "linkedin", id: "default-linkedin" },
];

const FALLBACK_SOCIAL_LINKS: SiteSocialLink[] = REQUIRED_SOCIAL.map(({ icon, id }) => ({
  id,
  url: "#",
  icon,
  label: SOCIAL_ICON_LABELS[icon],
}));

/**
 * Garantiza Facebook, Instagram, WhatsApp y LinkedIn en pantalla.
 * Nunca devolver lista vacia: si faltan redes o URLs, se rellenan con `#`.
 */
function ensureVisibleSocialLinks(links: SiteSocialLink[]): SiteSocialLink[] {
  const byIcon = new Map<SocialIconKey, SiteSocialLink>();

  for (const link of links) {
    if (!REQUIRED_SOCIAL.some((r) => r.icon === link.icon)) continue;
    const url = (link.url ?? "").trim() || "#";
    const prev = byIcon.get(link.icon);
    // Preferir URL real sobre placeholder.
    if (!prev || (prev.url === "#" && url !== "#")) {
      byIcon.set(link.icon, {
        ...link,
        url,
        label: (link.label ?? "").trim() || SOCIAL_ICON_LABELS[link.icon],
      });
    }
  }

  return REQUIRED_SOCIAL.map(({ icon, id }) => {
    const existing = byIcon.get(icon);
    if (existing) return existing;
    return {
      id,
      url: "#",
      icon,
      label: SOCIAL_ICON_LABELS[icon],
    };
  });
}

export function FooterSocialLinks({ sectionLabel, links }: FooterSocialLinksProps) {
  const displayLinks = ensureVisibleSocialLinks(
    links.length > 0 ? links : FALLBACK_SOCIAL_LINKS,
  );
  const title = sectionLabel.trim() || "Redes sociales";

  return (
    <div className="lg:col-span-3" data-footer-social="true">
      <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold/80">
        {title}
      </p>
      <ul className="flex flex-wrap items-center gap-3" aria-label={title}>
        {displayLinks.map((link) => {
          const href = link.url.trim() || "#";
          const label =
            (link.label ?? "").trim() || SOCIAL_ICON_LABELS[link.icon] || link.icon;
          const isPlaceholder = href === "#";
          const isMailOrTel = /^(mailto:|tel:)/i.test(href);

          return (
            <li key={`${link.icon}-${link.id}`}>
              <a
                href={href}
                aria-label={label}
                data-social-icon={link.icon}
                {...(isPlaceholder
                  ? { "aria-disabled": true }
                  : isMailOrTel
                    ? {}
                    : {
                        target: "_blank",
                        rel: "noopener noreferrer",
                      })}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/50 bg-white/5 text-gold transition-colors duration-ds hover:border-gold hover:bg-gold/15 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
              >
                <SocialIcon icon={link.icon} solid />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}