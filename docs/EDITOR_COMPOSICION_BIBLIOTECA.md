# Edición da Biblioteca en DecapCMS

A composición do **Modo explorador** da Biblioteca só se pode editar desde o panel autenticado de **DecapCMS**. A web pública amosa exclusivamente o modo visualización e non expón botóns de edición.

## Editor da composición

Dentro de **DecapCMS > Biblioteca > Editor da composición** pódese modificar o fondo, subir ou eliminar SVG, seleccionar e arrastrar mobles, cambiar posición e tamaño, ordenar capas, eliminar elementos, restablecer a composición e exportar JSON, HTML ou ZIP. Os SVG novos gárdanse en `content/settings/library-composition.json` como datos persistentes, polo que o editor volve cargalos despois de publicar.

## Táboa de correspondencias

Dentro de **DecapCMS > Biblioteca > Táboa de correspondencias** pódese escribir o texto plano da columna `Andel` da folla de cálculo e seleccionar nun menú despregable a área SVG correspondente. O menú detéctase a partir das áreas `data-id` dos SVG publicados, incluídos os mobles novos que xa forman parte da composición. As áreas xa asignadas aparecen desactivadas noutras filas para evitar duplicidades.

A táboa só ten dúas columnas: termo da folla e área SVG. Non existe unha terceira columna de nome público. A web resolve sempre o texto mostrado a partir da área SVG seleccionada. Ao premer nunha área do explorador, a correspondencia inversa activa o filtro polo termo da folla e a área correspondente destácase en vermello intermitente.

Para publicar cambios hai que gardar a entrada correspondente e finalmente premer **Publicar** en DecapCMS. Os dous datos publícanse en ficheiros separados: `library-composition.json` e `library-shelf-mappings.json`.

## Comportamento responsivo

A escena conserva unha proporción de `11:5`. En pantallas estreitas emprega desprazamento horizontal para non deformar o mobiliario; os controis pasan a unha columna. As posicións e o tamaño almacénanse como porcentaxes, polo que a mesma composición se adapta ao ancho do contedor sen precisar coordenadas distintas para escritorio e móbil.

| Ficheiro | Función |
| --- | --- |
| `content/settings/library-composition.json` | Fonte versionada da composición visual. |
| `content/settings/library-shelf-mappings.json` | Fonte versionada das correspondencias editables. |
| `src/lib/library-composition.ts` | Tipos, validación e carga combinada dos dous ficheiros. |
| `src/components/LibraryCompositionEditor.tsx` | Editor visual da composición. |
| `src/pages/LibraryCompositionCmsEditor.tsx` | Superficie incrustada do editor da composición. |
| `src/pages/LibraryShelfMappingsCmsEditor.tsx` | Táboa incrustada de correspondencias. |
| `public/admin/preview.js` | Rexistro dos dous widgets e sincronización cos iframes. |
| `scripts/build.mjs` | Copia os dous ficheiros ao directorio público antes de compilar. |
