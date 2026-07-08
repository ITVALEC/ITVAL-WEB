import { routing, type Locale } from "@/i18n/routing";

export function isLocale(value: string): value is Locale {
  return routing.locales.includes(value as Locale);
}
