import { revalidatePath } from "next/cache";
import { routing } from "@/i18n/routing";

/** Invalida las páginas públicas del catálogo tras editar en el admin. */
export function revalidatePublicCatalog(): void {
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}`, "layout");
    revalidatePath(`/${locale}/productos`, "layout");
  }
}
