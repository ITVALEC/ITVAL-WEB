const fs = require("node:fs");
const path = require("node:path");

const nextDir = path.join(__dirname, "..", ".next");
const force = process.argv.includes("--force");
const checkCorrupt = process.argv.includes("--check-corrupt");
const skipIfDev = process.argv.includes("--skip-if-dev");

function isDevPortInUse() {
  if (process.platform !== "win32") return false;
  try {
    const { execSync } = require("node:child_process");
    const output = execSync("netstat -ano | findstr :3000", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output.includes("LISTENING");
  } catch {
    return false;
  }
}

if (skipIfDev && isDevPortInUse()) {
  console.log("Servidor de desarrollo activo en :3000 — se omite limpieza de .next");
  process.exit(0);
}

if (!fs.existsSync(nextDir)) {
  process.exit(0);
}

const hasProductionBuild = fs.existsSync(path.join(nextDir, "BUILD_ID"));
const vendorChunk = path.join(nextDir, "server", "vendor-chunks", "next.js");
const hasServerDir = fs.existsSync(path.join(nextDir, "server"));
const isCorrupt = hasServerDir && !fs.existsSync(vendorChunk);

if (force || hasProductionBuild || (checkCorrupt && isCorrupt)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  if (force) {
    console.log("Caché .next eliminada.");
  } else if (hasProductionBuild) {
    console.log("Caché de producción eliminada (no mezclar build con dev).");
  } else if (isCorrupt) {
    console.log("Caché .next corrupta eliminada (vendor-chunks faltante).");
  }
}
