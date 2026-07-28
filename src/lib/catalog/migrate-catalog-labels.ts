/** Renombres de defaults del catalogo (solo si el valor sigue siendo el texto antiguo). */

type LabelMigration = {
  path: readonly string[];
  from: string;
  to: string;
};

const MIGRATIONS: Record<"es" | "en", readonly LabelMigration[]> = {
  es: [
    { path: ["explorer", "primary", "exteriors"], from: "Exteriores", to: "Cubiertas" },
    {
      path: ["categories", "facades", "title"],
      from: "Fachadas arquitect\u00f3nicas",
      to: "Envolventes Arquitect\u00f3nicos",
    },
  ],
  en: [
    { path: ["explorer", "primary", "exteriors"], from: "Exteriors", to: "Covers" },
    {
      path: ["categories", "facades", "title"],
      from: "Architectural facades",
      to: "Architectural Envelopes",
    },
  ],
};

function getAtPath(data: Record<string, unknown>, path: readonly string[]): unknown {
  let cursor: unknown = data;
  for (const key of path) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
}

function setAtPath(data: Record<string, unknown>, path: readonly string[], value: string): boolean {
  let cursor: Record<string, unknown> = data;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const child = cursor[key];
    if (!child || typeof child !== "object") return false;
    cursor = child as Record<string, unknown>;
  }
  cursor[path[path.length - 1]] = value;
  return true;
}

/** Aplica renombres conocidos in-place. Devuelve true si hubo cambios. */
export function applyCatalogLabelMigrations(
  locale: "es" | "en",
  data: Record<string, unknown>,
): boolean {
  let changed = false;
  for (const rule of MIGRATIONS[locale]) {
    if (getAtPath(data, rule.path) === rule.from) {
      if (setAtPath(data, rule.path, rule.to)) changed = true;
    }
  }
  return changed;
}