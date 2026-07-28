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
 * Redes del footer (valores por defecto).
 * En producción se editan desde Admin → Ajustes y viven en site-settings.
 * Vacío → enlace `#` en el footer.
 */
export const SOCIAL_LINKS = {
  facebook: "",
  instagram: "",
  whatsapp: "",
  linkedin: "",
} as const;

export type SocialNetwork = keyof typeof SOCIAL_LINKS;
