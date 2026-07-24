import "server-only";

import fs from "node:fs";
import path from "node:path";

const catalogDir = path.join(process.cwd(), "messages/products-catalog");

export async function loadProductsCatalogMessages(
  locale: "es" | "en",
): Promise<Record<string, unknown>> {
  const filePath = path.join(catalogDir, `${locale}.json`);

  try {
    const raw = await fs.promises.readFile(filePath, "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return (await import(`../../../messages/products-catalog/${locale}.json`))
      .default as Record<string, unknown>;
  }
}
