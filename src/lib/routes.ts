import { type Pathnames } from "@/i18n/routing";

/** Rutas canónicas — alineadas con pathnames en i18n/routing.ts */
export const NAV_PATHS = {
  home: "/",
  products: "/productos",
  projects: "/proyectos",
  about: "/nosotros",
  contact: "/contacto",
} as const satisfies Record<string, Pathnames>;
