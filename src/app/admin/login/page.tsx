"use client";

import { useState } from "react";
import { adminInputClass } from "@/components/admin/AdminShell";
import { AdminStatusMessage } from "@/components/admin/AdminUi";

const LOGIN_TIMEOUT_MS = 15_000;
const isDev = process.env.NODE_ENV === "development";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Contraseña incorrecta. Verifica e intenta nuevamente.");
        return;
      }

      // Navegación completa para que la cookie de sesión se aplique de inmediato.
      window.location.assign("/admin/dashboard");
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "El servidor no respondió a tiempo. Espera unos segundos e inténtalo de nuevo.",
        );
      } else {
        setError(
          "No se pudo conectar con el servidor. Revisa la conexión e inténtalo de nuevo.",
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <main
        id="admin-login-main"
        className="w-full max-w-md rounded-2xl border border-grey/20 bg-white p-6 shadow-lg sm:p-8"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-cornflower-ink">
          ITVAL
        </p>
        <h1 className="mt-2 text-2xl font-bold text-navy">Panel de administración</h1>
        <p className="mt-2 text-sm text-grey-dark">
          Gestiona proyectos, textos de imágenes, footer y contenido del sitio.
        </p>

        <form onSubmit={handleSubmit} className="mt-6" noValidate>
          <label className="block text-sm font-medium text-navy" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${adminInputClass} mt-1.5`}
            autoComplete="current-password"
            aria-describedby={error ? "login-error" : "login-hint"}
            aria-invalid={Boolean(error)}
            required
            disabled={loading}
          />
          <p id="login-hint" className="mt-2 text-xs text-grey">
            {isDev ? (
              <>
                Acceso restringido. En local la contraseña se define en{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">.env.local</code>{" "}
                con{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
                  ADMIN_PASSWORD
                </code>
                .
              </>
            ) : (
              "Acceso restringido al equipo autorizado de ITVAL."
            )}
          </p>

          {error ? (
            <div id="login-error" className="mt-3" role="alert">
              <AdminStatusMessage type="error" message={error} />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="mt-6 min-h-11 w-full rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Ingresar al panel"}
          </button>
        </form>
      </main>
    </div>
  );
}
