ALTER TABLE biblioteca_libros ADD COLUMN recomendacion INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_biblioteca_recomendacion ON biblioteca_libros(recomendacion DESC);
