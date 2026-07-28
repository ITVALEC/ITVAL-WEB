type AccentTextProps = {
  text: string;
  /** Fragmento exacto del texto a resaltar en oro (debe existir en `text`). */
  accent?: string;
  accentClassName?: string;
};

/**
 * Resalta un fragmento existente del copy (sin inventar wording).
 * Si el acento no coincide, renderiza el texto completo sin cambios.
 */
export function AccentText({
  text,
  accent,
  accentClassName = "text-gold",
}: AccentTextProps) {
  if (!accent || !text.includes(accent)) {
    return <>{text}</>;
  }

  const index = text.indexOf(accent);
  const before = text.slice(0, index);
  const after = text.slice(index + accent.length);

  return (
    <>
      {before}
      <span className={accentClassName}>{accent}</span>
      {after}
    </>
  );
}

/** Últimas N palabras del título — útil cuando el acento depende del idioma. */
export function accentLastWords(text: string, count: number): string {
  const parts = text.trim().split(/\s+/);
  if (parts.length === 0) return text;
  return parts.slice(Math.max(0, parts.length - count)).join(" ");
}

/** Texto tras el primer ":" (sin espacios iniciales). */
export function accentAfterColon(text: string): string | undefined {
  const index = text.indexOf(":");
  if (index < 0) return undefined;
  const after = text.slice(index + 1).trim();
  return after || undefined;
}
