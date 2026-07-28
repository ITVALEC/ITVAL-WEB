import { type SocialNetwork } from "@/lib/site";
import type { SiteSocialLinks } from "@/lib/site-settings";

type FooterSocialLinksProps = {
  labels: Record<SocialNetwork, string>;
  sectionLabel: string;
  links: SiteSocialLinks;
};

const SOCIAL_ORDER: SocialNetwork[] = [
  "facebook",
  "instagram",
  "whatsapp",
  "linkedin",
];

function SocialIcon({ network }: { network: SocialNetwork }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-5 w-5 fill-none stroke-current",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (network) {
    case "facebook":
      return (
        <svg {...common}>
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <path d="M20.5 11.5a8.5 8.5 0 01-12.7 7.4L4 20l1.2-3.6A8.5 8.5 0 1120.5 11.5z" />
          <path d="M9.2 9.4c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.6l-.4.5c-.1.1-.1.3 0 .4.4.7 1.1 1.4 1.9 1.9.1.1.3.1.4 0l.5-.4c.2-.1.4-.2.6-.1l1.7.7c.3.1.4.3.4.5v.5c0 .3 0 .5-.4.7-.4.2-.9.4-1.4.4A7 7 0 018.8 10c0-.5.1-1 .4-1.4z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
  }
}

export function FooterSocialLinks({
  labels,
  sectionLabel,
  links,
}: FooterSocialLinksProps) {
  return (
    <div className="lg:col-span-3">
      <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold/80">
        {sectionLabel}
      </p>
      <ul className="flex flex-wrap items-center gap-3">
        {SOCIAL_ORDER.map((network) => {
          const href = (links[network] ?? "").trim() || "#";
          const isPlaceholder = href === "#";

          return (
            <li key={network}>
              <a
                href={href}
                aria-label={labels[network]}
                {...(isPlaceholder
                  ? { "aria-disabled": true }
                  : {
                      target: "_blank",
                      rel: "noopener noreferrer",
                    })}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/35 text-white/85 transition-colors duration-ds hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
              >
                <SocialIcon network={network} />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}