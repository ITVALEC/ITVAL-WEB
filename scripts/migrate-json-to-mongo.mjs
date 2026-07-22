// Migra los datos JSON del proyecto a MongoDB (Atlas).
//
// Uso (Node 20+):
//   node --env-file=.env.local scripts/migrate-json-to-mongo.mjs
//
// Cada archivo JSON se guarda como un documento "envoltorio" { _id, data }
// dentro de su colección, de modo que la app lea la misma forma que hoy.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dns from "node:dns";
import { MongoClient } from "mongodb";

// En algunas redes Windows, Node falla al resolver mongodb+srv (querySrv).
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "itval";

if (!uri) {
  console.error(
    "\n[migrate] Falta MONGODB_URI. Ejecuta:\n  node --env-file=.env.local scripts/migrate-json-to-mongo.mjs\n",
  );
  process.exit(1);
}

function readJson(relativePath) {
  const filePath = path.join(root, relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

/** Documentos de configuración de un solo registro: colección -> archivo JSON. */
const SINGLE_DOCS = [
  { collection: "taxonomy", id: "taxonomy", file: "src/lib/catalog/taxonomy.json" },
  { collection: "filterConfig", id: "filterConfig", file: "src/lib/catalog/filter-config.json" },
  { collection: "productImages", id: "productImages", file: "src/lib/catalog/product-images.json" },
  { collection: "siteSettings", id: "siteSettings", file: "src/lib/catalog/site-settings.json" },
  { collection: "blockedImages", id: "blockedImages", file: "src/lib/catalog/blocked-images.json" },
  { collection: "portfolio", id: "portfolio", file: "src/lib/catalog/project-portfolio.json" },
];

/** Contenido i18n del catálogo, un documento por idioma. */
const CATALOG_LOCALES = [
  { id: "es", file: "messages/products-catalog/es.json" },
  { id: "en", file: "messages/products-catalog/en.json" },
];

async function main() {
  // family:4 evita fallos de DNS SRV/IPv6 en Windows.
  const client = new MongoClient(uri, {
    maxPoolSize: 5,
    family: 4,
    serverSelectionTimeoutMS: 20_000,
  });
  await client.connect();
  console.log(`[migrate] Conectado a MongoDB · base de datos "${dbName}"`);
  const db = client.db(dbName);

  try {
    for (const { collection, id, file } of SINGLE_DOCS) {
      const data = readJson(file);
      await db
        .collection(collection)
        .replaceOne({ _id: id }, { _id: id, data, updatedAt: new Date() }, { upsert: true });
      console.log(`[migrate] ✓ ${collection} <- ${file}`);
    }

    for (const { id, file } of CATALOG_LOCALES) {
      const data = readJson(file);
      await db
        .collection("catalogContent")
        .replaceOne({ _id: id }, { _id: id, data, updatedAt: new Date() }, { upsert: true });
      console.log(`[migrate] ✓ catalogContent[${id}] <- ${file}`);
    }

    console.log("\n[migrate] Migración completada correctamente.\n");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[migrate] Error:", message);
  if (/SSL|TLS|ECONNREFUSED|ENOTFOUND|authentication|IP|whitelist/i.test(message)) {
    console.error(
      "\n[migrate] Revisa en Atlas → Network Access que tu IP esté autorizada\n" +
        "  (o 0.0.0.0/0 solo para pruebas). Luego vuelve a ejecutar:\n" +
        "  npm run db:mongo:migrate\n",
    );
  }
  process.exit(1);
});
