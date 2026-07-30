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

export const runtime = "nodejs";

function getUploadFile(value: FormDataEntryValue | null): {
  size: number;
  type: string;
  name: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
} | null {
  if (typeof File !== "undefined" && value instanceof File) {
    return value;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Blob).arrayBuffer === "function" &&
    typeof (value as Blob).size === "number"
  ) {
    const blob = value as Blob & { name?: string };
    return {
      size: blob.size,
      type: blob.type ?? "",
      name: typeof blob.name === "string" && blob.name.trim() ? blob.name.trim() : "imagen.jpg",
      arrayBuffer: () => blob.arrayBuffer(),
    };
  }
  return null;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch (error) {
    console.error("[media/upload] formData parse failed:", error);
    return NextResponse.json(
      {
        error:
          "No se pudo leer el archivo. Si pesa mucho, usa menos de 20 MB o comprueba el límite del servidor.",
      },
      { status: 413 },
    );
  }

  const file = getUploadFile(form.get("file"));
  const action = String(form.get("action") ?? "replace");

  if (!file || file.size <= 0) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  const fileName = file.name;
  const fileType = file.type;

  try {
    validateUpload({ size: file.size, type: fileType, name: fileName });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Archivo inválido" },
      { status: 400 },
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch (error) {
    console.error("[media/upload] arrayBuffer failed:", error);
    return NextResponse.json(
      { error: "No se pudo leer el contenido del archivo." },
      { status: 400 },
    );
  }

  if (buffer.length === 0) {
    return NextResponse.json({ error: "El archivo llegó vacío al servidor." }, { status: 400 });
  }

  try {
    if (action === "add-project") {
      const projectId = String(form.get("projectId") ?? "").trim();
      if (!projectId) {
        return NextResponse.json({ error: "Proyecto requerido" }, { status: 400 });
      }
      const item = await addProjectImage(projectId, buffer, fileName);
      return NextResponse.json({ ok: true, item, src: item.src });
    }

    if (action === "add-product") {
      const category = String(form.get("category") ?? "").trim();
      const subcategory = String(form.get("subcategory") ?? "").trim();
      const caption = String(form.get("caption") ?? "").trim();
      if (!category || !subcategory) {
        return NextResponse.json(
          { error: "Categoría y subcategoría requeridas" },
          { status: 400 },
        );
      }
      const item = await addProductImage(category, subcategory, buffer, fileName, caption);
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

    const src = await replaceMediaImage(item, buffer, fileName);
    return NextResponse.json({ ok: true, src, mediaId });
  } catch (error) {
    console.error("[media/upload] failed:", error);
    const message = error instanceof Error ? error.message : "No se pudo subir la imagen";
    const status =
      message.includes("Máximo") ||
      message.includes("no permitido") ||
      message.includes("no soportado") ||
      message.includes("vacío")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
