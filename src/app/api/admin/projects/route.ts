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
import { isDatabaseEnabled } from "@/lib/db/pool";
import { listProjectsFromDb, searchProjectsFromDb, updateProjectInDb } from "@/lib/db/repositories/projects";
import { syncDatabaseToJson } from "@/lib/db/sync-json";
import type { PortfolioProject } from "@/lib/catalog/project-portfolio";
import { resolveProjectCover } from "@/lib/catalog/project-cover";

type ProjectManifest = {
  projects: PortfolioProject[];
  [key: string]: unknown;
};

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const queryText = searchParams.get("q")?.toLowerCase().trim() ?? "";
  const { page, pageSize } = parseAdminPagination(searchParams, 10);

  let projects: PortfolioProject[];

  if (isDatabaseEnabled()) {
    projects = queryText
      ? await searchProjectsFromDb(queryText)
      : await listProjectsFromDb();
  } else {
    const data = readJsonFile<ProjectManifest>(MANIFEST_PATHS.projects);
    projects = data.projects;
    if (queryText) {
      projects = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(queryText) ||
          project.city.toLowerCase().includes(queryText) ||
          project.id.toLowerCase().includes(queryText),
      );
    }
  }

  const paginated = paginateAdminList(projects, page, pageSize);

  return NextResponse.json({
    projects: paginated.items,
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
    id: string;
    featured?: boolean;
    productCategory?: string;
    coverIndex?: number;
    name?: string;
  };

  if (!body.id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  if (isDatabaseEnabled()) {
    const project = await updateProjectInDb(body.id, body);
    if (!project) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }
    await syncDatabaseToJson();
    return NextResponse.json({ project });
  }

  const data = readJsonFile<ProjectManifest>(MANIFEST_PATHS.projects);
  const index = data.projects.findIndex((p) => p.id === body.id);

  if (index === -1) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  const project = { ...data.projects[index] };

  if (typeof body.featured === "boolean") project.featured = body.featured;
  if (body.productCategory) {
    project.productCategory = body.productCategory as PortfolioProject["productCategory"];
  }
  if (typeof body.coverIndex === "number") {
    project.coverIndex = body.coverIndex;
    project.cover = resolveProjectCover(project.gallery, body.coverIndex);
  }
  if (typeof body.name === "string" && body.name.trim()) {
    project.name = body.name.trim();
  }

  data.projects[index] = project;
  data.generatedAt = new Date().toISOString();
  writeJsonFile(MANIFEST_PATHS.projects, data);

  return NextResponse.json({ project });
}
