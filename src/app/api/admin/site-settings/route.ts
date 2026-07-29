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
import { isValidSocialUrl } from "@/lib/social";
import {
  normalizeSiteSettings,
  normalizeSocialLinks,
  packSiteSettingsForDb,
  type SiteFooterCopy,
  type SiteSettings,
  type SiteSocialLink,
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
      // CTA footer legacy: no se edita ni se muestra; conservar valores previos
      ctaTitle: previousEn.ctaTitle ?? "",
      ctaText: previousEn.ctaText ?? "",
      location: translated.values.location ?? previousEn.location,
    },
    warnings: translated.warnings,
    provider: translated.provider,
  };
}

function validateSocialPayload(social: SiteSocialLink[]): string | null {
  for (const link of social) {
    if (link.url && !isValidSocialUrl(link.url)) {
      return `URL inválida en redes: "${link.url}". Usa https://, mailto: o tel:.`;
    }
  }
  return null;
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
    social?: SiteSocialLink[];
  };

  const current =
    (isDatabaseEnabled() ? await getSettingsFromDb() : null) ??
    normalizeSiteSettings(readJsonFile<SiteSettings>(MANIFEST_PATHS.siteSettings));

  // No aceptar edición de ctaTitle/ctaText desde el admin (CTA retirado a propósito)
  const nextEs: SiteFooterCopy = {
    ...current.footer.es,
    tagline: body.footer?.es?.tagline ?? current.footer.es.tagline,
    experience: body.footer?.es?.experience ?? current.footer.es.experience,
    location: body.footer?.es?.location ?? current.footer.es.location,
    ctaTitle: current.footer.es.ctaTitle ?? "",
    ctaText: current.footer.es.ctaText ?? "",
  };

  const socialIncoming = normalizeSocialLinks(body.social ?? current.social, {
    keepEmpty: true,
  });
  const socialError = validateSocialPayload(socialIncoming);
  if (socialError) {
    return NextResponse.json({ error: socialError }, { status: 400 });
  }

  const { en: nextEn, warnings, provider } = await translateFooterFromSpanish(
    nextEs,
    current.footer.es,
    current.footer.en,
  );

  const next: SiteSettings = {
    contact: {
      ...current.contact,
      ...body.contact,
      mapsUrl: String(body.contact?.mapsUrl ?? current.contact.mapsUrl ?? "").trim(),
    },
    footer: {
      es: nextEs,
      en: nextEn,
    },
    // URLs / iconos: no se traducen
    social: normalizeSocialLinks(socialIncoming),
  };

  const mapsUrl = next.contact.mapsUrl;
  if (mapsUrl && !/^https?:\/\//i.test(mapsUrl)) {
    return NextResponse.json(
      { error: "URL de Google Maps inválida. Usa https://…" },
      { status: 400 },
    );
  }

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
