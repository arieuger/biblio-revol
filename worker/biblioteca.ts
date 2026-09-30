import { displayBookTitle, SEARCHABLE_FIELDS, splitBibliographicTags, type BibliotecaBook, type BibliotecaFilterOptions, type BibliotecaFilters, type BibliotecaSearchResponse, type SearchableField } from "../shared/biblioteca";
import { seoBookFromRaw, updateSeoSnapshot } from "./seo";

export interface Env {
  ASSETS?: Fetcher;
  BIBLIOTECA_DB: D1Database;
  BIBLIOTECA_VECTORIZE: VectorizeIndex;
  AI: Ai;
  SEO_KV?: KVNamespace;
}

type Clause = { field: SearchableField | null; value: string; exact: boolean; operator: "AND" | "OR" | "NOT" };
type RawBook = Omit<BibliotecaBook, "id" | "slug" | "puntuacionLiteral" | "puntuacionSemantica" | "tipoCoincidencia"> & { id: string; slug: string; sourceHash: string };
type BookRow = {
  id: string; slug: string | null; portada: string | null; titulo: string; formato: string | null; volume: string | null; numero: string | null; autoria: string | null; direccion: string | null; producion: string | null; guion: string | null; reparto: string | null; musica: string | null; fotografia: string | null; editorial: string | null; coleccion: string | null; isbn_issn: string | null; sinopse: string | null;
  data_publicacion: string | null; tematicas: string; andel: string; idioma: string | null; idiomas: string; numero_paxinas: number | null; soporte: string | null; xenero: string | null; duracion: string | null; discografica: string | null; estudio: string | null; exemplares_totais: number | null; exemplares_emprestados: number | null; exemplares_disponibles: number | null; recomendacion: number; literal_score?: number;
};

const SHEET_URL = "https://docs.google.com/spreadsheets/d/REEMPLAZAR_ID/export?format=csv&gid=0";
const SEARCH_FIELDS: ReadonlySet<string> = new Set(SEARCHABLE_FIELDS);
export const FTS_WEIGHTS = [8, 8, 5, 4, 4, 4, 4, 3, 3, 3, 6, 8, 3, 3, 1] as const;

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("Access-Control-Allow-Origin", "*");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function normalizeText(value: unknown): string | null {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized || null;
}

function hash(value: string): Promise<string> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)).then(buffer =>
    Array.from(new Uint8Array(buffer)).map(byte => byte.toString(16).padStart(2, "0")).join(""),
  );
}

