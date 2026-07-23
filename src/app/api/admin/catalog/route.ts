import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import {
  listCatalogTree,
  listProjectCategoryOptions,
  listCatalogFilterOptions,
  getCatalogHub,
  updateCatalogHub,
  updateCatalogEntry,
  updateCatalogFilters,
  addCategory,
  addSubcategory,
  type CatalogFilterSelection,
  type CatalogHubTexts,
} from "@/lib/admin/catalog-service";

export type {
  CatalogCategoryItem,
  CatalogSubcategoryItem,
  CatalogFilterSelection,
  CatalogFilterOptions,
  CatalogHubTexts,
} from "@/lib/admin/catalog-service";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("meta") === "project-categories") {
    return NextResponse.json({ categories: await listProjectCategoryOptions() });
  }

  const categories = await listCatalogTree();
  const hub = await getCatalogHub();
  return NextResponse.json({
    categories,
    hub,
    filterOptions: await listCatalogFilterOptions(),
  });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    type: "category" | "subcategory" | "hub";
    categoryKey?: string;
    subcategoryKey?: string;
    titleEs?: string;
    titleEn?: string;
    descriptionEs?: string;
    descriptionEn?: string;
    subtitleEs?: string;
    subtitleEn?: string;
    filters?: Partial<CatalogFilterSelection>;
  };

  if (!body.type) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  try {
    if (body.type === "hub") {
      await updateCatalogHub({
        titleEs: body.titleEs,
        titleEn: body.titleEn,
        subtitleEs: body.subtitleEs,
        subtitleEn: body.subtitleEn,
      });
      return NextResponse.json({ ok: true, hub: await getCatalogHub() });
    }

    if (!body.categoryKey) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    await updateCatalogEntry({
      type: body.type,
      categoryKey: body.categoryKey,
      subcategoryKey: body.subcategoryKey,
      titleEs: body.titleEs,
      titleEn: body.titleEn,
      descriptionEs: body.descriptionEs,
      descriptionEn: body.descriptionEn,
    });

    if (body.filters) {
      await updateCatalogFilters({
        type: body.type,
        categoryKey: body.categoryKey,
        subcategoryKey: body.subcategoryKey,
        filters: body.filters,
      });
    }
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

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    action: "add-category" | "add-subcategory";
    key?: string;
    categoryKey?: string;
    titleEs?: string;
    titleEn?: string;
    descriptionEs?: string;
    descriptionEn?: string;
    subcategoryKey?: string;
    subTitleEs?: string;
    subTitleEn?: string;
    subDescriptionEs?: string;
    subDescriptionEn?: string;
    primaryGroup?: string;
  };

  try {
    if (body.action === "add-category") {
      if (!body.key || !body.titleEs || !body.titleEn || !body.subcategoryKey || !body.subTitleEs || !body.subTitleEn) {
        return NextResponse.json({ error: "Completa categoría y primera subcategoría." }, { status: 400 });
      }
      await addCategory({
        key: body.key,
        titleEs: body.titleEs,
        titleEn: body.titleEn,
        descriptionEs: body.descriptionEs ?? "",
        descriptionEn: body.descriptionEn ?? "",
        subcategoryKey: body.subcategoryKey,
        subTitleEs: body.subTitleEs,
        subTitleEn: body.subTitleEn,
        subDescriptionEs: body.subDescriptionEs,
        subDescriptionEn: body.subDescriptionEn,
        primaryGroup: body.primaryGroup,
      });
    } else if (body.action === "add-subcategory") {
      if (!body.categoryKey || !body.key || !body.titleEs || !body.titleEn) {
        return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
      }
      await addSubcategory({
        categoryKey: body.categoryKey,
        key: body.key,
        titleEs: body.titleEs,
        titleEn: body.titleEn,
        descriptionEs: body.descriptionEs,
        descriptionEn: body.descriptionEn,
      });
    } else {
      return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
    }

    const categories = await listCatalogTree();
    return NextResponse.json({ ok: true, categories });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear" },
      { status: 500 },
    );
  }
}
