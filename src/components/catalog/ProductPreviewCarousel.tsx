"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SafeImage } from "@/components/ui/SafeImage";
import { CATALOG_NS } from "@/lib/i18n/namespaces";

export type PreviewImage = {
  src: string;
  alt: string;
};

type ProductPreviewCarouselProps = {
  images: PreviewImage[];
};

export function ProductPreviewCarousel({
  images,
}: ProductPreviewCarouselProps) {
  const t = useTranslations(`${CATALOG_NS}.detail`);
  const [active, setActive] = useState(0);

  const total = images.length;

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return;
      setActive(((index % total) + total) % total);
    },
    [total],
  );

  const goPrev = useCallback(() => goTo(active - 1), [active, goTo]);
  const goNext = useCallback(() => goTo(active + 1), [active, goTo]);

  useEffect(() => {
    if (active > total - 1) setActive(Math.max(0, total - 1));
  }, [active, total]);

  if (total === 0) return null;

  const hasMultiple = total > 1;

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:h-[380px] sm:flex-row sm:gap-4 lg:h-[440px]">
      {hasMultiple && (
        <div className="order-2 flex min-w-0 gap-2 overflow-x-auto pb-1 sm:order-1 sm:w-[76px] sm:min-w-[76px] sm:shrink-0 sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:pb-0 sm:pr-1">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => goTo(index)}
              aria-label={t("previewGoToImage", { index: index + 1 })}
              aria-current={index === active || undefined}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2 sm:h-[58px] sm:w-full ${
                index === active
                  ? "border-cornflower ring-2 ring-cornflower/40"
                  : "border-grey/30 opacity-70 hover:opacity-100"
              }`}
            >
              <SafeImage
                src={image.src}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      <div
        className="group relative order-1 aspect-[4/3] w-full min-w-0 overflow-hidden rounded-2xl border border-grey/20 bg-white shadow-sm sm:order-2 sm:aspect-auto sm:h-full sm:w-auto sm:flex-1"
        role="group"
        aria-roledescription="carousel"
        onKeyDown={(event) => {
          if (!hasMultiple) return;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            goPrev();
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            goNext();
          }
        }}
        tabIndex={hasMultiple ? 0 : -1}
      >
        {images.map((image, index) => (
          <SafeImage
            key={image.src}
            src={image.src}
            alt={image.alt}
            fill
            priority={index === 0}
            aria-hidden={index !== active}
            className="object-cover transition-opacity duration-500 ease-in-out motion-reduce:transition-none"
            style={{ opacity: index === active ? 1 : 0 }}
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
        ))}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label={t("previewPrevious")}
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-navy/70 text-white backdrop-blur-sm transition hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy sm:left-3"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label={t("previewNext")}
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-navy/70 text-white backdrop-blur-sm transition hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy sm:right-3"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" aria-hidden="true">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-navy/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {t("previewCounter", { current: active + 1, total })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
