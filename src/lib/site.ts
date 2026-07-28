/** Datos de sitio editables — copy traducible vive en messages/*.json */
export const SITE = {
  name: "ITVAL",
} as const;

/** Valores por defecto; el sitio público lee overrides desde site-settings en servidor. */
export const CONTACT = {
  email: "info@itval.com.ec",
  phone: "+593 2 123 4567",
  address: "Quito, Ecuador",
  hours: "Lunes a viernes, 8:00 – 17:00",
} as const;

/**
 * Redes del footer. Vacío → enlace `#` (sin inventar URLs de marca).
 * Completar con perfiles oficiales cuando estén confirmados.
 */
export const SOCIAL_LINKS = {
  facebook: "",
  instagram: "",
  whatsapp: "",
  linkedin: "",
} as const;

export type SocialNetwork = keyof typeof SOCIAL_LINKS;
