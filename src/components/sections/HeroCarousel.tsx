"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const SLIDE_INTERVAL_MS = 8000;
const FADE_DURATION_MS = 2000;

type HeroCarouselProps = {
  images: { src: string; alt: string }[];
  navLabel: string;
  goToSlideLabels: string[];
};

export function HeroCarousel({
  images,
  navLabel,
  goToSlideLabels,
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

  useEffect(() => {
    if (images.length <= 1 || reducedMotion || paused) return;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      setActive((current) => (current + 1) % images.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [images.length, reducedMotion, paused]);

  if (images.length === 0) return null;

  const showSingle = images.length === 1 || reducedMotion;
  const currentIndex = showSingle ? 0 : active;

  if (showSingle) {
    return (
      <Image
        src={images[0].src}
        alt={images[0].alt}
        fill
        priority
        className="object-cover object-[70%_center]"
        sizes="100vw"
      />
    );
  }

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
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
            className="object-cover object-[70%_center] motion-reduce:transition-none motion-reduce:opacity-100"
            style={{
              opacity: isActive ? 1 : 0,
              transition: `opacity ${FADE_DURATION_MS}ms ease-in-out`,
              zIndex: isActive ? 1 : 0,
            }}
            sizes="100vw"
          />
        );
      })}

      <div
        className="absolute bottom-6 right-4 z-20 flex gap-2 sm:right-8"
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
  );
}
