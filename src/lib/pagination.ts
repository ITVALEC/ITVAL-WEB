export const CATALOG_PAGE_SIZE = 9;

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
  from: number;
  to: number;
};

export function paginateItems<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  if (items.length === 0) {
    return {
      items: [],
      page: 1,
      totalPages: 1,
      totalItems: 0,
      from: 0,
      to: 0,
    };
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    totalItems: items.length,
    from: start + 1,
    to: Math.min(start + pageSize, items.length),
  };
}

export function getPageNumbers(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let p = start; p <= end; p += 1) {
    pages.push(p);
  }

  if (current < total - 2) pages.push("ellipsis");

  pages.push(total);
  return pages;
}
