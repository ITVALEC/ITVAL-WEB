import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import {
  MANIFEST_PATHS,
  readJsonFile,
  writeJsonFile,
} from "@/lib/admin/manifests";
import { isDatabaseEnabled, query } from "@/lib/db/pool";
import { syncDatabaseToJson } from "@/lib/db/sync-json";
import type { SiteSettings } from "@/lib/site-settings";

async function getSettingsFromDb(): Promise<SiteSettings | null> {
  const { rows } = await query<{ contact: SiteSettings["contact"]; footer: SiteSettings["footer"] }>(
    `SELECT contact, footer FROM site_settings WHERE id = 1`,
  );
  if (!rows[0]) return null;
  return { contact: rows[0].contact, footer: rows[0].footer };
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (isDatabaseEnabled()) {
    const settings = await getSettingsFromDb();
    if (settings) return NextResponse.json(settings);
  }

  const settings = readJsonFile<SiteSettings>(MANIFEST_PATHS.siteSettings);
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<SiteSettings>;

  if (isDatabaseEnabled()) {
    const current =
      (await getSettingsFromDb()) ??
      readJsonFile<SiteSettings>(MANIFEST_PATHS.siteSettings);

    const next: SiteSettings = {
      contact: { ...current.contact, ...body.contact },
      footer: {
        es: { ...current.footer.es, ...body.footer?.es },
        en: { ...current.footer.en, ...body.footer?.en },
      },
    };

    await query(
      `INSERT INTO site_settings (id, contact, footer) VALUES (1, $1::jsonb, $2::jsonb)
       ON CONFLICT (id) DO UPDATE SET contact = $1::jsonb, footer = $2::jsonb`,
      [JSON.stringify(next.contact), JSON.stringify(next.footer)],
    );

    await syncDatabaseToJson();
    return NextResponse.json(next);
  }

  const current = readJsonFile<SiteSettings>(MANIFEST_PATHS.siteSettings);
  const next: SiteSettings = {
    contact: { ...current.contact, ...body.contact },
    footer: {
      es: { ...current.footer.es, ...body.footer?.es },
      en: { ...current.footer.en, ...body.footer?.en },
    },
  };

  writeJsonFile(MANIFEST_PATHS.siteSettings, next);
  return NextResponse.json(next);
}
