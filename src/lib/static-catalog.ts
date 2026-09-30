import type { BibliotecaBook } from "@shared/biblioteca";
import { books as catalogBooks } from "./books";

const normalize = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();

export function staticCatalogResponse(url: URL): Response {
  const endpoint = url.pathname.replace("/api/biblioteca/", "");
  const params = url.searchParams;

  // Ficha individual
  if (endpoint.startsWith("libros/")) {
    const slug = decodeURIComponent(endpoint.slice(7));

    const book = catalogBooks.find(
      book => book.slug === slug || book.id === slug,
    );

    return Response.json(
      book ?? { error: "Exemplar non atopado" },
      { status: book ? 200 : 404 },
    );
  }

  // Filtros
  if (endpoint === "filtros") {
    const pageNumbers = catalogBooks
      .map(book => book.numeroPaxinas)
      .filter((pages): pages is number => typeof pages === "number");

    return Response.json({
      tematicas: [
        ...new Set(
          catalogBooks.flatMap(book => book.tematicas),
        ),
      ],

      idiomas: [
        ...new Set(
          catalogBooks.flatMap(book => book.idiomas),
        ),
      ],

      formatos: [
        ...new Set(
          catalogBooks
            .map(book => book.formato)
            .filter((value): value is string => Boolean(value)),
        ),
      ],

      soportes: [
        ...new Set(
          catalogBooks
            .map(book => book.soporte)
            .filter((value): value is string => Boolean(value)),
        ),
      ],

      limitesPaxinas: {
        min: pageNumbers.length
          ? Math.min(...pageNumbers)
          : null,
        max: pageNumbers.length
          ? Math.max(...pageNumbers)
          : null,
      },

      actualizadaEn: null,
    });
  }

  // Recomendacións
  if (endpoint === "recomendacions") {
    return Response.json(
      catalogBooks
        .filter(book => book.recomendacion)
        .slice(0, 4),
    );
  }

  // Novidades
  if (endpoint === "novidades") {
    return Response.json(
      catalogBooks.slice(0, 4),
    );
  }

  if (endpoint !== "libros") {
    return Response.json(
      { error: "Ruta non atopada" },
      { status: 404 },
    );
  }

  // ---------- Catálogo ----------

  const exact: Record<string, keyof BibliotecaBook> = {
    tematica: "tematicas",
    idioma: "idiomas",
    formato: "formato",
    soporte: "soporte",
    andel: "andel",
    autoria: "autoria",
    editorial: "editorial",
    coleccion: "coleccion",
    direccion: "direccion",
    producion: "producion",
    guion: "guion",
    reparto: "reparto",
    musica: "musica",
    fotografia: "fotografia",
    discografica: "discografica",
    estudio: "estudio",
  };

  const partial: Record<string, keyof BibliotecaBook> = {
    av_titulo: "titulo",
    av_autoria: "autoria",
    av_editorial: "editorial",
    av_coleccion: "coleccion",
    av_isbn: "isbnIssn",
  };

  let filteredBooks = catalogBooks.filter(book => {
    const query = normalize(params.get("q")).trim();

    if (
      query &&
      !normalize(
        [
          book.titulo,
          book.autoria,
          book.sinopse,
        ].join(" "),
      ).includes(query)
    ) {
      return false;
    }

    for (const [key, field] of Object.entries(exact)) {
      const selected = params.getAll(key);

      const fieldValue = book[field];

      const values = Array.isArray(fieldValue)
        ? fieldValue as string[]
        : [String(fieldValue ?? "")];

      if (
        selected.length &&
        !selected.some(selectedValue =>
          values.some(
            value =>
              normalize(value) === normalize(selectedValue),
          ),
        )
      ) {
        return false;
      }
    }

    for (const [key, field] of Object.entries(partial)) {
      if (
        params.has(key) &&
        !normalize(book[field]).includes(
          normalize(params.get(key)),
        )
      ) {
        return false;
      }
    }

    if (
      params.has("desde") &&
      (book.dataPublicacion ?? "") < params.get("desde")!
    ) {
      return false;
    }

    if (
      params.has("ata") &&
      (book.dataPublicacion ?? "") > params.get("ata")!
    ) {
      return false;
    }

    if (
      params.has("paxinasMin") &&
      (book.numeroPaxinas ?? 0) <
      Number(params.get("paxinasMin"))
    ) {
      return false;
    }

    if (
      params.has("paxinasMax") &&
      (book.numeroPaxinas ?? 0) >
      Number(params.get("paxinasMax"))
    ) {
      return false;
    }

    return true;
  });

  if (params.get("orde") === "alfabetica") {
    filteredBooks = [...filteredBooks].sort(
      (a, b) =>
        a.titulo.localeCompare(b.titulo, "gl"),
    );
  }

  const positive = (
    key: string,
    fallback: number,
  ) => {
    const value = Number(params.get(key));

    return Number.isFinite(value) && value >= 1
      ? Math.floor(value)
      : fallback;
  };

  const pagina = positive("paxina", 1);
  const porPaxina = Math.min(
    100,
    positive("porPaxina", 24),
  );

  const start = (pagina - 1) * porPaxina;
  const end = pagina * porPaxina;

  return Response.json({
    resultados: filteredBooks.slice(start, end),
    total: filteredBooks.length,
    pagina,
    porPaxina,
    actualizadaEn: null,
  });
}