import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { resolveExistingImageDiskPath } from "@/lib/media/images-root";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

/** Serve /images/* from shared and/or public/images. */
export function servePublicImage(segments: string[]): NextResponse {
  if (segments.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const publicSrc = `/images/${segments.map(decodeURIComponent).join("/")}`;

  const diskPath = resolveExistingImageDiskPath(publicSrc);
  if (!diskPath) {
    return new NextResponse("Not found", { status: 404 });
  }

  let stat: fs.Stats;
  try {
    stat = fs.statSync(diskPath);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!stat.isFile() || stat.size < 1) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(diskPath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
  const body = fs.readFileSync(diskPath);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(body.length),
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}