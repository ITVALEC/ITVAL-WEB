import { revalidatePath } from "next/cache";
import { routing } from "@/i18n/routing";

/**
 * Invalida páginas públicas tras mutaciones del admin
 * (catálogo, fotos, obras, ajustes/footer/redes/maps).
 */
export function revalidatePublicCatalog(): void {
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}`, "layout");
    revalidatePath(`/${locale}/productos`, "layout");
    revalidatePath(`/${locale}/proyectos`, "layout");
    revalidatePath(`/${locale}/nosotros`, "layout");
    revalidatePath(`/${locale}/contacto`, "layout");
  }
}

/** Alias semántico para ajustes/site-settings. */
export function revalidatePublicSite(): void {
  revalidatePublicCatalog();
}
