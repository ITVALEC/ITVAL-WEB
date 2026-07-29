type FooterMapProps = {
  sectionLabel: string;
  viewLabel: string;
  address: string;
  mapsUrl: string;
  embedUrl: string;
  ariaLabel: string;
};

/**
 * Mapa embebido clicable: el iframe es decorativo; el clic abre Google Maps.
 */
export function FooterMap({
  sectionLabel,
  viewLabel,
  address,
  mapsUrl,
  embedUrl,
  ariaLabel,
}: FooterMapProps) {
  return (
    <section className="mt-10" data-footer-maps="true" aria-label={sectionLabel}>
      <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold/80">
        {sectionLabel}
      </p>
      <p className="mb-3 max-w-2xl text-ds-caption text-white/75">{address}</p>
      <div className="relative overflow-hidden rounded-[2px] border border-gold/30 bg-navy">
        <iframe
          title={ariaLabel}
          src={embedUrl}
          className="pointer-events-none h-[180px] w-full border-0 sm:h-[200px] lg:h-[220px]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
          aria-label={ariaLabel}
        >
          <span className="sr-only">{viewLabel}</span>
        </a>
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[2px] border border-gold/50 bg-transparent px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-gold transition-colors duration-ds hover:border-gold hover:bg-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
      >
        {viewLabel}
      </a>
    </section>
  );
}