import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { ButtonLink } from "@/components/ui/Button";
import { PRODUCT_LIST_ITEM_KEYS } from "@/lib/content-keys";
import { getProjectsForProductSubcategory } from "@/lib/catalog";
import {
  getProductImageLive,
  getProductOnlyGalleryLive,
  getProjectReferenceGalleryLive,
} from "@/lib/catalog/product-images.server";
import {
  isCatalogPlaceholderSrc,
  isRealProductImageSrc,
  MAX_PRODUCT_GALLERY_IMAGES,
} from "@/lib/catalog/product-images";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { ProductPreviewCarousel } from "@/components/catalog/ProductPreviewCarousel";
import { breadcrumbTrail, productCategoryPath } from "@/lib/breadcrumbs";
import { CATALOG_NS, subcategoryNamespace } from "@/lib/i18n/namespaces";
import { NAV_PATHS } from "@/lib/routes";
import { type ProductKey } from "@/lib/catalog";

type ProductDetailViewProps = {
  locale: string;
  category: ProductKey;
  subcategory: string;
};

export async function ProductDetailView({
  locale,
  category,
  subcategory,
}: ProductDetailViewProps) {
  const tSub = await getTranslations({
    locale,
    namespace: subcategoryNamespace(category),
  });
  const tCat = await getTranslations({
    locale,
    namespace: `${CATALOG_NS}.categories`,
  });
  const tCatalog = await getTranslations({ locale, namespace: CATALOG_NS });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const relatedProjects = getProjectsForProductSubcategory(subcategory);
  const heroImage = await getProductImageLive(category, subcategory);
  const productGalleryImages = await getProductOnlyGalleryLive(category, subcategory);
  const worksGallery = await getProjectReferenceGalleryLive(category, subcategory);

  const subtitle = tSub(`${subcategory}.title`);
  // Galería Amazon: solo ángulos reales del producto (máx. 6). Sin obras, captions ni SVG marcadores.
  // Si no hay fotos de producto en disco, usar portada real; si tampoco, carrusel vacío.
  const realProductGallery = productGalleryImages.filter((image) =>
    isRealProductImageSrc(image.src),
  );
  const galleryForPreview =
    realProductGallery.length > 0
      ? realProductGallery.slice(0, MAX_PRODUCT_GALLERY_IMAGES)
      : heroImage && isRealProductImageSrc(heroImage)
        ? [{ src: heroImage, caption: "", source: "product" as const }]
        : [];

  const previewImages = galleryForPreview
    .filter((image) => !isCatalogPlaceholderSrc(image.src))
    .map((image, index) => ({
      src: image.src,
      alt: `${subtitle} — ${index + 1}`,
    }));

  const heroIsReal = Boolean(heroImage && isRealProductImageSrc(heroImage));

  return (
    <>
      <section className="relative overflow-hidden bg-navy py-16 lg:py-20">
        {heroIsReal && heroImage ? (
          <Image
            src={heroImage}
            alt={tSub(`${subcategory}.title`)}
            fill
            className="object-cover object-center saturate-[0.55]"
            sizes="(max-width: 1280px) 100vw, 1280px"
            loading="eager"
          />
        ) : null}
        <div className="absolute inset-0 bg-navy/70" aria-hidden="true" />
        <div
          className={`absolute inset-0 ${heroIsReal ? "bg-gradient-to-r from-navy/95 via-navy/85 to-navy/65" : ""}`}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-navy/45"
          aria-hidden="true"
        />
        <Container className="relative z-10">
          <Breadcrumbs
            light
            ariaLabel={tCommon("breadcrumbNav")}
            items={breadcrumbTrail(tNav("home"), [
              { label: tNav("products"), href: NAV_PATHS.products },
              {
                label: tCat(`${category}.title`),
                href: productCategoryPath(category),
              },
              { label: tSub(`${subcategory}.title`) },
            ])}
          />
          <h1 className="max-w-3xl font-display text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            {tSub(`${subcategory}.title`)}
          </h1>
          <p className="mt-4 max-w-2xl text-ds-body text-white/85">
            {tSub(`${subcategory}.description`)}
          </p>
        </Container>
      </section>

      <section className="border-b border-navy/10 bg-white py-section">
        <Container>
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
            {previewImages.length > 0 ? (
              <div className="min-w-0">
                <ProductPreviewCarousel images={previewImages} />
              </div>
            ) : null}

            <div className="flex min-w-0 flex-col gap-6">
              <div>
                <p className="text-ds-caption font-semibold uppercase tracking-[0.14em] text-gold-deep">
                  {tCatalog("detail.previewTitle")}
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">
                  {tSub(`${subcategory}.title`)}
                </h2>
                <p className="mt-3 text-ds-body leading-[1.5] text-ink/80">
                  {tSub(`${subcategory}.description`).trim() ||
                    tCatalog("detail.previewHint")}
                </p>
              </div>

              {(() => {
                const materials = tSub(`${subcategory}.materials`).trim();
                const standards = tSub(`${subcategory}.standards`).trim();
                const options = tSub(`${subcategory}.options`).trim();
                if (!materials && !standards && !options) return null;
                return (
                  <dl className="divide-y divide-navy/10 overflow-hidden rounded-card border border-navy/10 shadow-card">
                    {materials ? (
                      <SpecRow
                        title={tCatalog("detail.materials")}
                        content={materials}
                      />
                    ) : null}
                    {standards ? (
                      <SpecRow
                        title={tCatalog("detail.standards")}
                        content={standards}
                      />
                    ) : null}
                    {options ? (
                      <SpecRow
                        title={tCatalog("detail.options")}
                        content={options}
                      />
                    ) : null}
                  </dl>
                );
              })()}

              <ButtonLink href={NAV_PATHS.contact} variant="primary">
                {tCatalog("detail.requestQuote")}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-surface py-section">
        <Container>
          <div className="grid gap-8 md:grid-cols-2 md:gap-12">
            <ProductInfoBlock
              title={tCatalog("detail.applications")}
              items={PRODUCT_LIST_ITEM_KEYS.map((key) =>
                tSub(`${subcategory}.applications.${key}`),
              )}
            />
            <ProductInfoBlock
              title={tCatalog("detail.benefits")}
              items={PRODUCT_LIST_ITEM_KEYS.map((key) =>
                tSub(`${subcategory}.benefits.${key}`),
              )}
            />
          </div>

          <ProductGallery
            images={worksGallery}
            title={tCatalog("detail.projectGallery")}
          />

          {relatedProjects.length > 0 && (
            <div className="mt-16">
              <SectionHeading title={tCatalog("detail.relatedProjects")} />
              <ul className="mt-8 grid gap-card-gap sm:grid-cols-2 lg:grid-cols-3">
                {relatedProjects.map((project) => (
                  <li key={project.id}>
                    <ProjectCard project={project} linkToDetail />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

function ProductInfoBlock({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-navy">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 rounded-card border border-navy/10 bg-white p-4 shadow-card"
          >
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy"
              aria-hidden="true"
            >
              ✓
            </span>
            <span className="text-ink">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SpecRow({ title, content }: { title: string; content: string }) {
  return (
    <div className="bg-white px-4 py-3.5 sm:px-5">
      <dt className="text-xs font-semibold uppercase tracking-wider text-grey">
        {title}
      </dt>
      <dd className="mt-1 text-sm leading-relaxed text-ink/80">{content}</dd>
    </div>
  );
}
