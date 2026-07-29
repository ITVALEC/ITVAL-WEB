import type { SocialIconKey } from "@/lib/social";

const outline = {
  viewBox: "0 0 24 24",
  className: "h-5 w-5 fill-none stroke-current",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

const solid = {
  viewBox: "0 0 24 24",
  className: "h-5 w-5 fill-current",
  "aria-hidden": true as const,
};

export function SocialIcon({
  icon,
  solid: useSolid = false,
}: {
  icon: SocialIconKey;
  /** Iconos rellenos (footer oscuro): mas visibles que stroke fino. */
  solid?: boolean;
}) {
  if (useSolid) {
    switch (icon) {
      case "facebook":
        return (
          <svg {...solid}>
            <path d="M14 13.5h2.5l.5-3H14v-1.5c0-.8.2-1.3 1.4-1.3H17V5.1C16.7 5 15.7 5 14.6 5 12.2 5 10.5 6.5 10.5 9.2V10.5H8v3h2.5V20h3.5v-6.5z" />
          </svg>
        );
      case "instagram":
        return (
          <svg {...solid}>
            <path d="M12 7.2A4.8 4.8 0 1016.8 12 4.8 4.8 0 0012 7.2zm0 7.9A3.1 3.1 0 1115.1 12 3.1 3.1 0 0112 15.1z" />
            <circle cx="17.5" cy="6.5" r="1.1" />
            <path d="M16.5 3h-9A4.5 4.5 0 003 7.5v9A4.5 4.5 0 007.5 21h9a4.5 4.5 0 004.5-4.5v-9A4.5 4.5 0 0016.5 3zm3 13.5a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9a3 3 0 013-3h9a3 3 0 013 3z" />
          </svg>
        );
      case "whatsapp":
        return (
          <svg {...solid}>
            <path d="M19.1 4.9A9.9 9.9 0 003.2 16.5L2 22l5.6-1.5A9.9 9.9 0 0012 22a9.9 9.9 0 007.1-17.1zM12 20.2a8.1 8.1 0 01-4.1-1.1l-.3-.2-3.3.9.9-3.2-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7.9-.3.2-.5.1a6.7 6.7 0 01-2-1.2 7.4 7.4 0 01-1.4-1.7c-.1-.3 0-.4.1-.5l.4-.4.2-.3a.5.5 0 000-.5l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 00-.7.3 2.9 2.9 0 00-.9 2.2 5 5 0 001.1 2.7 11.4 11.4 0 004.4 3.9 5.2 5.2 0 002.4.7 2.8 2.8 0 001.9-.8 2.3 2.3 0 00.5-1.5c0-.2-.2-.3-.4-.4z" />
          </svg>
        );
      case "linkedin":
        return (
          <svg {...solid}>
            <path d="M6.9 8.6A2.1 2.1 0 114.8 6.5a2.1 2.1 0 012.1 2.1zM4.9 20.5h3.9V9.9H4.9zM20.5 13.8V20.5h-3.9v-6.2c0-1.5-.5-2.5-1.9-2.5a2 2 0 00-1.9 1.4 2.5 2.5 0 00-.1.9v6.4H8.9s.1-10.4 0-11.5h3.9v1.6c.5-.8 1.4-2 3.5-2 2.5 0 4.4 1.7 4.4 5.2z" />
          </svg>
        );
      default:
        break;
    }
  }

  switch (icon) {
    case "facebook":
      return (
        <svg {...outline}>
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...outline}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...outline}>
          <path d="M20.5 11.5a8.5 8.5 0 01-12.7 7.4L4 20l1.2-3.6A8.5 8.5 0 1120.5 11.5z" />
          <path d="M9.2 9.4c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.6l-.4.5c-.1.1-.1.3 0 .4.4.7 1.1 1.4 1.9 1.9.1.1.3.1.4 0l.5-.4c.2-.1.4-.2.6-.1l1.7.7c.3.1.4.3.4.5v.5c0 .3 0 .5-.4.7-.4.2-.9.4-1.4.4A7 7 0 018.8 10c0-.5.1-1 .4-1.4z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...outline}>
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...outline}>
          <path d="M22.5 7.2a2.8 2.8 0 00-2-2C18.8 4.8 12 4.8 12 4.8s-6.8 0-8.5.4a2.8 2.8 0 00-2 2A29 29 0 001 12a29 29 0 00.5 4.8 2.8 2.8 0 002 2c1.7.4 8.5.4 8.5.4s6.8 0 8.5-.4a2.8 2.8 0 002-2A29 29 0 0023 12a29 29 0 00-.5-4.8z" />
          <path d="M10 15.2V8.8L15.5 12z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...outline}>
          <path d="M14 4v9.2a3.8 3.8 0 11-3.2-3.7V12a1.6 1.6 0 101.2 1.5V4h2z" />
          <path d="M14 4c.6 2.4 2.2 4 4.5 4.5V11c-1.7-.1-3.2-.7-4.5-1.8" />
        </svg>
      );
    case "x":
      return (
        <svg {...outline}>
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      );
    case "email":
      return (
        <svg {...outline}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 7 9-7" />
        </svg>
      );
    case "website":
    default:
      return (
        <svg {...outline}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
        </svg>
      );
  }
}