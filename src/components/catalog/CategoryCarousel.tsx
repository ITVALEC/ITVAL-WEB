"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CategoryCard } from "@/components/catalog/CategoryCard";
import { CategoryServiceItem } from "@/components/catalog/CategoryServiceItem";
import { type ProductKey } from "@/lib/catalog/types";

type CategoryCarouselProps = {
  categories: readonly ProductKey[];
  navLabel: string;
  previousLabel: string;
  nextLabel: string;
  /** "card" = foto + texto; "service" = iconos lineales tipo mockup. */
  variant?: "card" | "service";
};

export function CategoryCarousel({
  categories,
  navLabel,
  previousLabel,
  nextLabel,
  variant = "card",
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

  const itemWidth =
    variant === "service"
      ? "w-[min(85%,200px)] shrink-0 snap-start sm:w-[min(40%,200px)] lg:w-[min(20%,180px)]"
      : "w-[min(85%,280px)] shrink-0 snap-start sm:w-[min(48%,320px)] lg:w-[min(25%,280px)]";

  return (
    <div className="relative mt-10 sm:mt-12">
      <ul
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 sm:gap-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={navLabel}
      >
        {categories.map((category) => (
          <li key={category} className={itemWidth}>
            {variant === "service" ? (
              <CategoryServiceItem category={category} />
            ) : (
              <CategoryCard category={category} />
            )}
          </li>
        ))}
      </ul>

      {categories.length > 1 ? (
        <div className="mt-5 flex items-center justify-end gap-2 sm:mt-6">
          <CarouselButton
            direction="prev"
            label={previousLabel}
            disabled={!canScrollLeft}
            onClick={() => scrollByPage("prev")}
            tone={variant === "service" ? "gold" : "neutral"}
          />
          <CarouselButton
            direction="next"
            label={nextLabel}
            disabled={!canScrollRight}
            onClick={() => scrollByPage("next")}
            tone={variant === "service" ? "gold" : "neutral"}
          />
        </div>
      ) : null}
    </div>
  );
}

function CarouselButton({
  direction,
  label,
  disabled,
  onClick,
  tone = "neutral",
}: {
  direction: "prev" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
  tone?: "neutral" | "gold";
}) {
  const toneClass =
    tone === "gold"
      ? "border-gold/40 bg-white text-gold-deep hover:border-gold hover:bg-gold/10"
      : "border-grey/30 bg-white text-navy hover:border-gold hover:text-gold-deep";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border text-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none ${toneClass}`}
    >
      <span aria-hidden="true">{direction === "prev" ? "←" : "→"}</span>
    </button>
  );
}
