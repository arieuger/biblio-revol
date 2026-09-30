import type { BibliotecaBook } from "../shared/biblioteca";

export const SEO_SNAPSHOT_KEY = "biblioteca:seo-snapshot";
const LEGACY_MANIFEST_KEY = "biblioteca:seo-manifest";
const SITE_URL = "https://biblioteca-exemplo.example.org";
const DEFAULT_IMAGE = `${SITE_URL}/images/og-miniatura.png`;

export type SnapshotBook = BibliotecaBook & { sourceHash: string };
type SnapshotManifest = Record<string, { sourceHash: string; aliasKey?: string }>;
export const SEO_ALIASES_KEY = "biblioteca:seo-aliases";
type SeoSnapshot = { manifest: SnapshotManifest; aliases: Record<string, string>; books: Record<string, SnapshotBook> };

type SeoStorage = {
  SEO_KV?: KVNamespace;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plainText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function description(book: SnapshotBook): string {
  const parts = [book.sinopse, book.autoria ? `Autoría: ${book.autoria}.` : null, book.formato ? `Formato: ${book.formato}.` : null].filter(Boolean).join(" ");
  const text = plainText(parts);
  if (text.length <= 160) return text || `Ficha bibliográfica de ${book.titulo} na Biblioteca da NOME DA ASOCIACIÓN.`;
  return `${text.slice(0, 157).replace(/\s+\S*$/, "").trim()}…`;
}

function absoluteImage(book: SnapshotBook): string {
  if (!book.portada) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(book.portada)) return book.portada;
  return `${SITE_URL}${book.portada.startsWith("/") ? book.portada : `/images/biblioteca/${encodeURIComponent(book.portada)}`}`;
}

