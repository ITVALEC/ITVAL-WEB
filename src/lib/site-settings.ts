import fs from "node:fs";
import path from "node:path";
import "server-only";
import defaults from "./catalog/site-settings.json";
import { CONTACT, SOCIAL_LINKS } from "@/lib/site";
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
  /** URL de Google Maps (place o search). Vacío → se deriva de `address`. */
  mapsUrl: string;
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

const DEFAULT_SOCIAL_ORDER: {
  key: keyof SiteSocialLinksLegacy;
  icon: SocialIconKey;
}[] = [
  { key: "facebook", icon: "facebook" },
  { key: "instagram", icon: "instagram" },
  { key: "whatsapp", icon: "whatsapp" },
  { key: "linkedin", icon: "linkedin" },
];

/** Facebook, Instagram, WhatsApp y LinkedIn siempre disponibles en el footer. */
export function getDefaultSocialLinks(): SiteSocialLink[] {
  return DEFAULT_SOCIAL_ORDER.map(({ key, icon }) => {
    const configured = String(SOCIAL_LINKS[key] ?? "").trim();
    return {
      id: `default-${key}`,
      label: "",
      url: configured || "#",
      icon,
    };
  });
}

function legacyRecordToSocialLinks(
  value: Partial<SiteSocialLinksLegacy>,
): SiteSocialLink[] {
  return DEFAULT_SOCIAL_ORDER.map(({ key, icon }) => {
    const configured = String(value[key] ?? SOCIAL_LINKS[key] ?? "").trim();
    return {
      id: `legacy-${key}`,
      label: "",
      url: configured || "#",
      icon,
    };
  });
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
 * Filtra URLs inválidas; `keepEmpty` conserva filas sin URL (admin).
 * `allowEmptyList` evita reinyectar defaults cuando el admin vació la lista.
 */
export function normalizeSocialLinks(
  value?: SiteSocialLink[] | Partial<SiteSocialLinksLegacy> | null,
  options?: { keepEmpty?: boolean; allowEmptyList?: boolean },
): SiteSocialLink[] {
  const keepEmpty = options?.keepEmpty === true;
  const allowEmptyList = options?.allowEmptyList === true || keepEmpty;

  if (Array.isArray(value)) {
    const out: SiteSocialLink[] = [];
    value.forEach((item, index) => {
      const normalized = normalizeOneSocialLink(item, index);
      if (!normalized) return;
      if (!normalized.url && !keepEmpty) return;
      out.push({
        ...normalized,
        id: normalized.id || createSocialLinkId(),
        url: normalized.url || (keepEmpty ? "" : "#"),
      });
    });
    if (out.length === 0) {
      return allowEmptyList ? [] : getDefaultSocialLinks();
    }
    return out;
  }

  if (value && typeof value === "object") {
    return legacyRecordToSocialLinks(value as Partial<SiteSocialLinksLegacy>);
  }

  return getDefaultSocialLinks();
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

  const mergedContact = {
    email: CONTACT.email,
    phone: CONTACT.phone,
    address: CONTACT.address,
    mapsUrl: CONTACT.mapsUrl,
    hours: CONTACT.hours,
    ...(defaultsTyped.contact ?? {}),
    ...(base.contact ?? {}),
  };

  return {
    contact: {
      email: String(mergedContact.email ?? "").trim() || CONTACT.email,
      phone: String(mergedContact.phone ?? "").trim() || CONTACT.phone,
      address: String(mergedContact.address ?? "").trim() || CONTACT.address,
      mapsUrl: String(mergedContact.mapsUrl ?? "").trim() || CONTACT.mapsUrl,
      hours: String(mergedContact.hours ?? "").trim() || CONTACT.hours,
    },
    footer: {
      es: footerEs,
      en: footerEn,
    },
    social: (() => {
      const source = base.social ?? nestedSocial ?? defaultsTyped.social;
      // Array (aunque vacío) = lista configurada; no forzar defaults.
      if (Array.isArray(source)) {
        return normalizeSocialLinks(source, {
          keepEmpty: true,
          allowEmptyList: true,
        });
      }
      if (source && typeof source === "object") {
        return normalizeSocialLinks(source);
      }
      return getDefaultSocialLinks();
    })(),
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
      social: normalizeSocialLinks(settings.social, {
        keepEmpty: true,
        allowEmptyList: true,
      }),
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
  const contact = getSiteSettings().contact;
  return {
    ...contact,
    email: contact.email.trim() || CONTACT.email,
    phone: contact.phone.trim() || CONTACT.phone,
    address: contact.address.trim() || CONTACT.address,
    mapsUrl: (contact.mapsUrl ?? "").trim() || CONTACT.mapsUrl,
    hours: contact.hours.trim() || CONTACT.hours,
  };
}

/** Enlace externo a Google Maps (nueva pestaña). */
export function buildGoogleMapsUrl(contact: SiteContact): string {
  const custom = (contact.mapsUrl ?? "").trim();
  if (custom && /^https?:\/\//i.test(custom)) return custom;
  const query = contact.address.trim() || CONTACT.address;
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
}

/** Embed iframe sin API key (q=dirección). */
export function buildGoogleMapsEmbedUrl(contact: SiteContact): string {
  const query = contact.address.trim() || CONTACT.address;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}

export function getSiteFooterCopy(locale: string): SiteFooterCopy {
  const settings = getSiteSettings();
  return locale === "en" ? settings.footer.en : settings.footer.es;
}

export function getSiteSocialLinks(): SiteSocialLink[] {
  try {
    // Respeta exactamente lo guardado en admin (incl. lista vacía).
    return getSiteSettings().social;
  } catch {
    return getDefaultSocialLinks();
  }
}
