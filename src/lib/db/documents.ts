import "server-only";

import { MANIFEST_PATHS, readJsonFile, writeJsonFile } from "@/lib/admin/manifests";
import { isDatabaseEnabled, query } from "@/lib/db/pool";
import { getDb, isMongoEnabled } from "@/lib/db/mongo";
import type { Filter } from "mongodb";
import fs from "node:fs";
import path from "node:path";

/**
 * Capa de documentos compartida.
 * Prioridad: PostgreSQL (VPS) → MongoDB Atlas (opcional) → JSON local.
 */

export type DocumentKey =
  | "taxonomy"
  | "filterConfig"
  | "productImages"
  | "siteSettings"
  | "blockedImages"
  | "portfolio"
  | "catalogContentEs"
  | "catalogContentEn";

type DocumentMeta = {
  /** Clave estable en `app_documents.key` y Mongo `_id`/colección. */
  storageKey: string;
  collection: string;
  id: string;
  filePath: string;
};

const root = process.cwd();

const DOCUMENTS: Record<DocumentKey, DocumentMeta> = {
  taxonomy: {
    storageKey: "taxonomy",
    collection: "taxonomy",
    id: "taxonomy",
    filePath: MANIFEST_PATHS.taxonomy,
  },
  filterConfig: {
    storageKey: "filterConfig",
    collection: "filterConfig",
    id: "filterConfig",
    filePath: MANIFEST_PATHS.filters,
  },
  productImages: {
    storageKey: "productImages",
    collection: "productImages",
    id: "productImages",
    filePath: MANIFEST_PATHS.products,
  },
  siteSettings: {
    storageKey: "siteSettings",
    collection: "siteSettings",
    id: "siteSettings",
    filePath: MANIFEST_PATHS.siteSettings,
  },
  blockedImages: {
    storageKey: "blockedImages",
    collection: "blockedImages",
    id: "blockedImages",
    filePath: MANIFEST_PATHS.blocked,
  },
  portfolio: {
    storageKey: "portfolio",
    collection: "portfolio",
    id: "portfolio",
    filePath: MANIFEST_PATHS.projects,
  },
  catalogContentEs: {
    storageKey: "catalogContentEs",
    collection: "catalogContent",
    id: "es",
    filePath: path.join(root, "messages/products-catalog/es.json"),
  },
  catalogContentEn: {
    storageKey: "catalogContentEn",
    collection: "catalogContent",
    id: "en",
    filePath: path.join(root, "messages/products-catalog/en.json"),
  },
};

type WrappedDoc<T> = {
  _id: string;
  data: T;
  updatedAt?: Date;
};

async function getFromPostgres<T>(storageKey: string): Promise<T | null> {
  if (!isDatabaseEnabled()) return null;
  try {
    const result = await query<{ data: T }>(
      `SELECT data FROM app_documents WHERE key = $1 LIMIT 1`,
      [storageKey],
    );
    return result.rows[0]?.data ?? null;
  } catch (error) {
    console.warn(`[documents] Postgres falló al leer "${storageKey}".`, error);
    return null;
  }
}

async function setInPostgres<T>(storageKey: string, data: T): Promise<boolean> {
  if (!isDatabaseEnabled()) return false;
  try {
    await query(
      `INSERT INTO app_documents (key, data, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE
         SET data = EXCLUDED.data, updated_at = now()`,
      [storageKey, JSON.stringify(data)],
    );
    return true;
  } catch (error) {
    console.warn(`[documents] Postgres falló al escribir "${storageKey}".`, error);
    return false;
  }
}

async function getFromMongo<T>(meta: DocumentMeta): Promise<T | null> {
  if (!isMongoEnabled()) return null;
  try {
    const db = await getDb();
    const filter = { _id: meta.id } as Filter<WrappedDoc<T>>;
    const doc = await db.collection<WrappedDoc<T>>(meta.collection).findOne(filter);
    return doc?.data ?? null;
  } catch (error) {
    console.warn(`[documents] Mongo falló al leer "${meta.storageKey}".`, error);
    return null;
  }
}

async function setInMongo<T>(meta: DocumentMeta, data: T): Promise<boolean> {
  if (!isMongoEnabled()) return false;
  try {
    const db = await getDb();
    const filter = { _id: meta.id } as Filter<WrappedDoc<T>>;
    const payload: WrappedDoc<T> = { _id: meta.id, data, updatedAt: new Date() };
    await db.collection<WrappedDoc<T>>(meta.collection).replaceOne(filter, payload, {
      upsert: true,
    });
    return true;
  } catch (error) {
    console.warn(`[documents] Mongo falló al escribir "${meta.storageKey}".`, error);
    return false;
  }
}

export async function getDocument<T>(key: DocumentKey): Promise<T> {
  const meta = DOCUMENTS[key];

  const fromPg = await getFromPostgres<T>(meta.storageKey);
  if (fromPg != null) return fromPg;

  const fromMongo = await getFromMongo<T>(meta);
  if (fromMongo != null) return fromMongo;

  return readJsonFile<T>(meta.filePath);
}

export async function setDocument<T>(key: DocumentKey, data: T): Promise<void> {
  const meta = DOCUMENTS[key];
  const wrotePg = await setInPostgres(meta.storageKey, data);
  const wroteMongo = await setInMongo(meta, data);

  try {
    writeJsonFile(meta.filePath, data);
  } catch (error) {
    if (!wrotePg && !wroteMongo) throw error;
    console.warn(`[documents] No se pudo escribir JSON local para "${key}".`, error);
  }
}

export function catalogContentKey(locale: "es" | "en"): DocumentKey {
  return locale === "es" ? "catalogContentEs" : "catalogContentEn";
}

export function documentFileExists(key: DocumentKey): boolean {
  return fs.existsSync(DOCUMENTS[key].filePath);
}
