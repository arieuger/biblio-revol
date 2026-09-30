export const SEARCHABLE_FIELDS = ["titulo", "autoria", "direccion", "producion", "guion", "reparto", "musica", "fotografia", "editorial", "coleccion", "volume", "numero", "discografica", "estudio", "sinopse"] as const;

export type SearchableField = (typeof SEARCHABLE_FIELDS)[number];

export type BibliotecaBook = {
  id: string;
  slug: string;
  portada: string | null;
  titulo: string;
  formato: string | null;
  volume: string | null;
  numero: string | null;
  autoria: string | null;
  direccion: string | null;
  producion: string | null;
  guion: string | null;
  reparto: string | null;
  musica: string | null;
  fotografia: string | null;
  editorial: string | null;
  coleccion: string | null;
  isbnIssn: string | null;
  sinopse: string | null;
  dataPublicacion: string | null;
  tematicas: string[];
  andel: string[];
  idioma: string | null;
  idiomas: string[];
  numeroPaxinas: number | null;
  soporte: string | null;
  xenero: string | null;
  duracion: string | null;
  discografica: string | null;
  estudio: string | null;
  exemplaresTotais: number | null;
  exemplaresEmprestados: number | null;
  exemplaresDispoñibles: number | null;
  recomendacion?: number;
  puntuacionLiteral?: number;
  puntuacionSemantica?: number;
  tipoCoincidencia?: "literal" | "semantica" | "recente";
};

function inferredExtraNumber(portada?: string | null): string | null {
  const match = portada?.match(/evtextra(\d+)\.png(?:$|[?#])/i);
  return match ? `Extra ${match[1]}` : null;
}

export function displayBookTitle(book: Pick<BibliotecaBook, "titulo" | "formato" | "volume" | "numero"> & Partial<Pick<BibliotecaBook, "portada">>): string {
  const format = book.formato?.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  if (format !== "revista" && format !== "xornal" && format !== "folleto") return book.titulo;
  const volume = book.volume?.trim() || null;
  const number = book.numero?.trim() || inferredExtraNumber(book.portada);
  const issueParts = [volume && `Vol. ${volume}`, number && `Núm. ${number}`].filter(Boolean);
  return issueParts.length ? `${book.titulo}, ${issueParts.join(", ")}` : book.titulo;
}

export function splitBibliographicTags(value: string | null): string[] {
  return Array.from(new Set((value ?? "").split(/,\s*/).map(tag => tag.trim()).filter(Boolean)));
}

export type ExplorerShelfCorrespondence = {
  spreadsheetTerm: string;
  svgArea: string;
};

/**
 * The spreadsheet stores the first column; the second column is the only
 * human-facing label used by the explorer and by book detail pages.
 */
export const EXPLORER_SHELF_CORRESPONDENCES: ExplorerShelfCorrespondence[] = [
  ...["A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "C1", "C2", "C3", "C4", "C5", "C6", "D1", "D2", "D3", "D4", "D5", "D6"].map(spreadsheetTerm => ({ spreadsheetTerm, svgArea: spreadsheetTerm })),
  ...["V1", "V2", "V3", "V4"].map(spreadsheetTerm => ({ spreadsheetTerm, svgArea: spreadsheetTerm })),
  { spreadsheetTerm: "EL", svgArea: "EL" },
  { spreadsheetTerm: "ER", svgArea: "ER" },
  { spreadsheetTerm: "Z", svgArea: "Z" },
  { spreadsheetTerm: "C", svgArea: "C" },
];

const SVG_AREA_LABELS: Record<string, string> = {
  EL: "Expositor de libros",
  ER: "Expositor de revistas",
  Z: "Estantería azul",
  C: "Moble circular",
};

const SVG_AREA_IDS_BY_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(SVG_AREA_LABELS).map(([id, label]) => [label.toLocaleUpperCase(), id]),
);

export const EXPLORER_SHELF_AREA_NAMES: Record<string, string> = Object.fromEntries(
  EXPLORER_SHELF_CORRESPONDENCES.map(({ spreadsheetTerm, svgArea }) => [spreadsheetTerm, SVG_AREA_LABELS[svgArea] ?? svgArea]),
);

export function explorerSvgAreaName(svgArea: string): string {
  const value = svgArea.trim();
  const normalized = value.toUpperCase();
  if (SVG_AREA_LABELS[normalized]) return SVG_AREA_LABELS[normalized];
  return value === normalized ? `${value.charAt(0)}${value.slice(1).toLocaleLowerCase()}` : value;
}

export function explorerSvgAreaId(svgArea: string): string {
  const value = svgArea.trim();
  const normalized = value.toUpperCase();
  return SVG_AREA_IDS_BY_LABEL[normalized] ?? value;
}

export function explorerShelfAreaName(shelfCode: string, correspondences: ExplorerShelfCorrespondence[] = EXPLORER_SHELF_CORRESPONDENCES): string {
  const normalized = shelfCode.trim().toUpperCase();
  const mapping = correspondences.find(entry => entry.spreadsheetTerm.toUpperCase() === normalized);
  return mapping ? explorerSvgAreaName(mapping.svgArea) : EXPLORER_SHELF_AREA_NAMES[normalized] ?? shelfCode.trim();
}

export function explorerShelfHref(shelfCode: string): string {
  return `/biblioteca?modo=explorador&andel=${encodeURIComponent(shelfCode.trim().toUpperCase())}`;
}

export type BibliotecaFilters = {
  desde?: string;
  ata?: string;
  tematicas?: string[];
  idiomas?: string[];
  formatos?: string[];
  soportes?: string[];
  andels?: string[];
  autorias?: string[];
  editoriais?: string[];
  coleccions?: string[];
  direccions?: string[];
  produccions?: string[];
  guions?: string[];
  repartos?: string[];
  musicas?: string[];
  fotografias?: string[];
  discograficas?: string[];
  estudios?: string[];
  tituloAvanzado?: string;
  autoriaAvanzada?: string;
  editorialAvanzada?: string;
  coleccionAvanzada?: string;
  isbnIssnAvanzado?: string;
  paxinasMin?: number;
  paxinasMax?: number;
};

export type BibliotecaSearchResponse = {
  resultados: BibliotecaBook[];
  total: number;
  pagina: number;
  porPaxina: number;
  actualizadaEn: string | null;
};

export type BibliotecaFilterOptions = {
  tematicas: string[];
  idiomas: string[];
  formatos: string[];
  soportes: string[];
  limitesPaxinas: { min: number | null; max: number | null };
  actualizadaEn: string | null;
};
