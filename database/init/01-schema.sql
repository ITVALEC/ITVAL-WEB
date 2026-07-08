-- ITVAL — esquema para PostgREST
-- Las imágenes (binarios) viven en public/ o almacenamiento externo;
-- PostgreSQL guarda rutas, metadatos y textos.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Roles PostgREST ───────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'web_anon') THEN
    CREATE ROLE web_anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'web_admin') THEN
    CREATE ROLE web_admin NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO web_anon, web_admin;
GRANT web_admin TO itval;

-- ─── Proyectos ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  location TEXT,
  year INT,
  folder TEXT,
  product_category TEXT NOT NULL,
  product_subcategory TEXT,
  cover_path TEXT,
  cover_index INT NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_images (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  src TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  alt_text TEXT,
  UNIQUE (project_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_project_images_project ON project_images(project_id);

-- ─── Galerías de productos ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_gallery_images (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  src TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE (category, subcategory, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_product_gallery_cat ON product_gallery_images(category, subcategory);

-- ─── Configuración del sitio (footer, contacto) ────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  footer JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Imágenes bloqueadas ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_images (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Permisos: lectura pública, escritura solo admin ───────────────
GRANT SELECT ON ALL TABLES IN SCHEMA public TO web_anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO web_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO web_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO web_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO web_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO web_admin;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS site_settings_updated_at ON site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
