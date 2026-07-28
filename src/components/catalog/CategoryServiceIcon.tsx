import type { ReactNode } from "react";
import { type ProductKey } from "@/lib/catalog";

type IconSize = "sm" | "md";

function IconShell({
  children,
  size = "md",
}: {
  children: ReactNode;
  size?: IconSize;
}) {
  if (size === "sm") {
    return (
      <svg
        className="h-4 w-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    );
  }

  return (
    <span className="inline-flex h-14 w-14 items-center justify-center text-navy/80 transition-colors group-hover:text-gold-deep">
      <svg
        className="h-8 w-8"
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

const ICON_PATHS: Record<ProductKey, ReactNode> = {
  facades: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
    </>
  ),
  aluminumWindows: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M12 4v16M3 12h18" />
    </>
  ),
  doorsAccess: (
    <>
      <path d="M8 3h8a1 1 0 0 1 1 1v16H7V4a1 1 0 0 1 1-1z" />
      <path d="M14 12h.01" />
    </>
  ),
  automaticDoors: (
    <>
      <path d="M4 4h7v16H4zM13 4h7v16h-7" />
      <path d="M11 12H4M20 12h-7" />
    </>
  ),
  security: (
    <>
      <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </>
  ),
  coversExteriors: (
    <>
      <path d="M3 14l9-8 9 8" />
      <path d="M5 12v8h14v-8" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  acmLouvers: (
    <>
      <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </>
  ),
  corporateInteriors: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 21v-8h6v8M9 8h.01M15 8h.01M9 12h.01M15 12h.01" />
    </>
  ),
  architecturalGlass: (
    <>
      <path d="M4 20L12 4l8 16H4z" />
      <path d="M8.5 14h7" />
    </>
  ),
  stainlessSteel: (
    <>
      <path d="M6 4h12v16H6z" />
      <path d="M6 9h12M6 14h12M10 4v16" />
    </>
  ),
};

export function CategoryServiceIcon({
  category,
  size = "md",
}: {
  category: ProductKey;
  size?: IconSize;
}) {
  const paths = ICON_PATHS[category] ?? ICON_PATHS.facades;
  return <IconShell size={size}>{paths}</IconShell>;
}
