import type { BibliotecaBook } from '../../shared/biblioteca';

// Fictional bibliographic records: never represent actual holdings or loans.
export const demoBooks: BibliotecaBook[] = [
  ['unha-casa-de-palabras', 'Unha casa de palabras', 'Lúa Varela', 'Galego', 'Narrativa', 'A1'],
  ['mapas-do-comun', 'Mapas do común', 'Antón Souto', 'Galego', 'Comunidade', 'A2'],
  ['el-jardin-compartido', 'El jardín compartido', 'Clara Montes', 'Castelán', 'Natureza', 'B1'],
  ['memorias-do-barrio', 'Memorias do barrio', 'Iria Lago', 'Galego', 'Memoria', 'A1'],
  ['pequenas-revoltas', 'Pequenas revoltas', 'Eva Castro', 'Galego', 'Poesía', 'B2'],
  ['caminhos-abertos', 'Caminhos abertos', 'Leonor Reis', 'Portugués', 'Narrativa', 'A2'],
].map(([slug, titulo, autoria, idioma, topic, shelf], index) => ({
  id: `demo-${index + 1}`, slug, titulo, autoria, idioma, idiomas: [idioma],
  tematicas: [topic], andel: [shelf], portada: null, formato: 'Libro',
  soporte: 'Papel', xenero: topic, numeroPaxinas: 96 + index * 40,
  exemplaresTotais: 2, exemplaresEmprestados: index % 3,
  exemplaresDispoñibles: 2 - index % 3, recomendacion: 1,
  sinopse: `Exemplar ficticio de demostración sobre ${topic.toLocaleLowerCase()}. Esta ficha permite probar a consulta do catálogo de Revolteira. Non corresponde a unha publicación real.`,
  dataPublicacion: `${2020 + index}-01-01`, editorial: 'Edicións de exemplo',
  volume: null, numero: null, direccion: null, producion: null, guion: null,
  reparto: null, musica: null, fotografia: null, coleccion: null, isbnIssn: null,
  duracion: null, discografica: null, estudio: null,
}));
const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();

export function demoResponse(url: URL): Response {
  const endpoint = url.pathname.replace('/api/biblioteca/', '');
  const params = url.searchParams;
  if (endpoint.startsWith('libros/')) {
    const slug = decodeURIComponent(endpoint.slice(7));
    const book = demoBooks.find(book => book.slug === slug || book.id === slug);
    return Response.json(book ?? { error: 'Exemplar non atopado' }, { status: book ? 200 : 404 });
  }
  if (endpoint === 'filtros') return Response.json({
    tematicas: [...new Set(demoBooks.flatMap(book => book.tematicas))],
    idiomas: [...new Set(demoBooks.flatMap(book => book.idiomas))],
    formatos: ['Libro'], soportes: ['Papel'], limitesPaxinas: { min: 96, max: 296 }, actualizadaEn: null,
  });
  if (endpoint === 'recomendacions' || endpoint === 'novidades') return Response.json(demoBooks.slice(0, 4));
  if (endpoint !== 'libros') return Response.json({ error: 'Ruta non atopada' }, { status: 404 });
  const exact: Record<string, keyof BibliotecaBook> = { tematica: 'tematicas', idioma: 'idiomas', formato: 'formato', soporte: 'soporte', andel: 'andel', autoria: 'autoria', editorial: 'editorial', coleccion: 'coleccion', direccion: 'direccion', producion: 'producion', guion: 'guion', reparto: 'reparto', musica: 'musica', fotografia: 'fotografia', discografica: 'discografica', estudio: 'estudio' };
  const partial: Record<string, keyof BibliotecaBook> = { av_titulo: 'titulo', av_autoria: 'autoria', av_editorial: 'editorial', av_coleccion: 'coleccion', av_isbn: 'isbnIssn' };
  let books = demoBooks.filter(book => {
    const query = normalize(params.get('q')).trim();
    if (query && !normalize([book.titulo, book.autoria, book.sinopse].join(' ')).includes(query)) return false;
    for (const [key, field] of Object.entries(exact)) {
      const selected = params.getAll(key);
      const values = Array.isArray(book[field]) ? book[field] as string[] : [String(book[field] ?? '')];
      if (selected.length && !selected.some(value => values.some(item => normalize(item) === normalize(value)))) return false;
    }
    for (const [key, field] of Object.entries(partial)) {
      if (params.has(key) && !normalize(book[field]).includes(normalize(params.get(key)))) return false;
    }
    if (params.has('desde') && (book.dataPublicacion ?? '') < params.get('desde')!) return false;
    if (params.has('ata') && (book.dataPublicacion ?? '') > params.get('ata')!) return false;
    if (params.has('paxinasMin') && (book.numeroPaxinas ?? 0) < Number(params.get('paxinasMin'))) return false;
    if (params.has('paxinasMax') && (book.numeroPaxinas ?? 0) > Number(params.get('paxinasMax'))) return false;
    return true;
  });
  if (params.get('orde') === 'alfabetica') books = [...books].sort((a,b) => a.titulo.localeCompare(b.titulo, 'gl'));
  const positive = (key: string, fallback: number) => { const value = Number(params.get(key)); return Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback; };
  const pagina = positive('paxina', 1), porPaxina = Math.min(100, positive('porPaxina', 24));
  return Response.json({ resultados: books.slice((pagina-1)*porPaxina, pagina*porPaxina), total: books.length, pagina, porPaxina, actualizadaEn: null });
}