function jsonLd(book: SnapshotBook, url: string): string {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": book.formato?.toLocaleLowerCase().includes("revista") || book.formato?.toLocaleLowerCase().includes("xornal") ? "Periodical" : "CreativeWork",
    name: book.titulo,
    url,
    description: plainText(book.sinopse) || undefined,
    image: absoluteImage(book),
    inLanguage: book.idiomas?.length ? book.idiomas : undefined,
    author: book.autoria ? { "@type": "Person", name: book.autoria } : undefined,
    publisher: book.editorial ? { "@type": "Organization", name: book.editorial } : undefined,
    datePublished: book.dataPublicacion || undefined,
    isbn: book.formato?.toLocaleLowerCase().includes("libro") ? book.isbnIssn || undefined : undefined,
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function setMeta(html: string, selector: RegExp, replacement: string): string {
  return selector.test(html) ? html.replace(selector, replacement) : html;
}

export function renderSeoShell(shell: string, book: SnapshotBook, pathname: string): string {
  const url = `${SITE_URL}${pathname}`;
  const title = `${book.titulo} — Biblioteca da NOME DA ASOCIACIÓN`;
  const metaDescription = description(book);
  const image = absoluteImage(book);
  let html = shell;
  html = setMeta(html, /<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = setMeta(html, /<meta\s+name="description"\s+content="[^"]*"\s*\/?\s*>/i, `<meta name="description" content="${escapeHtml(metaDescription)}" />`);
  html = setMeta(html, /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?\s*>/i, `<meta property="og:type" content="book" />`);
  html = setMeta(html, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?\s*>/i, `<meta property="og:url" content="${escapeHtml(url)}" />`);
  html = setMeta(html, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?\s*>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = setMeta(html, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?\s*>/i, `<meta property="og:description" content="${escapeHtml(metaDescription)}" />`);
  html = setMeta(html, /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?\s*>/i, `<meta property="og:image" content="${escapeHtml(image)}" />`);
  html = setMeta(html, /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:url" content="${escapeHtml(url)}" />`);
  html = setMeta(html, /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = setMeta(html, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:description" content="${escapeHtml(metaDescription)}" />`);
  html = setMeta(html, /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:image" content="${escapeHtml(image)}" />`);
  const canonical = `<link rel="canonical" href="${escapeHtml(url)}" />`;
  html = html.replace(/<\/head>/i, `${canonical}<script type="application/ld+json">${jsonLd(book, url)}</script></head>`);
  const initialContent = `<article data-seo-prerendered="true" class="seo-library-shell"><h1>${escapeHtml(book.titulo)}</h1>${book.autoria ? `<p>Autoría: ${escapeHtml(book.autoria)}</p>` : ""}${book.sinopse ? `<p>${escapeHtml(book.sinopse)}</p>` : ""}</article>`;
  html = html.replace(/<div id="root">\s*<\/div>/i, `<div id="root">${initialContent}</div>`);
  return html;
}

export type RawSeoBook = {
  id: string; slug: string; sourceHash: string; portada: string | null; titulo: string; formato: string | null; volume: string | null; numero: string | null;
  autoria: string | null; direccion: string | null; producion: string | null; guion: string | null; reparto: string | null; musica: string | null; fotografia: string | null;
  editorial: string | null; coleccion: string | null; isbnIssn: string | null; sinopse: string | null; dataPublicacion: string | null; tematicas: string[]; andel: string[];
  idioma: string | null; idiomas: string[]; numeroPaxinas: number | null; soporte: string | null; xenero: string | null; duracion: string | null; discografica: string | null;
  estudio: string | null; exemplaresTotais: number | null; exemplaresEmprestados: number | null; exemplaresDispoñibles: number | null; recomendacion?: number;
};

export function seoBookFromRaw(book: RawSeoBook): SnapshotBook {
  const portada = book.portada && /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(book.portada) ? `/images/biblioteca/${encodeURIComponent(book.portada)}` : book.portada;
  return { ...book, portada, puntuacionLiteral: undefined, puntuacionSemantica: undefined, tipoCoincidencia: undefined };
}

async function readSnapshot(env: SeoStorage): Promise<SeoSnapshot | null> {
  if (!env.SEO_KV) return null;
  const current = await env.SEO_KV.get<SeoSnapshot>(SEO_SNAPSHOT_KEY, "json");
  if (current) return current;
  const manifest = await env.SEO_KV.get<SnapshotManifest>(LEGACY_MANIFEST_KEY, "json");
  if (!manifest) return null;
  const aliases = await env.SEO_KV.get<Record<string, string>>(SEO_ALIASES_KEY, "json") ?? {};
  return { manifest, aliases, books: {} };
}

export async function updateSeoSnapshot(env: SeoStorage, books: SnapshotBook[]): Promise<void> {
  if (!env.SEO_KV) return;
  const previous = await readSnapshot(env);
  const previousManifest = previous?.manifest ?? {};
  const aliases = { ...(previous?.aliases ?? {}) };
  const manifest: SnapshotManifest = {};
  const snapshotBooks: Record<string, SnapshotBook> = {};
  const activeSlugs = new Set<string>();

  for (const book of books) {
    activeSlugs.add(book.slug);
    const aliasKey = JSON.stringify({ ...book, id: undefined, slug: undefined, titulo: undefined, sourceHash: undefined });
    manifest[book.slug] = { sourceHash: book.sourceHash, aliasKey };
    snapshotBooks[book.slug] = book;
    const former = Object.entries(previousManifest).find(([slug, entry]) => slug !== book.slug && entry.aliasKey === aliasKey);
    if (former) aliases[former[0]] = book.slug;
  }

  for (const slug of Object.keys(previousManifest)) {
    if (!activeSlugs.has(slug) && !Object.values(aliases).includes(slug)) delete aliases[slug];
  }

  const next: SeoSnapshot = { manifest, aliases, books: snapshotBooks };
  if (JSON.stringify(previous) !== JSON.stringify(next)) await env.SEO_KV.put(SEO_SNAPSHOT_KEY, JSON.stringify(next));
}

export async function getSeoBook(env: SeoStorage, slug: string): Promise<SnapshotBook | null> {
  const snapshot = await readSnapshot(env);
  const book = snapshot?.books[slug];
  if (book) return book;
  const target = snapshot?.aliases[slug];
  if (target && snapshot.books[target]) return snapshot.books[target];
  if (env.SEO_KV) return env.SEO_KV.get<SnapshotBook>(`biblioteca:book:${slug}`, "json");
  return null;
}

export async function resolveSeoBook(env: SeoStorage, slug: string): Promise<{ canonicalSlug: string; book: SnapshotBook } | null> {
  const snapshot = await readSnapshot(env);
  if (snapshot?.books[slug]) return { canonicalSlug: slug, book: snapshot.books[slug] };
  const target = snapshot?.aliases[slug];
  if (target && snapshot.books[target]) return { canonicalSlug: target, book: snapshot.books[target] };
  const legacy = env.SEO_KV ? await env.SEO_KV.get<SnapshotBook>(`biblioteca:book:${slug}`, "json") : null;
  return legacy ? { canonicalSlug: slug, book: legacy } : null;
}

export async function getSeoCanonicalSlug(env: SeoStorage, slug: string): Promise<string | null> {
  const snapshot = await readSnapshot(env);
  if (snapshot?.books[slug]) return slug;
  if (snapshot?.aliases[slug]) return snapshot.aliases[slug];
  if (env.SEO_KV && await env.SEO_KV.get(`biblioteca:book:${slug}`)) return slug;
  return null;
}

export async function getSeoManifest(env: SeoStorage): Promise<SnapshotManifest | null> {
  return (await readSnapshot(env))?.manifest ?? null;
}

export function sitemapFromManifest(manifest: SnapshotManifest, baseSitemap?: string): string {
  const urls = Object.keys(manifest).sort().map(slug => `  <url><loc>${SITE_URL}/biblioteca/${encodeURIComponent(slug)}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`).join("\n");
  if (baseSitemap) {
    const withoutLibrary = baseSitemap.replace(/\s*<url>\s*<loc>[^<]*\/biblioteca(?:\/[^<]*)?<\/loc>[\s\S]*?<\/url>/g, "");
    return withoutLibrary.replace("</urlset>", `${urls ? `\n${urls}\n` : ""}</urlset>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_URL}/biblioteca</loc><changefreq>daily</changefreq><priority>0.8</priority></url>\n${urls}\n</urlset>`;
}
