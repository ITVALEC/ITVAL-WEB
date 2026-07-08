"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CategoryCard } from "@/components/catalog/CategoryCard";
import { type ProductKey } from "@/lib/catalog/types";

type CategoryCarouselProps = {
  categories: readonly ProductKey[];
  navLabel: string;
  previousLabel: string;
  nextLabel: string;
};

export function CategoryCarousel({
  categories,
  navLabel,
  previousLabel,
  nextLabel,
}: CategoryCarouselProps) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const threshold = 8;
    setCanScrollLeft(el.scrollLeft > threshold);
    setCanScrollRight(
      el.scrollLeft + el.clientWidth < el.scrollWidth - threshold,
    );
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateScrollState();

    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [categories.length, updateScrollState]);

  const scrollByPage = (direction: "prev" | "next") => {
    const el = scrollerRef.current;
    if (!el) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    el.scrollBy({
      left: direction === "next" ? el.clientWidth * 0.85 : -el.clientWidth * 0.85,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  if (categories.length === 0) return null;

  return (
    <div className="relative mt-12">
      <ul
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={navLabel}
      >
        {categories.map((category) => (
          <li
            key={category}
            className="w-[min(100%,300px)] shrink-0 snap-start sm:w-[min(48%,320px)] lg:w-[min(25%,280px)]"
          >
            <CategoryCard category={category} />
          </li>
        ))}
      </ul>

      {categories.length > 1 && (
        <div className="mt-5 flex items-center justify-end gap-2">
          <CarouselButton
            direction="prev"
            label={previousLabel}
            disabled={!canScrollLeft}
            onClick={() => scrollByPage("prev")}
          />
          <CarouselButton
            direction="next"
            label={nextLabel}
            disabled={!canScrollRight}
            onClick={() => scrollByPage("next")}
          />
        </div>
      )}
    </div>
  );
}

function CarouselButton({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-grey/30 bg-white text-lg font-semibold text-navy transition-colors hover:border-cornflower hover:text-cornflower focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
    >
      <span aria-hidden="true">{direction === "prev" ? "←" : "→"}</span>
    </button>
  );
}
