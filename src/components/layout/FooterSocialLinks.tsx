import { SocialIcon } from "@/components/ui/SocialIcon";
import {
  SOCIAL_ICON_LABELS,
  type SiteSocialLink,
} from "@/lib/social";

type FooterSocialLinksProps = {
  sectionLabel: string;
  links: SiteSocialLink[];
};

/**
 * Renderiza exactamente las redes configuradas en admin.
 * Sin forzar Facebook/Instagram/etc.: agregar o quitar debe reflejarse en el sitio.
 */
export function FooterSocialLinks({ sectionLabel, links }: FooterSocialLinksProps) {
  const title = sectionLabel.trim() || "Redes sociales";

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="lg:col-span-3" data-footer-social="true">
      <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold/80">
        {title}
      </p>
      <ul className="flex flex-wrap items-center gap-3" aria-label={title}>
        {links.map((link) => {
          const href = (link.url ?? "").trim() || "#";
          const label =
            (link.label ?? "").trim() || SOCIAL_ICON_LABELS[link.icon] || link.icon;
          const isPlaceholder = href === "#";
          const isMailOrTel = /^(mailto:|tel:)/i.test(href);

          return (
            <li key={link.id}>
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-[2px] border border-gold/50 bg-white/5 text-gold transition-colors duration-ds hover:border-gold hover:bg-gold/15 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
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
