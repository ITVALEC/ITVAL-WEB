import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { Metrics } from "@/components/sections/Metrics";
import { ProductsPreview } from "@/components/sections/ProductsPreview";
import { FeaturedProjects } from "@/components/sections/FeaturedProjects";
import { Process } from "@/components/sections/Process";
import { CtaBanner } from "@/components/sections/CtaBanner";

type PageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Home — Design System Master Guide v1 + composición mockup.
 * Hero → métricas flotantes → servicios → obras (navy) → proceso → CTA.
 */
export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <Metrics />
      <ProductsPreview />
      <FeaturedProjects />
      <Process />
      <CtaBanner />
    </>
  );
}
