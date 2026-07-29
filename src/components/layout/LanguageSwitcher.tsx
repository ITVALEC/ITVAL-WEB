"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
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
      className="flex items-center gap-4"
      role="group"
      aria-label={t("languageSwitcher")}
    >
      {routing.locales.map((lang) => {
        const active = locale === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => switchLocale(lang)}
            aria-pressed={active}
            className={`border-b pb-0.5 text-xs font-semibold uppercase tracking-[0.18em] transition-[color,border-color] duration-ds focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 motion-reduce:transition-none ${
              active
                ? "border-gold text-white"
                : "border-transparent text-white/75 hover:border-gold hover:text-gold"
            } ${
              transparent
                ? "drop-shadow-sm focus-visible:ring-offset-transparent"
                : "focus-visible:ring-offset-navy-dark"
            }`}
          >
            {t(`locales.${lang}`)}
          </button>
        );
      })}
    </div>
  );
}
