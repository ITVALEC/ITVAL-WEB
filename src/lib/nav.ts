import { NAV_PATHS } from "./routes";
import { type Pathnames } from "@/i18n/routing";

export const NAV_ITEMS = [
  { href: NAV_PATHS.home, labelKey: "nav.home" },
  { href: NAV_PATHS.products, labelKey: "nav.products" },
  { href: NAV_PATHS.projects, labelKey: "nav.projects" },
  { href: NAV_PATHS.about, labelKey: "nav.about" },
  { href: NAV_PATHS.contact, labelKey: "nav.contact" },
] as const satisfies ReadonlyArray<{
  href: Pathnames;
  labelKey:
    | "nav.home"
    | "nav.products"
    | "nav.projects"
    | "nav.about"
    | "nav.contact";
}>;

export type NavLabelKey = (typeof NAV_ITEMS)[number]["labelKey"];

export function buildNavItems(
  translate: (key: NavLabelKey) => string,
): ReadonlyArray<{ href: Pathnames; label: string }> {
  return NAV_ITEMS.map(({ href, labelKey }) => ({
    href,
    label: translate(labelKey),
  }));
}
