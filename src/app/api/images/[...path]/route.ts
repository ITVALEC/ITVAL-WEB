import { servePublicImage } from "@/lib/media/serve-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path?: string[] }> };

/** Rewrite target for /images/* (see next.config.ts beforeFiles). */
export async function GET(_request: Request, context: RouteContext) {
  const segments = (await context.params).path ?? [];
  return servePublicImage(segments);
}