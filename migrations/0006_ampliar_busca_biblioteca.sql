DROP TRIGGER IF EXISTS biblioteca_libros_ai;
DROP TRIGGER IF EXISTS biblioteca_libros_ad;
DROP TRIGGER IF EXISTS biblioteca_libros_au;
DROP TABLE IF EXISTS biblioteca_fts;

CREATE VIRTUAL TABLE biblioteca_fts USING fts5(
  titulo,
  autoria,
  direccion,
  producion,
  guion,
  reparto,
  musica,
  fotografia,
  editorial,
  coleccion,
  volume,
  numero,
  discografica,
  estudio,
  sinopse,
  content='biblioteca_libros',
  content_rowid='row_id'
);

CREATE TRIGGER biblioteca_libros_ai AFTER INSERT ON biblioteca_libros BEGIN
  INSERT INTO biblioteca_fts(rowid, titulo, autoria, direccion, producion, guion, reparto, musica, fotografia, editorial, coleccion, volume, numero, discografica, estudio, sinopse)
  VALUES (new.row_id, new.titulo, new.autoria, new.direccion, new.producion, new.guion, new.reparto, new.musica, new.fotografia, new.editorial, new.coleccion, new.volume, new.numero, new.discografica, new.estudio, new.sinopse);
END;

CREATE TRIGGER biblioteca_libros_ad AFTER DELETE ON biblioteca_libros BEGIN
  INSERT INTO biblioteca_fts(biblioteca_fts, rowid, titulo, autoria, direccion, producion, guion, reparto, musica, fotografia, editorial, coleccion, volume, numero, discografica, estudio, sinopse)
  VALUES ('delete', old.row_id, old.titulo, old.autoria, old.direccion, old.producion, old.guion, old.reparto, old.musica, old.fotografia, old.editorial, old.coleccion, old.volume, old.numero, old.discografica, old.estudio, old.sinopse);
END;

CREATE TRIGGER biblioteca_libros_au AFTER UPDATE OF titulo, autoria, direccion, producion, guion, reparto, musica, fotografia, editorial, coleccion, volume, numero, discografica, estudio, sinopse ON biblioteca_libros BEGIN
  INSERT INTO biblioteca_fts(biblioteca_fts, rowid, titulo, autoria, direccion, producion, guion, reparto, musica, fotografia, editorial, coleccion, volume, numero, discografica, estudio, sinopse)
  VALUES ('delete', old.row_id, old.titulo, old.autoria, old.direccion, old.producion, old.guion, old.reparto, old.musica, old.fotografia, old.editorial, old.coleccion, old.volume, old.numero, old.discografica, old.estudio, old.sinopse);
  INSERT INTO biblioteca_fts(rowid, titulo, autoria, direccion, producion, guion, reparto, musica, fotografia, editorial, coleccion, volume, numero, discografica, estudio, sinopse)
  VALUES (new.row_id, new.titulo, new.autoria, new.direccion, new.producion, new.guion, new.reparto, new.musica, new.fotografia, new.editorial, new.coleccion, new.volume, new.numero, new.discografica, new.estudio, new.sinopse);
END;

INSERT INTO biblioteca_fts(rowid, titulo, autoria, direccion, producion, guion, reparto, musica, fotografia, editorial, coleccion, volume, numero, discografica, estudio, sinopse)
SELECT row_id, titulo, autoria, direccion, producion, guion, reparto, musica, fotografia, editorial, coleccion, volume, numero, discografica, estudio, sinopse
FROM biblioteca_libros;
