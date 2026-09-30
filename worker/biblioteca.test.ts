import { describe, expect, it } from "vitest";
import { compileFts, filtersSql, FTS_WEIGHTS, parseCatalogQuery, parsePublicationDate, parseRecommendation, prioritizeLiteralResults, prioritizeRecommendations, requiresLiteralResults, shouldIncludeSemanticResults, slugifyBiblioteca, sortCatalogAlphabetically, splitTags } from "./biblioteca";

describe("identidade pública da Biblioteca", () => {
  it("normaliza títulos para slugs lexibles", () => {
    expect(slugifyBiblioteca("La cuestión Bahá'í. Limpeza cultural en Irán")).toBe("la-cuestion-baha-i-limpeza-cultural-en-iran");
    expect(slugifyBiblioteca("  O Principiño  ")).toBe("o-principino");
  });

  it("deixa baleiro o slug cando non hai título", () => {
    expect(slugifyBiblioteca("")).toBe("");
  });
});

describe("linguaxe de busca da Biblioteca", () => {
  it("compila frases, campos e operadores booleanos para FTS5", () => {
    const clauses = parseCatalogQuery('titulo:"Sherlock Holmes" OR autoria:Doyle NOT editorial:Exemplo');
    expect(clauses).toMatchObject([
      { field: "titulo", value: "Sherlock Holmes", exact: true, operator: "AND" },
      { field: "autoria", value: "Doyle", exact: false, operator: "OR" },
      { field: "editorial", value: "Exemplo", exact: false, operator: "NOT" },
    ]);
    expect(compileFts(clauses)).toBe('((titulo : "Sherlock Holmes") OR (autoria : "Doyle")) NOT (editorial : "Exemplo")');
  });

  it("interpreta os espazos como AND", () => {
    expect(compileFts(parseCatalogQuery("memoria libertaria"))).toBe('("memoria") AND ("libertaria")');
  });

  it("permite unha exclusión inicial sen invalidar a busca", () => {
    expect(compileFts(parseCatalogQuery("NOT militar historia"))).toBe('("historia") NOT ("militar")');
  });

  it("pondera título, autoría e número por riba dos campos descritivos", () => {
    expect(FTS_WEIGHTS).toEqual([8, 8, 5, 4, 4, 4, 4, 3, 3, 3, 6, 8, 3, 3, 1]);
  });

  it("permite buscar un título e o seu número cando están en campos distintos", () => {
    expect(compileFts(parseCatalogQuery("El Viejo Topo 232"))).toBe('((("El") AND ("Viejo")) AND ("Topo")) AND ("232")');
    expect(compileFts(parseCatalogQuery("numero:232"))).toBe('numero : "232"');
    expect(compileFts(parseCatalogQuery("direccion:Agnès producion:ZDF guion:historia reparto:actriz musica:banda fotografia:imaxe discografica:selo estudio:estudio volume:2"))).toContain('direccion : "Agnès"');
  });

  it("trata a puntuación como texto literal e non como sintaxe de FTS5", () => {
    const compiled = compileFts(parseCatalogQuery('"Como. Facermos"'));
    expect(compiled).toBe('"Como. Facermos"');
    expect(compiled).not.toContain("MATCH");
  });

  it("compón filtros de data, temática, idioma e páxinas con parámetros seguros", () => {
    const compiled = filtersSql({ desde: "2010-01-01", ata: "2020-12-31", tematicas: ["Artes", "Historia"], idiomas: ["Galego"], paxinasMin: 50, paxinasMax: 300 });
    expect(compiled.sql).toContain("l.data_publicacion >= ?");
    expect(compiled.sql).toContain("json_each(l.tematicas)");
    expect(compiled.sql).toContain("json_each(l.idiomas)");
    expect(compiled.params).toEqual(["2010-01-01", "2020-12-31", 50, 300, "Galego", "Artes", "Historia"]);
  });

  it("filtra polo formato sen distinguir maiúsculas e minúsculas", () => {
    const compiled = filtersSql({ formatos: ["Libro", "Revista"] });
    expect(compiled.sql).toContain("LOWER(COALESCE(l.formato, '')) IN (?,?)");
    expect(compiled.params).toEqual(["libro", "revista"]);
  });

  it("filtra estritamente por códigos de andel e inhibe os resultados semánticos", () => {
    const compiled = filtersSql({ andels: ["A1", "ER"] });
    expect(compiled.sql).toContain("json_each(l.andel)");
    expect(compiled.params).toEqual(["a1", "er"]);
    expect(shouldIncludeSemanticResults("arquivo", { andels: ["A1"] })).toBe(false);
  });

  it("filtra por etiquetas individuais de autoría, editorial e colección", () => {
    const compiled = filtersSql({ autorias: ["Autora A"], editoriais: ["Editorial B"], coleccions: ["Colección C"] });
    expect(compiled.sql).toContain("l.autoria");
    expect(compiled.sql).toContain("l.editorial");
    expect(compiled.sql).toContain("l.coleccion");
    expect(compiled.params).toEqual(["%,Autora A,%", "%,Editorial B,%", "%,Colección C,%"]);
  });

  it("filtra cada entidade multimedia separada por comas como unha etiqueta", () => {
    const compiled = filtersSql({ direccions: ["Directora"], produccions: ["Produtora"], guions: ["Guionista"], repartos: ["Actriz"], musicas: ["Banda"], fotografias: ["Fotógrafa"], discograficas: ["Selo"], estudios: ["Estudio"] });
    for (const column of ["l.direccion", "l.producion", "l.guion", "l.reparto", "l.musica", "l.fotografia", "l.discografica", "l.estudio"]) expect(compiled.sql).toContain(column);
    expect(compiled.params).toEqual(["%,Directora,%", "%,Produtora,%", "%,Guionista,%", "%,Actriz,%", "%,Banda,%", "%,Fotógrafa,%", "%,Selo,%", "%,Estudio,%"]);
  });

  it("compón a busca avanzada por título, autoría, editorial, colección e ISBN/ISSN", () => {
    const compiled = filtersSql({ tituloAvanzado: "Memoria", autoriaAvanzada: "Doyle", editorialAvanzada: "Xerais", coleccionAvanzada: "Ensaio", isbnIssnAvanzado: "978" });
    expect(compiled.sql).toContain("l.titulo");
    expect(compiled.sql).toContain("l.autoria");
    expect(compiled.sql).toContain("l.editorial");
    expect(compiled.sql).toContain("l.coleccion");
    expect(compiled.sql).toContain("REPLACE(COALESCE(l.isbn_issn, ''), '-', '')");
    expect(compiled.params).toEqual(["%memoria%", "%doyle%", "%xerais%", "%ensaio%", "%978%"]);
  });

  it("ignora os guións e o último díxito de control ao buscar ISBN / ISSN", () => {
    const compiled = filtersSql({ isbnIssnAvanzado: "978-93-7583-923-0" });
    expect(compiled.sql).toContain("REPLACE(COALESCE(l.isbn_issn, ''), '-', '')");
    expect(compiled.params).toEqual(["%978937583923%"]);
  });

  it("separa e normaliza etiquetas indicadas con coma", () => {
    expect(splitTags("Galego, Castelán, Galego")).toEqual(["Galego", "Castelán"]);
    expect(splitTags("Editorial A, Editorial B")).toEqual(["Editorial A", "Editorial B"]);
  });

  it("normaliza a publicación a mes e ano para non conservar un día artificial", () => {
    expect(parsePublicationDate("10/04/2023")).toBe("2023-04");
    expect(parsePublicationDate("04/2023")).toBe("2023-04");
    expect(parsePublicationDate("2023")).toBe("2023");
  });

  it("interpreta as estrelas de recomendación sen alterar os valores baleiros ou nulos", () => {
    expect(parseRecommendation("5")).toBe(5);
    expect(parseRecommendation(" 3 ")).toBe(3);
    expect(parseRecommendation("0")).toBe(0);
    expect(parseRecommendation(null)).toBe(0);
  });

  it("prioriza as obras con máis estrelas e completa ata dez mantendo a orde de respaldo", () => {
    const recommended = [{ id: "two", titulo: "Dous", recomendacion: 2 }, { id: "five", titulo: "Cinco", recomendacion: 5 }] as any[];
    const fallback = Array.from({ length: 10 }, (_, index) => ({ id: `base-${index + 1}`, titulo: `Base ${index + 1}`, recomendacion: 0 })) as any[];
    const selected = prioritizeRecommendations(recommended, fallback);
    expect(selected).toHaveLength(10);
    expect(selected.map(book => book.id)).toEqual(["five", "two", "base-1", "base-2", "base-3", "base-4", "base-5", "base-6", "base-7", "base-8"]);
  });

  it("non permite resultados relacionados cando a consulta usa operadores", () => {
    expect(requiresLiteralResults("titulo:Memoria")).toBe(true);
    expect(requiresLiteralResults("memoria OR arquivo")).toBe(true);
    expect(requiresLiteralResults("memoria NOT arquivo")).toBe(true);
    expect(requiresLiteralResults("memoria libertaria")).toBe(false);
  });

  it("deixa sempre as obras relacionadas despois das coincidencias literais", () => {
    const literal = [{ id: "literal", tipoCoincidencia: "literal" }] as any[];
    const related = [{ id: "related-1", tipoCoincidencia: "semantica" }, { id: "related-2", tipoCoincidencia: "semantica" }] as any[];
    expect(prioritizeLiteralResults(literal, related).map(book => book.id)).toEqual(["literal", "related-1", "related-2"]);
  });

  it("ordena alfabeticamente polo título completo, incluíndo Volume e Número", () => {
    const ordered = sortCatalogAlphabetically([
      { id: "issue-12", titulo: "Tempo exterior", formato: "Revista", volume: "6", numero: "12 (xaneiro-xuño)", portada: null },
      { id: "issue-9", titulo: "Tempo exterior", formato: "Revista", volume: "5", numero: "9 (xullo-decembro)", portada: null },
      { id: "first", titulo: "A comezos", formato: "Libro", volume: null, numero: null, portada: null },
    ] as any[]);
    expect(ordered.map(book => book.id)).toEqual(["first", "issue-9", "issue-12"]);
  });
});
