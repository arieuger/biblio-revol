# Correspondencias entre a folla e as áreas SVG

As correspondencias son datos editables dentro da composición da Biblioteca en **DecapCMS**. O editor mostra unha táboa con tres columnas: o termo exacto da columna `Andel` da folla de cálculo, a asignación ao identificador da área SVG (`data-id`) e o texto público calculado a partir desa área.

A primeira columna é o valor que chega desde a folla e se usa para procurar no catálogo. A segunda é o identificador que debe existir nunha área `.shelf-hit` do SVG. A terceira é o único texto que se mostra publicamente: aparece no filtro activo, nos enlaces da ficha da publicación, no título/etiqueta da área e en calquera outro lugar que presente o andel.

| Termo na folla (`Andel`) | Área SVG asignada | Texto público inicial |
| --- | --- | --- |
| A1, A2, A3, A4 | A1, A2, A3, A4 | A1, A2, A3, A4 |
| B1, B2, B3, B4, B5, B6, B7 | B1, B2, B3, B4, B5, B6, B7 | B1, B2, B3, B4, B5, B6, B7 |
| C1, C2, C3, C4, C5, C6 | C1, C2, C3, C4, C5, C6 | C1, C2, C3, C4, C5, C6 |
| D1, D2, D3, D4, D5, D6 | D1, D2, D3, D4, D5, D6 | D1, D2, D3, D4, D5, D6 |
| V1, V2, V3, V4 | V1, V2, V3, V4 | V1, V2, V3, V4 |
| EL | EL | Expositor de libros |
| ER | ER | Expositor de revistas |
| Z | Z | Estantería azul |
| C | C | Moble circular |

Para cambiar unha correspondencia, edita a fila no widget de DecapCMS, preme **Pechar edición**, confirma e finalmente preme **Publicar**. A web carga `shelfMappings` desde `public/settings/library-composition.json` e aplica a mesma resolución tanto no explorador como nas fichas.

A función `explorerShelfAreaName` é a única porta de saída do nome público. O código interno da folla non se presenta directamente cando existe unha correspondencia. Se se engade unha área SVG nova, primeiro debe existir o seu `data-id` no SVG e despois pódese engadir a fila correspondente desde DecapCMS.
