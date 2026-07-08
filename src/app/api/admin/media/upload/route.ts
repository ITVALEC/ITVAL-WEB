import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import {
  addProductImage,
  addProjectImage,
  findMediaItem,
  listAllMedia,
  replaceMediaImage,
  validateUpload,
} from "@/lib/admin/media-service";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const action = String(form.get("action") ?? "replace");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  try {
    validateUpload({ size: file.size, type: file.type, name: file.name });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Archivo inválido" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    if (action === "add-project") {
      const projectId = String(form.get("projectId") ?? "").trim();
      if (!projectId) {
        return NextResponse.json({ error: "Proyecto requerido" }, { status: 400 });
      }
      const item = await addProjectImage(projectId, buffer, file.name);
      return NextResponse.json({ ok: true, item, src: item.src });
    }

    if (action === "add-product") {
      const category = String(form.get("category") ?? "").trim();
      const subcategory = String(form.get("subcategory") ?? "").trim();
      const caption = String(form.get("caption") ?? "").trim();
      if (!category || !subcategory) {
        return NextResponse.json({ error: "Categoría y subcategoría requeridas" }, { status: 400 });
      }
      const item = await addProductImage(category, subcategory, buffer, file.name, caption);
      return NextResponse.json({ ok: true, item, src: item.src });
    }

    const mediaId = String(form.get("mediaId") ?? "").trim();
    if (!mediaId) {
      return NextResponse.json({ error: "Imagen destino requerida" }, { status: 400 });
    }

    const items = await listAllMedia();
    const item = findMediaItem(items, mediaId);
    if (!item) {
      return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
    }

    const src = await replaceMediaImage(item, buffer, file.name);
    return NextResponse.json({ ok: true, src, mediaId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo subir la imagen" },
      { status: 500 },
    );
  }
}
