import type { BibliotecaBook } from "@shared/biblioteca";

type BookRecord = {
  title: string;
  authors: string[];
  publisher?: string;
  year?: number;
  isbn?: string;
  language?: string;
  pages?: number;
  cover?: string;
  categories?: string[];
  tags?: string[];
  description?: string;
  location: {
    shelf: string;
  };
  copies: {
    total: number;
    available: number;
  };
  featured?: boolean;
};

const modules = import.meta.glob<BookRecord>(
  "/content/books/*.json",
  {
    eager: true,
    import: "default",
  },
);

function slugFromPath(path: string): string {
  return path.split("/").pop()!.replace(/\.json$/, "");
}

export const books: BibliotecaBook[] = Object.entries(modules).map(
  ([path, book]) => {
    const slug = slugFromPath(path);

    return {
      id: slug,
      slug,

      titulo: book.title,
      autoria: book.authors.join(", "),
      editorial: book.publisher ?? null,
      isbnIssn: book.isbn ?? null,
      sinopse: book.description ?? null,
      dataPublicacion: book.year ? String(book.year) : null,
      portada: book.cover ?? null,
      tematicas: book.categories ?? [],
      andel: book.location?.shelf ? [book.location.shelf] : [],
      idioma: book.language ?? null,
      idiomas: book.language ? [book.language] : [],
      numeroPaxinas: book.pages ?? null,

      exemplaresTotais: book.copies?.total ?? 1,
      exemplaresDispoñibles: book.copies?.available ?? 1,
      exemplaresEmprestados: Math.max(
        0,
        (book.copies?.total ?? 1) - (book.copies?.available ?? 1),
      ),

      recomendacion: book.featured ? 1 : 0,

      formato: "Libro",
      soporte: "Papel",

      volume: null,
      numero: null,
      direccion: null,
      producion: null,
      guion: null,
      reparto: null,
      musica: null,
      fotografia: null,
      coleccion: null,
      xenero: null,
      duracion: null,
      discografica: null,
      estudio: null,
    };
  },
);