import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  serverExternalPackages: ["pg", "mongodb"],
  experimental: {
    // Subidas admin (fotos hasta 20 MB) vía Route Handlers / middleware.
    middlewareClientMaxBodySize: "25mb",
  },
  serverActions: {
    bodySizeLimit: "25mb",
  },
  // beforeFiles: Next no debe devolver 404 de public/ antes de llegar al handler.
  // Las fotos de proyectos/productos viven en ITVAL_IMAGES_ROOT (shared en VPS).
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/images/:path*",
          destination: "/api/images/:path*",
        },
      ],
    };
  },
};

export default withNextIntl(nextConfig);
