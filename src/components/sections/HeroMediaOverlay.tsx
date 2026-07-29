type HeroMediaOverlayProps = {
  /** Home / page: degradado oscuro desde la izquierda hacia transparente a la derecha. */
  variant?: "home" | "page";
};

/** Navy dark #091A30 - degradado horizontal del hero home (sin oscurecer toda la foto). */
const HOME_HERO_SCRIM =
  "linear-gradient(to right, rgba(9, 26, 48, 0.95) 0%, rgba(9, 26, 48, 0.80) 25%, rgba(9, 26, 48, 0.45) 50%, rgba(9, 26, 48, 0.15) 70%, transparent 100%)";

/**
 * Capas de contraste sobre fotos de hero / banners.
 * En home: solo scrim horizontal L->R; la arquitectura queda clara a la derecha.
 */
export function HeroMediaOverlay({ variant = "page" }: HeroMediaOverlayProps) {
  if (variant === "home") {
    return (
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ backgroundImage: HOME_HERO_SCRIM }}
        aria-hidden="true"
      />
    );
  }

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy from-0% via-navy/80 via-42% to-transparent to-85%"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-navy/20"
        aria-hidden="true"
      />
    </>
  );
}
