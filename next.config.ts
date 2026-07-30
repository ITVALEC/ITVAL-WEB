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
  // beforeFiles: no depender de public/ ni de rutas API con .jpg (Next las 404).
  // /images/* → /api/media/file?path=* (handler sin extensión en la URL de la API).
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/images/:path*",
          destination: "/api/media/file?path=:path*",
        },
      ],
    };
  },
};

export default withNextIntl(nextConfig);
