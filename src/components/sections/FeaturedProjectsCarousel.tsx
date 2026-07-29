"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { SafeImage } from "@/components/ui/SafeImage";
import { getProjectPath } from "@/lib/catalog";
import { getProjectImage, type Project } from "@/lib/projects";

type FeaturedProjectsCarouselProps = {
  projects: readonly Project[];
  navLabel: string;
  previousLabel: string;
  nextLabel: string;
};

export function FeaturedProjectsCarousel({
  projects,
  navLabel,
  previousLabel,
  nextLabel,
}: FeaturedProjectsCarouselProps) {
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
  }, [projects.length, updateScrollState]);

  const scrollByPage = (direction: "prev" | "next") => {
    const el = scrollerRef.current;
    if (!el) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollBy({
      left: direction === "next" ? el.clientWidth * 0.8 : -el.clientWidth * 0.8,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  if (projects.length === 0) return null;

  return (
    <div className="relative mt-10">
      <ul
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-card-gap overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={navLabel}
      >
        {projects.map((project) => (
          <li
            key={project.id}
            className="w-[min(85%,280px)] shrink-0 snap-start sm:w-[min(45%,300px)] lg:w-[min(28%,260px)]"
          >
            <AppLink
              href={getProjectPath(project.id)}
              className="group relative block aspect-[4/5] overflow-hidden rounded-card shadow-card transition duration-ds hover:scale-[1.03] hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark motion-reduce:hover:scale-100"
            >
              <SafeImage
                src={getProjectImage(project)}
                alt={project.name}
                fill
                className="object-cover transition-transform duration-ds group-hover:scale-105 motion-reduce:transform-none"
                sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 28vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/55 to-navy-dark/15"
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <h3 className="font-display text-lg font-bold text-white sm:text-xl">
                  {project.name}
                </h3>
                <p className="mt-1 text-ds-caption text-white/75">{project.location}</p>
              </div>
            </AppLink>
          </li>
        ))}
      </ul>

      {projects.length > 1 ? (
        <div className="mt-6 flex items-center justify-end gap-2">
          <NavButton
            direction="prev"
            label={previousLabel}
            disabled={!canScrollLeft}
            onClick={() => scrollByPage("prev")}
          />
          <NavButton
            direction="next"
            label={nextLabel}
            disabled={!canScrollRight}
            onClick={() => scrollByPage("next")}
          />
        </div>
      ) : null}
    </div>
  );
}

function NavButton({
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
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-gold/40 bg-navy text-gold transition-colors duration-ds hover:border-gold hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
    >
      <span aria-hidden="true">{direction === "prev" ? "←" : "→"}</span>
    </button>
  );
}
