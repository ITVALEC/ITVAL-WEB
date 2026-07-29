type HeroMediaOverlayProps = {
  /** Home / page: degradado oscuro desde la izquierda hacia transparente a la derecha. */
  variant?: "home" | "page";
};

/**
 * Capas de contraste sobre fotos de hero / banners.
 * En home: scrim horizontal responsive (.hero-home-scrim en globals.css).
 */
export function HeroMediaOverlay({ variant = "page" }: HeroMediaOverlayProps) {
  if (variant === "home") {
    return (
      <div
        className="hero-home-scrim pointer-events-none absolute inset-0 z-[1]"
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
