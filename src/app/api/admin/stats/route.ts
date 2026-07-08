import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { MANIFEST_PATHS, readJsonFile } from "@/lib/admin/manifests";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const projects = readJsonFile<{ projects: { featured?: boolean }[] }>(
    MANIFEST_PATHS.projects,
  );
  const products = readJsonFile<{ subcategories?: unknown }>(
    MANIFEST_PATHS.products,
  );
  const blocked = readJsonFile<{ files: string[] }>(MANIFEST_PATHS.blocked);
  const taxonomy = readJsonFile<Record<string, unknown>>(MANIFEST_PATHS.taxonomy);

  const productCount = products.subcategories
    ? Object.values(products.subcategories as Record<string, unknown>).flat().length
    : 0;

  return NextResponse.json({
    projects: projects.projects.length,
    featured: projects.projects.filter((p) => Boolean(p.featured)).length,
    products: productCount,
    blockedImages: blocked.files.length,
    categories: Object.keys(taxonomy).length,
  });
}
