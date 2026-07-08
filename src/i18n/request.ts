import { getRequestConfig } from "next-intl/server";
import { isLocale } from "@/lib/locale";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !isLocale(locale)) {
    locale = routing.defaultLocale;
  }

  const baseMessages = (await import(`../../messages/${locale}.json`)).default;
  const productsCatalog = (
    await import(`../../messages/products-catalog/${locale}.json`)
  ).default;

  return {
    locale,
    messages: {
      ...baseMessages,
      productsCatalog,
    },
  };
});
