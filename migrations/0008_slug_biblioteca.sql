ALTER TABLE biblioteca_libros ADD COLUMN slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_biblioteca_slug ON biblioteca_libros(slug) WHERE slug IS NOT NULL;

