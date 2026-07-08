"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  {
    href: "/admin/dashboard",
    label: "Inicio",
    shortLabel: "Inicio",
    hint: "Resumen del sitio",
  },
  {
    href: "/admin/projects",
    label: "Obras",
    shortLabel: "Obras",
    hint: "Proyectos realizados",
  },
  {
    href: "/admin/catalogo",
    label: "Catálogo",
    shortLabel: "Catálogo",
    hint: "Categorías y productos",
  },
  {
    href: "/admin/imagenes",
    label: "Fotos",
    shortLabel: "Fotos",
    hint: "Todas las imágenes",
  },
  {
    href: "/admin/config",
    label: "Ajustes",
    shortLabel: "Ajustes",
    hint: "Contacto y footer",
  },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2";

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
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 sm:text-xs">
              Administración ITVAL
            </p>
            <h1 className="truncate text-base font-bold sm:text-lg">{title}</h1>
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
              onClick={() => setMenuOpen((open) => !open)}
              className={`min-h-11 rounded-lg border border-white/20 px-3 py-2 text-sm lg:hidden ${focusRing}`}
              aria-expanded={menuOpen}
              aria-controls="admin-nav"
            >
              {menuOpen ? "Cerrar menú" : "Menú"}
            </button>
            <button
              type="button"
              onClick={logout}
              className={`min-h-11 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20 ${focusRing}`}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
          <nav
            id="admin-nav"
            className={`lg:block lg:w-60 lg:shrink-0 ${menuOpen ? "block" : "hidden"}`}
            aria-label="Secciones del panel"
          >
            <ul className="grid gap-1 rounded-xl border border-grey/20 bg-white p-2 shadow-sm sm:grid-cols-2 lg:grid-cols-1">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`block min-h-11 rounded-lg px-3 py-2.5 transition-colors ${focusRing} ${
                        active
                          ? "bg-navy text-white"
                          : "text-grey-dark hover:bg-slate-50 hover:text-navy"
                      }`}
                    >
                      <span className="block text-sm font-semibold">
                        <span className="lg:hidden">{item.shortLabel}</span>
                        <span className="hidden lg:inline">{item.label}</span>
                      </span>
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
