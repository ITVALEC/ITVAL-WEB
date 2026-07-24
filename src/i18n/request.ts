import { getRequestConfig } from "next-intl/server";
import { unstable_noStore as noStore } from "next/cache";
import { isLocale } from "@/lib/locale";
import { catalogContentKey, getDocument } from "@/lib/db/documents";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Evita que Next sirva un snapshot viejo de textos del catálogo.
  noStore();

  let locale = await requestLocale;

  if (!locale || !isLocale(locale)) {
    locale = routing.defaultLocale;
  }

  const baseMessages = (await import(`../../messages/${locale}.json`)).default;

  const catalogLocale = locale === "en" ? "en" : "es";
  let productsCatalog: Record<string, unknown>;
  try {
    // Misma fuente que el admin (Postgres → JSON).
    productsCatalog = await getDocument<Record<string, unknown>>(
      catalogContentKey(catalogLocale),
    );
  } catch {
    productsCatalog = (
      await import(`../../messages/products-catalog/${catalogLocale}.json`)
    ).default;
  }

  return {
    locale,
    messages: {
      ...baseMessages,
      productsCatalog,
    },
  };
});
