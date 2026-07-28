import "server-only";

import { englishNeedsRetranslation } from "@/lib/i18n/translate-es-to-en";

/**
 * Si un string EN es copia del ES (o vacio), preferir el EN empaquetado del repo
 * cuando sea distinto. Corrige de inmediato paginas /en sin esperar un re-save.
 */
export function scrubUntranslatedEnglishLeaves(
  enNode: unknown,
  esNode: unknown,
  bundledEnNode: unknown,
): unknown {
  if (typeof enNode === "string") {
    const es = typeof esNode === "string" ? esNode : "";
    const bundled = typeof bundledEnNode === "string" ? bundledEnNode : "";
    if (!englishNeedsRetranslation(es, enNode)) return enNode;
    if (bundled && !englishNeedsRetranslation(es, bundled)) return bundled;
    return enNode;
  }

  if (
    enNode &&
    typeof enNode === "object" &&
    !Array.isArray(enNode) &&
    esNode &&
    typeof esNode === "object" &&
    !Array.isArray(esNode)
  ) {
    const enObj = enNode as Record<string, unknown>;
    const esObj = esNode as Record<string, unknown>;
    const bundledObj =
      bundledEnNode && typeof bundledEnNode === "object" && !Array.isArray(bundledEnNode)
        ? (bundledEnNode as Record<string, unknown>)
        : {};

    const out: Record<string, unknown> = { ...enObj };
    for (const key of Object.keys(enObj)) {
      out[key] = scrubUntranslatedEnglishLeaves(
        enObj[key],
        esObj[key],
        bundledObj[key],
      );
    }
    return out;
  }

  return enNode;
}