"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** Retraso extra al revelar (ms). */
  delayMs?: number;
  as?: ElementType;
};

/**
 * Fade-up al entrar en viewport. Respeta prefers-reduced-motion.
 */
export function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  as: Tag = "div",
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style: CSSProperties | undefined =
    delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined;

  const Comp = Tag as ElementType;

  return (
    <Comp
      ref={ref as never}
      className={`scroll-reveal${visible ? " scroll-reveal-in" : ""}${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}
    </Comp>
  );
}