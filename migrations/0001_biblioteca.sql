CREATE TABLE IF NOT EXISTS biblioteca_libros (
  row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  source_hash TEXT NOT NULL UNIQUE,
  portada TEXT,
  titulo TEXT NOT NULL,
  autoria TEXT,
  editorial TEXT,
  coleccion TEXT,
  sinopse TEXT,
  data_publicacion TEXT,
  tematicas TEXT NOT NULL DEFAULT '[]',
  andel TEXT NOT NULL DEFAULT '[]',
  idioma TEXT,
  idiomas TEXT NOT NULL DEFAULT '[]',
  numero_paxinas INTEGER,
  actualizado_en INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_biblioteca_data ON biblioteca_libros(data_publicacion);
CREATE INDEX IF NOT EXISTS idx_biblioteca_idioma ON biblioteca_libros(idioma);
CREATE INDEX IF NOT EXISTS idx_biblioteca_paxinas ON biblioteca_libros(numero_paxinas);
CREATE VIRTUAL TABLE IF NOT EXISTS biblioteca_fts USING fts5(titulo, autoria, editorial, coleccion, sinopse, content='biblioteca_libros', content_rowid='row_id');
CREATE TRIGGER IF NOT EXISTS biblioteca_libros_ai AFTER INSERT ON biblioteca_libros BEGIN INSERT INTO biblioteca_fts(rowid, titulo, autoria, editorial, coleccion, sinopse) VALUES (new.row_id, new.titulo, new.autoria, new.editorial, new.coleccion, new.sinopse); END;
CREATE TRIGGER IF NOT EXISTS biblioteca_libros_ad AFTER DELETE ON biblioteca_libros BEGIN INSERT INTO biblioteca_fts(biblioteca_fts, rowid, titulo, autoria, editorial, coleccion, sinopse) VALUES ('delete', old.row_id, old.titulo, old.autoria, old.editorial, old.coleccion, old.sinopse); END;
CREATE TRIGGER IF NOT EXISTS biblioteca_libros_au AFTER UPDATE OF titulo, autoria, editorial, coleccion, sinopse ON biblioteca_libros BEGIN INSERT INTO biblioteca_fts(biblioteca_fts, rowid, titulo, autoria, editorial, coleccion, sinopse) VALUES ('delete', old.row_id, old.titulo, old.autoria, old.editorial, old.coleccion, old.sinopse); INSERT INTO biblioteca_fts(rowid, titulo, autoria, editorial, coleccion, sinopse) VALUES (new.row_id, new.titulo, new.autoria, new.editorial, new.coleccion, new.sinopse); END;
CREATE TABLE IF NOT EXISTS biblioteca_vectores (id TEXT PRIMARY KEY, source_hash TEXT NOT NULL, actualizado_en INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS biblioteca_rexistros_vixentes (id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS biblioteca_sincronizacion (id INTEGER PRIMARY KEY CHECK (id = 1), actualizada_en INTEGER, total_libros INTEGER NOT NULL DEFAULT 0, erro TEXT);
