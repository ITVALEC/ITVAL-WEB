"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ButtonLink } from "@/components/ui/Button";
import { buildNavItems } from "@/lib/nav";
import { NAV_PATHS } from "@/lib/constants";
import { Logo } from "@/components/ui/Logo";

/** Píxeles de scroll antes de fijar fondo sólido en el inicio. */
const SCROLL_THRESHOLD = 16;

function isHomePath(pathname: string): boolean {
  return pathname === NAV_PATHS.home;
}

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const isHome = isHomePath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navItems = buildNavItems((key) => t(key));

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const isOverlay = isHome && !scrolled && !menuOpen;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-[background-color,box-shadow,border-color] duration-300 motion-reduce:transition-none ${
        isOverlay
          ? "border-b border-transparent bg-transparent shadow-none"
          : "border-b border-white/10 bg-navy shadow-lg"
      }`}
    >
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href={NAV_PATHS.home}
          className={`group flex shrink-0 items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2 ${
            isOverlay ? "focus-visible:ring-offset-transparent" : "focus-visible:ring-offset-navy"
          }`}
          aria-label={t("common.logoAlt")}
        >
          <Logo
            priority
            alt={t("common.logoAlt")}
            className={`h-9 w-auto sm:h-10 ${
              isOverlay ? "drop-shadow-md" : ""
            }`}
          />
        </Link>

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label={t("footer.nav")}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-sm text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:text-cornflower focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2 ${
                isOverlay
                  ? "text-white/90 drop-shadow-sm focus-visible:ring-offset-transparent"
                  : "text-white/95 focus-visible:ring-offset-navy"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <LanguageSwitcher transparent={isOverlay} />
          <ButtonLink href={NAV_PATHS.contact} variant="primary">
            {t("common.quoteNow")}
          </ButtonLink>
        </div>

        <button
          type="button"
          className={`inline-flex items-center justify-center rounded-md p-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower md:hidden ${
            isOverlay ? "drop-shadow-sm" : ""
          }`}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="sr-only">
            {menuOpen ? t("common.closeMenu") : t("common.openMenu")}
          </span>
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-menu"
          className="border-t border-white/15 bg-navy px-4 pb-4 pt-2 md:hidden"
          aria-label={t("footer.nav")}
        >
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2.5 text-base font-medium text-white/90 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-3 flex items-center justify-between gap-3 px-3">
              <LanguageSwitcher transparent={false} />
              <ButtonLink
                href={NAV_PATHS.contact}
                variant="primary"
                className="flex-1 text-center"
                onClick={() => setMenuOpen(false)}
              >
                {t("common.quoteNow")}
              </ButtonLink>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
