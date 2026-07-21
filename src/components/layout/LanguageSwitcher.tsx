"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, routing, type Locale } from "@/i18n/routing";
import { isLocale } from "@/lib/locale";

type LanguageSwitcherProps = {
  transparent?: boolean;
};

export function LanguageSwitcher({ transparent = false }: LanguageSwitcherProps) {
  const t = useTranslations("common");
  const rawLocale = useLocale();
  const locale: Locale = isLocale(rawLocale) ? rawLocale : routing.defaultLocale;
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div
      className={`flex items-center gap-1 p-0.5 ${
        transparent
          ? "rounded-md"
          : "rounded-md border border-white/20"
      }`}
      role="group"
      aria-label={t("languageSwitcher")}
    >
      {routing.locales.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => switchLocale(lang)}
          aria-pressed={locale === lang}
          className={`rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2 motion-reduce:transition-none ${
            locale === lang
              ? transparent
                ? "bg-white/15 text-white drop-shadow-sm"
                : "bg-cornflower-ink text-white"
              : transparent
                ? "text-white/75 drop-shadow-sm hover:text-white"
                : "text-white/70 hover:text-white"
          } ${transparent ? "focus-visible:ring-offset-transparent" : "focus-visible:ring-offset-navy"}`}
        >
          {t(`locales.${lang}`)}
        </button>
      ))}
    </div>
  );
}
