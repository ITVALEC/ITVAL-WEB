-- Migración incremental: documentos del catálogo en PostgreSQL
CREATE TABLE IF NOT EXISTS app_documents (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS app_documents_updated_at ON app_documents;
CREATE TRIGGER app_documents_updated_at
  BEFORE UPDATE ON app_documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
