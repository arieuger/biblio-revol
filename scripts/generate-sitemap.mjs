import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = (process.env.VITE_SITE_URL || 'https://arieuger.github.io/biblio-revol').replace(/\/$/, '');
const CONTENT_POSTS_DIR = path.resolve('content/posts');
const PUBLIC_DIR = path.resolve('public');

const SECTIONS = [
  { path: '', priority: '1.0', changefreq: 'weekly' },
  { path: 'blog', priority: '0.8', changefreq: 'weekly' },
  { path: 'obradoiros', priority: '0.7', changefreq: 'monthly' },
  { path: 'calendario', priority: '0.9', changefreq: 'daily' },
  { path: 'recursos', priority: '0.6', changefreq: 'monthly' },
  { path: 'biblioteca', priority: '0.8', changefreq: 'daily' },
  { path: 'asociate', priority: '0.5', changefreq: 'monthly' },
  { path: 'contacto', priority: '0.5', changefreq: 'monthly' },
  { path: 'aviso-legal', priority: '0.3', changefreq: 'monthly' },
  { path: 'privacidade', priority: '0.3', changefreq: 'monthly' },
  { path: 'cookies', priority: '0.3', changefreq: 'monthly' },
];

function generateSitemap() {
  console.log('[sitemap] Xerando sitemap.xml...');

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // 1. Engadir seccións estáticas
  for (const section of SECTIONS) {
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}/${section.path}${section.path ? '/' : ''}</loc>\n`;
    xml += `    <changefreq>${section.changefreq}</changefreq>\n`;
    xml += `    <priority>${section.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  // 2. Engadir entradas do blog
  if (fs.existsSync(CONTENT_POSTS_DIR)) {
    const postFiles = fs.readdirSync(CONTENT_POSTS_DIR).filter(f => f.endsWith('.md'));
    for (const filename of postFiles) {
      const slug = filename.replace('.md', '');
      const stats = fs.statSync(path.join(CONTENT_POSTS_DIR, filename));
      const lastmod = stats.mtime.toISOString().split('T')[0];

      xml += '  <url>\n';
      xml += `    <loc>${SITE_URL}/blog/${encodeURIComponent(slug)}/</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';
      xml += '  </url>\n';
    }
  }

  xml += '</urlset>';

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), xml);
  console.log(`[sitemap] ✓ sitemap.xml xerado con éxito en ${PUBLIC_DIR}`);
}

generateSitemap();
