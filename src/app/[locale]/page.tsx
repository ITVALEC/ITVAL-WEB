import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { ProductsPreview } from "@/components/sections/ProductsPreview";
import { Metrics } from "@/components/sections/Metrics";
import { FeaturedProjects } from "@/components/sections/FeaturedProjects";
import { Process } from "@/components/sections/Process";
import { CtaBanner } from "@/components/sections/CtaBanner";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <ProductsPreview />
      <Metrics />
      <FeaturedProjects />
      <Process />
      <CtaBanner />
    </>
  );
}
