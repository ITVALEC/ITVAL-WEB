import "server-only";

/**
 * Traducción automática ES → EN para el admin.
 *
 * Proveedores (en orden):
 * 1. DeepL — `DEEPL_AUTH_KEY` (opcional `DEEPL_API_URL` para API free: https://api-free.deepl.com)
 * 2. OpenAI — `OPENAI_API_KEY` (modelo `OPENAI_TRANSLATE_MODEL`, default gpt-4o-mini)
 * 3. Google Cloud Translation — `GOOGLE_TRANSLATE_API_KEY` o `TRANSLATION_API_KEY`
 * 4. MyMemory (sin clave, rate-limited) — útil si aún no hay API key en el VPS
 *
 * En `/var/www/itval/shared/.env.production.local` basta con una de las claves anteriores.
 * Si falla la traducción, el guardado ES no debe tumbarse: se conserva el EN previo.
 */

export type TranslateFieldInput = {
  es: string;
  previousEs?: string;
  previousEn?: string;
};

export type TranslateFieldsResult = {
  values: Record<string, string>;
  warnings: string[];
  provider: string | null;
  translatedCount: number;
  skippedCount: number;
};

type Provider = {
  id: string;
  available: () => boolean;
  translateOne: (text: string) => Promise<string>;
  translateMany?: (texts: string[]) => Promise<string[]>;
};

function normalizeText(value: string | undefined | null): string {
  return (value ?? "").trim();
}

/**
 * True si el inglés previo no sirve: vacío, idéntico al ES, o claramente en español.
 * Evita que un fallback ES→EN fallido quede congelado para siempre.
 */
export function englishNeedsRetranslation(es: string, en: string | undefined | null): boolean {
  const esNorm = normalizeText(es);
  const enNorm = normalizeText(en);
  if (!esNorm) return false;
  if (!enNorm) return true;
  if (enNorm === esNorm) return true;
  if (enNorm.toLowerCase() === esNorm.toLowerCase()) return true;
  // EN mucho más corto que ES → traducción truncada / incompleta (p. ej. MyMemory 450 chars)
  if (esNorm.length >= 40 && enNorm.length < Math.floor(esNorm.length * 0.45)) {
    return true;
  }
  // Acentos o palabras típicas de ES en el campo "EN" → copia sin traducir
  if (/[áéíóúñü¿¡]/i.test(enNorm)) return true;
  if (
    /\b(soluciones|arquitect[oó]nicos|fachadas|edificios|experiencia|tambi[eé]n|integrales|estructuras|met[aá]licas|vidrio|aluminio|cortina|sistemas|corporativos|comerciales|institucionales|asesor[ií]a|pr[oó]ximo|escalar|cu[eé]ntanos|nuestro|equipo|t[eé]cnico)\b/i.test(
      enNorm,
    )
  ) {
    return true;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) await sleep(350 * (i + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

const deeplProvider: Provider = {
  id: "deepl",
  available: () => Boolean(process.env.DEEPL_AUTH_KEY?.trim()),
  translateOne: async (text) => {
    const authKey = process.env.DEEPL_AUTH_KEY!.trim();
    const base =
      process.env.DEEPL_API_URL?.trim() ||
      (authKey.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com");
    const res = await fetch(`${base.replace(/\/$/, "")}/v2/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${authKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: [text],
        source_lang: "ES",
        target_lang: "EN-US",
      }),
    });
    if (!res.ok) {
      throw new Error(`DeepL HTTP ${res.status}`);
    }
    const data = (await res.json()) as { translations?: { text?: string }[] };
    const out = data.translations?.[0]?.text;
    if (!out) throw new Error("DeepL sin texto");
    return out;
  },
  translateMany: async (texts) => {
    const authKey = process.env.DEEPL_AUTH_KEY!.trim();
    const base =
      process.env.DEEPL_API_URL?.trim() ||
      (authKey.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com");
    const res = await fetch(`${base.replace(/\/$/, "")}/v2/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${authKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: texts,
        source_lang: "ES",
        target_lang: "EN-US",
      }),
    });
    if (!res.ok) throw new Error(`DeepL HTTP ${res.status}`);
    const data = (await res.json()) as { translations?: { text?: string }[] };
    if (!data.translations || data.translations.length !== texts.length) {
      throw new Error("DeepL batch incompleto");
    }
    return data.translations.map((t, i) => t.text ?? texts[i]);
  },
};

const openaiProvider: Provider = {
  id: "openai",
  available: () => Boolean(process.env.OPENAI_API_KEY?.trim()),
  translateOne: async (text) => {
    const results = await openaiProvider.translateMany!([text]);
    return results[0] ?? text;
  },
  translateMany: async (texts) => {
    const apiKey = process.env.OPENAI_API_KEY!.trim();
    const model = process.env.OPENAI_TRANSLATE_MODEL?.trim() || "gpt-4o-mini";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'You translate Spanish UI/catalog copy for an aluminum and glass architecture company into natural US English. Preserve meaning, tone, and line breaks. Do not invent content. Return JSON: {"translations":["..."]} with the same order and length as the input array.',
          },
          {
            role: "user",
            content: JSON.stringify({ texts }),
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error("OpenAI sin contenido");
    const parsed = JSON.parse(raw) as { translations?: string[] };
    if (!Array.isArray(parsed.translations) || parsed.translations.length !== texts.length) {
      throw new Error("OpenAI JSON inválido");
    }
    return parsed.translations.map((t, i) => (typeof t === "string" && t.trim() ? t : texts[i]));
  },
};

const googleProvider: Provider = {
  id: "google",
  available: () =>
    Boolean(
      process.env.GOOGLE_TRANSLATE_API_KEY?.trim() || process.env.TRANSLATION_API_KEY?.trim(),
    ),
  translateOne: async (text) => {
    const key =
      process.env.GOOGLE_TRANSLATE_API_KEY?.trim() || process.env.TRANSLATION_API_KEY!.trim();
    const url = new URL("https://translation.googleapis.com/language/translate/v2");
    url.searchParams.set("key", key);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "es",
        target: "en",
        format: "text",
      }),
    });
    if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);
    const data = (await res.json()) as {
      data?: { translations?: { translatedText?: string }[] };
    };
    const out = data.data?.translations?.[0]?.translatedText;
    if (!out) throw new Error("Google Translate sin texto");
    return out;
  },
};

