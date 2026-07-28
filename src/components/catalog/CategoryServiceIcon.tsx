import type { ReactNode } from "react";
import { type ProductKey } from "@/lib/catalog";

const ICON_CLASS = "h-8 w-8";

function IconShell({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-14 w-14 items-center justify-center text-navy/80 transition-colors group-hover:text-gold-deep">
      <svg
        className={ICON_CLASS}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </span>
  );
}

const ICONS: Record<ProductKey, ReactNode> = {
  facades: (
    <IconShell>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
    </IconShell>
  ),
  aluminumWindows: (
    <IconShell>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M12 4v16M3 12h18" />
    </IconShell>
  ),
  doorsAccess: (
    <IconShell>
      <path d="M8 3h8a1 1 0 0 1 1 1v16H7V4a1 1 0 0 1 1-1z" />
      <path d="M14 12h.01" />
    </IconShell>
  ),
  automaticDoors: (
    <IconShell>
      <path d="M4 4h7v16H4zM13 4h7v16h-7" />
      <path d="M11 12H4M20 12h-7" />
    </IconShell>
  ),
  security: (
    <IconShell>
      <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </IconShell>
  ),
  coversExteriors: (
    <IconShell>
      <path d="M3 14l9-8 9 8" />
      <path d="M5 12v8h14v-8" />
      <path d="M10 20v-5h4v5" />
    </IconShell>
  ),
  acmLouvers: (
    <IconShell>
      <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </IconShell>
  ),
  corporateInteriors: (
    <IconShell>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 21v-8h6v8M9 8h.01M15 8h.01M9 12h.01M15 12h.01" />
    </IconShell>
  ),
  architecturalGlass: (
    <IconShell>
      <path d="M4 20L12 4l8 16H4z" />
      <path d="M8.5 14h7" />
    </IconShell>
  ),
  stainlessSteel: (
    <IconShell>
      <path d="M6 4h12v16H6z" />
      <path d="M6 9h12M6 14h12M10 4v16" />
    </IconShell>
  ),
};

export function CategoryServiceIcon({ category }: { category: ProductKey }) {
  return <>{ICONS[category] ?? ICONS.facades}</>;
}
