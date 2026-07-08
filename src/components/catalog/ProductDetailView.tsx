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
  const heroImage = getProductImage(category, subcategory);
  const galleryImages = getProductGallery(category, subcategory);

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

      <section className="py-16 lg:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="space-y-10 lg:col-span-2">
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
              <ButtonLink href={NAV_PATHS.contact} variant="primary">
                {tCatalog("detail.requestQuote")}
              </ButtonLink>
            </div>

            <aside className="space-y-4">
              <SpecCard
                title={tCatalog("detail.materials")}
                content={tSub(`${subcategory}.materials`)}
              />
              <SpecCard
                title={tCatalog("detail.standards")}
                content={tSub(`${subcategory}.standards`)}
              />
              <SpecCard
                title={tCatalog("detail.options")}
                content={tSub(`${subcategory}.options`)}
              />
            </aside>
          </div>

          <ProductGallery
            images={galleryImages}
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
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cornflower text-xs font-bold text-white"
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

function SpecCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-lg border border-grey/30 bg-white p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-grey">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-grey-dark">{content}</p>
    </div>
  );
}
