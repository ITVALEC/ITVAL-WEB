import type { ReactNode } from "react";
import type { PrimaryGroup } from "@/lib/catalog/filter-keys";

const ICON_CLASS = "h-4 w-4 shrink-0";

function IconShell({ children }: { children: ReactNode }) {
  return (
    <svg
      className={ICON_CLASS}
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

const ICONS: Record<Exclude<PrimaryGroup, "all">, ReactNode> = {
  facades: (
    <IconShell>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
    </IconShell>
  ),
  windows: (
    <IconShell>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M12 4v16M3 12h18" />
    </IconShell>
  ),
  doors: (
    <IconShell>
      <path d="M8 3h8a1 1 0 0 1 1 1v16H7V4a1 1 0 0 1 1-1z" />
      <path d="M14 12h.01" />
    </IconShell>
  ),
  security: (
    <IconShell>
      <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </IconShell>
  ),
  exteriors: (
    <IconShell>
      <path d="M3 14l9-8 9 8" />
      <path d="M5 12v8h14v-8" />
      <path d="M10 20v-5h4v5" />
    </IconShell>
  ),
  interiors: (
    <IconShell>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 21v-8h6v8M9 8h.01M15 8h.01M9 12h.01M15 12h.01" />
    </IconShell>
  ),
  steel: (
    <IconShell>
      <path d="M6 4h12v16H6z" />
      <path d="M6 9h12M6 14h12M10 4v16" />
    </IconShell>
  ),
  other: (
    <IconShell>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2.5" />
    </IconShell>
  ),
};

const ALL_ICON = (
  <IconShell>
    <path d="M4 6h16M4 12h16M4 18h10" />
  </IconShell>
);

export function PrimaryGroupIcon({ group }: { group: PrimaryGroup }) {
  if (group === "all") return ALL_ICON;
  return <>{ICONS[group] ?? ICONS.other}</>;
}
