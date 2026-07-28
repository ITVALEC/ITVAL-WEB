import fs from "node:fs";
import path from "node:path";
import "server-only";
import defaults from "./catalog/site-settings.json";
import { SOCIAL_LINKS, type SocialNetwork } from "@/lib/site";

export type SiteContact = {
  email: string;
  phone: string;
  address: string;
  hours: string;
};

export type SiteFooterCopy = {
  tagline: string;
  experience: string;
  ctaTitle: string;
  ctaText: string;
  location: string;
};

export type SiteSocialLinks = Record<SocialNetwork, string>;

export type SiteSettings = {
  contact: SiteContact;
  footer: {
    es: SiteFooterCopy;
    en: SiteFooterCopy;
  };
  social: SiteSocialLinks;
};

/** Forma guardada en Postgres (`footer` JSONB puede incluir `social`). */
export type SiteFooterStored = SiteSettings["footer"] & {
  social?: Partial<SiteSocialLinks>;
};

const SETTINGS_PATH = path.join(process.cwd(), "src/lib/catalog/site-settings.json");

const DEFAULT_SOCIAL: SiteSocialLinks = {
  facebook: SOCIAL_LINKS.facebook,
  instagram: SOCIAL_LINKS.instagram,
  whatsapp: SOCIAL_LINKS.whatsapp,
  linkedin: SOCIAL_LINKS.linkedin,
};

export function normalizeSocialLinks(
  value?: Partial<SiteSocialLinks> | null,
): SiteSocialLinks {
  return {
    facebook: String(value?.facebook ?? DEFAULT_SOCIAL.facebook).trim(),
    instagram: String(value?.instagram ?? DEFAULT_SOCIAL.instagram).trim(),
    whatsapp: String(value?.whatsapp ?? DEFAULT_SOCIAL.whatsapp).trim(),
    linkedin: String(value?.linkedin ?? DEFAULT_SOCIAL.linkedin).trim(),
  };
}

/** Normaliza lectura desde JSON/BD (social top-level o anidado en footer). */
export function normalizeSiteSettings(raw: unknown): SiteSettings {
  const base = (raw && typeof raw === "object" ? raw : {}) as {
    contact?: SiteContact;
    footer?: SiteFooterStored;
    social?: Partial<SiteSocialLinks>;
  };
  const defaultsTyped = defaults as SiteSettings & { social?: Partial<SiteSocialLinks> };
  const footerRaw = base.footer ?? defaultsTyped.footer;
  const { social: nestedSocial, ...footerLocales } = footerRaw as SiteFooterStored;

  return {
    contact: { ...(defaultsTyped.contact ?? {}), ...(base.contact ?? {}) },
    footer: {
      es: { ...defaultsTyped.footer.es, ...(footerLocales.es ?? {}) },
      en: { ...defaultsTyped.footer.en, ...(footerLocales.en ?? {}) },
    },
    social: normalizeSocialLinks(
      base.social ?? nestedSocial ?? defaultsTyped.social ?? DEFAULT_SOCIAL,
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

export function getSiteSocialLinks(): SiteSocialLinks {
  return getSiteSettings().social;
}
