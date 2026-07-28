/**
 * Deep-merge de mensajes de catalogo.
 * - Claves nuevas del `defaults` (repo) aparecen aunque el override (BD) este atrasado.
 * - Valores editados en admin/BD ganan sobre el defaults.
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