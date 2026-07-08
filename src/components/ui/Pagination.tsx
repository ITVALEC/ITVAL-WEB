"use client";

import type { ReactNode } from "react";
import { getPageNumbers } from "@/lib/pagination";

type PaginationLabels = {
  navLabel: string;
  previous: string;
  next: string;
  pageStatus: string;
  goToPage: (page: number) => string;
  showingRange: string;
};

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  labels: PaginationLabels;
  className?: string;
};

export function Pagination({
  page,
  totalPages,
  onPageChange,
  labels,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <nav
      className={`mt-10 flex flex-col items-center gap-4 border-t border-grey/20 pt-8 ${className}`}
      aria-label={labels.navLabel}
    >
      <p className="text-sm text-grey-dark">{labels.showingRange}</p>

      <div className="flex flex-wrap items-center justify-center gap-1">
        <PageButton
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          ariaLabel={labels.previous}
        >
      ← <span className="hidden sm:inline">{labels.previous}</span>
        </PageButton>

        <ol className="flex items-center gap-1" role="list">
          {pages.map((entry, index) =>
            entry === "ellipsis" ? (
              <li
                key={`ellipsis-${index}`}
                className="px-2 text-sm text-grey"
                aria-hidden="true"
              >
                …
              </li>
            ) : (
              <li key={entry} role="listitem">
                <button
                  type="button"
                  onClick={() => onPageChange(entry)}
                  aria-label={labels.goToPage(entry)}
                  aria-current={entry === page ? "page" : undefined}
                  className={`min-h-10 min-w-10 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2 ${
                    entry === page
                      ? "bg-navy text-white"
                      : "text-navy hover:bg-slate-100"
                  }`}
                >
                  {entry}
                </button>
              </li>
            ),
          )}
        </ol>

        <PageButton
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          ariaLabel={labels.next}
        >
          <span className="hidden sm:inline">{labels.next}</span> →
        </PageButton>
      </div>

      <p className="sr-only" aria-live="polite">
        {labels.pageStatus}
      </p>
    </nav>
  );
}

function PageButton({
  children,
  disabled,
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  disabled: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="min-h-10 rounded-md px-3 text-sm font-semibold text-navy transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
