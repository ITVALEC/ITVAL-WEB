import { getRequestConfig } from "next-intl/server";
import { unstable_noStore as noStore } from "next/cache";
import { isLocale } from "@/lib/locale";
import { routing } from "./routing";

/**
 * Carga el catálogo en runtime desde Postgres (misma fuente que el admin).
 * Evita importar `documents.ts` (fs/mongo) aquí porque next-intl/navigation
 * puede arrastrar este módulo al grafo de webpack y romper el build.
 */
async function loadProductsCatalog(
  locale: "es" | "en",
): Promise<Record<string, unknown>> {
  const loadFallback = async () =>
    (await import(`../../messages/products-catalog/${locale}.json`))
      .default as Record<string, unknown>;

  try {
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_DB) {
      return loadFallback();
    }

    const { query } = await import("@/lib/db/pool");
    const key = locale === "en" ? "catalogContentEn" : "catalogContentEs";
    const { rows } = await query<{ data: Record<string, unknown> }>(
      `SELECT data FROM app_documents WHERE key = $1 LIMIT 1`,
      [key],
    );
    if (rows[0]?.data && typeof rows[0].data === "object") {
      return rows[0].data;
    }
  } catch {
    // Sin DB o error de conexión: usar JSON del disco/build.
  }

  return loadFallback();
}

export default getRequestConfig(async ({ requestLocale }) => {
  noStore();

  let locale = await requestLocale;

  if (!locale || !isLocale(locale)) {
    locale = routing.defaultLocale;
  }

  const baseMessages = (await import(`../../messages/${locale}.json`)).default;
  const catalogLocale = locale === "en" ? "en" : "es";
  const productsCatalog = await loadProductsCatalog(catalogLocale);

  return {
    locale,
    messages: {
      ...baseMessages,
      productsCatalog,
    },
  };
});
