/** Datos de sitio editables — copy traducible vive en messages/*.json */
export const SITE = {
  name: "ITVAL",
} as const;

/** Valores por defecto; el sitio público lee overrides desde site-settings en servidor. */
export const CONTACT = {
  email: "info@itval.com.ec",
  phone: "+593 2 123 4567",
  address:
    "Panamericana Norte Km 16.5, Oe4-237 y Miguel Guarderas, Calderón, Quito, Ecuador",
  /** URL de Google Maps (place/search). Vacío → se genera desde `address`. */
  mapsUrl:
    "https://maps.google.com/?q=Panamericana%20Norte%20Km%2016.5%2C%20Oe4-237%20y%20Miguel%20Guarderas%2C%20Calder%C3%B3n%2C%20Quito%2C%20Ecuador",
  hours: "Lunes a viernes, 8:00 – 17:00",
} as const;

/**
 * Redes del footer (valores por defecto permanentes).
 * En producción se editan desde Admin → Ajustes y viven en site-settings.
 * Si una URL está vacía, el footer muestra el icono con enlace `#`
 * (la sección NUNCA se oculta por lista vacía).
 */
export const SOCIAL_LINKS = {
  facebook: "",
  instagram: "",
  /** WhatsApp por defecto al teléfono público de contacto. */
  whatsapp: "https://wa.me/593996603613",
  linkedin: "",
} as const;

export type SocialNetwork = keyof typeof SOCIAL_LINKS;
