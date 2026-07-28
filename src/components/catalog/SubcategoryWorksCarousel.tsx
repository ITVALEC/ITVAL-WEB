"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  isCatalogPlaceholderSrc,
  MAX_PRODUCT_GALLERY_IMAGES,
} from "@/lib/catalog/product-images";
import { CATALOG_NS } from "@/lib/i18n/namespaces";

export type WorksPreviewImage = {
  src: string;
  alt: string;
};

type SubcategoryWorksCarouselProps = {
  images: WorksPreviewImage[];
  label: string;
};

const AUTOPLAY_MS = 4500;

export function SubcategoryWorksCarousel({
  images: rawImages,
  label,
}: SubcategoryWorksCarouselProps) {
  const t = useTranslations(`${CATALOG_NS}.detail`);
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(() => new Set());
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const pauseUntil = useRef(0);

  const images = useMemo(
    () =>
      rawImages
        .filter(
          (image) =>
            image.src?.trim() &&
            !isCatalogPlaceholderSrc(image.src) &&
            !failedSrcs.has(image.src),
        )
        .slice(0, MAX_PRODUCT_GALLERY_IMAGES),
    [rawImages, failedSrcs],
  );

  const total = images.length;

  const markFailed = useCallback((src: string) => {
    setFailedSrcs((prev) => {
      if (prev.has(src)) return prev;
      const next = new Set(prev);
      next.add(src);
      return next;
    });
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return;
      setActive(((index % total) + total) % total);
    },
    [total],
  );

  const goPrev = useCallback(() => {
    pauseUntil.current = Date.now() + AUTOPLAY_MS;
    goTo(active - 1);
  }, [active, goTo]);

  const goNext = useCallback(() => {
    pauseUntil.current = Date.now() + AUTOPLAY_MS;
    goTo(active + 1);
  }, [active, goTo]);

  useEffect(() => {
    if (active > total - 1) setActive(Math.max(0, total - 1));
  }, [active, total]);

  useEffect(() => {
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(motionMq.matches);
    sync();
    motionMq.addEventListener("change", sync);
    return () => motionMq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (total < 2 || reducedMotion) return;
    const id = window.setInterval(() => {
      if (Date.now() < pauseUntil.current) return;
      setActive((prev) => (prev + 1) % total);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [total, reducedMotion]);

  if (total === 0) return null;

  const hasMultiple = total > 1;

  function onTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current == null || !hasMultiple) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta > 0) goPrev();
    else goNext();
  }

  return (
    <div
      className="group/carousel relative aspect-[16/10] w-full overflow-hidden bg-slate-100"
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {images.map((image, index) => {
        const isActive = index === active;
        return (
          <SafeImage
            key={image.src}
            src={image.src}
            alt={isActive ? image.alt : ""}
            fill
            fallbackSrc={false}
            onError={() => markFailed(image.src)}
            aria-hidden={!isActive}
            className="object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none"
            style={{ opacity: isActive ? 1 : 0 }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        );
      })}

      {hasMultiple ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label={t("previewPrevious")}
            className="absolute left-2 top-1/2 z-[1] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-navy/55 text-white opacity-0 backdrop-blur-sm transition hover:bg-navy/80 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover/carousel:opacity-100 motion-reduce:opacity-100"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-none stroke-current"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                d="M15 5l-7 7 7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label={t("previewNext")}
            className="absolute right-2 top-1/2 z-[1] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-navy/55 text-white opacity-0 backdrop-blur-sm transition hover:bg-navy/80 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover/carousel:opacity-100 motion-reduce:opacity-100"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-none stroke-current"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                d="M9 5l7 7-7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div
            className="absolute bottom-2 left-1/2 z-[1] flex -translate-x-1/2 gap-1.5"
            role="tablist"
            aria-label={label}
          >
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={t("previewGoToImage", { index: index + 1 })}
                onClick={() => {
                  pauseUntil.current = Date.now() + AUTOPLAY_MS;
                  goTo(index);
                }}
                className={`h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  index === active
                    ? "w-4 bg-white"
                    : "w-1.5 bg-white/55 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
