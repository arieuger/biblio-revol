import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { parse, stringify } from 'yaml';

const base = '/biblio-revol/';
const siteUrl = 'https://arieuger.github.io/biblio-revol';
const env = { ...process.env, VITE_BASE_PATH: base, VITE_SITE_URL: siteUrl, VITE_CATALOG_MODE: process.env.VITE_CATALOG_MODE ?? 'static' };
const result = spawnSync(process.execPath, ['scripts/build.mjs'], { env, stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
const output = 'dist/public';
const html = fs.readFileSync(`${output}/index.html`, 'utf8');
// Known iframe routes must return the SPA instead of the static /admin index.
for (const route of ['admin/composicion-biblioteca', 'admin/correspondencias-biblioteca']) {
  fs.mkdirSync(`${output}/${route}`, { recursive: true });
  fs.writeFileSync(`${output}/${route}/index.html`, html);
}
// GitHub Pages has no SPA rewrites. Unknown deep links still load the app,
// although GitHub returns HTTP 404 for those URLs.
fs.writeFileSync(`${output}/404.html`, html);
fs.writeFileSync(`${output}/.nojekyll`, '');
fs.writeFileSync(`${output}/robots.txt`, `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
const config = parse(fs.readFileSync(`${output}/admin/config.yml`, 'utf8'));
delete config.local_backend;
config.site_url = `${siteUrl}/`;
config.display_url = `${siteUrl}/`;
config.backend.repo = 'arieuger/biblio-revol';
config.backend.branch = 'main';
config.backend.site_domain = 'arieuger.github.io';
if (process.env.CMS_OAUTH_URL) {
  const url = new URL(process.env.CMS_OAUTH_URL);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw new Error('CMS_OAUTH_URL debe ser un origen HTTPS, sin ruta ni credenciales.');
  config.backend.base_url = url.origin;
}
fs.writeFileSync(`${output}/admin/config.yml`, stringify(config));
if (config.backend.base_url.includes('REEMPLAZAR')) console.warn('CMS: falta configurar la variable CMS_OAUTH_URL para iniciar sesión.');
console.log(`GitHub Pages: ${siteUrl}/`);
