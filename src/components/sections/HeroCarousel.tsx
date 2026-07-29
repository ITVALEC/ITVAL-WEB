"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type ReactNode } from "react";

const SLIDE_INTERVAL_MS = 8000;
const FADE_DURATION_MS = 2000;

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
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

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

  useEffect(() => {
    if (images.length <= 1 || reducedMotion || paused) return;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      setActive((current) => (current + 1) % images.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [images.length, reducedMotion, paused]);

  useEffect(() => {
    if (images.length <= 1) return;

    const onKeyDown = (event: KeyboardEvent) => {
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

  if (images.length === 0) return null;

  const showSingle = images.length === 1 || reducedMotion;
  const currentIndex = showSingle ? 0 : active;
  const hasMultiple = !showSingle;

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0 z-0">
        {images.map((image, index) => {
          const isActive = showSingle ? index === 0 : index === currentIndex;

          return (
            <Image
              key={image.src}
              src={image.src}
              alt={isActive ? image.alt : ""}
              fill
              priority={index === 0}
              aria-hidden={!isActive}
              className="object-cover object-[70%_center] motion-reduce:transition-none motion-reduce:opacity-100"
              style={{
                opacity: isActive ? 1 : 0,
                transition: showSingle
                  ? undefined
                  : `opacity ${FADE_DURATION_MS}ms ease-in-out`,
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
            className="pointer-events-auto absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-navy-dark/55 text-white transition hover:border-white/45 hover:bg-navy-dark/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy sm:left-6 sm:h-12 sm:w-12"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-none stroke-current"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            type="button"
            aria-label={nextLabel}
            onClick={goNext}
            className="pointer-events-auto absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-navy-dark/55 text-white transition hover:border-white/45 hover:bg-navy-dark/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy sm:right-6 sm:h-12 sm:w-12"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-none stroke-current"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div
            className="pointer-events-auto absolute bottom-6 right-4 flex gap-2 sm:right-8"
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
                    ? "w-7 bg-white"
                    : "w-2 bg-white/45 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
