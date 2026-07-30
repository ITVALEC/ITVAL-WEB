import { NextResponse } from "next/server";
import { servePublicImage } from "@/lib/media/serve-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sirve fotos sin extension en la ruta de la API (evita 404 de Next con .jpg/.webp).
 * Uso: /api/media/file?path=projects/obra/foto.jpg
 * Rewrite: /images/:path* -> /api/media/file?path=:path*
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("path")?.trim() ?? "";
  if (!raw) {
    return new NextResponse("Not found", { status: 404 });
  }

  const normalized = raw.replace(/^\/+/, "").replace(/\\/g, "/");
  if (
    !normalized ||
    normalized.includes("\0") ||
    normalized.includes("..") ||
    normalized.startsWith("/") ||
    /^[a-zA-Z]:/.test(normalized)
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Accept "images/..." or "projects/..."
  const relative = normalized.startsWith("images/")
    ? normalized.slice("images/".length)
    : normalized;

  if (!relative) {
    return new NextResponse("Not found", { status: 404 });
  }

  return servePublicImage(relative.split("/").filter(Boolean));
}