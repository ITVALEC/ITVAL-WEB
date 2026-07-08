import { type BreadcrumbItem } from "@/components/ui/Breadcrumbs";
import { NAV_PATHS } from "./routes";

export function homeCrumb(homeLabel: string): BreadcrumbItem {
  return { label: homeLabel, href: NAV_PATHS.home };
}

export function breadcrumbTrail(
  homeLabel: string,
  items: BreadcrumbItem[],
): BreadcrumbItem[] {
  return [homeCrumb(homeLabel), ...items];
}

export function productCategoryPath(category: string): `/productos/${string}` {
  return `/productos/${category}`;
}
