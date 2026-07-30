import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import {
  MANIFEST_PATHS,
  readJsonFile,
  writeJsonFile,
} from "@/lib/admin/manifests";
import { isDatabaseEnabled, query } from "@/lib/db/pool";
import { syncDatabaseToJson } from "@/lib/db/sync-json";
import {
  HOME_COPY_FIELD_KEYS,
  mergeHomeCopyEs,
  type SiteHomeCopy,
} from "@/lib/home-copy";
import { fillEnglishFromSpanish } from "@/lib/i18n/translate-es-to-en";
import { isValidSocialUrl } from "@/lib/social";
import { revalidatePublicSite } from "@/lib/catalog/revalidate-public";
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

async function translateHomeFromSpanish(
  nextEs: SiteHomeCopy,
  previousEs: SiteHomeCopy,
  previousEn: SiteHomeCopy,
): Promise<{ en: SiteHomeCopy; warnings: string[]; provider: string | null }> {
  const fields = Object.fromEntries(
    HOME_COPY_FIELD_KEYS.map((key) => [
      key,
      {
        es: nextEs[key],
        previousEs: previousEs[key],
        previousEn: previousEn[key],
      },
    ]),
  );

  const translated = await fillEnglishFromSpanish(fields);
  const en = { ...previousEn };
  for (const key of HOME_COPY_FIELD_KEYS) {
    en[key] = translated.values[key] ?? previousEn[key];
  }

  return {
    en,
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
    home?: { es?: Partial<SiteHomeCopy> };
  };

  const current =
    (isDatabaseEnabled() ? await getSettingsFromDb() : null) ??
    normalizeSiteSettings(readJsonFile<SiteSettings>(MANIFEST_PATHS.siteSettings));

  const footerProvided = Boolean(body.footer?.es);
  const homeProvided = Boolean(body.home?.es);
  const socialProvided = Array.isArray(body.social);
  const contactProvided = Boolean(body.contact);

  // No aceptar edición de ctaTitle/ctaText desde el admin (CTA retirado a propósito)
  const nextEs: SiteFooterCopy = footerProvided
    ? {
        ...current.footer.es,
        tagline: body.footer?.es?.tagline ?? current.footer.es.tagline,
        experience: body.footer?.es?.experience ?? current.footer.es.experience,
        location: body.footer?.es?.location ?? current.footer.es.location,
        ctaTitle: current.footer.es.ctaTitle ?? "",
        ctaText: current.footer.es.ctaText ?? "",
      }
    : current.footer.es;

  const nextHomeEs = homeProvided
    ? mergeHomeCopyEs(current.home.es, body.home?.es)
    : current.home.es;

  const socialIncoming = socialProvided
    ? normalizeSocialLinks(body.social, {
        keepEmpty: true,
        allowEmptyList: true,
      })
    : current.social;
  const socialError = validateSocialPayload(socialIncoming);
  if (socialError) {
    return NextResponse.json({ error: socialError }, { status: 400 });
  }

  const warnings: string[] = [];
  let provider: string | null = null;

  let nextFooterEn = current.footer.en;
  if (footerProvided) {
    const footerResult = await translateFooterFromSpanish(
      nextEs,
      current.footer.es,
      current.footer.en,
    );
    nextFooterEn = footerResult.en;
    warnings.push(...footerResult.warnings);
    provider = footerResult.provider ?? provider;
  }

  let nextHomeEn = current.home.en;
  if (homeProvided) {
    const homeResult = await translateHomeFromSpanish(
      nextHomeEs,
      current.home.es,
      current.home.en,
    );
    nextHomeEn = homeResult.en;
    warnings.push(...homeResult.warnings);
    provider = homeResult.provider ?? provider;
  }

  const next: SiteSettings = {
    contact: contactProvided
      ? {
          ...current.contact,
          ...(body.contact ?? {}),
          mapsUrl: String(body.contact?.mapsUrl ?? current.contact.mapsUrl ?? "").trim(),
        }
      : current.contact,
    footer: {
      es: nextEs,
      en: nextFooterEn,
    },
    home: {
      es: nextHomeEs,
      en: nextHomeEn,
    },
    social: socialIncoming,
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

  revalidatePublicSite();

  return NextResponse.json({
    ...next,
    translation: { warnings, provider },
  });
}
