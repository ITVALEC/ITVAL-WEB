import fs from "node:fs";
import path from "node:path";
import "server-only";
import defaults from "./catalog/site-settings.json";
import { SOCIAL_LINKS } from "@/lib/site";
import {
  createSocialLinkId,
  isSocialIconKey,
  isValidSocialUrl,
  type SiteSocialLink,
  type SocialIconKey,
} from "@/lib/social";

export type SiteContact = {
  email: string;
  phone: string;
  address: string;
  hours: string;
};

export type SiteFooterCopy = {
  tagline: string;
  experience: string;
  /** Conservado por compatibilidad con datos viejos; no se edita ni se muestra en el home. */
  ctaTitle: string;
  ctaText: string;
  location: string;
};

export type { SiteSocialLink, SocialIconKey };

/** @deprecated Preferir `SiteSocialLink[]`. Compat lectura legacy. */
export type SiteSocialLinksLegacy = {
  facebook: string;
  instagram: string;
  whatsapp: string;
  linkedin: string;
};

export type SiteSettings = {
  contact: SiteContact;
  footer: {
    es: SiteFooterCopy;
    en: SiteFooterCopy;
  };
  social: SiteSocialLink[];
};

/** Forma guardada en Postgres (`footer` JSONB puede incluir `social`). */
export type SiteFooterStored = SiteSettings["footer"] & {
  social?: SiteSocialLink[] | Partial<SiteSocialLinksLegacy>;
};

const SETTINGS_PATH = path.join(process.cwd(), "src/lib/catalog/site-settings.json");

const DEFAULT_FOOTER: SiteSettings["footer"] = {
  es: {
    tagline: "Soluciones integrales en vidrio, aluminio y estructuras metálicas.",
    experience: "Más de 14 años de experiencia en Ecuador.",
    ctaTitle: "",
    ctaText: "",
    location: "Quito · Guayaquil · Ecuador",
  },
  en: {
    tagline: "Integrated solutions in glass, aluminum, and metal structures.",
    experience: "Over 14 years of experience in Ecuador.",
    ctaTitle: "",
    ctaText: "",
    location: "Quito · Guayaquil · Ecuador",
  },
};

function legacyRecordToSocialLinks(
  value: Partial<SiteSocialLinksLegacy>,
): SiteSocialLink[] {
  const order: { key: keyof SiteSocialLinksLegacy; icon: SocialIconKey }[] = [
    { key: "facebook", icon: "facebook" },
    { key: "instagram", icon: "instagram" },
    { key: "whatsapp", icon: "whatsapp" },
    { key: "linkedin", icon: "linkedin" },
  ];
  const links: SiteSocialLink[] = [];
  for (const { key, icon } of order) {
    const url = String(value[key] ?? SOCIAL_LINKS[key] ?? "").trim();
    if (!url) continue;
    links.push({
      id: `legacy-${key}`,
      label: "",
      url,
      icon,
    });
  }
  return links;
}

function normalizeOneSocialLink(raw: unknown, index: number): SiteSocialLink | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const url = String(row.url ?? "").trim();
  const iconRaw = row.icon;
  const icon: SocialIconKey = isSocialIconKey(iconRaw) ? iconRaw : "website";
  const id = String(row.id ?? "").trim() || `social-${index + 1}`;
  const label = String(row.label ?? "").trim();
  if (url && !isValidSocialUrl(url)) {
    return null;
  }
  return { id, label: label || undefined, url, icon };
}

/**
 * Acepta lista dinámica o el Record legacy de 4 redes.
 * Filtra URLs inválidas; `keepEmpty` sirve en admin mientras se edita.
 */
export function normalizeSocialLinks(
  value?: SiteSocialLink[] | Partial<SiteSocialLinksLegacy> | null,
  options?: { keepEmpty?: boolean },
): SiteSocialLink[] {
  const keepEmpty = options?.keepEmpty === true;

  if (Array.isArray(value)) {
    const out: SiteSocialLink[] = [];
    value.forEach((item, index) => {
      const normalized = normalizeOneSocialLink(item, index);
      if (!normalized) return;
      if (!normalized.url && !keepEmpty) return;
      out.push({
        ...normalized,
        id: normalized.id || createSocialLinkId(),
      });
    });
    return out;
  }

  if (value && typeof value === "object") {
    return legacyRecordToSocialLinks(value as Partial<SiteSocialLinksLegacy>);
  }

  return [];
}

/** Normaliza lectura desde JSON/BD (social top-level o anidado en footer). */
export function normalizeSiteSettings(raw: unknown): SiteSettings {
  const base = (raw && typeof raw === "object" ? raw : {}) as {
    contact?: SiteContact;
    footer?: SiteFooterStored;
    social?: SiteSocialLink[] | Partial<SiteSocialLinksLegacy>;
  };
  const defaultsTyped = defaults as Partial<SiteSettings> & {
    social?: SiteSocialLink[] | Partial<SiteSocialLinksLegacy>;
  };
  const footerRaw = (base.footer ?? defaultsTyped.footer ?? DEFAULT_FOOTER) as SiteFooterStored;
  const { social: nestedSocial, ...footerLocales } = footerRaw;

  const footerEs = {
    ...DEFAULT_FOOTER.es,
    ...(defaultsTyped.footer?.es ?? {}),
    ...(footerLocales.es ?? {}),
  };
  const footerEn = {
    ...DEFAULT_FOOTER.en,
    ...(defaultsTyped.footer?.en ?? {}),
    ...(footerLocales.en ?? {}),
  };

  return {
    contact: {
      email: "",
      phone: "",
      address: "",
      hours: "",
      ...(defaultsTyped.contact ?? {}),
      ...(base.contact ?? {}),
    },
    footer: {
      es: footerEs,
      en: footerEn,
    },
    social: normalizeSocialLinks(
      base.social ?? nestedSocial ?? defaultsTyped.social ?? [],
      { keepEmpty: true },
    ),
  };
}

/** Empaqueta social dentro de footer para columnas Postgres contact/footer. */
export function packSiteSettingsForDb(settings: SiteSettings): {
  contact: SiteContact;
  footer: SiteFooterStored;
} {
  return {
    contact: settings.contact,
    footer: {
      es: settings.footer.es,
      en: settings.footer.en,
      social: normalizeSocialLinks(settings.social),
    },
  };
}

export function getSiteSettings(): SiteSettings {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      return normalizeSiteSettings(
        JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8")),
      );
    }
  } catch {
    // Fallback to bundled defaults.
  }
  return normalizeSiteSettings(defaults);
}

export function getSiteContact(): SiteContact {
  return getSiteSettings().contact;
}

export function getSiteFooterCopy(locale: string): SiteFooterCopy {
  const settings = getSiteSettings();
  return locale === "en" ? settings.footer.en : settings.footer.es;
}

export function getSiteSocialLinks(): SiteSocialLink[] {
  return normalizeSocialLinks(getSiteSettings().social);
}
