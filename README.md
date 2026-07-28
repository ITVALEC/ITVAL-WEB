# ITVAL — Sitio web corporativo

Sitio bilingüe (ES/EN) para ITVAL, especialistas en aluminio y vidrio.

## Requisitos

- Node.js 18.18+
- npm

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) — redirige a `/es`.

## Producción

```bash
npm run build
npm start
```

## Traducción automática (admin)

El panel admin edita solo en **español**. Al guardar, el servidor genera/actualiza el inglés.

Proveedores (prioridad): `DEEPL_AUTH_KEY` → `OPENAI_API_KEY` → `GOOGLE_TRANSLATE_API_KEY` / `TRANSLATION_API_KEY` → MyMemory (sin clave).

En VPS añade una clave en `/var/www/itval/shared/.env.production.local` (ver `.env.example`). Si falla la API, el español se guarda igual y el admin muestra un aviso.
