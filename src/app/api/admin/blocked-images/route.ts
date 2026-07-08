import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import {
  MANIFEST_PATHS,
  readJsonFile,
  writeJsonFile,
} from "@/lib/admin/manifests";
import { isDatabaseEnabled, query } from "@/lib/db/pool";
import { syncDatabaseToJson } from "@/lib/db/sync-json";

type BlockedManifest = {
  description: string;
  files: string[];
  patterns: string[];
};

async function getBlockedFromDb(): Promise<BlockedManifest> {
  const { rows } = await query<{ filename: string }>(
    `SELECT filename FROM blocked_images ORDER BY filename`,
  );
  return {
    description: "Imágenes que no deben publicarse (personas trabajando, IA, etc.).",
    files: rows.map((r) => r.filename),
    patterns: ["^DSC0060[0-9]\\.(jpe?g|png)$"],
  };
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (isDatabaseEnabled()) {
    return NextResponse.json(await getBlockedFromDb());
  }

  return NextResponse.json(readJsonFile<BlockedManifest>(MANIFEST_PATHS.blocked));
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as { filename?: string };
  if (!body.filename?.trim()) {
    return NextResponse.json({ error: "Nombre de archivo requerido" }, { status: 400 });
  }

  const filename = body.filename.trim();

  if (isDatabaseEnabled()) {
    await query(
      `INSERT INTO blocked_images (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING`,
      [filename],
    );
    await syncDatabaseToJson();
    return NextResponse.json(await getBlockedFromDb());
  }

  const data = readJsonFile<BlockedManifest>(MANIFEST_PATHS.blocked);
  if (!data.files.some((f) => f.toLowerCase() === filename.toLowerCase())) {
    data.files.push(filename);
    writeJsonFile(MANIFEST_PATHS.blocked, data);
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");
  if (!filename) {
    return NextResponse.json({ error: "filename requerido" }, { status: 400 });
  }

  if (isDatabaseEnabled()) {
    await query(`DELETE FROM blocked_images WHERE lower(filename) = lower($1)`, [
      filename,
    ]);
    await syncDatabaseToJson();
    return NextResponse.json(await getBlockedFromDb());
  }

  const data = readJsonFile<BlockedManifest>(MANIFEST_PATHS.blocked);
  data.files = data.files.filter((f) => f.toLowerCase() !== filename.toLowerCase());
  writeJsonFile(MANIFEST_PATHS.blocked, data);

  return NextResponse.json(data);
}
