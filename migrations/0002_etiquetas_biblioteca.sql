ALTER TABLE biblioteca_libros ADD COLUMN andel TEXT NOT NULL DEFAULT '[]';
ALTER TABLE biblioteca_libros ADD COLUMN idiomas TEXT NOT NULL DEFAULT '[]';
UPDATE biblioteca_libros SET idiomas = CASE WHEN idioma IS NULL OR trim(idioma) = '' THEN '[]' ELSE json_array(idioma) END;
