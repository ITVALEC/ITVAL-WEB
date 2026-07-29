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
