import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import {
  MANIFEST_PATHS,
  readJsonFile,
  writeJsonFile,
} from "@/lib/admin/manifests";
import { isDatabaseEnabled, query } from "@/lib/db/pool";
import { syncDatabaseToJson } from "@/lib/db/sync-json";
import { fillEnglishFromSpanish } from "@/lib/i18n/translate-es-to-en";
import {
  normalizeSiteSettings,
  normalizeSocialLinks,
  packSiteSettingsForDb,
  type SiteFooterCopy,
  type SiteSettings,
  type SiteSocialLinks,
} from "@/lib/site-settings";

async function getSettingsFromDb(): Promise<SiteSettings | null> {
  const { rows } = await query<{ contact: unknown; footer: unknown }>(
    `SELECT contact, footer FROM site_settings WHERE id = 1`,
  );
  if (!rows[0]) return null;
  return normalizeSiteSettings({
    contact: rows[0].contact,
    footer: rows[0].footer,
  });
}

async function translateFooterFromSpanish(
  nextEs: SiteFooterCopy,
  previousEs: SiteFooterCopy,
  previousEn: SiteFooterCopy,
): Promise<{ en: SiteFooterCopy; warnings: string[]; provider: string | null }> {
  const translated = await fillEnglishFromSpanish({
    tagline: {
      es: nextEs.tagline,
      previousEs: previousEs.tagline,
      previousEn: previousEn.tagline,
    },
    experience: {
      es: nextEs.experience,
      previousEs: previousEs.experience,
      previousEn: previousEn.experience,
    },
    ctaTitle: {
      es: nextEs.ctaTitle,
      previousEs: previousEs.ctaTitle,
      previousEn: previousEn.ctaTitle,
    },
    ctaText: {
      es: nextEs.ctaText,
      previousEs: previousEs.ctaText,
      previousEn: previousEn.ctaText,
    },
    location: {
      es: nextEs.location,
      previousEs: previousEs.location,
      previousEn: previousEn.location,
    },
  });

  return {
    en: {
      tagline: translated.values.tagline ?? previousEn.tagline,
      experience: translated.values.experience ?? previousEn.experience,
      ctaTitle: translated.values.ctaTitle ?? previousEn.ctaTitle,
      ctaText: translated.values.ctaText ?? previousEn.ctaText,
      location: translated.values.location ?? previousEn.location,
    },
    warnings: translated.warnings,
    provider: translated.provider,
  };
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (isDatabaseEnabled()) {
    const settings = await getSettingsFromDb();
    if (settings) return NextResponse.json(settings);
  }

  const settings = normalizeSiteSettings(
    readJsonFile<SiteSettings>(MANIFEST_PATHS.siteSettings),
  );
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<SiteSettings> & {
    social?: Partial<SiteSocialLinks>;
  };

  const current =
    (isDatabaseEnabled() ? await getSettingsFromDb() : null) ??
    normalizeSiteSettings(readJsonFile<SiteSettings>(MANIFEST_PATHS.siteSettings));

  const nextEs: SiteFooterCopy = {
    ...current.footer.es,
    ...body.footer?.es,
  };

  const { en: nextEn, warnings, provider } = await translateFooterFromSpanish(
    nextEs,
    current.footer.es,
    current.footer.en,
  );

  const next: SiteSettings = {
    contact: { ...current.contact, ...body.contact },
    footer: {
      es: nextEs,
      en: nextEn,
    },
    // URLs de redes: no se traducen
    social: normalizeSocialLinks(body.social ?? current.social),
  };

  const packed = packSiteSettingsForDb(next);

  if (isDatabaseEnabled()) {
    await query(
      `INSERT INTO site_settings (id, contact, footer) VALUES (1, $1::jsonb, $2::jsonb)
       ON CONFLICT (id) DO UPDATE SET contact = $1::jsonb, footer = $2::jsonb`,
      [JSON.stringify(packed.contact), JSON.stringify(packed.footer)],
    );
    await syncDatabaseToJson();
  } else {
    writeJsonFile(MANIFEST_PATHS.siteSettings, next);
  }

  return NextResponse.json({
    ...next,
    translation: { warnings, provider },
  });
}
