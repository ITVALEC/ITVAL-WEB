import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { ButtonLink } from "@/components/ui/Button";
import { PRODUCT_LIST_ITEM_KEYS } from "@/lib/content-keys";
import { getProjectsForProductSubcategory } from "@/lib/catalog";
import { getProductImage, getProductGallery } from "@/lib/assets";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { ProductPreviewCarousel } from "@/components/catalog/ProductPreviewCarousel";
import { breadcrumbTrail, productCategoryPath } from "@/lib/breadcrumbs";
import { CATALOG_NS, subcategoryNamespace } from "@/lib/i18n/namespaces";
import { NAV_PATHS } from "@/lib/routes";
import { type ProductKey } from "@/lib/catalog";

const PREVIEW_IMAGE_LIMIT = 6;

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
  const heroImage = getProductImage(category, subcategory);
  const galleryImages = getProductGallery(category, subcategory);

  const subtitle = tSub(`${subcategory}.title`);
  const worksGallery = galleryImages.filter(
    (image) => image.src !== heroImage,
  );
  const previewImages = [
    ...(heroImage ? [{ src: heroImage, alt: subtitle }] : []),
    ...worksGallery.map((image) => ({
      src: image.src,
      alt: image.caption || subtitle,
    })),
  ].slice(0, PREVIEW_IMAGE_LIMIT);

  return (
    <>
      <section className="relative overflow-hidden bg-navy py-16 lg:py-20">
        {heroImage && (
          <Image
            src={heroImage}
            alt={tSub(`${subcategory}.title`)}
            fill
            className="object-cover object-center opacity-40"
            sizes="(max-width: 1280px) 100vw, 1280px"
            loading="eager"
          />
        )}
        <div
          className={`absolute inset-0 ${heroImage ? "bg-navy/80" : ""}`}
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
          <h1 className="max-w-3xl text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            {tSub(`${subcategory}.title`)}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
            {tSub(`${subcategory}.description`)}
          </p>
        </Container>
      </section>

      <section className="border-b border-grey/15 bg-white py-12 lg:py-16">
        <Container>
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
            {previewImages.length > 0 ? (
              <div className="min-w-0">
                <ProductPreviewCarousel images={previewImages} />
              </div>
            ) : null}

            <div className="flex min-w-0 flex-col gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-cornflower-ink">
                  {tCatalog("detail.previewTitle")}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">
                  {tSub(`${subcategory}.title`)}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-grey-dark">
                  {tCatalog("detail.previewHint")}
                </p>
              </div>

              <dl className="divide-y divide-grey/15 overflow-hidden rounded-xl border border-grey/20">
                <SpecRow
                  title={tCatalog("detail.materials")}
                  content={tSub(`${subcategory}.materials`)}
                />
                <SpecRow
                  title={tCatalog("detail.standards")}
                  content={tSub(`${subcategory}.standards`)}
                />
                <SpecRow
                  title={tCatalog("detail.options")}
                  content={tSub(`${subcategory}.options`)}
                />
              </dl>

              <ButtonLink href={NAV_PATHS.contact} variant="primary">
                {tCatalog("detail.requestQuote")}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-24">
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
              <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
      <h2 className="text-xl font-bold text-navy">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 rounded-lg border border-grey/30 bg-slate-50 p-4"
          >
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cornflower-ink text-xs font-bold text-white"
              aria-hidden="true"
            >
              ✓
            </span>
            <span className="text-navy">{item}</span>
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
      <dd className="mt-1 text-sm leading-relaxed text-grey-dark">{content}</dd>
    </div>
  );
}
