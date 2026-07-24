import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/proyectos": {
      es: "/proyectos",
      en: "/projects",
    },
    "/productos": {
      es: "/productos",
      en: "/products",
    },
    "/nosotros": {
      es: "/nosotros",
      en: "/about",
    },
    "/contacto": {
      es: "/contacto",
      en: "/contact",
    },
  },
});

export type Pathnames = keyof typeof routing.pathnames;
export type Locale = (typeof routing.locales)[number];
