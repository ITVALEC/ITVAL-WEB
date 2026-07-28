import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { catalogContentKey, getDocument } from "@/lib/db/documents";
import { applyCatalogLabelMigrations } from "@/lib/catalog/migrate-catalog-labels";
import { mergeCatalogMessages } from "@/lib/catalog/merge-messages";

export { mergeCatalogMessages } from "@/lib/catalog/merge-messages";

async function loadBundledCatalog(
  locale: "es" | "en",
): Promise<Record<string, unknown>> {
  return (await import(`../../../messages/products-catalog/${locale}.json`))
    .default as Record<string, unknown>;
}

/** Catálogo i18n vivo (Postgres → merge con JSON del repo). */
export async function loadProductsCatalogMessages(
  locale: "es" | "en",
): Promise<Record<string, unknown>> {
  noStore();

  const bundled = await loadBundledCatalog(locale);

  try {
    const data = await getDocument<Record<string, unknown>>(
      catalogContentKey(locale),
    );
    applyCatalogLabelMigrations(locale, data);
    return mergeCatalogMessages(bundled, data);
  } catch {
    return bundled;
  }
}