/** Parte textos largos para MyMemory (límite ~450) sin cortar a mitad de frase. */
function chunkTextForMyMemory(text: string, maxLen = 420): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return [trimmed];

  const chunks: string[] = [];
  let remaining = trimmed;
  while (remaining.length > maxLen) {
    const window = remaining.slice(0, maxLen);
    const breakAt = Math.max(
      window.lastIndexOf(". "),
      window.lastIndexOf("? "),
      window.lastIndexOf("! "),
      window.lastIndexOf("; "),
      window.lastIndexOf(", "),
      window.lastIndexOf(" "),
    );
    const cut = breakAt > maxLen * 0.4 ? breakAt + 1 : maxLen;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

async function myMemoryTranslateChunk(text: string): Promise<string> {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text.slice(0, 450));
  url.searchParams.set("langpair", "es|en");
  const email = process.env.MYMEMORY_EMAIL?.trim();
  if (email) url.searchParams.set("de", email);
  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = (await res.json()) as {
    responseStatus?: number;
    responseData?: { translatedText?: string };
  };
  if (data.responseStatus && data.responseStatus !== 200) {
    throw new Error(`MyMemory status ${data.responseStatus}`);
  }
  const out = data.responseData?.translatedText;
  if (!out) throw new Error("MyMemory sin texto");
  if (/MYMEMORY WARNING/i.test(out)) {
    throw new Error("MyMemory cuota agotada");
  }
  return out;
}

