type HeroMediaOverlayProps = {
  /** Home / page: degradado oscuro desde la izquierda hacia transparente a la derecha. */
  variant?: "home" | "page";
};

/**
 * Capas de contraste sobre fotos de hero / banners.
 * Oscurece desde la izquierda (texto legible) y deja la foto visible a la derecha.
 */
export function HeroMediaOverlay({ variant = "page" }: HeroMediaOverlayProps) {
  if (variant === "home") {
    return (
      <>
        {/* Oscuro izquierda → transparente derecha (foto visible a la derecha) */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-navy-dark via-navy-dark/75 via-40% to-transparent to-78%"
          aria-hidden="true"
        />
        {/* Suave ancla inferior / superior sin tapar el lateral derecho */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-navy-dark/55 via-transparent to-navy-dark/25"
          aria-hidden="true"
        />
      </>
    );
  }

  return (
    <>
      <div
        className="absolute inset-0 bg-gradient-to-r from-navy from-0% via-navy/80 via-42% to-transparent to-85%"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-navy/20"
        aria-hidden="true"
      />
    </>
  );
}