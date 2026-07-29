"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";

const SLIDE_INTERVAL_MS = 7000;
const FADE_DURATION_MS = 2000;
const SWIPE_THRESHOLD_PX = 48;

type HeroCarouselProps = {
  images: { src: string; alt: string }[];
  navLabel: string;
  goToSlideLabels: string[];
  previousLabel: string;
  nextLabel: string;
  /** Scrim / contraste entre fotos y controles (p. ej. HeroMediaOverlay). */
  overlay?: ReactNode;
};

export function HeroCarousel({
  images,
  navLabel,
  goToSlideLabels,
  previousLabel,
  nextLabel,
  overlay,
}: HeroCarouselProps) {
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const pointerStartX = useRef<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (images.length === 0) return;
      setActive(((index % images.length) + images.length) % images.length);
    },
    [images.length],
  );

  const goPrev = useCallback(() => {
    goTo(active - 1);
  }, [active, goTo]);

  const goNext = useCallback(() => {
    goTo(active + 1);
  }, [active, goTo]);

  // Autoplay continuo. Se reinicia al cambiar de slide (flechas, dots, swipe o auto).
  useEffect(() => {
    if (images.length <= 1 || reducedMotion) return;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      setActive((current) => (current + 1) % images.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [images.length, reducedMotion, active]);

  useEffect(() => {
    if (images.length <= 1) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [images.length, goPrev, goNext]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, a")) return;
    pointerStartX.current = event.clientX;
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current == null || images.length <= 1) {
      pointerStartX.current = null;
      return;
    }
    const delta = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta > 0) goPrev();
    else goNext();
  };

  const onPointerCancel = () => {
    pointerStartX.current = null;
  };

  if (images.length === 0) return null;

  const hasMultiple = images.length > 1;
  const currentIndex = active;
  const useFade = hasMultiple && !reducedMotion;

  const arrowClass =
    "pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-navy-dark/55 text-white transition hover:border-white/45 hover:bg-navy-dark/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy sm:h-11 sm:w-11 md:h-12 md:w-12";

  return (
    <div
      className="absolute inset-0 touch-pan-y"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className="absolute inset-0 z-0">
        {images.map((image, index) => {
          const isActive = index === currentIndex;

          return (
            <Image
              key={image.src}
              src={image.src}
              alt={isActive ? image.alt : ""}
              fill
              priority={index === 0}
              aria-hidden={!isActive}
              draggable={false}
              className="object-cover object-[55%_center] motion-reduce:transition-none motion-reduce:opacity-100 sm:object-[62%_center] lg:object-[70%_center]"
              style={{
                opacity: isActive ? 1 : 0,
                transition: useFade
                  ? `opacity ${FADE_DURATION_MS}ms ease-in-out`
                  : undefined,
                zIndex: isActive ? 1 : 0,
              }}
              sizes="100vw"
            />
          );
        })}
      </div>

      {overlay}

      {hasMultiple ? (
        <div className="pointer-events-none absolute inset-0 z-20">
          <button
            type="button"
            aria-label={previousLabel}
            onClick={goPrev}
            className={`${arrowClass} absolute left-3 top-1/2 hidden -translate-y-1/2 md:left-5 md:flex lg:left-8`}
          >
            <Chevron direction="prev" />
          </button>

          <button
            type="button"
            aria-label={nextLabel}
            onClick={goNext}
            className={`${arrowClass} absolute right-3 top-1/2 hidden -translate-y-1/2 md:right-5 md:flex lg:right-8`}
          >
            <Chevron direction="next" />
          </button>

          <div
            className="pointer-events-auto absolute inset-x-0 bottom-[4.75rem] flex items-center justify-center gap-3 px-4 pt-3 sm:bottom-[5.75rem] sm:gap-4 sm:px-6 md:inset-x-auto md:right-6 md:bottom-[6.5rem] md:justify-end md:px-0 lg:right-8 lg:bottom-28"
            role="group"
            aria-label={navLabel}
          >
            <button
              type="button"
              aria-label={previousLabel}
              onClick={goPrev}
              className={`${arrowClass} md:hidden`}
            >
              <Chevron direction="prev" />
            </button>

            <div
              className="flex max-w-[min(100%,18rem)] flex-wrap items-center justify-center gap-1.5 sm:max-w-none sm:gap-2"
              role="tablist"
              aria-label={navLabel}
            >
              {images.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  role="tab"
                  aria-selected={index === currentIndex}
                  aria-label={goToSlideLabels[index] ?? `Slide ${index + 1}`}
                  onClick={() => goTo(index)}
                  className={`h-2 rounded-full transition-[width,background-color] duration-500 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy motion-reduce:transition-none ${
                    index === currentIndex
                      ? "w-6 bg-white sm:w-7"
                      : "w-2 bg-white/45 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label={nextLabel}
              onClick={goNext}
              className={`${arrowClass} md:hidden`}
            >
              <Chevron direction="next" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Chevron({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
      strokeWidth="2"
      aria-hidden="true"
    >
      {direction === "prev" ? (
        <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
