import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { paginateAdminList, parseAdminPagination } from "@/lib/admin/pagination";
import {
  deleteMediaItem,
  findMediaItem,
  listAllMedia,
  listProjectOptions,
  type MediaKind,
  updateMediaCaption,
} from "@/lib/admin/media-service";
import { listProductTaxonomy } from "@/lib/admin/product-labels";

export type { AdminMediaItem, MediaKind } from "@/lib/admin/media-service";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const queryText = searchParams.get("q")?.trim() ?? "";
  const kind = (searchParams.get("kind") as MediaKind | "all") ?? "all";
  const category = searchParams.get("category")?.trim() || undefined;
  const subcategory = searchParams.get("subcategory")?.trim() || undefined;
  const { page, pageSize } = parseAdminPagination(searchParams, 24);
  const meta = searchParams.get("meta");

  if (meta === "options") {
    const [projects, taxonomy] = await Promise.all([
      listProjectOptions(),
      Promise.resolve(listProductTaxonomy()),
    ]);
    return NextResponse.json({ projects, taxonomy });
  }

  const items = await listAllMedia(
    queryText,
    kind === "all" ? undefined : kind,
    category,
    subcategory,
  );
  const paginated = paginateAdminList(items, page, pageSize);

  return NextResponse.json({
    items: paginated.items,
    total: paginated.totalItems,
    page: paginated.page,
    pageSize,
    totalPages: paginated.totalPages,
    from: paginated.from,
    to: paginated.to,
  });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as { id: string; caption?: string };
  if (!body.id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const items = await listAllMedia();
  const item = findMediaItem(items, body.id);
  if (!item) {
    return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  }

  if (typeof body.caption === "string") {
    await updateMediaCaption(item, body.caption);
    return NextResponse.json({ ok: true, caption: body.caption.trim() });
  }

  return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const items = await listAllMedia();
  const item = findMediaItem(items, id);
  if (!item) {
    return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  }

  if (item.kind === "hero") {
    return NextResponse.json(
      { error: "Las imágenes principales de categoría solo se pueden reemplazar, no eliminar." },
      { status: 400 },
    );
  }

  await deleteMediaItem(item);
  return NextResponse.json({ ok: true });
}
