"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Pagination } from "@/components/ui/Pagination";
import { CATALOG_PAGE_SIZE, paginateItems } from "@/lib/pagination";
import { CATALOG_NS } from "@/lib/i18n/namespaces";
import type { ProductGalleryImage } from "@/lib/catalog/product-images";

type ProductGalleryProps = {
  images: ProductGalleryImage[];
  title: string;
};

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const t = useTranslations(`${CATALOG_NS}.detail`);
  const [active, setActive] = useState<ProductGalleryImage | null>(null);
  const [page, setPage] = useState(1);

  const paginated = useMemo(
    () => paginateItems(images, page, CATALOG_PAGE_SIZE),
    [images, page],
  );

  if (images.length === 0) return null;

  return (
    <>
      <section className="mt-16" aria-labelledby="product-gallery-heading">
        <h2
          id="product-gallery-heading"
          className="text-2xl font-bold text-navy"
        >
          {title}
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.items.map((image) => (
            <li key={image.src}>
              <button
                type="button"
                onClick={() => setActive(image)}
                className="group block w-full overflow-hidden rounded-lg border border-grey/30 bg-white text-left transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <SafeImage
                    src={image.src}
                    alt={image.caption}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                {image.caption && (
                  <p className="line-clamp-2 px-4 py-3 text-sm font-medium text-navy">
                    {image.caption}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>

        <Pagination
          page={paginated.page}
          totalPages={paginated.totalPages}
          onPageChange={setPage}
          labels={{
            navLabel: t("galleryPaginationNav"),
            previous: t("galleryPreviousPage"),
            next: t("galleryNextPage"),
            pageStatus: t("galleryPageStatus", {
              page: paginated.page,
              totalPages: paginated.totalPages,
            }),
            goToPage: (pageNumber) => t("galleryGoToPage", { page: pageNumber }),
            showingRange: t("galleryShowingRange", {
              from: paginated.from,
              to: paginated.to,
              total: paginated.totalItems,
            }),
          }}
        />
      </section>

      {active && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={active.caption}
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute right-4 top-4 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {t("closeGallery")}
          </button>
          <div
            className="relative max-h-[85vh] w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg">
              <SafeImage
                src={active.src}
                alt={active.caption}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
            {active.caption && (
              <p className="mt-4 text-center text-sm text-white/90">
                {active.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
