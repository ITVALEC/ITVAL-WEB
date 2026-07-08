import fs from "node:fs";
import path from "node:path";
import "server-only";
import defaults from "./catalog/site-settings.json";

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

export type SiteSettings = {
  contact: SiteContact;
  footer: {
    es: SiteFooterCopy;
    en: SiteFooterCopy;
  };
};

const SETTINGS_PATH = path.join(process.cwd(), "src/lib/catalog/site-settings.json");

export function getSiteSettings(): SiteSettings {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8")) as SiteSettings;
    }
  } catch {
    // Fallback to bundled defaults.
  }
  return defaults as SiteSettings;
}

export function getSiteContact(): SiteContact {
  return getSiteSettings().contact;
}

export function getSiteFooterCopy(locale: string): SiteFooterCopy {
  const settings = getSiteSettings();
  return locale === "en" ? settings.footer.en : settings.footer.es;
}
