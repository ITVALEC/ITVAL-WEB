import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { Metrics } from "@/components/sections/Metrics";
import { ProductsPreview } from "@/components/sections/ProductsPreview";
import { FeaturedProjects } from "@/components/sections/FeaturedProjects";
import { Process } from "@/components/sections/Process";

type PageProps = {
  params: Promise<{ locale: string }>;
};

/** Home: Hero, metricas, servicios, obras y proceso. Sin CtaBanner. */
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
    </>
  );
}