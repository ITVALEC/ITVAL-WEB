import "server-only";

import { getRequestConfig } from "next-intl/server";
import { unstable_noStore as noStore } from "next/cache";
import { loadProductsCatalogMessages } from "@/lib/catalog/load-products-catalog-messages";
import { isLocale } from "@/lib/locale";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  noStore();

  let locale = await requestLocale;

  if (!locale || !isLocale(locale)) {
    locale = routing.defaultLocale;
  }

  const baseMessages = (await import(`../../messages/${locale}.json`)).default;
  const catalogLocale = locale === "en" ? "en" : "es";
  const productsCatalog = await loadProductsCatalogMessages(catalogLocale);

  return {
    locale,
    messages: {
      ...baseMessages,
      productsCatalog,
    },
  };
});
