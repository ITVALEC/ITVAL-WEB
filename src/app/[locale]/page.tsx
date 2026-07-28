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
 * Home — Fase 1 navy/oro.
 * Orden visual tipo mockup: Hero → métricas (barra) → servicios → obras → proceso → CTA.
 * Sin franja de logos de clientes: no hay assets reales de marcas en el repo.
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
