/**
 * Archivo de inicio para cPanel (Phusion Passenger).
 *
 * Passenger ejecuta este archivo y define `process.env.PORT`. El servidor
 * debe escuchar en ese puerto; Next.js se encarga del resto (páginas SSR,
 * archivos estáticos `/_next`, optimización de imágenes y rutas de API).
 *
 * Requiere que el proyecto esté compilado en el servidor:
 *   npm install && npm run build
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const port = Number.parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOST || "127.0.0.1";

const app = next({ dev: false, dir: __dirname, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url || "/", true);
      handle(req, res, parsedUrl);
    }).listen(port, () => {
      console.log(`[ITVAL] Servidor Next.js escuchando en el puerto ${port}`);
    });
  })
  .catch((error) => {
    console.error("[ITVAL] Error al iniciar Next.js:", error);
    process.exit(1);
  });
