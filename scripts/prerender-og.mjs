/**
 * prerender-og.mjs
 *
 * Script de pre-renderizado de meta tags Open Graph.
 *
 * Este script execútase DESPOIS do build de Vite e xera ficheiros HTML
 * individuais para cada ruta da web, con os meta tags OG correctos xa
 * incrustados estaticamente no HTML. Deste xeito, os bots de Telegram,
 * WhatsApp, Bluesky, X e outros servizos que NON executan JavaScript
 * reciben os meta tags correctos ao rastrexar a URL.
 *
 * Estratexia:
 *  - Para cada ruta de sección (/blog, /obradoiros, etc.) crea un
 *    directorio con un index.html que contén os meta tags específicos.
 *  - Para cada entrada do blog (/blog/:slug) crea un directorio
 *    blog/:slug/index.html con o título e imaxe de portada da entrada.
 *  - Cloudflare Pages serve automaticamente index.html ao acceder a
 *    calquera directorio, polo que os bots recibirán o HTML correcto.
 *  - Os usuarios normais (con JS) cargarán o mesmo index.html e a SPA
 *    React sobreescribirá os meta tags correctamente no cliente.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

// ── Configuración ──────────────────────────────────────────────────────────────

const SITE_URL = (process.env.VITE_SITE_URL || 'https://arieuger.github.io/biblio-revol').replace(/\/$/, '');
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;
const DIST_DIR = path.resolve('dist/public');
const CONTENT_POSTS_DIR = path.resolve('content/posts');

// ── Datos das seccións ─────────────────────────────────────────────────────────

const SECTIONS = [
  {
    path: 'blog',
    title: 'Revolteira - Blog',
    description: 'Novidades, actividades, crónicas e comunicados da Revolteira.',
    type: 'website',
  },
  {
    path: 'blog/paxina',
    title: 'Revolteira - Blog',
    description: 'Novidades, actividades, crónicas e comunicados da Revolteira.',
    type: 'website',
  },
  {
    path: 'obradoiros',
    title: 'Revolteira - Obradoiros',
    description: 'Actividades periódicas nas que aportamos e recibimos coñecementos e tecemos redes. Todos os obradoiros son abertos, de balde e ninguén recibe retribución por eles.',
    type: 'website',
  },
  {
    path: 'calendario',
    title: 'Revolteira - Calendario',
    description: 'Consulta a nosa axenda de obradoiros, actividades e asembleas abertas.',
    type: 'website',
  },
  {
    path: 'recursos',
    title: 'Revolteira - Recursos',
    description: 'Recursos e materiais da Revolteira: documentos, formularios e máis.',
    type: 'website',
  },
  {
    path: 'biblioteca',
    title: 'Revolteira - Biblioteca',
    description: 'Biblioteca da Revolteira.',
    type: 'website',
  },
  {
    path: 'asociate',
    title: 'Revolteira - Asóciate',
    description: 'Fai parte da Revolteira. Coñece como asociarte e apoiar o proxecto.',
    type: 'website',
  },
  {
    path: 'hazte-socio',
    title: 'Revolteira - Asóciate',
    description: 'Fai parte da Revolteira. Coñece como asociarte e apoiar o proxecto.',
    type: 'website',
  },
  {
    path: 'contacto',
    title: 'Revolteira - Contacto',
    description: 'Ponte en contacto coa Revolteira.',
    type: 'website',
  },
  {
    path: 'aviso-legal',
    title: 'Revolteira - Aviso Legal',
    description: 'Aviso legal da Revolteira.',
    type: 'website',
  },
  {
    path: 'privacidade',
    title: 'Revolteira - Privacidade',
    description: 'Política de privacidade da Revolteira.',
    type: 'website',
  },
  {
    path: 'cookies',
    title: 'Revolteira - Cookies',
    description: 'Política de cookies da Revolteira.',
    type: 'website',
  },
  {
    path: 'condicions',
    title: 'Revolteira - Condicións',
    description: 'Condicións de acceso e participación na Revolteira.',
    type: 'website',
  },
];

// ── Funcións auxiliares ────────────────────────────────────────────────────────

/**
 * Le o frontmatter YAML dun ficheiro Markdown.
 * Soporta títulos multiliña con sangría YAML.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return {};
  try {
    return parseYaml(match[1]) || {};
  } catch {
    return {};
  }
}

/**
 * Escapa caracteres especiais HTML para uso en atributos.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Le o index.html do build de Vite e substitúe os meta tags OG.
 */
