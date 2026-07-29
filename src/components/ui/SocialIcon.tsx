import type { SocialIconKey } from "@/lib/social";

const common = {
  viewBox: "0 0 24 24",
  className: "h-5 w-5 fill-none stroke-current",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

export function SocialIcon({ icon }: { icon: SocialIconKey }) {
  switch (icon) {
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
    case "youtube":
      return (
        <svg {...common}>
          <path d="M22.5 7.2a2.8 2.8 0 00-2-2C18.8 4.8 12 4.8 12 4.8s-6.8 0-8.5.4a2.8 2.8 0 00-2 2A29 29 0 001 12a29 29 0 00.5 4.8 2.8 2.8 0 002 2c1.7.4 8.5.4 8.5.4s6.8 0 8.5-.4a2.8 2.8 0 002-2A29 29 0 0023 12a29 29 0 00-.5-4.8z" />
          <path d="M10 15.2V8.8L15.5 12z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M14 4v9.2a3.8 3.8 0 11-3.2-3.7V12a1.6 1.6 0 101.2 1.5V4h2z" />
          <path d="M14 4c.6 2.4 2.2 4 4.5 4.5V11c-1.7-.1-3.2-.7-4.5-1.8" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      );
    case "email":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 7 9-7" />
        </svg>
      );
    case "website":
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
        </svg>
      );
  }
}