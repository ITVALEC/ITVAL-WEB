import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { listCatalogTree, listProjectCategoryOptions, updateCatalogEntry } from "@/lib/admin/catalog-service";

export type { CatalogCategoryItem, CatalogSubcategoryItem } from "@/lib/admin/catalog-service";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("meta") === "project-categories") {
    return NextResponse.json({ categories: listProjectCategoryOptions() });
  }

  const categories = await listCatalogTree();
  return NextResponse.json({ categories });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    type: "category" | "subcategory";
    categoryKey: string;
    subcategoryKey?: string;
    titleEs?: string;
    titleEn?: string;
    descriptionEs?: string;
    descriptionEn?: string;
  };

  if (!body.categoryKey || !body.type) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  try {
    await updateCatalogEntry(body);
    const categories = await listCatalogTree();
    const updated =
      body.type === "category"
        ? categories.find((c) => c.key === body.categoryKey)
        : categories
            .find((c) => c.key === body.categoryKey)
            ?.subcategories.find((s) => s.key === body.subcategoryKey);

    return NextResponse.json({ ok: true, item: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo guardar" },
      { status: 500 },
    );
  }
}