const myMemoryProvider: Provider = {
  id: "mymemory",
  available: () => true,
  translateOne: async (text) => {
    const chunks = chunkTextForMyMemory(text);
    if (chunks.length === 1) {
      return myMemoryTranslateChunk(chunks[0]);
    }
    const parts: string[] = [];
    for (let i = 0; i < chunks.length; i += 1) {
      parts.push(await myMemoryTranslateChunk(chunks[i]));
      if (i < chunks.length - 1) await sleep(120);
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
  },
};

function pickProvider(): Provider | null {
  const ordered = [deeplProvider, openaiProvider, googleProvider, myMemoryProvider];
  return ordered.find((p) => p.available()) ?? null;
}

/** Traduce un texto ES → EN. Lanza si no hay proveedor o falla. */
export async function translateEsToEn(text: string): Promise<string> {
  const trimmed = normalizeText(text);
  if (!trimmed) return "";
  const provider = pickProvider();
  if (!provider) {
    throw new Error(
      "No hay proveedor de traducción. Configura DEEPL_AUTH_KEY, OPENAI_API_KEY o GOOGLE_TRANSLATE_API_KEY.",
    );
  }
  return withRetry(() => provider.translateOne(trimmed));
}

/**
 * Rellena campos EN a partir de ES.
 * Si el ES no cambió, reutiliza el EN anterior (evita retraducir).
 */
export async function fillEnglishFromSpanish(
  fields: Record<string, TranslateFieldInput>,
): Promise<TranslateFieldsResult> {
  const values: Record<string, string> = {};
  const warnings: string[] = [];
  const toTranslate: { key: string; es: string }[] = [];
  let skippedCount = 0;

  for (const [key, field] of Object.entries(fields)) {
    const es = normalizeText(field.es);
    const previousEs = normalizeText(field.previousEs);
    const previousEn = normalizeText(field.previousEn);

    if (!es) {
      values[key] = "";
      skippedCount += 1;
      continue;
    }

    // Reutilizar EN solo si el ES no cambió y el EN no es una copia en español.
    if (
      previousEs === es &&
      previousEn &&
      !englishNeedsRetranslation(es, previousEn)
    ) {
      values[key] = previousEn;
      skippedCount += 1;
      continue;
    }

    toTranslate.push({ key, es });
  }

  if (toTranslate.length === 0) {
    return {
      values,
      warnings,
      provider: null,
      translatedCount: 0,
      skippedCount,
    };
  }

  const provider = pickProvider();
  if (!provider) {
    for (const item of toTranslate) {
      const previousEn = normalizeText(fields[item.key]?.previousEn);
      values[item.key] =
        previousEn && !englishNeedsRetranslation(item.es, previousEn)
          ? previousEn
          : item.es;
    }
    warnings.push(
      "No hay API de traducción configurada. Se mantuvo el inglés previo (o el español como respaldo). Añade DEEPL_AUTH_KEY, OPENAI_API_KEY o GOOGLE_TRANSLATE_API_KEY en /var/www/itval/shared/.env.production.local",
    );
    return {
      values,
      warnings,
      provider: null,
      translatedCount: 0,
      skippedCount,
    };
  }

  try {
    const texts = toTranslate.map((t) => t.es);
    let translated: string[];

    if (provider.translateMany) {
      translated = await withRetry(() => provider.translateMany!(texts));
    } else {
      translated = [];
      for (const text of texts) {
        translated.push(await withRetry(() => provider.translateOne(text)));
        if (provider.id === "mymemory") await sleep(120);
      }
    }

    toTranslate.forEach((item, index) => {
      const out = normalizeText(translated[index]);
      const previousEn = normalizeText(fields[item.key]?.previousEn);
      values[item.key] =
        out ||
        (previousEn && !englishNeedsRetranslation(item.es, previousEn)
          ? previousEn
          : item.es);
    });

    return {
      values,
      warnings,
      provider: provider.id,
      translatedCount: toTranslate.length,
      skippedCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    for (const item of toTranslate) {
      const previousEn = normalizeText(fields[item.key]?.previousEn);
      values[item.key] =
        previousEn && !englishNeedsRetranslation(item.es, previousEn)
          ? previousEn
          : item.es;
    }
    warnings.push(
      `No se pudo traducir al inglés (${provider.id}: ${message}). Se guardó el español y se conservó el inglés previo cuando existía.`,
    );
    return {
      values,
      warnings,
      provider: provider.id,
      translatedCount: 0,
      skippedCount,
    };
  }
}

export function getConfiguredTranslationProvider(): string | null {
  return pickProvider()?.id ?? null;
}