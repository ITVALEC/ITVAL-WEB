type HeroMediaOverlayProps = {
  /** Home: oscurecido uniforme ~48% + gradientes. Page: ~52% + laterales para texto. */
  variant?: "home" | "page";
};

/**
 * Capas de contraste sobre fotos de hero / banners.
 * Objetivo: texto blanco legible sin tapar del todo la imagen (referencia SMC ~40-55%).
 */
export function HeroMediaOverlay({ variant = "page" }: HeroMediaOverlayProps) {
  if (variant === "home") {
    return (
      <>
        {/* Base ~48% — foto visible pero atenuada */}
        <div className="absolute inset-0 bg-navy-dark/50" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-gradient-to-r from-navy-dark/70 via-navy-dark/45 to-navy-dark/35"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-navy-dark/75 via-navy-dark/20 to-navy-dark/45"
          aria-hidden="true"
        />
      </>
    );
  }

  return (
    <>
      <div className="absolute inset-0 bg-navy/55" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-gradient-to-r from-navy/90 from-0% via-navy/70 via-45% to-navy/50 to-100%"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy/75 via-navy/25 to-navy/40"
        aria-hidden="true"
      />
    </>
  );
}