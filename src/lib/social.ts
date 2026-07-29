/** Iconos disponibles para redes del footer (admin + publico). */
export const SOCIAL_ICON_KEYS = [
  "facebook",
  "instagram",
  "whatsapp",
  "linkedin",
  "youtube",
  "tiktok",
  "x",
  "email",
  "website",
] as const;

export type SocialIconKey = (typeof SOCIAL_ICON_KEYS)[number];

export type SiteSocialLink = {
  id: string;
  /** Etiqueta accesible; si vacio se usa el nombre del icono. */
  label?: string;
  url: string;
  icon: SocialIconKey;
};

export const SOCIAL_ICON_LABELS: Record<SocialIconKey, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X / Twitter",
  email: "Email",
  website: "Sitio web",
};

export function isSocialIconKey(value: unknown): value is SocialIconKey {
  return typeof value === "string" && (SOCIAL_ICON_KEYS as readonly string[]).includes(value);
}

/** URL basica: http(s), mailto, tel o vacia. */
export function isValidSocialUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (/^(mailto:|tel:)/i.test(trimmed)) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function createSocialLinkId(): string {
  return `social-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}