function identityPart(value: string | null): string {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function isPeriodicalFormat(format: string | null): boolean {
  return ["revista", "xornal", "folleto"].includes(identityPart(format));
}

function identitySource(title: string, format: string | null, volume: string | null, numero: string | null): string {
  const periodical = isPeriodicalFormat(format);
  return [identityPart(title), periodical ? identityPart(volume) : "", periodical ? identityPart(numero) : ""].join("|");
}

export function slugifyBiblioteca(value: string): string {
  return identityPart(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function baseSlug(title: string, format: string | null, volume: string | null, numero: string | null): string {
  const parts = [title];
  if (isPeriodicalFormat(format)) parts.push(volume ?? "", numero ?? "");
  return slugifyBiblioteca(parts.filter(part => part.trim()).join(" "));
}

function csvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]!;
    if (quoted && character === '"' && input[index + 1] === '"') { cell += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (!quoted && character === ",") { row.push(cell); cell = ""; continue; }
    if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(cell); rows.push(row); row = []; cell = ""; continue;
    }
    cell += character;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export function parsePublicationDate(value: string | null): string | null {
  if (!value) return null;
  const localDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (localDate) return `${localDate[3]}-${localDate[2]!.padStart(2, "0")}`;
  const monthYear = value.match(/^(\d{1,2})\/(\d{4})$/);
  if (monthYear) return `${monthYear[2]}-${monthYear[1]!.padStart(2, "0")}`;
  if (/^\d{4}-\d{2}$/.test(value)) return value;
  return /^\d{4}$/.test(value) ? value : null;
}

function parsePages(value: string | null): number | null {
  const parsed = Number.parseInt((value ?? "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseCopies(value: string | null): number | null {
  const parsed = Number.parseInt((value ?? "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function parseRecommendation(value: string | null): number {
  const parsed = Number.parseInt((value ?? "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function splitTags(value: string | null): string[] {
  return splitBibliographicTags(value);
}

function tagsToText(value: string | null): string | null {
  const tags = splitTags(value);
  return tags.length ? tags.join(", ") : null;
}

function jsonTags(value: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(value || "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string" && Boolean(tag)) : [];
  } catch {
    return [];
  }
}

async function fetchCatalog(): Promise<RawBook[]> {
  const response = await fetch(SHEET_URL, { headers: { Accept: "text/csv" }, cf: { cacheTtl: 0, cacheEverything: false } });
  if (!response.ok) throw new Error(`A folla respondeu cun erro ${response.status}.`);
  const [header = [], ...rows] = csvRows(await response.text());
  const positions = new Map(header.map((name, index) => [normalizeText(name), index]));
  const field = (row: string[], name: string) => normalizeText(row[positions.get(name) ?? -1]);
  const records: RawBook[] = [];
  const identityOccurrences = new Map<string, number>();
  for (const [rowIndex, row] of rows.entries()) {
    const title = field(row, "Título") ?? "";
    if (!title) continue;
    const idiomas = splitTags(field(row, "Idioma"));
    const base = {
      portada: field(row, "Portada"), titulo: title, autoria: tagsToText(field(row, "Autoría")), direccion: tagsToText(field(row, "Dirección")), producion: tagsToText(field(row, "Produción")), guion: tagsToText(field(row, "Guión")), reparto: tagsToText(field(row, "Reparto")), musica: tagsToText(field(row, "Música")), fotografia: tagsToText(field(row, "Fotografía")), editorial: tagsToText(field(row, "Editorial")), coleccion: tagsToText(field(row, "Colección")),
      formato: field(row, "Formato"), volume: field(row, "Volume"), numero: field(row, "Número"), isbnIssn: field(row, "ISBN / ISSN / EAN") ?? field(row, "ISBN / ISSN"),
      sinopse: field(row, "Sinopse"), dataPublicacion: parsePublicationDate(field(row, "Data")), tematicas: splitTags(field(row, "Temática")), andel: splitTags(field(row, "Andel")), idioma: idiomas.join(", ") || null, idiomas, numeroPaxinas: parsePages(field(row, "Páxinas")), soporte: field(row, "Soporte"), xenero: field(row, "Xénero"), duracion: field(row, "Duración"), discografica: field(row, "Discográfica"), estudio: field(row, "Estudio"),
      exemplaresTotais: parseCopies(field(row, "Exemplares totais")), exemplaresEmprestados: parseCopies(field(row, "Exemplares emprestados")), exemplaresDispoñibles: parseCopies(field(row, "Exemplares dispoñibles")), recomendacion: parseRecommendation(field(row, "Recomendación")),
    };
    const identity = identitySource(base.titulo, base.formato, base.volume, base.numero);
    const occurrence = identityOccurrences.get(identity) ?? 0;
    identityOccurrences.set(identity, occurrence + 1);
    const duplicateSuffix = occurrence > 0 || !baseSlug(base.titulo, base.formato, base.volume, base.numero) ? (await hash(`${identity}|row:${rowIndex + 2}`)).slice(0, 8) : null;
    const id = await hash(duplicateSuffix ? `${identity}|duplicate:${rowIndex + 2}` : identity);
    const slugBase = baseSlug(base.titulo, base.formato, base.volume, base.numero);
    const slug = slugBase ? `${slugBase}${duplicateSuffix ? `--${duplicateSuffix}` : ""}` : duplicateSuffix!;
    const sourceHash = await hash(JSON.stringify({ id, ...base }));
    records.push({ ...base, id, slug, sourceHash });
  }
  return records;
}

export function parseCatalogQuery(input: string): Clause[] {
  const tokens = input.match(/(?:[a-záéíóúüñç]+:)?(?:"[^"]+"|[^\s]+)/gi) ?? [];
  const clauses: Clause[] = [];
  let operator: Clause["operator"] = "AND";
  for (const token of tokens) {
    const upper = token.toUpperCase();
    if (upper === "AND" || upper === "OR" || upper === "NOT") { operator = upper; continue; }
    const match = token.match(/^([a-záéíóúüñç]+):(.*)$/i);
    const normalizedField = match?.[1]?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (normalizedField && !SEARCH_FIELDS.has(normalizedField)) continue;
    const raw = (match ? match[2] : token).trim();
    const exact = raw.startsWith('"') && raw.endsWith('"') && raw.length > 1;
    const value = (exact ? raw.slice(1, -1) : raw).trim();
    if (value) clauses.push({ field: (normalizedField as SearchableField | undefined) ?? null, value, exact, operator: clauses.length ? operator : operator === "NOT" ? "NOT" : "AND" });
    operator = "AND";
  }
  return clauses;
}

function ftsTerm(clause: Clause): string {
  const value = clause.value.replace(/\s+/g, " ").trim();
  // Always quote user text before passing it to FTS5. Otherwise punctuation
  // such as a period, colon, parentheses, brackets, or an asterisk can be
  // interpreted as FTS5 syntax and make D1 reject the whole MATCH expression.
  const term = `"${value.replace(/"/g, '""')}"`;
  return clause.field ? `${clause.field} : ${term}` : term;
}

export function compileFts(clauses: Clause[]): string | null {
  const positive = clauses.filter(clause => clause.operator !== "NOT");
  if (!positive.length) return null;
  let query = ftsTerm(positive[0]!);
  for (let index = 1; index < positive.length; index += 1) query = `(${query}) ${positive[index]!.operator} (${ftsTerm(positive[index]!)})`;
  const negative = clauses.filter(clause => clause.operator === "NOT").map(ftsTerm);
  return negative.length ? `(${query}) NOT (${negative.join(" OR ")})` : query;
}

export function requiresLiteralResults(input: string, clauses = parseCatalogQuery(input)): boolean {
  return clauses.some(clause => clause.field !== null) || /\b(?:AND|OR|NOT)\b/i.test(input);
}

export function prioritizeLiteralResults(literal: BibliotecaBook[], related: BibliotecaBook[]): BibliotecaBook[] {
  return [...literal.filter(book => book.tipoCoincidencia !== "semantica"), ...related.filter(book => book.tipoCoincidencia === "semantica")];
}

export function sortCatalogAlphabetically(records: BibliotecaBook[]): BibliotecaBook[] {
  return [...records].sort((left, right) => displayBookTitle(left).localeCompare(displayBookTitle(right), "gl", { numeric: true, sensitivity: "base" }));
}

export function filtersSql(filters: BibliotecaFilters): { sql: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filters.desde) { conditions.push("l.data_publicacion >= ?"); params.push(filters.desde); }
  if (filters.ata) { conditions.push("l.data_publicacion <= ?"); params.push(filters.ata); }
  if (filters.paxinasMin !== undefined) { conditions.push("l.numero_paxinas >= ?"); params.push(filters.paxinasMin); }
  if (filters.paxinasMax !== undefined) { conditions.push("l.numero_paxinas <= ?"); params.push(filters.paxinasMax); }
  if (filters.idiomas?.length) { conditions.push(`EXISTS (SELECT 1 FROM json_each(l.idiomas) AS idioma WHERE idioma.value IN (${filters.idiomas.map(() => "?").join(",")}))`); params.push(...filters.idiomas); }
  if (filters.tematicas?.length) { conditions.push(`EXISTS (SELECT 1 FROM json_each(l.tematicas) AS tema WHERE tema.value IN (${filters.tematicas.map(() => "?").join(",")}))`); params.push(...filters.tematicas); }
  if (filters.andels?.length) { conditions.push(`EXISTS (SELECT 1 FROM json_each(l.andel) AS estante WHERE LOWER(estante.value) IN (${filters.andels.map(() => "?").join(",")}))`); params.push(...filters.andels.map(value => value.toLocaleLowerCase())); }
  if (filters.formatos?.length) { conditions.push(`LOWER(COALESCE(l.formato, '')) IN (${filters.formatos.map(() => "?").join(",")})`); params.push(...filters.formatos.map(value => value.toLocaleLowerCase())); }
  if (filters.soportes?.length) { conditions.push(`LOWER(COALESCE(l.soporte, '')) IN (${filters.soportes.map(() => "?").join(",")})`); params.push(...filters.soportes.map(value => value.toLocaleLowerCase())); }
  const entityFilters: Array<[keyof BibliotecaFilters, string]> = [["autorias", "l.autoria"], ["editoriais", "l.editorial"], ["coleccions", "l.coleccion"], ["direccions", "l.direccion"], ["produccions", "l.producion"], ["guions", "l.guion"], ["repartos", "l.reparto"], ["musicas", "l.musica"], ["fotografias", "l.fotografia"], ["discograficas", "l.discografica"], ["estudios", "l.estudio"]];
  for (const [key, column] of entityFilters) {
    const values = filters[key];
    if (Array.isArray(values) && values.length) { conditions.push(`(${values.map(() => `(',' || REPLACE(COALESCE(${column}, ''), ', ', ',') || ',') LIKE ?`).join(" OR ")})`); params.push(...values.map(value => `%,${value},%`)); }
  }
  const advancedFilters: Array<[keyof BibliotecaFilters, string]> = [["tituloAvanzado", "l.titulo"], ["autoriaAvanzada", "l.autoria"], ["editorialAvanzada", "l.editorial"], ["coleccionAvanzada", "l.coleccion"]];
  for (const [key, column] of advancedFilters) {
    const value = filters[key];
    if (typeof value === "string" && value.trim()) { conditions.push(`LOWER(COALESCE(${column}, '')) LIKE ?`); params.push(`%${value.trim().toLocaleLowerCase()}%`); }
  }
  const normalizedIsbnIssn = filters.isbnIssnAvanzado?.replace(/[-–—\s]/g, "").trim();
  if (normalizedIsbnIssn) {
    const comparableCode = normalizedIsbnIssn.length >= 8 ? normalizedIsbnIssn.slice(0, -1) : normalizedIsbnIssn;
    conditions.push("LOWER(REPLACE(COALESCE(l.isbn_issn, ''), '-', '')) LIKE ?");
    params.push(`%${comparableCode.toLocaleLowerCase()}%`);
  }
  return { sql: conditions.length ? ` AND ${conditions.join(" AND ")}` : "", params };
}

export function shouldIncludeSemanticResults(query: string, filters: BibliotecaFilters, clauses = parseCatalogQuery(query)): boolean {
  return Boolean(query) && !filters.andels?.length && !requiresLiteralResults(query, clauses);
}

function coverPath(portada: string | null): string | null {
  return portada && /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(portada) ? `/images/biblioteca/${encodeURIComponent(portada)}` : null;
}

function toBook(row: BookRow, type: BibliotecaBook["tipoCoincidencia"] = "recente"): BibliotecaBook {
  return { id: row.id, slug: row.slug ?? row.id, portada: coverPath(row.portada), titulo: row.titulo, formato: row.formato, volume: row.volume, numero: row.numero, autoria: row.autoria, direccion: row.direccion, producion: row.producion, guion: row.guion, reparto: row.reparto, musica: row.musica, fotografia: row.fotografia, editorial: row.editorial, coleccion: row.coleccion, isbnIssn: row.isbn_issn, sinopse: row.sinopse, dataPublicacion: row.data_publicacion, tematicas: jsonTags(row.tematicas), andel: jsonTags(row.andel), idioma: row.idioma, idiomas: jsonTags(row.idiomas), numeroPaxinas: row.numero_paxinas, soporte: row.soporte, xenero: row.xenero, duracion: row.duracion, discografica: row.discografica, estudio: row.estudio, exemplaresTotais: row.exemplares_totais, exemplaresEmprestados: row.exemplares_emprestados, exemplaresDispoñibles: row.exemplares_disponibles, recomendacion: row.recomendacion ?? 0, puntuacionLiteral: row.literal_score, tipoCoincidencia: type };
}

export function prioritizeRecommendations(recommended: BibliotecaBook[], fallback: BibliotecaBook[], minimum = 10): BibliotecaBook[] {
  const preferred = [...recommended].sort((left, right) => (right.recomendacion ?? 0) - (left.recomendacion ?? 0) || left.titulo.localeCompare(right.titulo, "gl"));
  const remaining = fallback.filter(book => !preferred.some(preferredBook => preferredBook.id === book.id));
  return [...preferred, ...remaining.slice(0, Math.max(0, minimum - preferred.length))];
}

async function state(env: Env): Promise<string | null> {
  const row = await env.BIBLIOTECA_DB.prepare("SELECT actualizada_en FROM biblioteca_sincronizacion WHERE id = 1").first<{ actualizada_en: number | null }>();
  return row?.actualizada_en ? new Date(row.actualizada_en).toISOString() : null;
}

async function ensureInitialSnapshot(env: Env): Promise<void> {
  if (!(await state(env))) await syncCatalog(env);
}

function aiVectors(result: unknown): number[][] {
  const embedding = result as { data?: unknown; response?: unknown };
  if (Array.isArray(embedding.data) && Array.isArray(embedding.data[0])) return embedding.data as number[][];
  if (Array.isArray(embedding.response) && Array.isArray(embedding.response[0])) return embedding.response as number[][];
  if (Array.isArray(result) && Array.isArray(result[0])) return result as number[][];
  throw new Error("Workers AI non devolveu vectores no formato esperado.");
}

async function semanticVector(env: Env, text: string): Promise<number[]> {
  const output = await env.AI.run("@cf/baai/bge-m3", { contexts: [{ text }], truncate_inputs: true });
  return aiVectors(output)[0] ?? [];
}

export async function searchCatalog(env: Env, url: URL): Promise<BibliotecaSearchResponse> {
  await ensureInitialSnapshot(env);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const filters: BibliotecaFilters = {
    desde: url.searchParams.get("desde") || undefined, ata: url.searchParams.get("ata") || undefined,
        tematicas: url.searchParams.getAll("tematica"), idiomas: url.searchParams.getAll("idioma"), formatos: url.searchParams.getAll("formato"), soportes: url.searchParams.getAll("soporte"), andels: url.searchParams.getAll("andel"),
 autorias: url.searchParams.getAll("autoria"), editoriais: url.searchParams.getAll("editorial"), coleccions: url.searchParams.getAll("coleccion"), direccions: url.searchParams.getAll("direccion"), produccions: url.searchParams.getAll("producion"), guions: url.searchParams.getAll("guion"), repartos: url.searchParams.getAll("reparto"), musicas: url.searchParams.getAll("musica"), fotografias: url.searchParams.getAll("fotografia"), discograficas: url.searchParams.getAll("discografica"), estudios: url.searchParams.getAll("estudio"), tituloAvanzado: url.searchParams.get("av_titulo") || undefined, autoriaAvanzada: url.searchParams.get("av_autoria") || undefined, editorialAvanzada: url.searchParams.get("av_editorial") || undefined, coleccionAvanzada: url.searchParams.get("av_coleccion") || undefined, isbnIssnAvanzado: url.searchParams.get("av_isbn") || undefined,
    paxinasMin: url.searchParams.has("paxinasMin") ? Number(url.searchParams.get("paxinasMin")) : undefined,
    paxinasMax: url.searchParams.has("paxinasMax") ? Number(url.searchParams.get("paxinasMax")) : undefined,
  };
  const page = Math.max(1, Number(url.searchParams.get("paxina") ?? 1));
  const perPage = Math.min(48, Math.max(1, Number(url.searchParams.get("porPaxina") ?? 24)));
  const alphabeticalOrder = url.searchParams.get("orde") === "alfabetica";
  const clauses = parseCatalogQuery(query);
  const { sql: filterSql, params } = filtersSql(filters);
  const fts = compileFts(clauses);
  let literalRows: BookRow[] = [];
  if (fts) {
    const result = await env.BIBLIOTECA_DB.prepare(
      `SELECT l.*, -bm25(biblioteca_fts, ${FTS_WEIGHTS.join(", ")}) AS literal_score FROM biblioteca_fts JOIN biblioteca_libros l ON l.row_id = biblioteca_fts.rowid WHERE biblioteca_fts MATCH ?${filterSql} ORDER BY literal_score DESC, l.data_publicacion DESC`,
    ).bind(fts, ...params).all<BookRow>();
    literalRows = result.results;
  } else {
    const result = await env.BIBLIOTECA_DB.prepare(`SELECT l.*, 0 AS literal_score FROM biblioteca_libros l WHERE 1 = 1${filterSql} ORDER BY l.data_publicacion DESC, l.titulo ASC`).bind(...params).all<BookRow>();
    literalRows = result.results;
  }
  const literal = literalRows.map(row => toBook(row, query ? "literal" : "recente"));
  const semantic: BibliotecaBook[] = [];
  if (shouldIncludeSemanticResults(query, filters, clauses)) {
    const vector = await semanticVector(env, clauses.filter(clause => clause.operator !== "NOT").map(clause => clause.value).join(" ") || query);
    if (vector.length) {
      const matches = await env.BIBLIOTECA_VECTORIZE.query(vector, { topK: 24 });
      const ids = matches.matches.map(match => match.id).filter(id => !literal.some(book => book.id === id));
      if (ids.length) {
        const result = await env.BIBLIOTECA_DB.prepare(`SELECT l.* FROM biblioteca_libros l WHERE l.id IN (${ids.map(() => "?").join(",")})${filterSql}`).bind(...ids, ...params).all<BookRow>();
        const scores = new Map(matches.matches.map(match => [match.id, match.score]));
        semantic.push(...result.results.map(row => ({ ...toBook(row, "semantica"), puntuacionSemantica: scores.get(row.id) })).filter(book => (book.puntuacionSemantica ?? 0) >= 0.42).sort((left, right) => (right.puntuacionSemantica ?? 0) - (left.puntuacionSemantica ?? 0)));
      }
    }
  }
  const records = alphabeticalOrder ? sortCatalogAlphabetically([...literal, ...semantic]) : prioritizeLiteralResults(literal, semantic);
  return { resultados: records.slice((page - 1) * perPage, page * perPage), total: records.length, pagina: page, porPaxina: perPage, actualizadaEn: await state(env) };
}

export async function getCatalogBook(env: Env, slug: string): Promise<BibliotecaBook | null> {
  await ensureInitialSnapshot(env);
  const row = await env.BIBLIOTECA_DB.prepare("SELECT l.* FROM biblioteca_libros l WHERE l.slug = ?").bind(slug).first<BookRow>();
  return row ? toBook(row) : null;
}

export async function recommendedCatalog(env: Env): Promise<BibliotecaBook[]> {
  await ensureInitialSnapshot(env);
  const recommendedRows = await env.BIBLIOTECA_DB.prepare("SELECT l.*, 0 AS literal_score FROM biblioteca_libros l WHERE COALESCE(l.recomendacion, 0) > 0 ORDER BY l.recomendacion DESC, l.titulo COLLATE NOCASE ASC").all<BookRow>();
  const recommended = recommendedRows.results.map(row => toBook(row));
  const minimum = 10;
  if (recommended.length >= minimum) return prioritizeRecommendations(recommended, [], minimum);
  const fallbackRows = await env.BIBLIOTECA_DB.prepare("SELECT l.*, 0 AS literal_score FROM biblioteca_libros l WHERE COALESCE(l.recomendacion, 0) = 0 ORDER BY l.data_publicacion DESC, l.titulo COLLATE NOCASE ASC LIMIT ?").bind(minimum - recommended.length).all<BookRow>();
  return prioritizeRecommendations(recommended, fallbackRows.results.map(row => toBook(row)), minimum);
}

export async function recentCatalog(env: Env): Promise<BibliotecaBook[]> {
  await ensureInitialSnapshot(env);
  const recentRows = await env.BIBLIOTECA_DB.prepare("SELECT l.*, 0 AS literal_score FROM biblioteca_libros l WHERE l.data_publicacion IS NOT NULL AND TRIM(l.data_publicacion) <> '' ORDER BY l.data_publicacion DESC, l.titulo COLLATE NOCASE ASC LIMIT 20").all<BookRow>();
  return recentRows.results.map(row => toBook(row, "recente"));
}

export async function filterOptions(env: Env): Promise<BibliotecaFilterOptions> {
  await ensureInitialSnapshot(env);
  const [languages, topics, formats, supports, pages] = await Promise.all([
    env.BIBLIOTECA_DB.prepare("SELECT idiomas FROM biblioteca_libros").all<{ idiomas: string }>(),
    env.BIBLIOTECA_DB.prepare("SELECT tematicas FROM biblioteca_libros").all<{ tematicas: string }>(),
    env.BIBLIOTECA_DB.prepare("SELECT DISTINCT TRIM(formato) AS formato FROM biblioteca_libros WHERE TRIM(COALESCE(formato, '')) <> ''").all<{ formato: string }>(),
    env.BIBLIOTECA_DB.prepare("SELECT DISTINCT TRIM(soporte) AS soporte FROM biblioteca_libros WHERE TRIM(COALESCE(soporte, '')) <> ''").all<{ soporte: string }>(),
    env.BIBLIOTECA_DB.prepare("SELECT MIN(numero_paxinas) AS min, MAX(numero_paxinas) AS max FROM biblioteca_libros").first<{ min: number | null; max: number | null }>(),
  ]);
  const tematicas = Array.from(new Set(topics.results.flatMap(row => JSON.parse(row.tematicas || "[]") as string[]))).sort((a, b) => a.localeCompare(b, "gl"));
  const idiomas = Array.from(new Set(languages.results.flatMap(row => jsonTags(row.idiomas)))).sort((a, b) => a.localeCompare(b, "gl"));
  const formatos = formats.results.map(row => row.formato).filter(Boolean).sort((a, b) => a.localeCompare(b, "gl"));
  const soportes = supports.results.map(row => row.soporte).filter(Boolean).sort((a, b) => a.localeCompare(b, "gl"));
  return { tematicas, idiomas, formatos, soportes, limitesPaxinas: pages ?? { min: null, max: null }, actualizadaEn: await state(env) };
}

async function batch(db: D1Database, statements: D1PreparedStatement[]): Promise<void> {
  for (let index = 0; index < statements.length; index += 80) await db.batch(statements.slice(index, index + 80));
}

function embeddingText(book: RawBook): string {
  return [book.titulo, book.titulo, book.autoria, book.autoria, book.direccion, book.producion, book.guion, book.reparto, book.musica, book.fotografia, book.editorial, book.coleccion, book.formato, book.soporte, book.xenero, book.duracion, book.discografica, book.estudio, book.tematicas.join(", "), book.andel.join(", "), book.idiomas.join(", "), book.sinopse].filter(Boolean).join(". ").slice(0, 20_000);
}

export async function syncCatalog(env: Env, options: { refreshSeo?: boolean } = {}): Promise<{ total: number; vectores: number }> {
  try {
    const books = await fetchCatalog();
    const sourceHash = await hash(books.map(book => book.sourceHash).join("\n"));
    const previous = await env.BIBLIOTECA_DB.prepare("SELECT source_hash, seo_source_hash, seo_checked_en FROM biblioteca_sincronizacion WHERE id = 1").first<{ source_hash: string | null; seo_source_hash: string | null; seo_checked_en: number | null }>();
    if (previous?.source_hash === sourceHash) {
      const pending = await env.BIBLIOTECA_DB.prepare("SELECT COUNT(*) AS total FROM biblioteca_libros l LEFT JOIN biblioteca_vectores v ON v.id = l.id WHERE v.source_hash IS NULL OR v.source_hash != l.source_hash").first<{ total: number }>();
      if (!pending?.total) {
        const wasUninitialized = !(await state(env));
        if (wasUninitialized) await env.BIBLIOTECA_DB.prepare("UPDATE biblioteca_sincronizacion SET actualizada_en = ?, erro = NULL WHERE id = 1").bind(Date.now()).run();
        const seoRetryDue = !previous.seo_checked_en || Date.now() - previous.seo_checked_en >= 86_400_000;
        if (env.SEO_KV && previous.seo_source_hash !== sourceHash && (wasUninitialized || options.refreshSeo || seoRetryDue)) {
          await env.BIBLIOTECA_DB.prepare("UPDATE biblioteca_sincronizacion SET seo_checked_en = ? WHERE id = 1").bind(Date.now()).run();
          try {
            await updateSeoSnapshot(env, books.map(book => seoBookFromRaw(book)));
            await env.BIBLIOTECA_DB.prepare("UPDATE biblioteca_sincronizacion SET seo_source_hash = ? WHERE id = 1").bind(sourceHash).run();
          } catch (error) {
            console.error("[biblioteca] Non se puido actualizar a instantánea SEO; o catálogo D1 segue dispoñible.", error);
          }
        }
        return { total: books.length, vectores: 0 };
      }
    }

    await env.BIBLIOTECA_DB.prepare("DELETE FROM biblioteca_rexistros_vixentes").run();
    const now = Date.now();
    await batch(env.BIBLIOTECA_DB, books.flatMap(book => [
      env.BIBLIOTECA_DB.prepare("INSERT OR REPLACE INTO biblioteca_rexistros_vixentes (id) VALUES (?)").bind(book.id),
      env.BIBLIOTECA_DB.prepare("INSERT INTO biblioteca_libros (id, slug, source_hash, portada, titulo, formato, volume, numero, autoria, direccion, producion, guion, reparto, musica, fotografia, editorial, coleccion, isbn_issn, sinopse, data_publicacion, tematicas, andel, idioma, idiomas, numero_paxinas, soporte, xenero, duracion, discografica, estudio, exemplares_totais, exemplares_emprestados, exemplares_disponibles, recomendacion, actualizado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, source_hash = excluded.source_hash, portada = excluded.portada, titulo = excluded.titulo, formato = excluded.formato, volume = excluded.volume, numero = excluded.numero, autoria = excluded.autoria, direccion = excluded.direccion, producion = excluded.producion, guion = excluded.guion, reparto = excluded.reparto, musica = excluded.musica, fotografia = excluded.fotografia, editorial = excluded.editorial, coleccion = excluded.coleccion, isbn_issn = excluded.isbn_issn, sinopse = excluded.sinopse, data_publicacion = excluded.data_publicacion, tematicas = excluded.tematicas, andel = excluded.andel, idioma = excluded.idioma, idiomas = excluded.idiomas, numero_paxinas = excluded.numero_paxinas, soporte = excluded.soporte, xenero = excluded.xenero, duracion = excluded.duracion, discografica = excluded.discografica, estudio = excluded.estudio, exemplares_totais = excluded.exemplares_totais, exemplares_emprestados = excluded.exemplares_emprestados, exemplares_disponibles = excluded.exemplares_disponibles, recomendacion = excluded.recomendacion, actualizado_en = excluded.actualizado_en WHERE biblioteca_libros.source_hash != excluded.source_hash").bind(book.id, book.slug, book.sourceHash, book.portada, book.titulo, book.formato, book.volume, book.numero, book.autoria, book.direccion, book.producion, book.guion, book.reparto, book.musica, book.fotografia, book.editorial, book.coleccion, book.isbnIssn, book.sinopse, book.dataPublicacion, JSON.stringify(book.tematicas), JSON.stringify(book.andel), book.idioma, JSON.stringify(book.idiomas), book.numeroPaxinas, book.soporte, book.xenero, book.duracion, book.discografica, book.estudio, book.exemplaresTotais, book.exemplaresEmprestados, book.exemplaresDispoñibles, book.recomendacion, now),
    ]));
    await env.BIBLIOTECA_DB.batch([
      env.BIBLIOTECA_DB.prepare("DELETE FROM biblioteca_libros WHERE id NOT IN (SELECT id FROM biblioteca_rexistros_vixentes)"),
      env.BIBLIOTECA_DB.prepare("DELETE FROM biblioteca_vectores WHERE id NOT IN (SELECT id FROM biblioteca_libros)"),
    ]);
    const pending = await env.BIBLIOTECA_DB.prepare("SELECT l.* FROM biblioteca_libros l LEFT JOIN biblioteca_vectores v ON v.id = l.id WHERE v.source_hash IS NULL OR v.source_hash != l.source_hash LIMIT 128").all<BookRow & { source_hash: string }>();
    let vectors = 0;
    if (pending.results.length) {
      const inputs = pending.results.map(row => embeddingText({ ...toBook(row), id: row.id, sourceHash: row.source_hash }));
      const output = await env.AI.run("@cf/baai/bge-m3", { contexts: inputs.map(text => ({ text })), truncate_inputs: true });
      const embeddings = aiVectors(output);
      await env.BIBLIOTECA_VECTORIZE.upsert(pending.results.map((row, index) => ({ id: row.id, values: embeddings[index]!, metadata: { sourceHash: row.source_hash } })));
      await batch(env.BIBLIOTECA_DB, pending.results.map(row => env.BIBLIOTECA_DB.prepare("INSERT INTO biblioteca_vectores (id, source_hash, actualizado_en) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET source_hash = excluded.source_hash, actualizado_en = excluded.actualizado_en").bind(row.id, row.source_hash, now)));
      vectors = pending.results.length;
    }
    await env.BIBLIOTECA_DB.prepare("INSERT INTO biblioteca_sincronizacion (id, actualizada_en, total_libros, erro, source_hash) VALUES (1, ?, ?, NULL, ?) ON CONFLICT(id) DO UPDATE SET actualizada_en = excluded.actualizada_en, total_libros = excluded.total_libros, erro = NULL, source_hash = excluded.source_hash").bind(now, books.length, sourceHash).run();
    if (env.SEO_KV) {
      await env.BIBLIOTECA_DB.prepare("UPDATE biblioteca_sincronizacion SET seo_checked_en = ? WHERE id = 1").bind(now).run();
      try {
        await updateSeoSnapshot(env, books.map(book => seoBookFromRaw(book)));
        await env.BIBLIOTECA_DB.prepare("UPDATE biblioteca_sincronizacion SET seo_source_hash = ? WHERE id = 1").bind(sourceHash).run();
      } catch (error) {
        console.error("[biblioteca] Non se puido actualizar a instantánea SEO; o catálogo D1 segue dispoñible.", error);
      }
    }
    return { total: books.length, vectores: vectors };
  } catch (error) {
    await env.BIBLIOTECA_DB.prepare("INSERT INTO biblioteca_sincronizacion (id, erro) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET erro = excluded.erro").bind(error instanceof Error ? error.message : String(error)).run();
    throw error;
  }
}
