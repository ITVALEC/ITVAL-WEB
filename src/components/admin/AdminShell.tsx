"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  {
    href: "/admin/dashboard",
    label: "Inicio",
    hint: "Resumen del sitio",
  },
  {
    href: "/admin/projects",
    label: "Obras",
    hint: "Proyectos realizados",
  },
  {
    href: "/admin/catalogo",
    label: "Catálogo",
    hint: "Categorías y productos",
  },
  {
    href: "/admin/imagenes",
    label: "Fotos",
    hint: "Todas las imágenes",
  },
  {
    href: "/admin/config",
    label: "Ajustes",
    hint: "Contacto y footer",
  },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2";

function NavLinks({
  pathname,
  onNavigate,
  compact = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  return (
    <ul className={compact ? "flex flex-col gap-1" : "grid gap-1 lg:grid-cols-1"}>
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`block min-h-11 rounded-lg px-3 py-2.5 transition-colors ${focusRing} ${
                active
                  ? "bg-navy text-white"
                  : "text-grey-dark hover:bg-slate-50 hover:text-navy"
              }`}
            >
              <span className="block text-sm font-semibold">{item.label}</span>
              <span
                className={`mt-0.5 block text-xs ${active ? "text-white/70" : "text-grey"}`}
              >
                {item.hint}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  function closeMenu() {
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onResize() {
      if (window.matchMedia("(min-width: 768px)").matches) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50/80 pb-8">
      <a
        href="#admin-main"
        className={`sr-only ${focusRing} focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-navy focus:shadow-lg`}
      >
        Saltar al contenido principal
      </a>

      <header className="sticky top-0 z-40 border-b border-grey/20 bg-navy text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-white/20 text-white hover:bg-white/10 md:hidden ${focusRing}`}
              aria-expanded={menuOpen}
              aria-controls="admin-nav-mobile"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
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
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 sm:text-xs">
                Administración ITVAL
              </p>
              <h1 className="truncate text-base font-bold sm:text-lg">{title}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/es"
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden min-h-11 items-center rounded-lg border border-white/20 px-3 py-2 text-sm text-white/90 hover:bg-white/10 sm:inline-flex ${focusRing}`}
            >
              Ver sitio
            </Link>
            <button
              type="button"
              onClick={logout}
              className={`min-h-11 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20 ${focusRing}`}
            >
              Salir
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav
            id="admin-nav-mobile"
            className="border-t border-white/15 bg-white px-3 py-3 text-navy md:hidden"
            aria-label="Secciones del panel"
          >
            <NavLinks pathname={pathname} onNavigate={closeMenu} compact />
            <Link
              href="/es"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className={`mt-2 flex min-h-11 items-center justify-center rounded-lg border border-grey/30 px-3 text-sm font-medium text-navy hover:bg-slate-50 sm:hidden ${focusRing}`}
            >
              Ver sitio
            </Link>
          </nav>
        ) : null}
      </header>

      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-navy/40 md:hidden"
          aria-label="Cerrar menú"
          onClick={closeMenu}
        />
      ) : null}

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 md:flex-row md:gap-8">
          <nav
            id="admin-nav"
            className="hidden md:block md:w-60 md:shrink-0"
            aria-label="Secciones del panel"
          >
            <div className="rounded-xl border border-grey/20 bg-white p-2 shadow-sm">
              <NavLinks pathname={pathname} />
            </div>
          </nav>

          <main id="admin-main" className="min-w-0 flex-1" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export function AdminPanel({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-xl border border-grey/20 bg-white p-4 shadow-sm sm:p-6"
      aria-labelledby={title ? "admin-panel-title" : undefined}
    >
      {title ? (
        <header className="mb-4 border-b border-grey/10 pb-4">
          <h2 id="admin-panel-title" className="text-lg font-semibold text-navy">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-grey-dark">{description}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function AdminField({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block text-sm">
      <label htmlFor={htmlFor} className="font-medium text-navy">
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-grey">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export const adminInputClass =
  "min-h-11 w-full rounded-lg border border-grey/40 bg-white px-3 py-2.5 text-sm text-navy focus-visible:border-cornflower focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower/30";

export const adminTextareaClass =
  "min-h-[96px] w-full rounded-lg border border-grey/40 bg-white px-3 py-2.5 text-sm text-navy focus-visible:border-cornflower focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower/30";

export function AdminSaveButton({
  saving,
  saved,
  label = "Guardar cambios",
}: {
  saving: boolean;
  saved: boolean;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={saving}
        aria-busy={saving}
        className="min-h-11 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Guardando…" : label}
      </button>
      {saved ? (
        <span className="text-sm font-medium text-green-700" role="status" aria-live="polite">
          Cambios guardados correctamente
        </span>
      ) : null}
    </div>
  );
}
