"use client";

import { useTranslations } from "next-intl";

const NEXT_SECTION_ID = "home-content";

/**
 * Indicador discreto para bajar del hero al contenido.
 * Respeta prefers-reduced-motion (sin animación).
 */
export function HeroScrollCue() {
  const t = useTranslations("hero");

  function handleClick() {
    const target = document.getElementById(NEXT_SECTION_ID);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center sm:bottom-8">
      <button
        type="button"
        onClick={handleClick}
        className="hero-scroll-cue pointer-events-auto inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-full px-4 py-2 text-white transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
        aria-label={t("seeMoreAria")}
      >
        <span
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ textShadow: "0 1px 8px rgba(0,0,0,0.75)" }}
        >
          {t("seeMore")}
        </span>
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
