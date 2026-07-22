import "server-only";

import { MANIFEST_PATHS, readJsonFile, writeJsonFile } from "@/lib/admin/manifests";
import { getDb, isMongoEnabled } from "@/lib/db/mongo";
import type { Filter } from "mongodb";
import fs from "node:fs";
import path from "node:path";

/**
 * Capa de documentos: lee/escribe los mismos payloads JSON que hoy,
 * pero en MongoDB Atlas cuando `MONGODB_URI` está definida.
 * Si Mongo no está disponible, usa los archivos locales (fallback).
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
  collection: string;
  id: string;
  filePath: string;
};

const root = process.cwd();

const DOCUMENTS: Record<DocumentKey, DocumentMeta> = {
  taxonomy: {
    collection: "taxonomy",
    id: "taxonomy",
    filePath: MANIFEST_PATHS.taxonomy,
  },
  filterConfig: {
    collection: "filterConfig",
    id: "filterConfig",
    filePath: MANIFEST_PATHS.filters,
  },
  productImages: {
    collection: "productImages",
    id: "productImages",
    filePath: MANIFEST_PATHS.products,
  },
  siteSettings: {
    collection: "siteSettings",
    id: "siteSettings",
    filePath: MANIFEST_PATHS.siteSettings,
  },
  blockedImages: {
    collection: "blockedImages",
    id: "blockedImages",
    filePath: MANIFEST_PATHS.blocked,
  },
  portfolio: {
    collection: "portfolio",
    id: "portfolio",
    filePath: MANIFEST_PATHS.projects,
  },
  catalogContentEs: {
    collection: "catalogContent",
    id: "es",
    filePath: path.join(root, "messages/products-catalog/es.json"),
  },
  catalogContentEn: {
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

export async function getDocument<T>(key: DocumentKey): Promise<T> {
  const meta = DOCUMENTS[key];

  if (isMongoEnabled()) {
    try {
      const db = await getDb();
      const filter = { _id: meta.id } as Filter<WrappedDoc<T>>;
      const doc = await db.collection<WrappedDoc<T>>(meta.collection).findOne(filter);
      if (doc?.data != null) return doc.data;
    } catch (error) {
      console.warn(`[documents] Mongo falló al leer "${key}", usando JSON local.`, error);
    }
  }

  return readJsonFile<T>(meta.filePath);
}

export async function setDocument<T>(key: DocumentKey, data: T): Promise<void> {
  const meta = DOCUMENTS[key];
  let wroteMongo = false;

  if (isMongoEnabled()) {
    try {
      const db = await getDb();
      const filter = { _id: meta.id } as Filter<WrappedDoc<T>>;
      const payload: WrappedDoc<T> = { _id: meta.id, data, updatedAt: new Date() };
      await db.collection<WrappedDoc<T>>(meta.collection).replaceOne(filter, payload, {
        upsert: true,
      });
      wroteMongo = true;
    } catch (error) {
      console.warn(`[documents] Mongo falló al escribir "${key}", usando JSON local.`, error);
    }
  }

  // Respaldo local (desarrollo / si el disco es escribible).
  try {
    writeJsonFile(meta.filePath, data);
  } catch (error) {
    if (!wroteMongo) throw error;
    console.warn(`[documents] No se pudo escribir JSON local para "${key}".`, error);
  }
}

export function catalogContentKey(locale: "es" | "en"): DocumentKey {
  return locale === "es" ? "catalogContentEs" : "catalogContentEn";
}

export function documentFileExists(key: DocumentKey): boolean {
  return fs.existsSync(DOCUMENTS[key].filePath);
}
