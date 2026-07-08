"use client";

import { Pagination } from "@/components/ui/Pagination";
import { adminInputClass } from "@/components/admin/AdminShell";

type AdminPaginationProps = {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  totalItems: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  className?: string;
};

export function AdminPagination({
  page,
  totalPages,
  from,
  to,
  totalItems,
  itemLabel,
  onPageChange,
  className,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      className={className}
      labels={{
        navLabel: "Paginación de resultados",
        previous: "Anterior",
        next: "Siguiente",
        pageStatus: `Página ${page} de ${totalPages}`,
        goToPage: (pageNumber) => `Ir a la página ${pageNumber}`,
        showingRange:
          totalItems === 0
            ? `Sin ${itemLabel}`
            : `Mostrando ${from}–${to} de ${totalItems} ${itemLabel}`,
      }}
    />
  );
}

type AdminSearchFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  resultsCount?: number;
  resultsLabel?: string;
};

export function AdminSearchField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  resultsCount,
  resultsLabel,
}: AdminSearchFieldProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1 sm:max-w-md">
        <label htmlFor={id} className="block text-sm font-medium text-navy">
          {label}
        </label>
        {hint ? <p className="mt-0.5 text-xs text-grey">{hint}</p> : null}
        <input
          id={id}
          type="search"
          role="searchbox"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className={`${adminInputClass} mt-1.5`}
        />
      </div>
      {typeof resultsCount === "number" && resultsLabel ? (
        <p className="text-sm text-grey-dark" aria-live="polite" aria-atomic="true">
          {resultsCount} {resultsLabel}
        </p>
      ) : null}
    </div>
  );
}

export function AdminLoadingState({ label = "Cargando contenido…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="rounded-xl border border-grey/15 bg-slate-50 px-4 py-10 text-center"
    >
      <div
        className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-grey/30 border-t-navy"
        aria-hidden="true"
      />
      <p className="mt-4 text-sm text-grey-dark">{label}</p>
    </div>
  );
}

type AdminEmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function AdminEmptyState({ title, description, action }: AdminEmptyStateProps) {
  return (
    <div
      role="status"
      className="rounded-xl border border-dashed border-grey/30 bg-slate-50 px-6 py-10 text-center"
    >
      <p className="text-base font-semibold text-navy">{title}</p>
      <p className="mt-2 text-sm text-grey-dark">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

type AdminStatusMessageProps = {
  type: "success" | "error" | "info";
  message: string;
};

export function AdminStatusMessage({ type, message }: AdminStatusMessageProps) {
  const styles = {
    success: "border-green-200 bg-green-50 text-green-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  } as const;

  return (
    <p
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`rounded-lg border px-4 py-3 text-sm ${styles[type]}`}
    >
      {message}
    </p>
  );
}

type AdminTabOption<T extends string> = {
  value: T;
  label: string;
};

export function AdminTabList<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: AdminTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex flex-wrap gap-2"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`min-h-11 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2 ${
              selected
                ? "bg-navy text-white"
                : "bg-slate-100 text-grey-dark hover:bg-slate-200"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
