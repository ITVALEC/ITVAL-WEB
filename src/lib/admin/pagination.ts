import { paginateItems } from "@/lib/pagination";

export const ADMIN_DEFAULT_PAGE_SIZE = 10;

export function parseAdminPagination(
  searchParams: URLSearchParams,
  defaultPageSize = ADMIN_DEFAULT_PAGE_SIZE,
) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? String(defaultPageSize), 10) || defaultPageSize),
  );

  return { page, pageSize };
}

export function paginateAdminList<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
) {
  return paginateItems(items, page, pageSize);
}
