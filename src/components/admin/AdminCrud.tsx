"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { adminInputClass } from "@/components/admin/AdminShell";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2";

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
      "bg-navy text-white hover:bg-navy/90 disabled:opacity-60",
    secondary:
      "border border-grey/40 bg-white text-navy hover:bg-slate-50 disabled:opacity-60",
    danger:
      "border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-60",
    ghost: "text-cornflower hover:bg-cornflower/10 disabled:opacity-60",
  } as const;

  return (
    <button
      type={type}
      form={form}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${focusRing} ${styles[variant]} ${className}`}
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
  tone?: "success" | "neutral" | "warning";
}) {
  const styles = {
    success: "bg-green-100 text-green-800",
    neutral: "bg-slate-100 text-grey-dark",
    warning: "bg-amber-100 text-amber-900",
  } as const;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[tone]}`}
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
    <div className="mb-4 flex flex-col gap-3 border-b border-grey/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-navy">{title}</h2>
        {description ? <p className="mt-1 text-sm text-grey-dark">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
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
    return <p className="py-8 text-center text-sm text-grey-dark">{emptyMessage}</p>;
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-grey/20 bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-3 py-3 text-xs font-semibold uppercase tracking-wide text-grey-dark ${col.headerClassName ?? ""}`}
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
                className="border-b border-grey/10 transition-colors hover:bg-slate-50/80"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-3 py-3 align-middle ${col.className ?? ""}`}>
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
            className="rounded-xl border border-grey/15 bg-white p-4 shadow-sm"
          >
            {mobileCard(row)}
          </li>
        ))}
      </ul>
    </>
  );
}

export function AdminModal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy/50"
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
        className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <header className="sticky top-0 border-b border-grey/10 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-navy">
                {title}
              </h2>
              {description ? (
                <p id={descId} className="mt-1 text-sm text-grey-dark">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`min-h-11 min-w-11 rounded-lg text-grey hover:bg-slate-100 ${focusRing}`}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </header>
        <div className="px-5 py-4">{children}</div>
        {footer ? (
          <footer className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-grey/10 bg-slate-50 px-5 py-4">
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
      className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
    >
      {children}
    </div>
  );
}

export { adminInputClass };
