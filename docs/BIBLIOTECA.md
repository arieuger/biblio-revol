# Biblioteca da NOME DA ASOCIACIÓN

A sección `/biblioteca` é un catálogo vivo servido por un **Cloudflare Worker**. A configuración técnica completa está en [CLOUDFLARE_BIBLIOTECA.md](./CLOUDFLARE_BIBLIOTECA.md). D1 garda os datos; FTS5 establece a orde das coincidencias textuais; Vectorize e Workers AI achegan referencias semanticamente relacionadas sen superar nunca os resultados literais.

## Columnas da folla

As columnas que se importan son **Portada**, **Título**, **Autoría**, **Data**, **Dirección**, **Produción**, **Guión**, **Reparto**, **Música**, **Fotografía**, **Editorial**, **Colección**, **Volume**, **Número**, **Páxinas**, **Soporte**, **Formato**, **Xénero**, **Duración**, **Discográfica**, **Estudio**, **ISBN / ISSN / EAN**, **Sinopse**, **Temática**, **Andel**, **Idioma**, **Exemplares totais**, **Exemplares emprestados**, **Exemplares dispoñibles** e **Recomendación**. Nos campos **Autoría**, **Editorial**, **Colección**, **Temática**, **Andel** e **Idioma**, a secuencia `, ` separa etiquetas individuais. As datas `dd/mm/aaaa` e os anos illados normalízanse para o filtro de datas. Na ficha do exemplar, despois das etiquetas de idiomas, os campos móstranse nesta orde: **Autoría**, **Data de publicación**, **Dirección**, **Produción**, **Guión**, **Reparto**, **Música**, **Fotografía**, **Editorial**, **Colección**, **Volume**, **Número**, **Páxinas**, **Soporte**, **Formato**, **Xénero**, **Duración**, **Discográfica**, **Estudio** e **ISBN / ISSN / EAN**. A ficha remata con **Exemplares dispoñibles**, **Andel** e, por separado, **Sinopse**.

## Engadir portadas

Garda cada ficheiro en `public/images/biblioteca/` e escribe o seu nome, incluída a extensión, na columna **Portada**. Por exemplo, a portada inicial está en `public/images/biblioteca/anarquistaounada.png` e a folla debe conter `anarquistaounada.png`.

Por seguridade, o servidor só constrúe rutas de portada a partir de nomes simples de ficheiro; non admite rutas nin nomes con barras. Isto evita que o valor dunha folla pública poida solicitar ficheiros alleos ao cartafol de portadas.

## Linguaxe de busca

| Forma | Exemplo | Resultado |
| --- | --- | --- |
| Espazo ou `AND` | `memoria AND libertaria` | Require ambos os termos. |
| `OR` | `poesía OR teatro` | Acepta calquera dos termos. |
| `NOT` | `historia NOT militar` | Exclúe o termo posterior. |
| Frase exacta | `"Sherlock Holmes"` | Busca a secuencia literal. |
| Campo concreto | `autoria:Doyle` | Limita a busca ao campo indicado. |

Os campos dispoñibles son `titulo:`, `autoria:`, `direccion:`, `producion:`, `guion:`, `reparto:`, `musica:`, `fotografia:`, `editorial:`, `coleccion:`, `volume:`, `numero:`, `discografica:`, `estudio:` e `sinopse:`. As consultas sen prefixo buscan en todos estes campos; por exemplo, `El Viejo Topo 232` esixe os termos e pode atopar o título nun campo e o número noutro. A interface tamén permite combinar estes criterios cos filtros de data, temática, idioma e páxinas. Os filtros de temática e idioma permiten seleccionar varias etiquetas individuais á vez.

## Referencias

[1] [Google Sheets, exportación de datos en CSV](https://docs.google.com/spreadsheets/d/REEMPLAZAR_ID/edit?usp=sharing).

[2] [Configuración de Cloudflare para o catálogo](./CLOUDFLARE_BIBLIOTECA.md).
