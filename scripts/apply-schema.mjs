import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { getDatabaseUrl } from "./db-config.mjs";

const root = process.cwd();
const schemaPath = path.join(root, "database", "schema-standalone.sql");

async function main() {
  const sql = fs.readFileSync(schemaPath, "utf8");
  const client = new pg.Client({ connectionString: getDatabaseUrl() });

  console.log("Conectando a PostgreSQL…");
  await client.connect();
  console.log("Aplicando esquema…");
  await client.query(sql);
  await client.end();
  console.log("Esquema listo.");
}

main().catch((error) => {
  console.error("Error al aplicar esquema:", error.message);
  process.exit(1);
});
