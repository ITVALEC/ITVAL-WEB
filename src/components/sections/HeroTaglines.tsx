"use client";

import { useCallback, useEffect, useState } from "react";

const ROTATE_MS = 9000;
const FADE_MS = 1400;

export type HeroTaglineItem = {
  key: string;
  lead: string;
  body: string;
};

type HeroTaglinesProps = {
  items: HeroTaglineItem[];
  navLabel: string;
};

export function HeroTaglines({ items, navLabel }: HeroTaglinesProps) {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);
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
      if (items.length === 0) return;
      setActive(((index % items.length) + items.length) % items.length);
      setVisible(true);
    },
    [items.length],
  );

  useEffect(() => {
    if (items.length <= 1 || reducedMotion || paused) return;

    let fadeTimeout: number | undefined;

    const id = window.setInterval(() => {
      if (document.hidden) return;

      setVisible(false);
      fadeTimeout = window.setTimeout(() => {
        setActive((current) => (current + 1) % items.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);

    return () => {
      window.clearInterval(id);
      if (fadeTimeout !== undefined) window.clearTimeout(fadeTimeout);
    };
  }, [items.length, reducedMotion, paused]);

  if (items.length === 0) return null;

  if (reducedMotion) {
    return (
      <div
        className="hero-reveal hero-reveal-delay-2 mt-8 max-w-2xl rounded-sm border border-gold/25 bg-navy/90 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-6"
        aria-label={navLabel}
      >
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.key} className="text-base leading-relaxed sm:text-lg">
              <span className="font-semibold text-gold">{item.lead}</span>{" "}
              <span className="text-white">{item.body}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const current = items[active];

  return (
    <div
      className="hero-reveal hero-reveal-delay-2 mt-8 max-w-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="rounded-sm border border-gold/25 bg-navy/90 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-6"
        aria-live="polite"
        aria-atomic="true"
      >
        <p
          className="min-h-[4.5rem] text-base leading-relaxed sm:min-h-[5rem] sm:text-lg"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(6px)",
            transition: `opacity ${FADE_MS}ms ease-in-out, transform ${FADE_MS}ms ease-in-out`,
          }}
        >
          <span className="font-semibold text-gold">{current.lead}</span>{" "}
          <span className="text-white">{current.body}</span>
        </p>
      </div>

      {items.length > 1 ? (
        <div
          className="mt-3 flex gap-2"
          role="tablist"
          aria-label={navLabel}
        >
          {items.map((item, index) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={item.lead}
              onClick={() => goTo(index)}
              className={`h-1.5 rounded-full transition-[width,background-color] duration-500 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy motion-reduce:transition-none ${
                index === active
                  ? "w-8 bg-gold"
                  : "w-3 bg-white/40 hover:bg-white/65"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