function generateHtml({ title, description, image, type, url }) {
  const baseHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');

  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeUrl = escapeHtml(url);
  const safeType = escapeHtml(type);

  // Substituír o bloque de meta tags no HTML do build
  let html = baseHtml;

  // Título da páxina
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`);

  // Meta description estándar
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${safeDescription}" />`
  );

  // Open Graph
  html = html.replace(
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:type" content="${safeType}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${safeUrl}" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${safeDescription}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:image" content="${safeImage}" />`
  );

  // Twitter Card
  html = html.replace(
    /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:url" content="${safeUrl}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${safeDescription}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:image" content="${safeImage}" />`
  );

  html = html.replace(/<\/head>/i, `<link rel="canonical" href="${safeUrl}" /></head>`);

  return html;
}

function generateArticleJsonLd({ title, description, image, url, publishedAt }) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image ? [image] : undefined,
    datePublished: publishedAt || undefined,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Organization', name: 'Revolteira', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'Revolteira', url: SITE_URL },
  }).replace(/</g, '\\u003c');
}

/**
 * Crea un directorio e escribe o index.html con os meta tags correctos.
 */
function writeRouteHtml(routePath, htmlContent) {
  const dir = path.join(DIST_DIR, routePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), htmlContent, 'utf-8');
  console.log(`[prerender-og] ✓ /${routePath}/index.html`);
}

// ── Execución principal ────────────────────────────────────────────────────────

console.log('[prerender-og] Iniciando pre-renderizado de meta tags OG...');

// 1. Verificar que o build de Vite xa existe
if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.error('[prerender-og] ERROR: Non se atopa dist/public/index.html. Executa o build de Vite primeiro.');
  process.exit(1);
}

// 2. Xerar HTML para cada sección estática
for (const section of SECTIONS) {
  const url = `${SITE_URL}/${section.path}${section.path ? '/' : ''}`;
  const html = generateHtml({
    title: section.title,
    description: section.description,
    image: DEFAULT_IMAGE,
    type: section.type,
    url,
  });
  writeRouteHtml(section.path, html);
}

// 3. Xerar HTML para cada entrada do blog
console.log('[prerender-og] Procesando entradas do blog...');

const postFiles = fs.readdirSync(CONTENT_POSTS_DIR).filter(f => f.endsWith('.md'));

for (const filename of postFiles) {
  const slug = filename.replace('.md', '');
  const content = fs.readFileSync(path.join(CONTENT_POSTS_DIR, filename), 'utf-8');
  const data = parseFrontmatter(content);

  const title = data.title || slug;
  const rawBody = content.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/, '').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/<[^>]+>/g, ' ').replace(/[#*_>`\[\]()]/g, ' ').replace(/https?:\/\/\S+/g, ' ').replace(/\s+/g, ' ').trim();
  const description = (rawBody || `Entrada do blog de Revolteira: ${title}.`).slice(0, 157).replace(/\s+\S*$/, '').trim() + '…';
  const image = data.image
    ? (data.image.startsWith('http') ? data.image : `${SITE_URL}${data.image}`)
    : DEFAULT_IMAGE;
  const url = `${SITE_URL}/blog/${encodeURIComponent(slug)}/`;

  const html = generateHtml({
    title,
    description,
    image,
    type: 'article',
    url,
  });

  const articleHtml = html.replace('</head>', `<script type="application/ld+json">${generateArticleJsonLd({ title, description, image, url, publishedAt: data.publishedAt })}</script></head>`);
  writeRouteHtml(`blog/${slug}`, articleHtml);
}

console.log(`[prerender-og] ✓ Pre-renderizado completo: ${SECTIONS.length} seccións + ${postFiles.length} entradas do blog.`);
