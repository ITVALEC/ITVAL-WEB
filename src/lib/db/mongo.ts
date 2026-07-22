import "server-only";
import dns from "node:dns";
import { MongoClient, type Db } from "mongodb";

// Evita fallos de DNS SRV en Windows / redes locales.
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

/**
 * Conexión a MongoDB (Atlas) con cliente cacheado.
 *
 * En desarrollo, Next.js recarga los módulos con HMR; guardar el cliente en
 * `globalThis` evita abrir una conexión nueva en cada recarga. En producción
 * se reutiliza una sola instancia por proceso.
 */

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "itval";

export function isMongoEnabled(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

type MongoCache = {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
};

const globalForMongo = globalThis as unknown as { __mongo?: MongoCache };

const cache: MongoCache = globalForMongo.__mongo ?? { client: null, promise: null };
globalForMongo.__mongo = cache;

async function getClient(): Promise<MongoClient> {
  if (!uri) {
    throw new Error(
      "MONGODB_URI no está definida. Agrega la cadena de conexión de MongoDB Atlas en las variables de entorno.",
    );
  }
  if (cache.client) return cache.client;
  if (!cache.promise) {
    // family:4 evita fallos de DNS SRV/IPv6 en redes Windows/cPanel.
    cache.promise = new MongoClient(uri, {
      maxPoolSize: 10,
      family: 4,
      serverSelectionTimeoutMS: 20_000,
    }).connect();
  }
  cache.client = await cache.promise;
  return cache.client;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(dbName);
}
