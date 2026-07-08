import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import {
  MANIFEST_PATHS,
  readJsonFile,
  writeJsonFile,
} from "@/lib/admin/manifests";
import {
  paginateAdminList,
  parseAdminPagination,
} from "@/lib/admin/pagination";
import { isDatabaseEnabled, query } from "@/lib/db/pool";
import { syncDatabaseToJson } from "@/lib/db/sync-json";

export type AdminGalleryItem = {
  id: string;
  category: string;
  subcategory: string;
  index: number;
  src: string;
  caption: string;
};

type GalleryImage = { src: string; caption: string; source?: string };
type ProductManifest = {
  galleries?: Record<string, Record<string, GalleryImage[]>>;
  [key: string]: unknown;
};

function flattenGalleries(data: ProductManifest): AdminGalleryItem[] {
  const items: AdminGalleryItem[] = [];
  const galleries = data.galleries ?? {};

  for (const [category, subs] of Object.entries(galleries)) {
    for (const [subcategory, images] of Object.entries(subs)) {
      images.forEach((image, index) => {
        items.push({
          id: `${category}/${subcategory}/${index}`,
          category,
          subcategory,
          index,
          src: image.src,
          caption: image.caption ?? "",
        });
      });
    }
  }

  return items;
}

async function listFromDb(search: string): Promise<AdminGalleryItem[]> {
  const { rows } = await query<{
    category: string;
    subcategory: string;
    src: string;
    caption: string;
    sort_order: number;
  }>(
    search
      ? `SELECT category, subcategory, src, caption, sort_order
         FROM product_gallery_images
         WHERE lower(caption) LIKE $1 OR lower(category) LIKE $1
           OR lower(subcategory) LIKE $1 OR lower(src) LIKE $1
         ORDER BY category, subcategory, sort_order`
      : `SELECT category, subcategory, src, caption, sort_order
         FROM product_gallery_images ORDER BY category, subcategory, sort_order`,
    search ? [`%${search.toLowerCase()}%`] : undefined,
  );

  return rows.map((row) => ({
    id: `${row.category}/${row.subcategory}/${row.sort_order}`,
    category: row.category,
    subcategory: row.subcategory,
    index: row.sort_order,
    src: row.src,
    caption: row.caption ?? "",
  }));
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const queryText = searchParams.get("q")?.toLowerCase().trim() ?? "";
  const { page, pageSize } = parseAdminPagination(searchParams, 12);

  const items = isDatabaseEnabled()
    ? await listFromDb(queryText)
    : flattenGalleries(readJsonFile<ProductManifest>(MANIFEST_PATHS.products)).filter(
        (item) =>
          !queryText ||
          item.caption.toLowerCase().includes(queryText) ||
          item.category.toLowerCase().includes(queryText) ||
          item.subcategory.toLowerCase().includes(queryText) ||
          item.src.toLowerCase().includes(queryText),
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
    source: isDatabaseEnabled() ? "postgresql" : "json",
  });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    category: string;
    subcategory: string;
    index: number;
    caption: string;
  };

  if (!body.category || !body.subcategory || typeof body.index !== "number") {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  if (isDatabaseEnabled()) {
    const { rows } = await query<{ src: string; caption: string }>(
      `UPDATE product_gallery_images SET caption = $4
       WHERE category = $1 AND subcategory = $2 AND sort_order = $3
       RETURNING src, caption`,
      [body.category, body.subcategory, body.index, body.caption.trim()],
    );

    if (!rows[0]) {
      return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
    }

    await syncDatabaseToJson();

    return NextResponse.json({
      item: {
        id: `${body.category}/${body.subcategory}/${body.index}`,
        category: body.category,
        subcategory: body.subcategory,
        index: body.index,
        src: rows[0].src,
        caption: rows[0].caption,
      },
    });
  }

  const data = readJsonFile<ProductManifest>(MANIFEST_PATHS.products);
  const gallery = data.galleries?.[body.category]?.[body.subcategory];

  if (!gallery?.[body.index]) {
    return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  }

  gallery[body.index].caption = body.caption.trim();
  writeJsonFile(MANIFEST_PATHS.products, data);

  return NextResponse.json({
    item: {
      id: `${body.category}/${body.subcategory}/${body.index}`,
      category: body.category,
      subcategory: body.subcategory,
      index: body.index,
      src: gallery[body.index].src,
      caption: gallery[body.index].caption,
    },
  });
}
