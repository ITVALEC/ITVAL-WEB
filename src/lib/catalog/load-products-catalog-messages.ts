import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { catalogContentKey, getDocument } from "@/lib/db/documents";
import { applyCatalogLabelMigrations } from "@/lib/catalog/migrate-catalog-labels";

async function loadBundledCatalog(
  locale: "es" | "en",
): Promise<Record<string, unknown>> {
  return (await import(`../../../messages/products-catalog/${locale}.json`))
    .default as Record<string, unknown>;
}

/** Catálogo i18n vivo (Postgres → JSON del repo). Evita importar pool en request.ts. */
export async function loadProductsCatalogMessages(
  locale: "es" | "en",
): Promise<Record<string, unknown>> {
  noStore();

  try {
    const data = await getDocument<Record<string, unknown>>(catalogContentKey(locale));
    applyCatalogLabelMigrations(locale, data);
    return data;
  } catch {
    return loadBundledCatalog(locale);
  }
}
