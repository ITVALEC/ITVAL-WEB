"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { adminInputClass } from "@/components/admin/AdminShell";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

export function AdminButton({
  children,
  variant = "primary",
  type = "button",
  disabled,
  onClick,
  className = "",
  form,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  form?: string;
}) {
  const styles = {
    primary:
      "bg-gold text-navy shadow-none hover:bg-gold-soft disabled:opacity-60",
    secondary:
      "border border-navy/25 bg-white text-navy shadow-none hover:border-gold hover:text-gold-deep disabled:opacity-60",
    danger:
      "border border-error/30 bg-white text-error hover:bg-error/5 disabled:opacity-60",
    ghost: "text-gold-deep hover:bg-gold/10 disabled:opacity-60",
  } as const;

  return (
    <button
      type={type}
      form={form}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center rounded-pill px-4 py-2 text-sm font-semibold transition-colors duration-ds ${focusRing} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function AdminBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "success" | "neutral" | "warning" | "cover" | "gallery";
}) {
  const styles = {
    success: "bg-success/15 text-success",
    neutral: "bg-surface-muted text-ink",
    warning: "bg-gold/20 text-navy",
    cover: "bg-gold/20 text-navy",
    gallery: "bg-navy/10 text-navy",
  } as const;

  return (
    <span
      className={`inline-flex rounded-pill px-2.5 py-0.5 text-xs font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

export function AdminCrudToolbar({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-navy/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-navy">{title}</h2>
        {description ? <p className="mt-1 text-sm text-ink/80">{description}</p> : null}
      </div>
      {action ? <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto">{action}</div> : null}
    </div>
  );
}

type Column<T> = {
  key: string;
  header: string;
  headerClassName?: string;
  cell: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
};

export function AdminDataTable<T extends { id: string }>({
  rows,
  columns,
  caption,
  emptyMessage = "No hay registros.",
  mobileCard,
}: {
  rows: T[];
  columns: Column<T>[];
  caption: string;
  emptyMessage?: string;
  mobileCard: (row: T) => ReactNode;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-ink/80">{emptyMessage}</p>;
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-navy/10 bg-surface">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-3 py-3.5 text-xs font-semibold uppercase tracking-wide text-ink/75 ${col.headerClassName ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-navy/5 transition-colors hover:bg-surface/80"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-3 py-4 align-middle ${col.className ?? ""}`}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden" aria-label={caption}>
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-card border border-navy/10 bg-white p-4 shadow-card"
          >
            {mobileCard(row)}
          </li>
        ))}
      </ul>
    </>
  );
}

const modalSizeClass = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
} as const;

export function AdminModal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
  size = "md",
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  /** md = formularios cortos; lg/xl = galerías y formularios densos en móvil. */
  size?: keyof typeof modalSizeClass;
}) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    // Solo enfocar el panel al ABRIR el modal; no en cada re-render
    // (si onClose cambia de identidad, no debe robar el foco del input).
    panelRef.current?.focus();

    const getFocusable = (): HTMLElement[] => {
      const panel = panelRef.current;
      if (!panel) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    };

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      // Atrapa el foco dentro del diálogo (patrón WAI-ARIA modal).
      if (event.key === "Tab") {
        const focusables = getFocusable();
        if (focusables.length === 0) {
          event.preventDefault();
          panelRef.current?.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (event.shiftKey) {
          if (active === first || active === panelRef.current) {
            event.preventDefault();
            last.focus();
          }
        } else if (active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy-dark/55"
        aria-label="Cerrar ventana"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`relative z-10 flex max-h-[min(92vh,100dvh)] w-full flex-col overflow-hidden rounded-t-card bg-white shadow-card-hover sm:rounded-card ${modalSizeClass[size]}`}
      >
        <header className="shrink-0 border-b border-navy/10 bg-white px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold text-navy">
                {title}
              </h2>
              {description ? (
                <p id={descId} className="mt-1 text-sm text-ink/80">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`min-h-11 min-w-11 shrink-0 rounded-xl text-grey hover:bg-surface ${focusRing}`}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {children}
        </div>
        {footer ? (
          <footer className="shrink-0 flex flex-wrap justify-end gap-2 border-t border-navy/10 bg-surface px-4 py-3 sm:px-5 sm:py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export function AdminConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AdminModal
      open={open}
      title={title}
      description={message}
      onClose={onCancel}
      footer={
        <>
          <AdminButton variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </AdminButton>
          <AdminButton
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Procesando…" : confirmLabel}
          </AdminButton>
        </>
      }
    >
      <p className="sr-only">{message}</p>
    </AdminModal>
  );
}

export function AdminInfoBanner({ children }: { children: ReactNode }) {
  return (
    <div
      role="note"
      className="mb-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-navy"
    >
      {children}
    </div>
  );
}

export { adminInputClass };
