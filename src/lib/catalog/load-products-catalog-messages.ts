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

/**
 * Une defaults del repo con el documento vivo.
 * - Claves nuevas del JSON (p. ej. hub.benefits) aparecen aunque la BD esté atrasada.
 * - Valores editados en admin/BD ganan sobre el bundled.
 */
export function mergeCatalogMessages(
  defaults: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...defaults };

  for (const [key, value] of Object.entries(override)) {
    const base = result[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base &&
      typeof base === "object" &&
      !Array.isArray(base)
    ) {
      result[key] = mergeCatalogMessages(
        base as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      result[key] = value;
    }
  }

  return result;
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
