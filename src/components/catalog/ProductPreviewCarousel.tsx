"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  isCatalogPlaceholderSrc,
  MAX_PRODUCT_GALLERY_IMAGES,
} from "@/lib/catalog/product-images";
import { CATALOG_NS } from "@/lib/i18n/namespaces";

export type PreviewImage = {
  src: string;
  alt: string;
};

type ProductPreviewCarouselProps = {
  images: PreviewImage[];
};

const HOVER_ZOOM_SCALE = 1.85;
const REDUCED_MOTION_ZOOM_SCALE = 1.25;

export function ProductPreviewCarousel({
  images: rawImages,
}: ProductPreviewCarouselProps) {
  const t = useTranslations(`${CATALOG_NS}.detail`);
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(() => new Set());
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [canHoverZoom, setCanHoverZoom] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const touchStartX = useRef<number | null>(null);

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

  const goPrev = useCallback(() => goTo(active - 1), [active, goTo]);
  const goNext = useCallback(() => goTo(active + 1), [active, goTo]);

  useEffect(() => {
    if (active > total - 1) setActive(Math.max(0, total - 1));
  }, [active, total]);

  useEffect(() => {
    if (!zoomed) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setZoomed(false);
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed, goPrev, goNext]);

  useEffect(() => {
    const hoverMq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setCanHoverZoom(hoverMq.matches);
      setReducedMotion(motionMq.matches);
      if (!hoverMq.matches) setHovering(false);
    };
    sync();
    hoverMq.addEventListener("change", sync);
    motionMq.addEventListener("change", sync);
    return () => {
      hoverMq.removeEventListener("change", sync);
      motionMq.removeEventListener("change", sync);
    };
  }, []);

  // Sin fotos reales: no inventar placeholders SVG.
  if (total === 0) return null;

  const hasMultiple = total > 1;
  const current = images[active];
  const hoverActive = canHoverZoom && hovering;
  const zoomScale = reducedMotion
    ? REDUCED_MOTION_ZOOM_SCALE
    : HOVER_ZOOM_SCALE;

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

  function onHoverMove(event: React.MouseEvent<HTMLElement>) {
    if (!canHoverZoom) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
    setHovering(true);
  }

  function onHoverLeave() {
    setHovering(false);
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div
        className="group relative aspect-[4/3] w-full min-w-0 overflow-hidden rounded-2xl border border-grey/20 bg-slate-100 shadow-sm lg:aspect-auto lg:h-[440px]"
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
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        tabIndex={hasMultiple ? 0 : -1}
      >
        {images.map((image, index) => {
          const isActive = index === active;
          return (
            <SafeImage
              key={image.src}
              src={image.src}
              alt={image.alt}
              fill
              priority={index === 0}
              aria-hidden={!isActive}
              fallbackSrc={false}
              onError={() => markFailed(image.src)}
              className={`object-cover transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
                isActive && hoverActive
                  ? "duration-75 ease-linear motion-reduce:duration-0"
                  : ""
              }`}
              style={{
                opacity: isActive ? 1 : 0,
                transform:
                  isActive && hoverActive ? `scale(${zoomScale})` : "scale(1)",
                transformOrigin: `${origin.x}% ${origin.y}%`,
                willChange: isActive && canHoverZoom ? "transform" : undefined,
              }}
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          );
        })}

        <button
          type="button"
          onClick={() => setZoomed(true)}
          onMouseEnter={onHoverMove}
          onMouseMove={onHoverMove}
          onMouseLeave={onHoverLeave}
          aria-label={t("previewZoom")}
          className={`absolute inset-0 z-[1] bg-transparent ${
            canHoverZoom ? "cursor-crosshair" : "cursor-zoom-in"
          }`}
        />

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goPrev();
              }}
              aria-label={t("previewPrevious")}
              className="absolute left-2 top-1/2 z-[2] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-navy/70 text-white backdrop-blur-sm transition hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy sm:left-3"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goNext();
              }}
              aria-label={t("previewNext")}
              className="absolute right-2 top-1/2 z-[2] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-navy/70 text-white backdrop-blur-sm transition hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy sm:right-3"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" aria-hidden="true">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="pointer-events-none absolute bottom-3 right-3 z-[2] rounded-full bg-navy/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {t("previewCounter", { current: active + 1, total })}
            </div>
          </>
        )}

        <div className="pointer-events-none absolute bottom-3 left-3 z-[2] rounded-full bg-navy/60 px-2.5 py-1 text-xs font-medium text-white/95 backdrop-blur-sm opacity-0 transition group-hover:opacity-100 motion-reduce:opacity-100">
          {t("previewZoomHint")}
        </div>
      </div>

      {hasMultiple && (
        <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => goTo(index)}
              aria-label={t("previewGoToImage", { index: index + 1 })}
              aria-current={index === active || undefined}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2 sm:h-[72px] sm:w-[88px] ${
                index === active
                  ? "border-cornflower ring-2 ring-cornflower/40"
                  : "border-grey/30 opacity-70 hover:opacity-100"
              }`}
            >
              <SafeImage
                src={image.src}
                alt=""
                fill
                fallbackSrc={false}
                onError={() => markFailed(image.src)}
                className="object-cover"
                sizes="88px"
              />
            </button>
          ))}
        </div>
      )}

      {zoomed && current ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t("previewZoom")}
          onClick={() => setZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute right-4 top-4 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {t("closeGallery")}
          </button>

          {hasMultiple ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  goPrev();
                }}
                aria-label={t("previewPrevious")}
                className="absolute left-3 top-1/2 z-[1] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-6"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  goNext();
                }}
                aria-label={t("previewNext")}
                className="absolute right-3 top-1/2 z-[1] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white">
                {t("previewCounter", { current: active + 1, total })}
              </div>
            </>
          ) : null}

          <div
            className="relative max-h-[85vh] w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-navy/40">
              <SafeImage
                src={current.src}
                alt={current.alt}
                fill
                fallbackSrc={false}
                onError={() => markFailed(current.src)}
                className="object-contain"
                sizes="100vw"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
